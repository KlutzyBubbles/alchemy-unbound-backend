import { LanguageRef } from '../language';

export const aiTaskV1 = (a: string, b: string) => `TASK: Make a new item / idea from '${a}' and '${b}' to create a new item or concept.
You should prioritize making a new thing out of that, rather than simply combining the words.
The output should be as close to one word as possible, but should be seperated into multiple otherwise.
You mix in pop culture references if the inputs or output has a vague connection to the pop culture reference.
You can interpret the items in a creative way.
These items should be combined to make fun and interesting items. The more explorative the better.
Your response should be the name of the new item, with an accomianing emoji that best represents the name.
The emoji MUST contain only one emoji to represent the item.
Always try to keep the emoji as closely related to the item as possible and use only 1 emoji.
Never output more than one emoji.
The emoji should NOT be included with the translation.
Example: Wind and Plant" = 🌼 Dandelion.
Example: Earth and Earth = 🌍 Solar System.
Exmaple: Flower and Sand" = 🌵 Cactus.
Exmaple: Lava and Lava" = 🌋 Volcano.
The item name should also be translated into Russian, Simplified Chinese, Spanish, French, Japanese, Indonesian, German, Latin American Spanish, Italian, Dutch, Polish, Portuguese, Traditional Chinese, Korean.
schinese is Simplified Chinese, tchinese is Traditional chinese, koreana is Korean, latam is Latin American Spanish.
Your output should be in json format to be parsed. Format: ${JSON.stringify({ ...LanguageRef, emoji: 'emoji' })}`;
