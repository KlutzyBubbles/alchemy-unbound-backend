import { Op } from 'sequelize';
import { Daily } from '../models/v2/daily.model';
import { getFormattedDate, getFormattedDateEnd, getItems } from './helpers';

(async () => {
    if (Daily === undefined) {
        console.error('Failed to pass database check');
        return;
    }
    for (let day = 1; day <= 7; day++) {
        console.log(`Generating for day ${day}`);
        const dateOffset = day * (24 * 60 * 60 * 1000);
        const dayDate = new Date(new Date().getTime() + dateOffset);
        console.log('\tInfo', dateOffset, dayDate.toLocaleString());
        const start = getFormattedDate(dayDate);
        const end = getFormattedDateEnd(dayDate);
        console.log('\tStart End', new Date(start).toLocaleString(), new Date(end).toLocaleString());
        const exists = await Daily.findOne({
            where: {
                expires: {
                    [Op.between]: [start, end]
                }
            }
        });
        console.log('\tFound', exists !== null);
        if (exists === null) {
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
    }
    process.exit();
})();
