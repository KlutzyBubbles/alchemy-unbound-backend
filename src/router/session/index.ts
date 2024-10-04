import routes from '../index';
import asyncHandler from 'express-async-handler';
import { query } from 'express-validator';
import { validationMiddleware } from '../../middleware/validation';
import { steamIdMiddlewareV1, steamIdMiddlewareV2 } from '../../middleware/steam';
import { sessionGetV1, sessionPostV1 } from './v1';
import { deprecationMiddlewareGenerator } from '../../middleware/deprecated';
import { sessionCheckDLCV2, sessionGetV2, sessionPostV2, sessionUserGetV2 } from './v2';

// V0
routes.get(
    '/session',
    query('token').trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    steamIdMiddlewareV1,
    asyncHandler(sessionGetV1)
);
  
routes.post(
    '/session',
    query('steamToken').isString().isLength({ min: 3, max: 512 }).trim().escape(),
    query('steamLanguage').isString().isLength({ min: 3, max: 128 }).trim().escape(),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    asyncHandler(sessionPostV1)
);

// V1
routes.get(
    '/session/v1',
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    steamIdMiddlewareV1,
    asyncHandler(sessionGetV1)
);
  
routes.post(
    '/session/v1',
    query('steamToken').isString().isLength({ min: 3, max: 512 }).trim().escape(),
    query('steamLanguage').isString().isLength({ min: 3, max: 128 }).trim().escape(),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    asyncHandler(sessionPostV1)
);

routes.get(
    '/v1/session',
    query('token').optional().trim().escape().isString().isLength({ min: 3, max: 1024 }),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    steamIdMiddlewareV1,
    asyncHandler(sessionGetV1)
);
  
routes.post(
    '/v1/session',
    query('steamToken').isString().isLength({ min: 3, max: 512 }).trim().escape(),
    query('steamLanguage').isString().isLength({ min: 3, max: 128 }).trim().escape(),
    deprecationMiddlewareGenerator('v2'),
    validationMiddleware,
    asyncHandler(sessionPostV1)
);

// V2
routes.get(
    '/v2/session',
    validationMiddleware,
    steamIdMiddlewareV2,
    asyncHandler(sessionGetV2)
);

routes.get(
    '/v2/session/user',
    validationMiddleware,
    steamIdMiddlewareV2,
    asyncHandler(sessionUserGetV2)
);
  
routes.post(
    '/v2/session',
    query('steamToken').isString().isLength({ min: 3, max: 512 }).trim().escape(),
    query('steamLanguage').isString().isLength({ min: 3, max: 128 }).trim().escape(),
    validationMiddleware,
    asyncHandler(sessionPostV2)
);

routes.get(
    '/v2/session/dlc',
    validationMiddleware,
    steamIdMiddlewareV2,
    asyncHandler(sessionCheckDLCV2)
);
