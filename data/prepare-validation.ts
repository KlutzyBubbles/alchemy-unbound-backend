import * as fs from 'fs';
// import * as ideas from './validation/ideas.json';
import * as infinite from './validation/infinite-craft.json';
import * as original from './validation/original.json';
import { aiTaskV2 } from '../src/ai/v2';
import OpenAI from 'openai';

type JSONL = {
    custom_id: string,
    method: string,
    url: string,
    body: {
        model: string,
        messages: {
            role: 'system' | 'user' | 'assistant',
            content: string
        }[],
        max_tokens: number
    }
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 15000,
    maxRetries: 2,
});

const MAX_ITEMS = Infinity;
const MODEL = 'gpt-3.5-turbo-0125';

async function run() {
    const infiniteFormatted: JSONL[] = [];
    const originalFormatted: JSONL[] = [];
    let count = 0;
    for (const record of infinite.table) {
        count++;
        if (count > MAX_ITEMS) {
            break;
        }
        infiniteFormatted.push({
            custom_id: `validation-infinite-${record.a.toLocaleLowerCase()}::${record.b.toLocaleLowerCase()}::${record.result.toLocaleLowerCase()}`,
            method: 'POST',
            url: '/v1/chat/completions',
            body: {
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
                max_tokens: 102
            }
        });
    }
    count = 0;
    for (const record of original.table) {
        count++;
        if (count > MAX_ITEMS) {
            break;
        }
        originalFormatted.push({
            custom_id: `validation-original-${record.a.toLocaleLowerCase()}::${record.b.toLocaleLowerCase()}::${record.result.toLocaleLowerCase()}`,
            method: 'POST',
            url: '/v1/chat/completions',
            body: {
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
                max_tokens: 102
            }
        });
    }

    const infiniteName = `v-infinite-${MODEL}-auto.jsonl`;
    const originalName = `v-original-${MODEL}-auto.jsonl`;
    fs.writeFile(__dirname + `/${infiniteName}`, infiniteFormatted.map(x=>JSON.stringify(x)).join('\n'), 'utf-8', err => {
        if (err) {
            console.error(err);
        } else {
            openai.files.create({
                file: fs.createReadStream(__dirname + `/${infiniteName}`),
                purpose: 'batch' as 'fine-tune' | 'assistants'
            });
        }
    });

    fs.writeFile(__dirname + `/${originalName}`, originalFormatted.map(x=>JSON.stringify(x)).join('\n'), 'utf-8', err => {
        if (err) {
            console.error(err);
        } else {
            openai.files.create({
                file: fs.createReadStream(__dirname + `/${originalName}`),
                purpose: 'batch' as 'fine-tune' | 'assistants'
            });
        }
    });
}

(async () => {
    await run();
})();
