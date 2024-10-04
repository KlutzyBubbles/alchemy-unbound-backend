import baseElements from '../baseElements';
import { postgresSequelize } from '../instance';
import { Language } from './language.model';
import { Recipe } from './recipe.model';

export async function initDbV2() {
    try {
        if (postgresSequelize === undefined) {
            console.warn('Sequelize object is undefined for initDB');
            return;
        }
        // await postgresSequelize.authenticate();
        // await postgresSequelize.sync({ force: false, alter: true });
        baseElements.forEach((element) => {
            const result = element.english.toLowerCase();
            Language?.findOrCreate({
                where: {
                    name: result
                },
                defaults: {
                    ...element,
                    name: result,
                    who_discovered: '',
                    tokens: 1
                }
            });
            Recipe?.findOrCreate({
                where: {
                    result: result
                },
                defaults: {
                    a: '',
                    b: '',
                    result: result,
                    depth: 1,
                    base: true,
                    custom: false,
                    found_by: '',
                    reversed: false
                }
            });
        });
    } catch (error) {
        console.error('Failed initializing DB', error);
    }
}
