import { Response } from 'express';
import { isNumeric } from '../helpers';
import { Recipe, RecipeData, RecipeModel, knownItems } from '../../models/v1/recipe.model';
import { Op } from 'sequelize';
import { filterLanguages } from '../../language';
import { openai } from '../../ai';
import { aiTaskV1 } from '../../ai/v1';
import { MAX_DEPTH } from '../../constants';
import { Language, LanguageModel } from '../../models/v1/language.model';
import { validateOrUndefinedV1 } from '../../language/helpers';
import { TokenedRequestV1 } from '../../middleware/steam';
import { AIResponse, APIResponseV1, ErrorCode, ErrorResponse, SuccessResponse } from '../../types';
import { isGenerating, setFinished, startGenerating, waitForGeneration } from '../../ai/stateManagement';
import { Idea, IdeaData, IdeaModel } from '../../models/v1/idea.model';

export async function apiGetV1(request: TokenedRequestV1, response: Response<ErrorResponse | APIResponseV1>) {
    const a: string | undefined = request.query.a as string | undefined;
    const b: string | undefined = request.query.b as string | undefined;

    if (a === undefined || b === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined'
        });
        return;
    }

    if (isNumeric(a)) {
        response.status(400).send({
            code: ErrorCode.AB_NUMBER,
            message: 'A/B Input is a number, this is not allowed'
        });
        return;
    }

    if (isNumeric(b)) {
        response.status(400).send({
            code: ErrorCode.AB_NUMBER,
            message: 'A/B Input is a number, this is not allowed'
        });
        return;
    }

    let itemsKnown = false;
    if (Object.keys(knownItems).includes(a) && Object.keys(knownItems).includes(b)) {
        itemsKnown = true;
    } else {
        if (!Object.keys(knownItems).includes(a)) {
            const aExists = Recipe === undefined ? null : await Recipe.findOne({
                where: {
                    result: a
                },
                attributes: ['result', 'depth']
            });
            if (aExists !== null) {
                knownItems[aExists.result] = aExists.depth;
            }
        }
        if (!Object.keys(knownItems).includes(b)) {
            const bExists = Recipe === undefined ? null : await Recipe.findOne({
                where: {
                    result: b
                },
                attributes: ['result', 'depth']
            });
            if (bExists !== null) {
                knownItems[bExists.result] = bExists.depth;
            }
        }
        if (Object.keys(knownItems).includes(a) && Object.keys(knownItems).includes(b)) {
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

    if (knownItems[a] > MAX_DEPTH || knownItems[b] > MAX_DEPTH) {
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
    let firstDiscovered = false;
    let saved = false;
    if (recipe === null) {
        // Generate one?
        if (await isGenerating(a, b)) {
            try {
                const reason = await waitForGeneration(a, b, 15000);
                if (reason === 'noClient' || reason === 'notGenerated' || reason === 'timeout') {
                    try {
                        const result = await generateElement(a, b, request.steamId, request.requestId);
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
                            const result = await generateElement(a, b, request.steamId, request.requestId);
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
            firstDiscovered = true;
            try {
                const result = await generateElement(a, b, request.steamId, request.requestId);
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
    if (firstDiscovered === false && recipe.base === false && recipe.who_discovered === '') {
        // First discovered?
        firstDiscovered = true;
    }
    let shouldSave = false;
    if (firstDiscovered && recipe.who_discovered === '' && request.steamId !== undefined) {
        shouldSave = true;
    } 
    if (firstDiscovered && request.steamId !== undefined) {
        recipe.who_discovered = request.steamId;
    }
    response.status(200).send({
        result: recipe.result,
        display: filterLanguages(language),
        emoji: language.emoji,
        depth: recipe.depth,
        who_discovered: recipe.who_discovered,
        first: firstDiscovered,
        base: recipe.base
    });
    if (shouldSave) {
        if (!Object.prototype.hasOwnProperty.call(recipe, 'save')) {
            console.error('Recipe requesting save when it isnt a model', { requestId: request.requestId });
        } else {
            await (recipe as RecipeModel).save();
        }
    }
    return;
}


export async function ideaPostV1(request: TokenedRequestV1, response: Response<ErrorResponse | SuccessResponse>) {
    const a: string | undefined = request.query.a as string | undefined;
    const b: string | undefined = request.query.b as string | undefined;
    const result: string | undefined = request.query.result as string | undefined;

    if (a === undefined || b === undefined || result === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined'
        });
        return;
    }

    if (Idea === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Database issues :/'
        });
        return;
    }

    const idea: IdeaModel | IdeaData | null = await Idea.findOne({
        where: {
            [Op.or]: [{
                a: a,
                b: b,
                result: result
            }, {
                a: b,
                b: a,
                result: result
            }]
        }
    });
    if (idea === null) {
        try {
            await Idea.create({
                a: a,
                b: b,
                result: result,
                suggested: request.steamId ?? ''
            });
            response.status(200).send({
                success: true,
            });
            return;
        } catch (error) {
            console.error('Failed to insert new idea', error, { requestId: request.requestId });
            response.status(500).send({
                code: ErrorCode.UNKNOWN_ERROR,
                message: 'Failed to insert suggestion'
            });
            return;
        }
    } else {
        response.status(500).send({
            code: ErrorCode.MAX_DEPTH,
            message: 'Suggestion already exists'
        });
        return;
    }
}

async function generateElement(a: string, b: string, steamId?: string, requestId?: string): Promise<{
    saved: boolean,
    recipe: RecipeData | RecipeModel
}> {
    await startGenerating(a, b);
    try {
        const chatCompletion = await openai.chat.completions.create({
            //model: "gpt-4",
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: aiTaskV1(a, b)
                }
            ],
            temperature: 0.7
        });
        const aiResponseRaw = chatCompletion.choices[0].message.content;
        if (aiResponseRaw) {
            const aiResponse: AIResponse = JSON.parse(aiResponseRaw);
            const result = aiResponse.english.toLowerCase();
            if (Language !== undefined && Recipe !== undefined) {
                let foundLanguage: LanguageModel | null = null;
                if (!Object.keys(knownItems).includes(result)) {
                    foundLanguage = await Language.findOne({
                        where: {
                            name: result
                        },
                    });
                }
                if (foundLanguage === null) {
                    const validated = validateOrUndefinedV1(aiResponse);
                    if (validated !== undefined) {
                        [foundLanguage] = await Language.findOrCreate({
                            where: {
                                name: result
                            },
                            defaults: {
                                ...validated,
                                name: result
                            }
                        });
                    }
                }
                if (foundLanguage !== null) {
                    let newRecipe = await Recipe.findOne({
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
                    if (newRecipe === null) {
                        newRecipe = await Recipe.create({
                            a: a,
                            b: b,
                            result: result,
                            base: false,
                            who_discovered: steamId ?? '',
                            depth: knownItems[a] + knownItems[b]
                        });
                    }
                    await setFinished(a, b, false);
                    return {
                        saved: true,
                        recipe: newRecipe
                    };
                } else {
                    console.warn('Unable to save generated recipe', { requestId: requestId });
                    return {
                        saved: false,
                        recipe: {
                            a: a,
                            b: b,
                            result: result,
                            base: false,
                            who_discovered: steamId ?? '',
                            depth: knownItems[a] + knownItems[b]
                        }
                    };
                }
            } else {
                console.warn('Language and Recipe model undefined when generating element', { requestId: requestId });
                return {
                    saved: false,
                    recipe: {
                        a: a,
                        b: b,
                        result: result,
                        base: false,
                        who_discovered: steamId ?? '',
                        depth: knownItems[a] + knownItems[b]
                    }
                };
            }
        } else {
            throw new Error('AI returned null');
        }
    } catch(e) {
        await setFinished(a, b, true);
        throw e;
    }
}
