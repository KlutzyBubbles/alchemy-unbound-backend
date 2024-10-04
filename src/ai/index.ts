import OpenAI from 'openai';
import { LanguageRef } from '../language';

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 15000,
    maxRetries: 2,
});

export const trainingTask = (a: string, b: string) => `TASK: Make a new item / idea from ${a} and ${b}.
You mix in pop culture references if the inputs or output has a vague connection to the pop culture reference.
This item / idea should be linked by the description or meaning of the two words
These items should be combined to make fun and interesting items. The more explorative the better.
Your response should be the name of the new item, with an accomianing emoji that best represents the name.
Always try to keep the emoji as closely related to the item as possible and use only 1 emoji.
The item name should also be translated into Russian, Simplified Chinese, Spanish, French, Japanese, Indonesian, German, Latin American Spanish, Italian, Dutch, Polish, Portuguese, Traditional Chinese, Korean.
the output keys corrspond like the following: schinese is Simplified Chinese, tchinese is Traditional chinese, koreana is Korean, latam is Latin American Spanish.
Your output should be in json format to be parsed. Format: ${JSON.stringify({ ...LanguageRef, emoji: 'emoji' })}`;

export const systemTask = () => `You are a bot that combines two items to create a new item or idea.
You mix in pop culture references if the inputs or output has a vague connection to the pop culture reference.
This new item / idea should be linked by the description or meaning of the two input words
These items should be combined to make fun and interesting items. The more explorative the better.
Your response should be the name of the new item, with an accomianing emoji that best represents the name.
Always try to keep the emoji as closely related to the item as possible and use only 1 emoji.
The item name should also be translated into Russian, Simplified Chinese, Spanish, French, Japanese, Indonesian, German, Latin American Spanish, Italian, Dutch, Polish, Portuguese, Traditional Chinese, Korean.
the output keys corrspond like the following: schinese is Simplified Chinese, tchinese is Traditional chinese, koreana is Korean, latam is Latin American Spanish.
Your output should be in json format to be parsed. Format: ${JSON.stringify({ ...LanguageRef, emoji: 'emoji' })}`;

export const translateTask = (name: string) => `TASK given the input json {
    "english": "${name}",
    "schinese": "",
    "russian": "",
    "spanish": "",
    "french": "",
    "japanese": "",
    "indonesian": "",
    "german": "",
    "latam": "",
    "italian": "",
    "dutch": "",
    "polish": "",
    "portuguese": "",
    "tchinese": "",
    "koreana": "",
    "emoji": ""
}, fill in the empty strings with their corresponding languages translated from english.
schinese is Simplified Chinese, tchinese is traditional chinese, koreana is korean, latam is Latin American Spanish. Do not put quotes around the json keys.
emoji should be a single emoji that best represents the word.
Your output should be in json format to be parsed. Format: {
    "english": "",
    "schinese": "",
    "russian": "",
    "spanish": "",
    "french": "",
    "japanese": "",
    "indonesian": "",
    "german": "",
    "latam": "",
    "italian": "",
    "dutch": "",
    "polish": "",
    "portuguese": "",
    "tchinese": "",
    "koreana": "",
    "emoji": ""
}`;


export const rawTranslateTask = (name: string) => `TASK given the input json {
    "english": "${name}",
    "schinese": "",
    "russian": "",
    "spanish": "",
    "french": "",
    "japanese": "",
    "indonesian": "",
    "german": "",
    "latam": "",
    "italian": "",
    "dutch": "",
    "polish": "",
    "portuguese": "",
    "tchinese": "",
    "koreana": ""
}, fill in the empty strings with their corresponding languages translated from english.
schinese is Simplified Chinese, tchinese is traditional chinese, koreana is korean, latam is Latin American Spanish. Do not put quotes around the json keys.
Your output should be in json format to be parsed. Format: {
    "english": "",
    "schinese": "",
    "russian": "",
    "spanish": "",
    "french": "",
    "japanese": "",
    "indonesian": "",
    "german": "",
    "latam": "",
    "italian": "",
    "dutch": "",
    "polish": "",
    "portuguese": "",
    "tchinese": "",
    "koreana": ""
}`;

/*
TASK: Combine 'snow' and 'piranha plant' to create a new item.

Given items in the input format { "a": "snow", "b": "piranha plant" }, combine both a and b to create a new item

TASK: Combine 'snow' and 'piranha plant' to create a new item.
Given items in the input format { "a": "snow", "b": "piranha plant" }, combine both a and b to create a new item
You should prioritize making a new thing, rather than simply combining the words.
You can interpret the input items in a creative way.
These items should be combined to make fun and interesting items. The more explorative the better.
You are allowed to use one of the inputs as the output, but only if there are no realistic output items.
Your response should be the name of the new element and MUST contain one and only one emoji to represent the element.
Always try to keep the emoji as closely related to the element as possible and try to use only 1 emoji.
The emoji should NOT be included with the translation.
Example: Earth + Earth = 🌍 Solar System.
Example: Fire + Water = 💨 Steam.
Example: Earth + Water" = 🌱 Plant.
Example: Wind + Plant" = 🌼 Dandelion.
Exmaple: Earth + Fire" = 🌋 Lava.
Exmaple: Wind + Fire" = 💨 Smoke.
Exmaple: Flower + Sand" = 🌵 Cactus.
Exmaple: Lava + Lava" = 🌋 Volcano.
The element name should also be translated into Russian, Simplified Chinese, Spanish, French, Japanese, Indonesian, German, Latin American Spanish, Italian, Dutch, Polish, Portuguese, Traditional Chinese, Korean.
schinese is Simplified Chinese, tchinese is Traditional chinese, koreana is Korean, latam is Latin American Spanish.
Do not  output anything except for the output json
Your output MUST be in json format to be parsed. Format: {
    english: "name",
    schinese: "姓名",
    russian: "имя",
    spanish: "nombre",
    french: "nom",
    japanese: "名前",
    indonesian: "nama",
    german: "Name",
    latam: "nome",
    italian: "nome",
    dutch: "naam",
    polish: "imię",
    portuguese: "nome",
    tchinese: "名字",
    koreana: "이름", emoji: "emoji" }
*/

