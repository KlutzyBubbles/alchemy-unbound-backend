import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

import { LanguageObject } from '../src/types';
import { generateLanguageV2 } from '../src/language/helpers';
import { filterLanguages } from '../src/language';
// import { openai, rawTranslateTask } from '../src/ai';

const items: {
    [key: string]: LanguageObject
} = {
    days: {
        english: 'Days',
        schinese: '',
        russian: '',
        spanish: '',
        french: '',
        japanese: '',
        indonesian: '',
        german: '',
        latam: '',
        italian: '',
        dutch: '',
        polish: '',
        portuguese: '',
        tchinese: '',
        koreana: ''
    },
};

async function translate() {
    const output: {
        [key: string]: LanguageObject
    } = {};
    for (const key of Object.keys(items)) {
        try {
            const result = await generateLanguageV2(key, items[key].english, 'english', 1, undefined, undefined, undefined, true, true);
            console.log('result', result);
            if (result !== undefined) {
                const aiResponse: LanguageObject = filterLanguages(result);
                console.log('aiResponse', aiResponse);
                output[key] = aiResponse;
            } else {
                throw new Error('Lang returned undefined');
            }
            /*
            const chatCompletion = await openai.chat.completions.create({
                //model: "gpt-4",
                // model: "gpt-3.5-turbo",
                model: 'gpt-3.5-turbo-1106',
                messages: [
                    {
                        role: 'system',
                        content: rawTranslateTask(items[key].english)
                    }
                ],
                temperature: 0.5
            });
            const aiResponseRaw = chatCompletion.choices[0].message.content;
            if (aiResponseRaw) {
                const aiResponse: LanguageObject = JSON.parse(aiResponseRaw);
                output[key] = aiResponse;
            } else {
                throw new Error('AI returned null');
            }
            */
        } catch (e) { 
            console.error(e);
        }
    }
    fs.writeFile(__dirname + '/translate2.json', JSON.stringify(output), err => console.error('done', err));
}

(async () => {
    await translate();
})();


