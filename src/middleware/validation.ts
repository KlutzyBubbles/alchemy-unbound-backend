import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ErrorCode } from '../types';

export async function validationMiddleware(request: Request, response: Response, next: NextFunction) {
    if (request.query === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_MISSING,
            message: 'Query parameters are missing'
        });
        return;
    }
    const result = validationResult(request);
    if (!result.isEmpty()) {
        response.status(400).send({
            code: ErrorCode.QUERY_INVALID,
            message: 'Query parameters are incorrect',
            fields: Object.keys(result.mapped())
        });
        return;
    }
    next();
    return;
}
