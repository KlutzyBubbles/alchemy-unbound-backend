import { Op, Sequelize } from 'sequelize';
import { Recipe } from '../models/v2/recipe.model';
import { MAX_DEPTH } from '../constants';

export function getFormattedDate(date: Date): number {
    return date.setUTCHours(0, 0, 0, 0);
}

export function getFormattedDateEnd(date: Date): number {
    return date.setUTCHours(23, 59, 59, 999);
}

export function getMonday(d: number) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day == 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

export async function getItems(): Promise<{
    easy: string,
    medium: string,
    hard: string,
    random: string
}> {
    if (Recipe === undefined) {
        throw new Error('Database issue');
    }

    console.log('Getting easy...');
    const easy = await getFromRecipes(true, [2, 25]);
    console.log('Getting medium...');
    const medium = await getFromRecipes(false, [2, 100]);
    console.log('Getting hard...');
    const hard = await getFromRecipes(false, [100, 10000]);
    console.log('Getting random...');
    const random = await getFromRecipes(false, [2, MAX_DEPTH * 2]);

    return {
        easy,
        medium,
        hard,
        random
    };
}

const EXCLUDED = ['piney', 'shep3rd', 'klutzybubbles', 'ango', 'uncle', 'flikz', 'tvision'];

async function getFromRecipes(onlyBase: boolean, between: [number, number], tryNumber?: number): Promise<string> {
    if (tryNumber === undefined) {
        tryNumber = 1;
    }
    if (tryNumber > 3) {
        throw new Error('Max tries for one of the getRecipes');
    }
    if (Recipe === undefined) {
        throw new Error('Database issue');
    }
    const found = await Recipe.findOne({
        where: {
            base: onlyBase ? true : {
                [Op.any]: [true, false]
            },
            depth: {
                [Op.between]: between
            }
        },
        order: Sequelize.fn('random')
    });
    if (found === null) {
        return getFromRecipes(onlyBase, between, tryNumber + 1);
    }
    if (EXCLUDED.includes(found.result)) {
        console.warn('Hit excluded result', found.result);
        return getFromRecipes(onlyBase, between, tryNumber);
    }
    return found.result;
}
