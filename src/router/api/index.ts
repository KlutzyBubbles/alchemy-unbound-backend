import routes from '../index';
import { query } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { validationMiddleware } from '../../middleware/validation';
import { steamIdMiddlewareV1, steamIdMiddlewareV2 } from '../../middleware/steam';
import { rateLimiterV1, rateLimiterV2 } from '../../middleware/rateLimit';
import { apiGetV1, ideaPostV1 } from './v1';
import { deprecationMiddlewareGenerator } from '../../middleware/deprecated';
import { apiGetV2 } from './v2/api';
import { missionCheckV2, missionGetV2 } from './v2/mission';
import { customGetV2, customPutV2 } from './v2/custom';
import { SteamLanguageKeys } from '../../constants';

// V0
routes.get('/api',
    query('a').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('b').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    steamIdMiddlewareV1,
    rateLimiterV1,
    asyncHandler(apiGetV1));

// V1
routes.get('/api/v1',
    query('a').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('b').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    steamIdMiddlewareV1,
    rateLimiterV1,
    asyncHandler(apiGetV1));

routes.get('/v1/api',
    query('a').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('b').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    steamIdMiddlewareV1,
    rateLimiterV1,
    asyncHandler(apiGetV1));

routes.get('/idea/v1',
    query('a').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('b').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('result').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('stop'),
    validationMiddleware,
    steamIdMiddlewareV1,
    rateLimiterV1,
    asyncHandler(ideaPostV1));

routes.get('/v1/idea',
    query('a').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('b').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('result').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('stop'),
    validationMiddleware,
    steamIdMiddlewareV1,
    rateLimiterV1,
    asyncHandler(ideaPostV1));

// V2
routes.get('/v2/api',
    query('a').trim().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('b').trim().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(apiGetV2));

routes.get('/v2/mission/check',
    query('a').trim().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('b').trim().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('result').trim().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('type').trim().escape().isString().isLength({ min: 3, max: 6 }).isIn(['daily', 'weekly']).toLowerCase(),
    query('combines').trim().escape().isNumeric(),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(missionCheckV2));

routes.get('/v2/mission/:type',
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(missionGetV2));

routes.get('/v2/custom',
    query('a').trim().isString().isLength({ min: 1, max: 256 }).toLowerCase(),
    query('b').trim().isString().isLength({ min: 1, max: 256 }).toLowerCase(),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(customGetV2));

routes.put('/v2/custom',
    query('result').trim().isString().isLength({ min: 1, max: 256 }).toLowerCase(),
    query('language').trim().escape().isString().isLength({ min: 1, max: 256 }).isIn(Object.keys(SteamLanguageKeys)).toLowerCase(),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(customPutV2));
    