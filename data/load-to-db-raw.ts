import { Op } from 'sequelize';
import { capitalizeWords, generateLanguageV2 } from '../src/language/helpers';
import { Language, LanguageModel } from '../src/models/v2/language.model';
import { Recipe, knownItems } from '../src/models/v2/recipe.model';
import * as languages from './base/Languages.json';
import * as baseRecipes from './base/Recipes.json';
import cl100k_base from 'gpt-tokenizer/cjs/encoding/cl100k_base';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadLanguages() {
    let count = 0;
    if (Language === undefined) {
        throw new Error('No language');
    }

    for (const langItem of languages.Languages) {
        count++;
        if (count > 1000) {
            break;
        }

        let language: LanguageModel | undefined = undefined;
        try {
            const resultLanguage = await Language.findOne({
                where: {
                    name: `${langItem.name}`
                },
            });
            if (resultLanguage !== null) {
                language = resultLanguage;
            } else {
                const encoded = cl100k_base.encode(langItem.name as string);
                const newLanguage = await Language.create({
                    name: `${langItem.name}`,
                    english: `${langItem.english}`,
                    japanese: `${langItem.japanese}`,
                    schinese: `${langItem.schinese}`,
                    french: `${langItem.french}`,
                    russian: `${langItem.russian}`,
                    spanish: `${langItem.spanish}`,
                    indonesian: `${langItem.indonesian}`,
                    german: `${langItem.german}`,
                    latam: `${langItem.latam}`,
                    italian: `${langItem.italian}`,
                    dutch: `${langItem.dutch}`,
                    polish: `${langItem.polish}`,
                    portuguese: `${langItem.portuguese}`,
                    tchinese: `${langItem.tchinese}`,
                    koreana: `${langItem.koreana}`,
                    who_discovered: '',
                    tokens: encoded.length,
                    emoji: `${langItem.emoji}`,
                });
                language = newLanguage;
            }
        } catch(e) {
            console.error('Failed to generate new element', e);
            continue;
        }
        console.log('Processed language', language.name);
    }
    //console.log('result', outputUrls);
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadBaseRecipes() {
    let count = 0;

    if (Recipe === undefined || Language === undefined) {
        console.log('recipe or lang gone');
        return;
    }

    for (const recipeItem of baseRecipes.Recipes) {
        count++;
        if (count > 4000) {
            break;
        }const a: string | undefined = recipeItem.a as string | undefined;
        const b: string | undefined = recipeItem.b as string | undefined;
        let result: string | undefined = recipeItem.result as string | undefined;
        let base: boolean | undefined = recipeItem.base as boolean | undefined;
        let ignoreDupe: boolean | undefined = undefined;

        if (a === undefined || b === undefined || result === undefined) {
            console.log('QUERY_UNDEFINED', a, b, result);
            continue;
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
            aDepth = knownItems[a].depth;
            bDepth = knownItems[b].depth;
        } else {
            if (!Object.keys(knownItems).includes(a)) {
                const aExists = await Recipe.findOne({
                    where: {
                        result: a
                    },
                    attributes: ['result', 'depth', 'base']
                });
                if (aExists !== null) {
                    knownItems[aExists.result] = {
                        depth: aExists.depth,
                        base: aExists.base,
                    };
                    aDepth = aExists.depth;
                }
            } else {
                aDepth = knownItems[a].depth;
            }
            if (!Object.keys(knownItems).includes(b)) {
                const bExists = await Recipe.findOne({
                    where: {
                        result: b
                    },
                    attributes: ['result', 'depth', 'base']
                });
                if (bExists !== null) {
                    knownItems[bExists.result] = {
                        depth: bExists.depth,
                        base: bExists.base,
                    };
                    bDepth = bExists.depth;
                }
            } else {
                bDepth = knownItems[b].depth;
            }
            if (Object.keys(knownItems).includes(a) && Object.keys(knownItems).includes(b)) {
                itemsKnown = true;
            }
        }
        if (itemsKnown === false) {
            console.log('AB_NOT_KNOWN', a, b, result);
            continue;
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
                let resultLanguage = await Language.findOne({
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
                        depth: aDepth + bDepth,
                        custom: false,
                        found_by: '',
                        reversed: false
                    });
                    language = resultLanguage;
                    recipe = newRecipe;
                } else {
                    const encoded = cl100k_base.encode(result);
                    const english = capitalizeWords(result, {
                        skipWord: /^(a|the|an|and|or|nor|as|at|via|by|with|than|to|for|from|into|like|over|with|upon|but|in|on|of|it)$/
                    });
                    const language = await generateLanguageV2(result, english, 'english', encoded.length, '', 'local', '');
                    if (language !== undefined) {
                        const newRecipe = await Recipe.create({
                            a: a,
                            b: b,
                            result: result,
                            base: true,
                            depth: aDepth + bDepth,
                            custom: false,
                            found_by: '',
                            reversed: false
                        });
                        resultLanguage = language;
                        recipe = newRecipe;
                    } else {
                        throw new Error('Unable to validate AI response');
                    }
                }
            } catch(e) {
                console.error('Failed to gen element', e);
                continue;
            }
        } else {
            // Recipe known, check result
            if (result !== recipe.result) {
                // Same
                if (ignoreDupe) {
                    try {
                        let resultLanguage = await Language.findOne({
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
                                depth: aDepth + bDepth,
                                custom: false,
                                found_by: '',
                                reversed: false
                            });
                            language = resultLanguage;
                            recipe = newRecipe;
                        } else {
                            const encoded = cl100k_base.encode(result);
                            const english = capitalizeWords(result, {
                                skipWord: /^(a|the|an|and|or|nor|as|at|via|by|with|than|to|for|from|into|like|over|with|upon|but|in|on|of|it)$/
                            });
                            const language = await generateLanguageV2(result, english, 'english', encoded.length, '', 'local', '');
                            if (language !== undefined) {
                                const newRecipe = await Recipe.create({
                                    a: a,
                                    b: b,
                                    result: result,
                                    base: true,
                                    depth: aDepth + bDepth,
                                    custom: false,
                                    found_by: '',
                                    reversed: false
                                });
                                resultLanguage = language;
                                recipe = newRecipe;
                            } else {
                                throw new Error('Unable to validate AI response');
                            }
                        }
                    } catch(e) {
                        console.error('Failed to gen element 2', e);
                        continue;
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
                console.error('Language is missing when it shouldnt be', e);
                continue;
            }
        }
    }
}

(async () => {
    console.log('Loading...');
    // await loadLanguages();
    await loadBaseRecipes();
    console.log('Done.');
})();


