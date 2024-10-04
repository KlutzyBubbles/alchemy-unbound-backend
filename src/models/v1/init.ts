import baseElements from '../baseElements';
import { postgresSequelize } from '../instance';
import { Language } from './language.model';
import { Recipe } from './recipe.model';

export async function initDbV1() {
    try {
        if (postgresSequelize === undefined) {
            console.warn('Sequelize object is undefined for initDB');
            return;
        }
        // await postgresSequelize.authenticate();
        // await postgresSequelize.sync({ force: false });
        baseElements.forEach((element) => {
            const result = element.english.toLowerCase();
            Language?.findOrCreate({
                where: {
                    name: result
                },
                defaults: {
                    ...element,
                    name: result
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
                    who_discovered: '',
                    base: true
                }
            });
        });
    } catch (error) {
        console.error('Failed initializing DB', error);
    }
}
