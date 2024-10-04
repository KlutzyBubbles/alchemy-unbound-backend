import { Op } from 'sequelize';
import { Weekly } from '../models/v2/weekly.model';
import { getFormattedDate, getFormattedDateEnd, getItems, getMonday } from './helpers';

(async () => {
    if (Weekly === undefined) {
        console.error('Failed to pass database check');
        return;
    }
    for (let week = 1; week <= 2; week++) {
        console.log(`Generating for week ${week}`);
        const dateOffset = week * (7 * 24 * 60 * 60 * 1000);
        const weekDate = new Date(new Date().getTime() + dateOffset);
        console.log('\tInfo', dateOffset, weekDate.toLocaleString());
        const start = getMonday(getFormattedDate(weekDate));
        const end = getFormattedDateEnd(new Date(start));
        console.log('\tStart End', new Date(start).toLocaleString(), new Date(end).toLocaleString());
        const exists = await Weekly.findOne({
            where: {
                expires: {
                    [Op.between]: [start, end]
                }
            }
        });
        console.log('\tFound', exists !== null);
        if (exists === null) {
            const items1 = await getItems();
            await Weekly.findOrCreate({
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
