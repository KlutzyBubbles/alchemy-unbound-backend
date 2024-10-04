import { Response } from 'express';
import routes from '../../index';
import { query } from 'express-validator';
import { Recipe, knownItems } from '../../../models/v1/recipe.model';
import { Op } from 'sequelize';
import { filterLanguages } from '../../../language';
import { openai, translateTask } from '../../../ai';
import asyncHandler from 'express-async-handler';
import { Language, LanguageModel } from '../../../models/v1/language.model';
import { validateOrUndefinedV1 } from '../../../language/helpers';
import { validationMiddleware } from '../../../middleware/validation';
import { HerokuRequest } from '../../../middleware/requestId';
import { AIResponse, ErrorCode } from '../../../types';

routes.get('/fill/v1',
    query('a').trim().isString().isLength({ min: 2, max: 256 }).toLowerCase(),
    query('b').trim().isString().isLength({ min: 2, max: 256 }).toLowerCase(),
    query('result').trim().isString().isLength({ min: 2, max: 256 }).toLowerCase(),
    query('base').optional().trim().escape().isBoolean(),
    query('ignoreDupe').optional().trim().escape().isBoolean(),
    validationMiddleware,
    asyncHandler(async (request: HerokuRequest, response: Response) => {

        const a: string | undefined = request.query.a as string | undefined;
        const b: string | undefined = request.query.b as string | undefined;
        let result: string | undefined = request.query.result as string | undefined;
        let base: boolean | undefined = request.query.base as boolean | undefined;
        let ignoreDupe: boolean | undefined = request.query.ignoreDupe as boolean | undefined;

        if (a === undefined || b === undefined || result === undefined) {
            console.log('QUERY_UNDEFINED', a, b, result);
            response.status(400).send({
                code: ErrorCode.QUERY_UNDEFINED,
                message: 'Query parameters are undefined'
            });
            return;
        }

        // if (isNumeric(a)) {
        //     console.log('AB_NUMBER', a, b, result);
        //     response.status(400).send({
        //         code: ErrorCode.AB_NUMBER,
        //         message: 'A/B Input is a number, this is not allowed'
        //     });
        //     return;
        // }

        // if (isNumeric(b)) {
        //     console.log('AB_NUMBER', a, b, result);
        //     response.status(400).send({
        //         code: ErrorCode.AB_NUMBER,
        //         message: 'A/B Input is a number, this is not allowed'
        //     });
        //     return;
        // }

        if (Recipe === undefined || Language === undefined) {
            console.log('UNKNOWN_ERROR', a, b, result);
            response.status(500).send({
                code: ErrorCode.UNKNOWN_ERROR,
                message: 'Database issues :/'
            });
            return;
        }

        if (base === undefined) {
            base = true;
        }
        if (ignoreDupe === undefined) {
            ignoreDupe = false;
        }

        let itemsKnown = false;
        let aDepth = -1;
        let bDepth = -1;
        if (Object.keys(knownItems).includes(a) && Object.keys(knownItems).includes(b)) {
            itemsKnown = true;
            aDepth = knownItems[a];
            bDepth = knownItems[b];
        } else {
            if (!Object.keys(knownItems).includes(a)) {
                const aExists = await Recipe.findOne({
                    where: {
                        result: a
                    },
                    attributes: ['result', 'depth']
                });
                if (aExists !== null) {
                    knownItems[aExists.result] = aExists.depth;
                    aDepth = aExists.depth;
                }
            } else {
                aDepth = knownItems[a];
            }
            if (!Object.keys(knownItems).includes(b)) {
                const bExists = await Recipe.findOne({
                    where: {
                        result: b
                    },
                    attributes: ['result', 'depth']
                });
                if (bExists !== null) {
                    knownItems[bExists.result] = bExists.depth;
                    bDepth = bExists.depth;
                }
            } else {
                bDepth = knownItems[b];
            }
            if (Object.keys(knownItems).includes(a) && Object.keys(knownItems).includes(b)) {
                itemsKnown = true;
            }
        }
        if (itemsKnown === false) {
            console.log('AB_NOT_KNOWN', a, b, result);
            response.status(400).json({
                code: ErrorCode.AB_NOT_KNOWN,
                message: 'Requested a/b are not known'
            });
            return;
        }

        let recipe = await Recipe.findOne({
            where: {
                [Op.or]: [{
                    a: a,
                    b: b
                }, {
                    a: b,
                    b: a
                }]
            }
        });
        let language: LanguageModel | undefined = undefined;
        if (recipe === null) {
        // Generate one?
            try {
                const resultLanguage = await Language.findOne({
                    where: {
                        name: result
                    },
                });
                if (resultLanguage !== null) {
                    const newRecipe = await Recipe.create({
                        result: result,
                        a: a,
                        b: b,
                        base: base,
                        who_discovered: '',
                        depth: aDepth + bDepth
                    });
                    language = resultLanguage;
                    recipe = newRecipe;
                } else {
                    const chatCompletion = await openai.chat.completions.create({
                        // model: 'gpt-4',
                        model: 'gpt-3.5-turbo',
                        // model: 'gpt-3.5-turbo-1106',
                        messages: [
                            {
                                role: 'system',
                                content: translateTask(result.charAt(0).toUpperCase() + result.slice(1))
                            }
                        ],
                        temperature: 0.7
                    });
                    const aiResponseRaw = chatCompletion.choices[0].message.content;
                    if (aiResponseRaw) {
                        const aiResponse: AIResponse = JSON.parse(aiResponseRaw);
                        const validated = validateOrUndefinedV1(aiResponse);
                        if (validated !== undefined) {
                            const newLanguage = await Language.create({
                                ...validated,
                                name: result
                            });
                            const newRecipe = await Recipe.create({
                                a: a,
                                b: b,
                                result: result,
                                base: true,
                                who_discovered: '',
                                depth: aDepth + bDepth
                            });
                            language = newLanguage;
                            recipe = newRecipe;
                        } else {
                            throw new Error('Unable to validate AI response');
                        }
                    } else {
                        throw new Error('AI returned null');
                    }
                }
            } catch(e) {
                console.error('1: Failed to generate new element', e, { requestId: request.requestId }, translateTask(result.charAt(0).toUpperCase() + result.slice(1)));
                response.status(500).send({
                    code: 500,
                    message: 'Failed to generate a new element, please try again later (AI Busy)'
                });
                return;
            }
        } else {
            // Recipe known, check result
            if (result !== recipe.result) {
                // Same
                if (ignoreDupe) {
                    try {
                        const resultLanguage = await Language.findOne({
                            where: {
                                name: result
                            },
                        });
                        if (resultLanguage !== null) {
                            const newRecipe = await Recipe.create({
                                result: result,
                                a: a,
                                b: b,
                                base: base,
                                who_discovered: '',
                                depth: aDepth + bDepth
                            });
                            language = resultLanguage;
                            recipe = newRecipe;
                        } else {
                            const chatCompletion = await openai.chat.completions.create({
                                // model: "gpt-4",
                                // model: 'gpt-3.5-turbo',
                                model: 'gpt-3.5-turbo-1106',
                                messages: [
                                    {
                                        role: 'system',
                                        content: translateTask(result.charAt(0).toUpperCase() + result.slice(1))
                                    }
                                ],
                                temperature: 0.7
                            });
                            const aiResponseRaw = chatCompletion.choices[0].message.content;
                            if (aiResponseRaw) {
                                const aiResponse: AIResponse = JSON.parse(aiResponseRaw);
                                const validated = validateOrUndefinedV1(aiResponse);
                                if (validated !== undefined) {
                                    const newLanguage = await Language.create({
                                        ...validated,
                                        name: result
                                    });
                                    const newRecipe = await Recipe.create({
                                        a: a,
                                        b: b,
                                        result: result,
                                        base: true,
                                        who_discovered: '',
                                        depth: aDepth + bDepth
                                    });
                                    language = newLanguage;
                                    recipe = newRecipe;
                                } else {
                                    throw new Error('Unable to validate AI response');
                                }
                            } else {
                                throw new Error('AI returned null');
                            }
                        }
                    } catch(e) {
                        console.error('2: Failed to generate new element', e, { requestId: request.requestId }, translateTask(result.charAt(0).toUpperCase() + result.slice(1)));
                        response.status(500).send({
                            code: 500,
                            message: 'Failed to generate a new element, please try again later (AI Busy)'
                        });
                        return;
                    }
                } else {
                    // Return existing
                    result = recipe.result;
                }
            } else {
                // eXACT SAME, NO NEED TO REPLACE
                result = recipe.result;
            }
            result = recipe.result;
        }
        if (language === undefined) {
            try {
                const foundLanguage = await Language.findOne({
                    where: {
                        name: result
                    },
                });
                if (foundLanguage === null) {
                    throw new Error('Language model found is null');
                }
                language = foundLanguage;
            } catch (e) {
                console.error('Language is missing when it shouldnt be', e, { requestId: request.requestId });
                response.status(500).send({
                    code: 500,
                    message: 'Failed to generate a new element, please try again later (Language Issue)'
                });
                return;
            }
        }
        // console.log('200', a, b, result);
        response.status(200).send({
            result: recipe.result,
            display: filterLanguages(language),
            emoji: language.emoji,
            depth: recipe.depth,
            who_discovered: recipe.who_discovered,
            first: false,
            base: recipe.base
        });
        return;
    }));
