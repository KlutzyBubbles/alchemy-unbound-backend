/* eslint-disable @typescript-eslint/no-unused-vars */
import OpenAI from 'openai';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { LanguageKeys } from '../src/constants';
import qs from 'qs';

import * as fs from 'fs';
import * as readline from 'readline';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 15000,
    maxRetries: 2,
});

type JSONL = {
    input: string,
    expected: string,
    output: string,
    usage: {
        completion_tokens: number,
        prompt_tokens: number,
        total_tokens: number
    }
}

(async () => {
    // const endpoint = 'https://api.cognitive.microsofttranslator.com';
    // const location = 'eastus';
// 
    // const response = await axios({
    //     baseURL: endpoint,
    //     url: '/translate',
    //     method: 'POST',
    //     headers: {
    //         'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATOR_KEY,
    //         // location required if you're using a multi-service or regional (not global) resource.
    //         'Ocp-Apim-Subscription-Region': location,
    //         'Content-type': 'application/json',
    //         'X-ClientTraceId': uuidv4().toString()
    //     },
    //     params: {
    //         'api-version': '3.0',
    //         from: 'en',
    //         to: Object.values(LanguageKeys)
    //     },
    //     paramsSerializer: (params) => {
    //         return qs.stringify(params, { arrayFormat: 'repeat' });
    //     },
    //     data: [{
    //         text: 'steam'
    //     }],
    //     responseType: 'json'
    // });
    // console.log(JSON.stringify(response.data, null, 4));
    
    // await openai.batches.create({
    //     input_file_id: '',
    //     endpoint: '/v1/chat/completions',
    //     completion_window: '24h',
    // });
    // await openai.files.del('');


    /*
{
    "id": "batch_req_",
    "custom_id": "validation-infinite-surf temple::piranha dew::piranha",
    "response": {
        "status_code": 200,
        "request_id": "",
        "body": {
            "id": "chatcmpl-",
            "object": "chat.completion",
            "created": 1714635439,
            "model": "gpt-3.5-turbo-0125",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "Surf - Beach"
                    },
                    "logprobs": null,
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": 59,
                "completion_tokens": 4,
                "total_tokens": 63
            },
            "system_fingerprint": "fp"
        }
    },
    "error": null
}
    */
    //const one = 'batch_output.jsonl';
    //const two = 'v-infinite-ft-gpt-3.5-turbo-0125--all--auto.jsonl';
    const one = 'batch_output.jsonl';
    const two = 'v-original-ft-gpt-3.5-turbo-0125--all--auto.jsonl';
    const fileStream = fs.createReadStream(`C:/Users/KlutzyBubbles/Documents/GitHub/element-craft-backend/data/validation/output/02-05-2024/${one}`);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
    const formatted: JSONL[] = [];
    const formatted2: JSONL[] = [];
    const expected: { [key: string]: string } = {};

    for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
        const item = JSON.parse(line);
        // validation-infinite-surf temple::piranha dew::piranha
        // const idSplit = item.custom_id.split('-');
        // if (idSplit[2].includes('::::')) {
        //     continue;
        // }
        // const inputSplit = idSplit[2].split('::');
        if (item.custom_id.includes('::::')) {
            continue;
        }
        const inputSplit = item.custom_id.split('::');
        const a = inputSplit[0].split('-').slice(2).join('-');
        const b = inputSplit[1];
        const result = inputSplit[2];
        expected[`${a} ${b}`] = inputSplit[2];
        formatted.push({
            input: `${a} ${b}`,
            expected: result === undefined ? '' : result.toLocaleLowerCase(),
            output: item.response.body.choices[0].message.content.toLocaleLowerCase(),
            usage: item.response.body.usage
        });
    }

    console.log('done1');

    const fileStream2 = fs.createReadStream(`C:/Users/KlutzyBubbles/Documents/GitHub/element-craft-backend/data/validation/output/02-05-2024/${two}`);

    const rl2 = readline.createInterface({
        input: fileStream2,
        crlfDelay: Infinity
    });
    for await (const line of rl2) {
        // Each line in input.txt will be successively available here as `line`.
        const item = JSON.parse(line);
        // validation-infinite-surf temple::piranha dew::piranha
        try {
            formatted2.push({
                input: item.input,
                expected: expected[item.input] === undefined ? '' : expected[item.input].toLocaleLowerCase(),
                output: item.output.toLocaleLowerCase(),
                usage: item.usage
            });
        } catch (error) {
            console.error(error);
        }
    }
    console.log('done2');

    let filename = 'v-original-gpt-3.5-turbo-0125';
    if (two.includes('infinite')) {
        filename = 'v-infinite-gpt-3.5-turbo-0125';
    }
    fs.writeFile(__dirname + `/${filename}.jsonl`, formatted.map(x=>JSON.stringify(x)).join('\n'), 'utf-8', err => {
        if (err) {
            console.error(err);
        } else {
            console.log('Saved one');
        }
    });
    fs.writeFile(__dirname + `/${two}`, formatted2.map(x=>JSON.stringify(x)).join('\n'), 'utf-8', err => {
        if (err) {
            console.error(err);
        } else {
            console.log('Saved two');
        }
    });
    console.log('Done');
})();


