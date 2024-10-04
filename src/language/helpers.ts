import axios from 'axios';
import { openai } from '../ai';
import qs from 'qs';
import { emojiTaskV2 } from '../ai/v2';
import { LanguageKeys, SteamLanguageKeys } from '../constants';
import { LanguageModel, Language } from '../models/v2/language.model';
import { AIResponse, LanguageObject, UnknownAIResponse, knownLanguageKeys } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { isNumeric } from '../router/helpers';

// Deprecated
export function trimEmoji(response: AIResponse): AIResponse {
    if (response.emoji.length > 1) {
        const found = response.emoji.match(/\p{Emoji}/u);
        if (found !== undefined && found !== null && found.length > 0) {
            response.emoji = found[0];
        }
    }
    return response;
}

export function validateOrUndefinedV1(response: UnknownAIResponse): AIResponse | undefined {
    const constructed: Partial<AIResponse> = {
        english: response.english,
        schinese: response.schinese ?? (response['simplified chinese'] ?? response.chinese),
        russian: response.russian,
        spanish: response.spanish,
        french: response.french,
        japanese: response.japanese,
        indonesian: response.indonesian,
        german: response.german,
        latam: (response.latam ?? (response.latin ?? response['latin american spanish'])) ?? response.latinamerican,
        italian: response.italian,
        dutch: response.dutch,
        polish: response.polish,
        portuguese: response.portuguese,
        tchinese: response.tchinese ?? (response['traditional chinese'] ?? response.chinese),
        koreana: response.koreana ?? response.korean,
        emoji: response.emoji
    };
    const undefinedKeys: string[] = [];
    for (const key of Object.keys(constructed)) {
        if (constructed[key as keyof LanguageObject] === undefined) {
            undefinedKeys.push(key);
        }
    }
    if (undefinedKeys.length > 0) {
        const unknownKeys: string[] = [];
        for (const key of Object.keys(constructed)) {
            if (!knownLanguageKeys.includes(key)) {
                unknownKeys.push(key);
            }
        }
        console.error('Keys are still undefined, undefined, unknown', undefinedKeys, unknownKeys);
        return undefined;
    } else {
        return constructed as AIResponse;
    }
}

export function validateOrUndefinedV2(response: UnknownAIResponse): AIResponse | undefined {
    const constructed: Partial<AIResponse> = {
        english: response.english,
        schinese: undefined,
        russian: response.russian,
        spanish: response.spanish,
        french: response.french,
        japanese: response.japanese,
        indonesian: response.indonesian,
        german: response.german,
        latam: undefined,
        italian: response.italian,
        dutch: response.dutch,
        polish: response.polish,
        portuguese: response.portuguese,
        tchinese: undefined,
        koreana: response.koreana ?? response.korean,
        emoji: response.emoji
    };
    // Fix Simplified Chinese
    if (response.simplified_chinese) {
        constructed.schinese = response.simplified_chinese;
    } else if (response['simplified chinese']) {
        constructed.schinese = response['simplified chinese'];
    } else if (response.schinese) {
        constructed.schinese = response.schinese;
    } else if (response.chinese) {
        constructed.schinese = response.chinese;
    }

    // Fix Traditional Chinese
    if (response.traditional_chinese) {
        constructed.tchinese = response.traditional_chinese;
    } else if (response['traditional chinese']) {
        constructed.tchinese = response['traditional chinese'];
    } else if (response.tchinese) {
        constructed.tchinese = response.tchinese;
    } else if (response.chinese) {
        constructed.tchinese = response.chinese;
    }

    // Fix Latin American Spanish
    if (response.latin_american_spanish) {
        constructed.latam = response.latin_american_spanish;
    } else if (response['latin american spanish']) {
        constructed.latam = response['latin american spanish'];
    } else if (response.latin) {
        constructed.latam = response.latin;
    } else if (response.latam) {
        constructed.latam = response.latam;
    }
    const undefinedKeys: string[] = [];
    for (const key of Object.keys(constructed)) {
        if (constructed[key as keyof LanguageObject] === undefined) {
            undefinedKeys.push(key);
        }
    }
    if (undefinedKeys.length > 0) {
        const unknownKeys: string[] = [];
        for (const key of Object.keys(constructed)) {
            if (!knownLanguageKeys.includes(key)) {
                unknownKeys.push(key);
            }
        }
        console.error('Keys are still undefined, undefined, unknown', undefinedKeys, unknownKeys);
        return undefined;
    } else {
        return constructed as AIResponse;
    }
}

type CapitalizeOpts = {
    preserve?: boolean,
    skipWord?: RegExp
}

type CapitalizeOptsNormalized = {
    preserve: boolean,
    skipWord?: (word: string, position: number) => boolean
}

export function capitalize (string: string, opts: CapitalizeOpts) {
    const optsNorm = normalizeOptions(opts);
    if (!optsNorm.preserve) {
        string = string.toLowerCase();
    }
    return string.charAt(0).toUpperCase() + string.substring(1);
}
  
// a QUOTE character immediately followed by a word character
const QUOTE = /['"`’]/;
const WORD = /[0-9a-zA-Z\u00C0-\u017F\u0400-\u04FF]/;
  
export function capitalizeWords(string: string, opts: CapitalizeOpts) {
    console.debug('capitalizeWords', string);
    const optsNorm = normalizeOptions(opts);
    if (!optsNorm.preserve) {
        string = string.toLowerCase();
    }
    let startOfWord = 0;
    const nonWord = /[^0-9a-zA-Z\u00C0-\u017F\u0400-\u04FF]+|$/g;
    let match = nonWord.exec(string);
    let out = '';
    let count = 0;

    while (match) {
        const sep = match[0];
        const sepStart = nonWord.lastIndex - sep.length;
        if (QUOTE.test(string[sepStart]) && WORD.test(string[sepStart + 1])) {
        // don't capitalize after an embedded quote
            match = nonWord.exec(string);
            continue;
        }
        let word = string.substring(startOfWord, nonWord.lastIndex - sep.length);
        if (QUOTE.test(word[0])) {
        // strip leading quote
            out += word[0];
            word = word.substring(1);
        }
        if (typeof optsNorm.skipWord === 'function' && optsNorm.skipWord(word, count)) {
            out += word;
        } else {
            out += capitalize(word, opts);
        }
        out += sep;
        startOfWord = nonWord.lastIndex;
        count++;
        if (startOfWord == string.length) {
            break;
        }
        match = nonWord.exec(string);
    }
  
    return out;
}
  
function normalizeOptions(opts: CapitalizeOpts): CapitalizeOptsNormalized {
    if (!opts) {
        return { preserve: false };
    }
    if (typeof opts === 'boolean') {
        return { preserve: opts };
    }
    if (opts.skipWord instanceof RegExp) {
        const newOpts: CapitalizeOptsNormalized = {
            preserve: opts.preserve ?? false
        };
        const rgx = opts.skipWord;
        newOpts.skipWord = function (word, position) {
            return position > 0 && rgx.test(word);
        };
    }
    return {
        preserve: opts.preserve ?? false
    };
}

const MAX_TRIES = 3;

export async function generateLanguageV2(
    result: string,
    language: string,
    fromLanguage: keyof LanguageObject,
    tokens: number,
    steamId?: string,
    requestId?: string,
    requestIp?: string,
    skipEmoji: boolean = false,
    noStore: boolean = false,
    tryNumber: number = 0): Promise<LanguageModel | undefined> {
    console.log('generateLanguageV2', result, tryNumber, language, tokens, fromLanguage);
    if (tryNumber >= MAX_TRIES) {
        return undefined;
    }
    if (Language === undefined) {
        return undefined;
    }
    try {
        let emoji: string | undefined = undefined;

        if (skipEmoji) {
            emoji = '❓';
        } else {
            const chatCompletion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: emojiTaskV2()
                    },
                    {
                        role: 'user',
                        content: `${result}`
                    }
                ],
                max_tokens: 33,
                user: ((steamId ?? requestIp) ?? requestId) ?? 'unknown',
                seed: 696969,
                frequency_penalty: 0.5,
                n: 1,
                temperature: 0
            });
            const aiResponseRaw = chatCompletion.choices[0].message.content;
            if (aiResponseRaw) {
                emoji = aiResponseRaw;
            } else {
                console.error('AI Response undefined');
                return generateLanguageV2(result, language, fromLanguage, tokens, steamId, requestId, requestIp, skipEmoji, noStore, tryNumber + 1);
            }

            if (emoji === undefined || emoji === '') {
                console.error('Emoji undefined');
                return generateLanguageV2(result, language, fromLanguage, tokens, steamId, requestId, requestIp, skipEmoji, noStore, tryNumber + 1);
            }
        }
        
        const constructed: Partial<AIResponse> = {
            english: undefined,
            schinese: undefined,
            russian: undefined,
            spanish: undefined,
            french: undefined,
            japanese: undefined,
            indonesian: undefined,
            german: undefined,
            latam: undefined,
            italian: undefined,
            dutch: undefined,
            polish: undefined,
            portuguese: undefined,
            tchinese: undefined,
            koreana: undefined,
            emoji: emoji
        };
        const undefinedKeys: string[] = [];

        if (isNumeric(language)) {
            constructed.english = language;
            constructed.schinese = language;
            constructed.russian = language;
            constructed.spanish = language;
            constructed.french = language;
            constructed.japanese = language;
            constructed.indonesian = language;
            constructed.german = language;
            constructed.latam = language;
            constructed.italian = language;
            constructed.dutch = language;
            constructed.polish = language;
            constructed.portuguese = language;
            constructed.tchinese = language;
            constructed.koreana = language;
        } else {
            const endpoint = 'https://api.cognitive.microsofttranslator.com';
            const location = 'eastus';
    
            const response = await axios({
                baseURL: endpoint,
                url: '/translate',
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATOR_KEY,
                    // location required if you're using a multi-service or regional (not global) resource.
                    'Ocp-Apim-Subscription-Region': location,
                    'Content-type': 'application/json',
                    'X-ClientTraceId': uuidv4().toString()
                },
                params: {
                    'api-version': '3.0',
                    from: SteamLanguageKeys[fromLanguage],
                    to: Object.keys(LanguageKeys)
                },
                paramsSerializer: (params) => {
                    return qs.stringify(params, { arrayFormat: 'repeat' });
                },
                data: [{
                    text: `${language}`
                }],
                responseType: 'json'
            });
            const translations: {
                text: string,
                to: string
            }[] = response.data[0].translations;
    
            for (const translation of translations) {
                constructed[LanguageKeys[translation.to]] = translation.text;
            }
            if (constructed.latam === undefined) {
                constructed.latam = constructed.spanish;
            }
            for (const key of Object.keys(constructed)) {
                if (constructed[key as keyof LanguageObject] === undefined) { // || constructed[key as keyof LanguageObject] === '') {
                    undefinedKeys.push(key);
                }
            }
        }

        if (undefinedKeys.length === 0) {
            if (noStore) {
                return Language.build({
                    ...(constructed as AIResponse),
                    who_discovered: steamId ?? '',
                    name: result,
                    tokens: tokens,
                });
            }
            const [foundLanguage] = await Language.findOrCreate({
                where: {
                    name: result
                },
                defaults: {
                    ...(constructed as AIResponse),
                    who_discovered: steamId ?? '',
                    name: result,
                    tokens: tokens,
                }
            });
            if (foundLanguage !== null) {
                return foundLanguage;
            } else {
                return generateLanguageV2(result, language, fromLanguage, tokens, steamId, requestId, requestIp, skipEmoji, noStore, tryNumber + 1);
            }
        } else {
            console.error('Keys are still undefined, undefined', undefinedKeys);
            return generateLanguageV2(result, language, fromLanguage, tokens, steamId, requestId, requestIp, skipEmoji, noStore, tryNumber + 1);
        }
    } catch (e) {
        console.warn('Language failed generating', { requestId: requestId });
        return generateLanguageV2(result, language, fromLanguage, tokens, steamId, requestId, requestIp, skipEmoji, noStore, tryNumber + 1);
    }
}

export async function getEnglish(
    item: string,
    fromLanguage: keyof LanguageObject,
    steamId?: string,
    requestId?: string,
    requestIp?: string,
    tryNumber: number = 0): Promise<string | undefined> {
    console.log('getEnglish', item, tryNumber, fromLanguage);
    if (tryNumber >= MAX_TRIES) {
        return undefined;
    }
    try {
        if (isNumeric(item)) {
            return item;
        } else {
            const endpoint = 'https://api.cognitive.microsofttranslator.com';
            const location = 'eastus';
    
            const response = await axios({
                baseURL: endpoint,
                url: '/translate',
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATOR_KEY,
                    // location required if you're using a multi-service or regional (not global) resource.
                    'Ocp-Apim-Subscription-Region': location,
                    'Content-type': 'application/json',
                    'X-ClientTraceId': uuidv4().toString()
                },
                params: {
                    'api-version': '3.0',
                    from: SteamLanguageKeys[fromLanguage],
                    to: 'en'
                },
                paramsSerializer: (params) => {
                    return qs.stringify(params, { arrayFormat: 'repeat' });
                },
                data: [{
                    text: `${item}`
                }],
                responseType: 'json'
            });
            const translations: {
                text: string,
                to: string
            }[] = response.data[0].translations;

            let english: string | undefined = undefined;
    
            for (const translation of translations) {
                if (translation.to === 'en') {
                    english = translation.text;
                }
            }

            return english;
        }
    } catch (e) {
        console.warn('English failed generating', { requestId: requestId });
        return getEnglish(item, fromLanguage, steamId, requestId, requestIp, tryNumber + 1);
    }
}
