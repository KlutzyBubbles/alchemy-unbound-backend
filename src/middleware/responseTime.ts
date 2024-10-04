import { NextFunction, Request, Response } from 'express';

export function responseTimeMiddleware(request: Request, response: Response, next: NextFunction) {
    const start = Date.now();
    response.on('header', function(){
        const duration = Date.now() - start;
        response.setHeader('X-Response-Time', `${duration}ms`);
    });

    next();
    return;
}
