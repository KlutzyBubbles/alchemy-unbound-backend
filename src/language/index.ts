import { LanguageModel } from '../models/v1/language.model';
import { LanguageObject } from '../types';

export const LanguageRef = {
    english: 'name',
    schinese: '姓名',
    russian: 'имя',
    spanish: 'nombre',
    french: 'nom',
    japanese: '名前',
    indonesian: 'nama',
    german: 'Name',
    latam: 'nome',
    italian: 'nome',
    dutch: 'naam',
    polish: 'imię',
    portuguese: 'nome',
    tchinese: '名字',
    koreana: '이름'
};

export function filterLanguages(item: LanguageModel): LanguageObject {
    const result: Record<string, string> = {};
    for (const language of Object.keys(LanguageRef)) {
        result[language] = item[language as keyof LanguageModel] as string;
    }
    return result as LanguageObject;
}

/*
TASK: Make a new item / idea from and.
You mix in pop culture references if the inputs or output has a vague connection to the pop culture reference.
This item / idea should be linked by the description or meaning of the two words
These items should be combined to make fun and interesting items. The more explorative the better.
Your response should be the name of the new item, with an accomianing emoji that best represents the name.
Always try to keep the emoji as closely related to the item as possible and use only 1 emoji.
The item name should also be translated into Russian, Simplified Chinese, Spanish, French, Japanese, Indonesian, German, Latin American Spanish, Italian, Dutch, Polish, Portuguese, Traditional Chinese, Korean.
the output keys corrspond like the following: schinese is Simplified Chinese, tchinese is Traditional chinese, koreana is Korean, latam is Latin American Spanish.
Your output should be in json format to be parsed. Format: {
    "english": 'name',
    "schinese": '姓名',
    "russian": 'имя',
    "spanish": 'nombre',
    "french": 'nom',
    "japanese": '名前',
    "indonesian": 'nama',
    "german": 'Name',
    "latam": 'nome',
    "italian": 'nome',
    "dutch": 'naam',
    "polish": 'imię',
    "portuguese": 'nome',
    "tchinese": '名字',
    "koreana": '이름',
    "emoji": ""
}
*/
