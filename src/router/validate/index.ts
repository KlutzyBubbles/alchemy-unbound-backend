import routes from '../index';
import { body, query } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { validationMiddleware } from '../../middleware/validation';
import { steamIdMiddlewareV1, steamIdMiddlewareV2 } from '../../middleware/steam';
import { rateLimiterV1, rateLimiterV2 } from '../../middleware/rateLimit';
import { validatePostV1 } from './v1';
import { deprecationMiddlewareGenerator } from '../../middleware/deprecated';
import { validatePostV2 } from './v2';

// V0
routes.post('/validate',
    body('items').isArray(),
    body('items.*').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    steamIdMiddlewareV1,
    rateLimiterV1,
    asyncHandler(validatePostV1)
);


// V1
routes.post('/validate/v1',
    body('items').isArray(),
    body('items.*').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    steamIdMiddlewareV1,
    rateLimiterV1,
    asyncHandler(validatePostV1)
);

routes.post('/v1/validate',
    body('items').isArray(),
    body('items.*').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    steamIdMiddlewareV1,
    rateLimiterV1,
    asyncHandler(validatePostV1)
);


// V2
routes.post('/v2/validate',
    body('items').isArray({ min: 0, max: 100 }),
    body('items.*').trim().escape().isString().isLength({ min: 1, max: 256 }).toLowerCase(),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(validatePostV2)
);
