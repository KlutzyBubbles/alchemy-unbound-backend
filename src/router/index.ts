import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

const router = express.Router();

export default router;

import './session';
import './api';
import './validate';
import './purchase';
import './leaderboard';
import { postgresSequelize } from '../models/instance';
import { isRedisAlive } from '../ai/stateManagement';
// import './dev';

// router.get('/error', asyncHandler(() => {
//     throw new Error('Purpose error for testing');
// }));
// 
// router.get('/error-async', asyncHandler(async () => {
//     throw new Error('Purpose async error for testing');
// }));

router.get('/', asyncHandler(async (request: Request, response: Response) => {
    try {
        if (postgresSequelize === undefined) {
            response.status(210).send({
                code: 210,
                message: 'Have you seen my diary?'
            });
            return;
        }
        await postgresSequelize?.authenticate();
    } catch (error) {
        console.error('Failed to check status of postgres database', error);
        response.status(210).send({
            code: 210,
            message: 'Im limping'
        });
        return;
    }
    try {
        if (!await isRedisAlive()) {
            response.status(211).send({
                code: 211,
                message: 'Im legally blind'
            });
            return;
        }
    } catch (error) {
        console.error('Failed to check status of redis database', error);
        response.status(211).send({
            code: 211,
            message: 'Im legally blind'
        });
        return;
    }
    response.status(200).send({
        code: 200,
        message: 'Im alive (trust me bro)'
    });
    return;
}));

router.all('*', asyncHandler(async (request: Request, response: Response) => {
    console.log('404', request.url);
    response.status(404).send({
        code: 404,
        message: 'Congrats you found the 404 message'
    });
}));
