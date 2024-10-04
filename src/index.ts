import express, { NextFunction } from 'express';
import { initDbV1 } from './models/v1/init';
import { initDbV2 } from './models/v2/init';
import './router';
import router from './router';
import { postgresSequelize } from './models/instance';
import { HerokuRequest, requestIdMiddleware } from './middleware/requestId';
import { initRedis } from './ai/stateManagement';
import { responseTimeMiddleware } from './middleware/responseTime';
import { initDb } from './models/init';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json());
app.use(responseTimeMiddleware);
app.use(requestIdMiddleware);

app.use((error: Error, request: HerokuRequest, response: express.Response, _next: NextFunction) => {
    if (error instanceof SyntaxError) {
        return response.status(400).send({
            status: 400,
            message: 'Malformed input syntax'
        });
    } else {
        return response.status(500).send({
            status: 500,
            message: 'Unknown error'
        });
    }
});

app.use(router);

app.use((error: Error, request: HerokuRequest, response: express.Response, _next: NextFunction) => {
    console.error('Unhandled error', error, { requestId: request.requestId });
    return response.status(500).send({
        code: 500,
        message: 'Unknown error'
    });
});

(async () => {
    console.log('Starting web worker...');
    if (process.env.JWT_SECRET === undefined) {
        throw new Error('JWT_SECRET is empty, fill it');
    }
    try {
        console.log('Initialising databases...');
        await initDb();
        console.log('Main Done');
        await initDbV1();
        console.log('v1 Done');
        await initDbV2();
        console.log('v2 Done');
        await initRedis();
        console.log('Redis Done');

        console.log('Initialising express.js...');
        app.listen(process.env.PORT, () => {
            // tslint:disable-next-line:no-console
            console.log(`server started at http(s)://IP:${process.env.PORT}` );
            if (process.send !== undefined) {
                process.send('ready');
            }
        });
    } catch (error) {
        console.error('Unable to start web server:', error);
    }
})();

process.on('SIGINT', async () => {
    let hasError = false;
    try {
        await postgresSequelize?.close();
    } catch (error) {
        console.error('Failed to close DB connections', error);
        hasError = true;
    }
    process.exit(hasError ? 1 : 0);
});
