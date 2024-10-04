import dotenv from 'dotenv';

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { openai } from '../src/ai';
import { aiTaskV2 } from '../src/ai/v2';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function run(a: string, b: string) {
    try {
        const chatCompletion = await openai.chat.completions.create({
            // model: "gpt-4",
            // model: 'gpt-3.5-turbo',
            model: 'ft:gpt-3.5-turbo-0125::all:',
            // model: 'gpt-3.5-turbo-1106',
            messages: [
                {
                    role: 'system',
                    //content: 'You are a bot tasked with deciding a word or phrase that best describes or has reference to the users input, if applicable use pop culture references, no descriptions.'
                    //content: 'You are a bot tasked with deciding a word or phrase that best encapsulates or has reference to the users input, if applicable use pop culture references, no descriptions.'
                    //content: 'You are a bot tasked with deciding a word or phrase that is associated to the users input, if applicable use pop culture references, no descriptions.'
                    //content: 'You are a bot tasked with deciding a word or phrase that is associated to the users input, if applicable use pop culture references, when needed answer literally, keep existing conjunctions and prepositions, no descriptions.'
                    content: aiTaskV2()
                },
                {
                    role: 'user',
                    content: `${a} ${b}`
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
            user: 'test_user',
            seed: 696969,
            frequency_penalty: 0.5,
            n: 1,
            temperature: 0
        });
        const responseRaw = chatCompletion;
        const aiResponseRaw = chatCompletion.choices[0].message.content;
        if (aiResponseRaw) {
            console.log(`${a} ${b}, r: `, aiResponseRaw, responseRaw.usage);
        } else {
            throw new Error('AI returned null');
        }
    } catch (error) {
        console.error('Error', error);
    }
}

(async () => {
    const proms: Promise<void>[] = [];
    proms.push(run('fire', 'water'));
    proms.push(run('dating', 'wind'));
    proms.push(run('cheese', 'wood'));
    proms.push(run('bicycle', 'machine'));
    proms.push(run('tornado', 'window'));
    proms.push(run('sand buddha', 'iron man'));
    proms.push(run('water', 'basin'));
    proms.push(run('earth', 'ghost'));
    proms.push(run('america', 'oasis'));
    proms.push(run('bread', 'meat'));
    proms.push(run('"word"', 'remove quotes'));
    proms.push(run('"thing"', 'remove quotes'));

    proms.push(run('sandwich', 'water'));
    proms.push(run('alphabet', 'letters'));

    await Promise.all(proms);
})();


