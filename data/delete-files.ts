import OpenAI from 'openai';
import { APIPromise } from 'openai/core';
import { FileDeleted } from 'openai/resources';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 15000,
    maxRetries: 2,
});

const FILES: string[] = [
    //'',
    //'',
    //'',
    //'',
    //'',
    //'',
    //'',
    //'',
    //'',
    //'',
    //''
];

(async () => {
    const proms: APIPromise<FileDeleted>[] = [];
    for (const file of FILES) {
        proms.push(openai.files.del(file));
    }
    await Promise.all(proms);
    console.log('Done');
})();


