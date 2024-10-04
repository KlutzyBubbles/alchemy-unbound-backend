import * as fs from 'fs';
import { Recipe } from '../src/models/v2/recipe.model';
import { Language } from '../src/models/v2/language.model';
import { filterLanguages } from '../src/language';
import { Op } from 'sequelize';
import { LanguageObject } from '../src/types';

async function loadBase(version: number) {
    if (Recipe === undefined || Language === undefined) {
        return;
    }
    const items = await Recipe.findAll({
        where: {
            base: true
        }
    });
    console.log('Base found', items.length);
    const baseOutput: unknown[] = [];
    const allDiscoveredOutput: unknown[] = [];
    const languagesOutput: Record<string, LanguageObject & { emoji: string }> = {};
    let count = 0;

    const itemNames = [...new Set(items.map((item) => item.result))];
    const languages = await Language.findAll({
        where: {
            name: {
                [Op.in]: itemNames
            }
        }
    });
    console.log('Language found', languages.length);
    for (const language of languages) {
        languagesOutput[language.name] = {
            english: language.english,
            schinese: language.schinese,
            russian: language.russian,
            spanish: language.spanish,
            french: language.french,
            japanese: language.japanese,
            indonesian: language.indonesian,
            german: language.german,
            latam: language.latam,
            italian: language.italian,
            dutch: language.dutch,
            polish: language.polish,
            portuguese: language.portuguese,
            tchinese: language.tchinese,
            koreana: language.koreana,
            emoji: language.emoji
        };
    }

    for (const item of items) {
        count++;
        // console.log(`Processing item ${count}`);
        try {
            const language = languages.find((lang) => lang.name === item.result);
            if (language === null || language === undefined) {
                console.error(`Language not found for ${item.result}`);
                continue;
            }
            const itemFormatted: {
                a: string,
                b: string,
                result: string,
                order: number,
                discovered: number,
                display?: LanguageObject,
                emoji?: string,
                first: number,
                depth: number,
                who_discovered: string,
                base: number
            } = {
                a: item.a,
                b: item.b,
                result: item.result,
                order: item.id,
                discovered: item.a === '' && item.b === '' ? 1 : 0,
                first: 0,
                depth: item.depth,
                who_discovered: language.who_discovered,
                base: item.base ? 1 : 0
            };
            if (version === 1) {
                itemFormatted.display = filterLanguages(language);
                itemFormatted.emoji = language.emoji;
            }
            baseOutput.push(itemFormatted);
            const clone = structuredClone(itemFormatted);
            clone.discovered = 1;
            allDiscoveredOutput.push(clone);
        } catch (error) {
            console.error(`Failed to process item ${count} (${item.a}::${item.b}::${item.result})`, error);
            continue;
        }
    }
    console.log(`Processed ${count} items`);
    fs.writeFile(__dirname + '/base.json', JSON.stringify(baseOutput), err => console.error('base', err));
    fs.writeFile(__dirname + '/languages.json', JSON.stringify(languagesOutput), err => console.error('base', err));
    fs.writeFile(__dirname + '/allDiscovered.json', JSON.stringify(allDiscoveredOutput), err => console.error('base', err));
}

(async () => {
    await loadBase(2);
})();


