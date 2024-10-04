/* eslint-disable @typescript-eslint/no-unused-vars */
import * as fs from 'fs';
import * as readline from 'readline';

(async () => {
    const folder = '02-05-2024';

    const output = {};
    const files: string[] = [];
    
    fs.readdirSync(`C:/Users/KlutzyBubbles/Documents/GitHub/element-craft-backend/data/validation/output/${folder}/final`).forEach(file => {
        console.log(file);
        files.push(file);
    });

    for (const file of files) {
        if (file.includes('summary')) {
            continue;
        }
        const fileStream = fs.createReadStream(`C:/Users/KlutzyBubbles/Documents/GitHub/element-craft-backend/data/validation/output/${folder}/final/${file}`);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let total = 0;
        let correct = 0;
        let incorrect = 0;
        let failed = 0;

        let sim90 = 0;
        let dif90 = 0;
        let sim75 = 0;
        let dif75 = 0;
        let sim50 = 0;
        let dif50 = 0;

        let totalTotal = 0;
        let totalPrompt = 0;
        let totalOutput = 0;

        let maxTotal = 0;
        let maxPrompt = 0;
        let maxOutput = 0;

        let minTotal = Infinity;
        let minPrompt = Infinity;
        let minOutput = Infinity;

        for await (const line of rl) {
            total++;
            const item = JSON.parse(line);
            const totalTokens = item.usage.total_tokens;
            const promptTokens = item.usage.prompt_tokens;
            const outputTokens = item.usage.completion_tokens;
            totalTotal += totalTokens;
            totalPrompt += promptTokens;
            totalOutput += outputTokens;
            if (totalTokens > maxTotal) {
                maxTotal = totalTokens;
            }
            if (promptTokens > maxPrompt) {
                maxPrompt = promptTokens;
            }
            if (outputTokens > maxOutput) {
                maxOutput = outputTokens;
            }
            if (totalTokens < minTotal) {
                minTotal = totalTokens;
            }
            if (promptTokens < minPrompt) {
                minPrompt = promptTokens;
            }
            if (outputTokens < minOutput) {
                minOutput = outputTokens;
            }
            const sim = similarity(item.expected, item.output);
            if (sim > 0.9) {
                sim90++;
            } else {
                dif90++;
            }
            if (sim > 0.75) {
                sim75++;
            } else {
                dif75++;
            }
            if (sim > 0.5) {
                sim50++;
            } else {
                dif50++;
            }
            if (item.output.includes('no direct association')
                || item.output.includes('word associated')
                || item.output.includes('is associated')
                || item.output.includes('no association')
                || item.output.includes('sorry')
                || item.output.includes('associated')
                || item.output.includes('please')) {
                failed++;
            }
            if (item.expected === item.output) {
                correct++;
            } else {
                incorrect++;
            }
        }
        output[file] = {
            total,
            correct,
            incorrect,
            sim90,
            dif90,
            sim75,
            dif75,
            sim50,
            dif50,
            failed,
            totalToken: {
                avg: Math.floor(totalTotal / total),
                min: minTotal,
                max: maxTotal
            },
            promptToken: {
                avg: Math.floor(totalPrompt / total),
                min: minPrompt,
                max: maxPrompt
            },
            completionToken: {
                avg: Math.floor(totalOutput / total),
                min: minOutput,
                max: maxOutput
            }
        };
    }
    
    fs.writeFile(__dirname + '/summary.json', JSON.stringify(output), 'utf-8', err => {
        if (err) {
            console.error(err);
        } else {
            console.log('Saved report');
        }
    });
    console.log('Done');
})();

function similarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}
