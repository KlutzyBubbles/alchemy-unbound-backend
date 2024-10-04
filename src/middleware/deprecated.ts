import { NextFunction, Response } from 'express';
import { HerokuRequest } from './requestId';

export function deprecationMiddlewareGenerator(newVersion: string) {
    return (request: HerokuRequest, response: Response, next: NextFunction) => {
        console.warn(`User is requesting deprecated API: ${request.route.path}`, { requestId: request.requestId });
        response.appendHeader('Api-Deprecated', newVersion);
        next();
        return;
    };
}