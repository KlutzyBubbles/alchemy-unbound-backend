import { Response } from 'express';
import { Recipe, RecipeData, RecipeModel, knownCustomItems } from '../../../models/v2/recipe.model';
import { Op } from 'sequelize';
import { filterLanguages } from '../../../language';
import { MAX_CUSTOM_DEPTH } from '../../../constants';
import { Language, LanguageModel } from '../../../models/v2/language.model';
import { TokenedRequestV2 } from '../../../middleware/steam';
import { APIResponseV2, ErrorCode, ErrorResponse, LanguageObject } from '../../../types';
import { isGenerating, waitForGeneration } from '../../../ai/stateManagement';
import { undefinedErrorFormat } from '../../../helpers';
import { generateElement } from './api';
import { generateLanguageV2, capitalizeWords, getEnglish } from '../../../language/helpers';
import { isNumeric } from '../../helpers';
import cl100k_base from 'gpt-tokenizer/cjs/encoding/cl100k_base';

export async function customGetV2(request: TokenedRequestV2, response: Response<ErrorResponse | APIResponseV2>) {
    const a: string | undefined = request.query.a as string | undefined;
    const b: string | undefined = request.query.b as string | undefined;
    const steamId = request.steamId;
    const user = request.user;

    if (a === undefined || b === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined',
            fields: undefinedErrorFormat({
                a,
                b,
            })
        });
        return;
    }

    if (steamId === undefined || user === undefined) {
        response.status(400).send({
            code: ErrorCode.NOT_AUTHENTICATED,
            message: 'User needs to be authenticated',
        });
        return;
    }

    if (user.credits <= 0) {
        response.status(400).send({
            code: ErrorCode.NO_CREDITS,
            message: 'User needs credits to custom combine',
        });
        return;
    }

    let itemsKnown = false;
    if (Object.keys(knownCustomItems).includes(a) && Object.keys(knownCustomItems).includes(b)) {
        itemsKnown = true;
    } else {
        if (!Object.keys(knownCustomItems).includes(a)) {
            const aExists = Recipe === undefined ? null : await Recipe.findOne({
                where: {
                    result: a
                },
                attributes: ['result', 'depth']
            });
            if (aExists !== null) {
                knownCustomItems[aExists.result] = {
                    depth: aExists.depth,
                    base: aExists.base
                };
            }
        }
        if (!Object.keys(knownCustomItems).includes(b)) {
            const bExists = Recipe === undefined ? null : await Recipe.findOne({
                where: {
                    result: b
                },
                attributes: ['result', 'depth', 'base']
            });
            if (bExists !== null) {
                knownCustomItems[bExists.result] = {
                    depth: bExists.depth,
                    base: bExists.base
                };
            }
        }
        if (Object.keys(knownCustomItems).includes(a) && Object.keys(knownCustomItems).includes(b)) {
            itemsKnown = true;
        }
    }

    if (itemsKnown === false) {
        response.status(400).json({
            code: ErrorCode.AB_NOT_KNOWN,
            message: 'Requested a/b are not known'
        });
        return;
    }

    if (knownCustomItems[a].depth > MAX_CUSTOM_DEPTH || knownCustomItems[b].depth > MAX_CUSTOM_DEPTH) {
        response.status(400).send({
            code: ErrorCode.MAX_DEPTH,
            message: 'Max depth, maybe diversify your holdings'
        });
        return;
    }

    if (Recipe === undefined || Language === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Database issues :/'
        });
        return;
    }

    let recipe: RecipeModel | RecipeData | null = await Recipe.findOne({
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
    let saved = false;
    let generated = false;
    if (recipe === null) {
        // Generate one?
        if (await isGenerating(a, b)) {
            try {
                const reason = await waitForGeneration(a, b, 15000);
                if (reason === 'noClient' || reason === 'notGenerated' || reason === 'timeout') {
                    try {
                        const result = await generateElement(a, b, request.steamId, request.requestId, undefined, true);
                        generated = true;
                        saved = result.saved;
                        recipe = result.recipe;
                    } catch(e) {
                        console.error('Failed to generate new element', e, { requestId: request.requestId });
                        response.status(500).send({
                            code: ErrorCode.UNKNOWN_ERROR,
                            message: 'Failed to generate a new element, please try again later (AI Busy)'
                        });
                        return;
                    }
                } else if (reason === 'generated') {
                    recipe = await Recipe.findOne({
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
                    if (recipe === null) {
                        try {
                            const result = await generateElement(a, b, request.steamId, request.requestId, undefined, true);
                            generated = true;
                            saved = result.saved;
                            recipe = result.recipe;
                        } catch(e) {
                            console.error('Failed to generate new element', e, { requestId: request.requestId });
                            response.status(500).send({
                                code: ErrorCode.UNKNOWN_ERROR,
                                message: 'Failed to generate a new element, please try again later (AI Busy)'
                            });
                            return;
                        }
                    }
                } else {
                    response.status(500).send({
                        code: ErrorCode.UNKNOWN_ERROR,
                        message: 'Failed to generate a new element, please try again later (AI Busy)'
                    });
                    return;
                }
            } catch (e) {
                console.error('Failed to generate new element', e, { requestId: request.requestId });
                response.status(500).send({
                    code: ErrorCode.UNKNOWN_ERROR,
                    message: 'Failed to generate a new element, please try again later (AI Busy)'
                });
                return;
            }
        } else {
            try {
                const result = await generateElement(a, b, request.steamId, request.requestId, undefined, true);
                generated = true;
                saved = result.saved;
                recipe = result.recipe;
            } catch(e) {
                console.error('Failed to generate new element', e, { requestId: request.requestId });
                response.status(500).send({
                    code: ErrorCode.UNKNOWN_ERROR,
                    message: 'Failed to generate a new element, please try again later (AI Busy)'
                });
                return;
            }
        }
    }
    if (language === undefined) {
        try {
            const foundLanguage = await Language.findOne({
                where: {
                    name: recipe.result
                },
            });
            if (foundLanguage === null) {
                throw new Error('Language model found is null');
            }
            language = foundLanguage;
        } catch (error) {
            if (error instanceof Error && error.message !== undefined && error.message.includes('too many connections')) {
                console.error('Too many database connections', error.message, { requestId: request.requestId });
            } else {
                if (saved) {
                    console.error('Language is missing when it shouldnt be', error, { requestId: request.requestId });
                } else {
                    response.status(500).send({
                        code: ErrorCode.TRANSLATION_ERROR,
                        message: 'Failed to generate a new element, please try again later (Translation Error)'
                    });
                    return;
                }
            }
            response.status(500).send({
                code: ErrorCode.UNKNOWN_ERROR,
                message: 'Failed to generate a new element, please try again later (Language Issue)'
            });
            return;
        }
    }
    response.status(200).send({
        result: recipe.result,
        display: filterLanguages(language),
        emoji: language.emoji,
        depth: recipe.depth,
        who_discovered: language.who_discovered,
        first: false,
        base: recipe.base,
        custom: recipe.custom,
        credits: user.credits - 1,
        creditAdjust: -1
    });
    user.credits -= 1;
    if  (user.credits < 0) {
        user.credits = 0;
    }
    user.customCombines += 1;
    if (generated) {
        user.customGenerations += 1;
    }
    if (recipe.depth > user.customHighestDepth) {
        user.customHighestDepth = recipe.depth;
    }
    try {
        await user.save();
    } catch (error) {
        console.error('Failed saving user', { requestId: request.requestId });
    }
    return;
}

export async function customPutV2(request: TokenedRequestV2, response: Response<ErrorResponse | APIResponseV2>) {
    const result: string | undefined = request.query.result as string | undefined;
    const languageInput: (keyof LanguageObject) | undefined = request.query.language as (keyof LanguageObject) | undefined;
    const steamId = request.steamId;
    const user = request.user;

    if (result === undefined || languageInput === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined',
            fields: undefinedErrorFormat({
                result,
                language: languageInput
            })
        });
        return;
    }

    if (steamId === undefined || user === undefined) {
        response.status(400).send({
            code: ErrorCode.NOT_AUTHENTICATED,
            message: 'User needs to be authenticated',
        });
        return;
    }

    if (user.credits <= 0) {
        response.status(400).send({
            code: ErrorCode.NO_CREDITS,
            message: 'User needs credits to custom combine',
        });
        return;
    }

    if (Recipe === undefined || Language === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Database issues :/'
        });
        return;
    }

    let recipe: RecipeModel | RecipeData | null = await Recipe.findOne({
        where: {
            result: result
        }
    });
    let language: LanguageModel | null = null;
    try {
        let capitalized = result;
        if (!isNumeric(result)) {
            capitalized = capitalizeWords(result, {
                skipWord: /^(a|the|an|and|or|nor|as|at|via|by|with|than|to|for|from|into|like|over|with|upon|but|in|on|of|it)$/
            });
        }
        let actualResult = result;
        if (languageInput !== 'english') {
            const temp = await getEnglish(result, languageInput, steamId, request.requestId, request.ip);
            if (temp === undefined) {
                response.status(500).send({
                    code: ErrorCode.TRANSLATION_ERROR,
                    message: 'Failed to translate to english'
                });
                return;
            }
            actualResult = temp;
        }
        language = await Language.findOne({
            where: {
                name: actualResult
            },
        });
        if (language === null) {
            const encoded = cl100k_base.encode(result);
            const genLanguage = await generateLanguageV2(actualResult, capitalized, languageInput, encoded.length, steamId, request.requestId, request.ip);
            if (genLanguage !== undefined) {
                language = genLanguage;
            }
        }
        if (language === null) {
            throw new Error('Language model found is null');
        }
    } catch (error) {
        console.error('big error', error);
        if (error instanceof Error && error.message !== undefined && error.message.includes('too many connections')) {
            console.error('Too many database connections', error.message, { requestId: request.requestId });
        }
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to generate a new element, please try again later (Language Issue)'
        });
        return;
    }
    if (recipe === null) {
        // Generate one?
        recipe = await Recipe.create({
            a: '',
            b: '',
            result: result,
            base: false,
            depth: 1,
            custom: true,
            found_by: steamId ?? '',
            reversed: false
        });
    }
    response.status(200).send({
        result: recipe.result,
        display: filterLanguages(language),
        emoji: language.emoji,
        depth: recipe.depth,
        who_discovered: language.who_discovered,
        first: false,
        base: recipe.base,
        custom: recipe.custom,
        credits: user.credits - 1,
        creditAdjust: -1
    });
    user.credits -= 1;
    if  (user.credits < 0) {
        user.credits = 0;
    }
    user.customGenerations += 1;
    try {
        await user.save();
    } catch (error) {
        console.error('Failed saving user', { requestId: request.requestId });
    }
    return;
}
