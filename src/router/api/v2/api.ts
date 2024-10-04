import { Response } from 'express';
import { isNumeric } from '../../helpers';
import { Recipe, RecipeData, RecipeModel, knownCustomItems, knownItems } from '../../../models/v2/recipe.model';
import { Op } from 'sequelize';
import { filterLanguages } from '../../../language';
import { openai } from '../../../ai';
import { aiTaskV2 } from '../../../ai/v2';
import { MAX_DEPTH } from '../../../constants';
import { Language, LanguageModel } from '../../../models/v2/language.model';
import { capitalizeWords, generateLanguageV2 } from '../../../language/helpers';
import { TokenedRequestV2 } from '../../../middleware/steam';
import { APIResponseV2, ErrorCode, ErrorResponse } from '../../../types';
import { isGenerating, setFinished, startGenerating, waitForGeneration } from '../../../ai/stateManagement';
import { undefinedErrorFormat } from '../../../helpers';

export async function apiGetV2(request: TokenedRequestV2, response: Response<ErrorResponse | APIResponseV2>) {
    const a: string | undefined = request.query.a as string | undefined;
    const b: string | undefined = request.query.b as string | undefined;

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
                    result: a,
                    custom: false
                },
                attributes: ['result', 'depth']
            });
            if (aExists !== null) {
                knownItems[aExists.result] = {
                    depth: aExists.depth,
                    base: aExists.base
                };
            }
        }
        if (!Object.keys(knownItems).includes(b)) {
            const bExists = Recipe === undefined ? null : await Recipe.findOne({
                where: {
                    result: b,
                    custom: false
                },
                attributes: ['result', 'depth', 'base']
            });
            if (bExists !== null) {
                knownItems[bExists.result] = {
                    depth: bExists.depth,
                    base: bExists.base
                };
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

    if (knownItems[a].depth > MAX_DEPTH || knownItems[b].depth > MAX_DEPTH) {
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
                        const result = await generateElement(a, b, request.steamId, request.requestId);
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
                            const result = await generateElement(a, b, request.steamId, request.requestId);
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
                const result = await generateElement(a, b, request.steamId, request.requestId);
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
    // One or both
    // const fromBaseItems = (knownItems[a].base || knownItems[b].base) ?? false;

    // Only both
    const fromBaseItems = knownItems[a].base && knownItems[b].base;
    let firstDiscovered = false;
    if (recipe.base === false && (language.who_discovered === '' || language.who_discovered === request.steamId)) {
        // First discovered?
        firstDiscovered = fromBaseItems ? false : true;
    }
    let shouldSaveLang = false;
    let shouldSaveRecipe = false;
    if (firstDiscovered && language.who_discovered === '' && request.steamId !== undefined) {
        shouldSaveLang = true;
    } 
    if (firstDiscovered && request.steamId !== undefined) {
        language.who_discovered = request.steamId;
    }
    if (recipe.custom) {
        recipe.custom = false;
        shouldSaveRecipe = true;
    }
    response.status(200).send({
        result: recipe.result,
        display: filterLanguages(language),
        emoji: language.emoji,
        depth: recipe.depth,
        who_discovered: language.who_discovered,
        first: firstDiscovered,
        base: recipe.base,
        custom: recipe.custom,
        credits: request.user === undefined ? 0 : request.user.credits,
        creditAdjust: 0
    });
    if (request.user !== undefined) {
        request.user.combines += 1;
        if (generated) {
            request.user.generations += 1;
            request.user.firstDiscoveries += 1;
        } else if (firstDiscovered && shouldSaveLang) {
            request.user.firstDiscoveries += 1;
        }
        if (recipe.depth > request.user.highestDepth) {
            request.user.highestDepth = recipe.depth;
        }
        try {
            await request.user.save();
        } catch (error) {
            console.error('Failed saving user', { requestId: request.requestId });
        }
    }
    if (shouldSaveLang) {
        try {
            if (language === undefined) {
                console.error('Language is undefined after requesting save', { requestId: request.requestId });
            } else {
                await (language as LanguageModel).save();
            }
        } catch (error) {
            console.error('Unable to save language after request save', error, { requestId: request.requestId });
        }
    }
    if (shouldSaveRecipe) {
        try {
            if (recipe === undefined) {
                console.error('Recipe is undefined after requesting save', { requestId: request.requestId });
            } else {
                await (recipe as RecipeModel).save();
            }
        } catch (error) {
            console.error('Unable to save recipe after request save', error, { requestId: request.requestId });
        }
    }
    return;
}

export async function generateElement(a: string, b: string, steamId?: string, requestId?: string, requestIp?: string, custom: boolean = false): Promise<{
    saved: boolean,
    recipe: RecipeData | RecipeModel
}> {
    console.log('generateElement', a, ':-:', b, steamId, requestId, requestIp, custom);
    await startGenerating(a, b);
    const knowItemsVar = custom ? knownCustomItems : knownItems;
    try {
        let combine = await runElementCombine(a, b, steamId, requestId, requestIp);
        let reversed = false;
        if ((combine.result === a || combine.result === b) && a !== b) {
            combine = await runElementCombine(b, a, steamId, requestId, requestIp);
            reversed = true;
        }
        const completionTokens = combine.tokens;
        const result = combine.result;
        if (Language !== undefined && Recipe !== undefined) {
            let foundLanguage: LanguageModel | null = null;
            if (!Object.keys(knowItemsVar).includes(result)) {
                foundLanguage = await Language.findOne({
                    where: {
                        name: result
                    },
                });
            }
            if (foundLanguage === null) {
                if (custom && isNumeric(result)) {
                    const english = result;
                    const language = await generateLanguageV2(result, english, 'english', completionTokens, steamId, requestId, requestIp);
                    if (language !== undefined) {
                        foundLanguage = language;
                    }
                } else {
                    const english = capitalizeWords(result, {
                        skipWord: /^(a|the|an|and|or|nor|as|at|via|by|with|than|to|for|from|into|like|over|with|upon|but|in|on|of|it)$/
                    });
                    const language = await generateLanguageV2(result, english, 'english', completionTokens, steamId, requestId, requestIp);
                    if (language !== undefined) {
                        foundLanguage = language;
                    }
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
                        depth: knowItemsVar[a].depth + knowItemsVar[b].depth,
                        custom: custom,
                        found_by: steamId ?? '',
                        reversed: reversed
                    });
                }
                if (!custom && newRecipe.custom !== custom) {
                    newRecipe.custom = custom;
                    await newRecipe.save();
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
                        depth: knowItemsVar[a].depth + knowItemsVar[b].depth,
                        custom: false,
                        found_by: steamId ?? '',
                        reversed: reversed
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
                    depth: knownItems[a].depth + knownItems[b].depth,
                    custom: false,
                    found_by: steamId ?? '',
                    reversed: reversed
                }
            };
        }
    } catch(e) {
        await setFinished(a, b, true);
        throw e;
    }
}

export async function runElementCombine(a: string, b: string, steamId?: string, requestId?: string, requestIp?: string): Promise<{
    tokens: number,
    result: string
}> {
    console.log('runElementCombine', a, ':-:', b, steamId, requestId, requestIp);
    try {
        const chatCompletion = await openai.chat.completions.create({
            //model: "gpt-4",
            // model: 'gpt-3.5-turbo',
            model: 'ft:gpt-3.5-turbo-0125:puzzle-galaxy:all:9Hvsxoqb',
            messages: [
                {
                    role: 'system',
                    content: aiTaskV2()
                },
                {
                    role: 'user',
                    content: `${a} ${b}`
                }
            ],
            max_tokens: 100,
            logit_bias: {
                '12': -0.15, // -
                '482': -0.15, //  -
                '6': -0.4, // '
                '1': -0.3, // "
                '55665': -0.5, // fusion
            },
            user: ((steamId ?? requestIp) ?? requestId) ?? 'unknown',
            seed: 696969,
            frequency_penalty: 0.5,
            n: 1,
            temperature: 0
        });
        const aiResponseRaw = chatCompletion.choices[0].message.content;
        if (aiResponseRaw) {
            const completionTokens = chatCompletion.usage?.completion_tokens ?? 0;
            const result = aiResponseRaw.toLowerCase();
            return {
                tokens: completionTokens,
                result: result
            };
        } else {
            throw new Error('AI returned null');
        }
    } catch(e) {
        await setFinished(a, b, true);
        throw e;
    }
}
