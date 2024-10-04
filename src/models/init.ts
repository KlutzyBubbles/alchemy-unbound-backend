import { postgresSequelize } from './instance';

export async function initDb() {
    try {
        if (postgresSequelize === undefined) {
            console.warn('Sequelize object is undefined for initDB');
            return;
        }
        await postgresSequelize.authenticate();
    } catch (error) {
        console.error('Failed initializing DB', error);
    }
}
