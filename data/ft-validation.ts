import * as fs from 'fs';
// import * as ideas from './validation/ideas.json';
import * as infinite from './validation/infinite-craft.json';
import * as original from './validation/original.json';
import { aiTaskV2 } from '../src/ai/v2';
import OpenAI from 'openai';
import { APIPromise } from 'openai/core';

type JSONL = {
    input: string,
    output: string,
    usage: {
        completion_tokens: number,
        prompt_tokens: number,
        total_tokens: number
    }
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 15000,
    maxRetries: 2,
});

const MAX_ITEMS = Infinity;
const MODEL = 'ft:gpt-3.5-turbo-0125::all:';
// const CHUNK_SIZE = 20;

async function run() {
    const infiniteFormatted: JSONL[] = [];
    const originalFormatted: JSONL[] = [];
    const infiniteWait: APIPromise<OpenAI.Chat.Completions.ChatCompletion>[] = [];
    let count = 0;
    for (const record of infinite.table) {
        count++;
        if (count > MAX_ITEMS) {
            break;
        }
        infiniteWait.push(openai.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: aiTaskV2()
                },
                {
                    role: 'user',
                    content: `${record.a.toLocaleLowerCase()} ${record.b.toLocaleLowerCase()}`
                }
            ],
            max_tokens: 100,
            logit_bias: {
                '12': -0.3, // -
                '482': -0.3, //  -
                '6': -0.6, // '
                '1': -0.5, // "
                '55665': -0.8, // fusion
            },
            user: 'validation',
            seed: 696969,
            frequency_penalty: 0.5,
            n: 1,
            temperature: 0
        }));
    }
    try {
        const infiniteDone = await Promise.all(infiniteWait);
        for (let i = 0; i < infiniteDone.length; i++) {
            try {
                infiniteFormatted.push({
                    input: `${infinite.table[i].a.toLocaleLowerCase()} ${infinite.table[i].b.toLocaleLowerCase()}`,
                    output: infiniteDone[i].choices[0].message.content ?? '',
                    usage: infiniteDone[i].usage ?? { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 }
                });
            } catch (error) {
                console.error('Error processing infinite row', error);
            }
        }
        console.log('Processed infinites');
    } catch (error) {
        console.error('Error processing infinite', error);
    }

    const originalWait: APIPromise<OpenAI.Chat.Completions.ChatCompletion>[] = [];
    count = 0;
    for (const record of original.table) {
        count++;
        if (count > MAX_ITEMS) {
            break;
        }
        originalWait.push(openai.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: aiTaskV2()
                },
                {
                    role: 'user',
                    content: `${record.a.toLocaleLowerCase()} ${record.b.toLocaleLowerCase()}`
                }
            ],
            max_tokens: 100,
            logit_bias: {
                '12': -0.3, // -
                '482': -0.3, //  -
                '6': -0.6, // '
                '1': -0.5, // "
                '55665': -0.8, // fusion
            },
            user: 'validation',
            seed: 696969,
            frequency_penalty: 0.5,
            n: 1,
            temperature: 0
        }));
    }
    
    try {
        const originalDone = await Promise.all(originalWait);
        for (let i = 0; i < originalDone.length; i++) {
            try {
                originalFormatted.push({
                    input: `${original.table[i].a.toLocaleLowerCase()} ${original.table[i].b.toLocaleLowerCase()}`,
                    output: originalDone[i].choices[0].message.content ?? '',
                    usage: originalDone[i].usage ?? { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 }
                });
            } catch (error) {
                console.error('Error processing original row', error);
            }
        }
        console.log('Processed originals');
    } catch (error) {
        console.error('Error processing original', error);
    }

    let modelName = MODEL;
    if (modelName.includes(':')) {
        modelName = modelName.split(':').join('-');
    }
    const infiniteName = `v-infinite-${modelName}-auto.jsonl`;
    const originalName = `v-original-${modelName}-auto.jsonl`;
    fs.writeFile(__dirname + `/${infiniteName}`, infiniteFormatted.map(x=>JSON.stringify(x)).join('\n'), 'utf-8', err => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Saved ${infiniteName}`);
        }
    });

    fs.writeFile(__dirname + `/${originalName}`, originalFormatted.map(x=>JSON.stringify(x)).join('\n'), 'utf-8', err => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Saved ${originalName}`);
        }
    });
}

(async () => {
    await run();
})();
