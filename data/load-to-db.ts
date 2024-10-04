// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as languages from './base/Languages.json';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as baseRecipes from './base/Recipes.json';

type Format = {
    a: string,
    b: string,
    result: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadIntoDB(items: Format[], base: boolean, version: number) {
    const knownResults = ['air', 'fire', 'water', 'earth', 'life', 'time'];
    
    const workingList = items.map((x) => x);
    console.log('Target', workingList.length);
    let workingOn = 0;
    while (workingList.length > 0 && workingOn < 100) {
        workingOn++;
        console.log(`Working on ${workingOn}`, knownResults.length);
        let i = workingList.length;
        while (i--) {
            if (knownResults.includes(workingList[i].a.toLowerCase())
                && knownResults.includes(workingList[i].b.toLowerCase())) {
                try {
                    console.log(`Combining '${workingList[i].a}' with '${workingList[i].b}' to '${workingList[i].result}'`);
                    await fetch(`http://localhost:5001/fill/v${version}?a=${encodeURIComponent(workingList[i].a)}&b=${encodeURIComponent(workingList[i].b)}&result=${encodeURIComponent(workingList[i].result)}&base=${base}`);
                    knownResults.push(workingList[i].result.toLowerCase());
                    workingList.splice(i, 1);
                } catch(e) {
                    console.error('error', e);
                }
            }
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadFromInfinite(items: {
    [key: string]: string[][]
}, base: boolean, version: number) {
    const knownResults = ['air', 'fire', 'water', 'earth', 'life', 'time'];

    let count = 0;
    const outputUrls: string[] = [];

    for (const itemKey of Object.keys(items)) {
        count++;
        if (count > 9000) {
            break;
        }
        const result = itemKey.toLocaleLowerCase();
        if (knownResults.includes(result)) {
            continue;
        } else {
            const recipes = items[itemKey];
            for (let i = 0; i < recipes.length; i++) {
                const recipe = recipes[i];
                if (knownResults.includes(recipe[2].toLocaleLowerCase())) {
                    continue;
                } else {
                    try {
                        const url = `http://localhost:5001/fill/v${version}?a=${encodeURIComponent(recipe[0].toLocaleLowerCase())}&b=${encodeURIComponent(recipe[1].toLocaleLowerCase())}&result=${encodeURIComponent(recipe[2].toLocaleLowerCase())}&base=${base}`;
                        outputUrls.push(url);
                        console.log(`Combining '${recipe[0]}' with '${recipe[1]}' to '${recipe[2]}', count: ${count}`);
                        await fetch(url);
                        knownResults.push(recipe[2].toLocaleLowerCase());
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        }
    }

    //  console.log('result', outputUrls);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadLanguages(version: number) {
    let count = 0;
    const outputUrls: string[] = [];

    for (const langItem of languages.Languages) {
        count++;
        if (count > 1000) {
            break;
        }

        let queryString = '';
        let queryPrefix = '';
        
        for (const itemKey of Object.keys(langItem)) {
            if (['id', 'createdAt', 'updatedAt'].includes(itemKey)) {
                continue;
            }
            queryString += `${queryPrefix}${itemKey}=${encodeURIComponent(langItem[itemKey])}`;
            queryPrefix = '&';
        }
        try {
            const url = `http://localhost:5001/fill-language/v${version}?${queryString}`;
            outputUrls.push(url);
            console.log(`Inserting '${langItem.name}', count: ${count}`);
            await fetch(url);
        } catch (error) {
            console.error(error);
        }
    }
    //console.log('result', outputUrls);
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadBaseRecipes(version: number) {
    let count = 0;
    const outputUrls: string[] = [];
    const knownResults = ['air', 'fire', 'water', 'earth', 'life', 'time'];

    for (const recipe of baseRecipes.Recipes) {
        count++;
        if (count > 4000) {
            break;
        }
        //if (knownResults.includes(recipe.result)) {
        //    continue;
        //} else {
        try {
            // console.log(recipe);
            const url = `http://localhost:5001/fill/v${version}?a=${encodeURIComponent(recipe.a)}&b=${encodeURIComponent(recipe.b)}&result=${encodeURIComponent(recipe.result)}&base=${recipe.base}&ignoreDupe=true`;
            outputUrls.push(url);
            console.log(`Combining '${recipe.a}' with '${recipe.b}' to '${recipe.result}', count: ${count}`);
            await fetch(url);
            knownResults.push(recipe.result);
        } catch (error) {
            console.error(error);
        }
        // }
    }
    //console.log('result', outputUrls);
}

//(a(nd?|s|t)?|b(ut|y)|en|for|i(f|n)|o(f|n|r)|t(he|o)|v(s?[.]?|ia))
(async () => {
    // await loadFromInfinite(recipes, true);
    // await loadLanguages(2);
    await loadBaseRecipes(2);
})();


