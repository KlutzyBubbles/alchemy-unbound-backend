import * as fs from 'fs';
import * as ideas from './training/ideas.json';
import * as infinite from './training/infinite-craft.json';
import * as original from './training/original.json';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 15000,
    maxRetries: 2,
});

type LooseFormat = {
    a: string,
    b: string,
    result: string
}

async function run(useIdeas: boolean, useInfinite: boolean, useOriginal: boolean) {
    const records: LooseFormat[] = [];

    if (useIdeas) {
        records.push(...ideas.table);
    }
    if (useInfinite) {
        records.push(...infinite.table);
    }
    if (useOriginal) {
        records.push(...original.table);
    }

    const formatted: {
        messages: {
            role: 'system' | 'user' | 'assistant',
            content: string
        }[]
    }[] = [];

    for (const record of records) {
        formatted.push({
            messages: [
                {
                    role: 'system',
                    content: 'You are a bot tasked with deciding a word or phrase that is associated to the users input, if applicable use pop culture references, when needed answer literally, keep existing conjunctions and prepositions, no descriptions.'
                },
                {
                    role: 'user',
                    content: `${record.a.toLocaleLowerCase()} ${record.b.toLocaleLowerCase()}`
                },
                {
                    role: 'assistant',
                    content: record.result
                }
            ]
        });
    }

    fs.writeFile(__dirname + '/training.jsonl', formatted.map(x=>JSON.stringify(x)).join('\n'), 'utf-8', err => {
        if (err) {
            console.error(err);
        } else {
            openai.files.create({
                file: fs.createReadStream(__dirname + '/training.jsonl'),
                purpose: 'fine-tune'
            });
            console.log('Done');
        }
    });
}


(async () => {
    await run(true, true, true);
})();


