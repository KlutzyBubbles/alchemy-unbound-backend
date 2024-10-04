import routes from '../index';
import { body, query } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { validationMiddleware } from '../../middleware/validation';
import { steamIdMiddlewareV2 } from '../../middleware/steam';
import { rateLimiterV2 } from '../../middleware/rateLimit';
import { purchaseCheckBulkV2, purchaseCheckV2, purchaseFinalizeGetV2, purchaseGetV2, purchaseRedeemV2 } from './v2';
import { deprecationMiddlewareGenerator } from '../../middleware/deprecated';

routes.get('/purchase',
    query('item').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(purchaseGetV2)
);

routes.get('/purchase/finalize',
    query('orderid').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(purchaseFinalizeGetV2)
);

routes.post('/v2/purchase',
    query('item').trim().escape().isString().isLength({ min: 3, max: 256 }),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(purchaseGetV2)
);

routes.get('/v2/purchase/check',
    query('item').trim().escape().isString().isLength({ min: 3, max: 256 }),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(purchaseCheckV2)
);

routes.post('/v2/purchase/check',
    body('items').isArray({ min: 0, max: 100 }),
    body('items.*').trim().escape().isString().isLength({ min: 3, max: 256 }).toLowerCase(),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(purchaseCheckBulkV2)
);

routes.patch('/v2/purchase',
    query('item').trim().escape().isString().isLength({ min: 3, max: 256 }),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(purchaseRedeemV2)
);
    
routes.get('/v2/purchase/finalize',
    query('orderid').trim().escape().isString().isLength({ min: 1, max: 256 }).toLowerCase(),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(purchaseFinalizeGetV2)
);
