import routes from '../index';
import { query } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { validationMiddleware } from '../../middleware/validation';
import { steamIdMiddlewareV2 } from '../../middleware/steam';
import { rateLimiterV2 } from '../../middleware/rateLimit';
import { missionLeaderboardV2, userLeaderboardV2 } from './v2';

routes.get('/v2/leaderboard/user/:stat',
    query('amount').optional().trim().isNumeric(),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(userLeaderboardV2)
);

routes.get('/v2/leaderboard/mission/:missionType/:stat/:missionLevel',
    query('missionId').optional().trim().isNumeric(),
    query('amount').optional().trim().isNumeric(),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(missionLeaderboardV2)
);

routes.get('/v2/leaderboard/mission/:missionType/:stat',
    query('missionId').optional().trim().isNumeric(),
    query('amount').optional().trim().isNumeric(),
    validationMiddleware,
    steamIdMiddlewareV2,
    rateLimiterV2,
    asyncHandler(missionLeaderboardV2)
);
