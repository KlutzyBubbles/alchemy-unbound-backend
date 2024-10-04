import Sequelize from 'sequelize';

let postgresSequelize: Sequelize.Sequelize | undefined = undefined;

try {
    postgresSequelize = new Sequelize.Sequelize(process.env.DATABASE_URL ?? 'NO_DATABASE_CONNECTION_STRING', {
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        pool: {
            max: Math.max(Math.min(Math.floor(parseInt(process.env.WEB_CONCURRENCY || '1')), 2), 1),
            min: 0,
            acquire: 5000,
            idle: 1000,
        },
        logging: process.env.NODE_ENV === 'development'
    });
} catch (error) {
    if (error instanceof Error && error.message !== undefined && error.message.includes('too many connections')) {
        console.error('Too many database connections', error.message);
    } else {
        console.error(error);
    }
    postgresSequelize = undefined;
}

export {
    postgresSequelize
};
