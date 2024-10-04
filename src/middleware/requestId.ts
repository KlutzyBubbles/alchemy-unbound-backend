import { NextFunction, Request, Response } from 'express';

export interface HerokuRequest extends Request {
    requestId?: string;
}

export function requestIdMiddleware(request: HerokuRequest, response: Response, next: NextFunction) {
    request.requestId = request.header('x-request-id');
    if (request.requestId === undefined) {
        request.requestId = crypto.randomUUID();
    }
    next();
    return;
}
