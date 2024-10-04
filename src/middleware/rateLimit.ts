import rateLimit from 'express-rate-limit';
import { TokenedRequestV1, TokenedRequestV2 } from './steam';

export const rateLimiterV1 = rateLimit({
    windowMs: 1000, // 1 second
    limit: 2, // 2 every second
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    statusCode: 429,
    message: {
        code: 429,
        message: 'Slow down, the server isnt going anywhere'
    },
    skip: (request, response) => {
        return response.statusCode >= 500 && response.statusCode < 600;
    },
    keyGenerator: async (request: TokenedRequestV1) => {
        if (request.steamId !== undefined) {
            return request.steamId;
        }
        return request.ip ?? 'GLOBAL';
    }
});

export const rateLimiterV2 = rateLimit({
    windowMs: 750, // 750 ms
    limit: 1, // 1 every 750 ms
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    statusCode: 429,
    message: {
        code: 429,
        message: 'Slow down, the server isnt going anywhere'
    },
    skip: (request, response) => {
        return response.statusCode >= 500 && response.statusCode < 600;
    },
    keyGenerator: async (request: TokenedRequestV2) => {
        if (request.steamId !== undefined) {
            return request.steamId;
        }
        return request.ip ?? 'GLOBAL';
    }
});
