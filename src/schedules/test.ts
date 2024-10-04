import { Op } from 'sequelize';
import { Daily } from '../models/v2/daily.model';
import { getItems } from './helpers';

(async () => {
    if (Daily === undefined) {
        return;
    }
    for (let minute = 0; minute < 60; minute++) {
        const dateOffset = minute * (60 * 1000);
        const dayDate = new Date(new Date().getTime() +dateOffset);
        const start = getFormattedDate(dayDate);
        const end = getFormattedDateEnd(dayDate);
        const items1 = await getItems();
        await Daily.findOrCreate({
            where: {
                expires: {
                    [Op.between]: [start, end]
                }
            },
            defaults: {
                expires: new Date(start),
                easy: items1.easy,
                medium: items1.medium,
                hard: items1.hard,
                random: items1.random,
            }
        });
    }
})();

function getFormattedDate(date: Date): number {
    return date.setUTCSeconds(0, 0);
}

function getFormattedDateEnd(date: Date): number {
    return date.setUTCSeconds(59, 999);
}
