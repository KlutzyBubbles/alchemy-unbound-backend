import { NextFunction, Response } from 'express';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { JWT_REFRESH_EXPIRATION } from '../constants';
import { HerokuRequest } from './requestId';
import { User, UserModel, defaultUser } from '../models/v2/user.model';
import { LanguageObject } from '../types';

export interface TokenedRequestV1 extends HerokuRequest {
    steamId?: string;
    steamLanguage?: string;
    tokenString?: string;
}

export interface TokenedRequestV2 extends HerokuRequest {
    user?: UserModel;
    steamId?: string;
    steamLanguage?: keyof LanguageObject;
    tokenString?: string;
}

export async function steamIdMiddlewareV1(request: TokenedRequestV1, response: Response, next: NextFunction) {
    try {
        const tokenStringQuery: string | undefined = request.query.token as string | undefined;
        const tokenStringAuth: string | undefined = request.headers.authorization as string | undefined;

        let tokenString: string | undefined = undefined;

        if (tokenStringAuth !== undefined && tokenStringAuth.includes(' ')) {
            const split = tokenStringAuth.split(' ');
            if (split.length === 2 && split[0] === 'Bearer') {
                tokenString = split[1];
            }
        }

        if (tokenString === undefined) {
            tokenString = tokenStringQuery;
        }

        let steamId: string | undefined = undefined;
        let steamLanguage: string | undefined = undefined;
        if (tokenString !== undefined) {
            const decoded = await (new Promise<string | jwt.JwtPayload | undefined>(
                (resolve, reject) => {
                    if (tokenString !== undefined) {
                        return jwt.verify(tokenString, process.env.JWT_SECRET ?? '32MWrhc3482cn7tH75x9ujdh23nNEgcL67n', {
                            algorithms: ['HS512'],
                            issuer: 'alchemyunboundoverlords',
                            maxAge: process.env.NODE_ENV === 'DEVELOPMENT' ? JWT_REFRESH_EXPIRATION + 31536000 : JWT_REFRESH_EXPIRATION + 60
                        }, (error, decoded) => error ? reject(error) : resolve(decoded));
                    } else {
                        return resolve(undefined);
                    }
                }
            ));
            if (decoded !== undefined && typeof decoded !== 'string' && decoded.data !== undefined) {
                steamId = decoded.data.steamId;
                steamLanguage = decoded.data.steamLanguage;
            } else {
                if (decoded === undefined) {
                    console.error('Token is undefined', { requestId: request.requestId });
                } else {
                    console.error('Token is ?', decoded, { requestId: request.requestId });
                }
            }
        }
        request.steamId = steamId;
        request.steamLanguage = steamLanguage;
        request.tokenString = tokenString;
    } catch (error) {
        if (error instanceof JsonWebTokenError) {
            console.error('Error with JWT', error.message, { requestId: request.requestId });
        } else {
            console.error('Error handling steamIdMiddleware', error, { requestId: request.requestId });
        }
        request.steamId = undefined;
        request.steamLanguage = undefined;
        request.tokenString = undefined;
    }
    next();
    return;
}

export async function steamIdMiddlewareV2(request: TokenedRequestV2, response: Response, next: NextFunction) {
    try {
        const tokenStringQuery: string | undefined = request.query.token as string | undefined;
        const tokenStringAuth: string | undefined = request.headers.authorization as string | undefined;

        let tokenString: string | undefined = undefined;

        if (tokenStringAuth !== undefined && tokenStringAuth.includes(' ')) {
            const split = tokenStringAuth.split(' ');
            if (split.length === 2 && split[0] === 'Bearer') {
                tokenString = split[1];
            }
        }

        if (tokenString === undefined) {
            tokenString = tokenStringQuery;
        }

        let steamId: string | undefined = undefined;
        let steamLanguage: keyof LanguageObject | undefined = undefined;
        let user: UserModel | undefined = undefined;
        if (tokenString !== undefined) {
            const decoded = await (new Promise<string | jwt.JwtPayload | undefined>(
                (resolve, reject) => {
                    if (tokenString !== undefined) {
                        return jwt.verify(tokenString, process.env.JWT_SECRET ?? '32MWrhc3482cn7tH75x9ujdh23nNEgcL67n', {
                            algorithms: ['HS512'],
                            issuer: 'alchemyunboundoverlords',
                            maxAge: process.env.NODE_ENV === 'DEVELOPMENT' ? JWT_REFRESH_EXPIRATION + 31536000 : JWT_REFRESH_EXPIRATION + 60
                        }, (error, decoded) => error ? reject(error) : resolve(decoded));
                    } else {
                        return resolve(undefined);
                    }
                }
            ));
            if (decoded !== undefined && typeof decoded !== 'string' && decoded.data !== undefined) {
                steamId = decoded.data.steamId;
                steamLanguage = decoded.data.steamLanguage;
                if (User !== undefined && steamId !== undefined) {
                    try {
                        const [temp] = await User.findOrCreate({
                            where: {
                                steamId: steamId
                            },
                            defaults: defaultUser(steamId)
                        });
                        if (temp !== null) {
                            user = temp;
                        }
                    } catch (error) {
                        console.error('Failed getting user', { requestId: request.requestId });
                        console.log(error);
                    }
                }
            } else {
                if (decoded === undefined) {
                    console.error('Token is undefined', { requestId: request.requestId });
                } else {
                    console.error('Token is ?', decoded, { requestId: request.requestId });
                }
            }
        }
        request.user = user;
        request.steamId = steamId;
        request.steamLanguage = steamLanguage;
        request.tokenString = tokenString;
    } catch (error) {
        if (error instanceof JsonWebTokenError) {
            console.error('Error with JWT', error.message, { requestId: request.requestId });
        } else {
            console.error('Error handling steamIdMiddleware', error, { requestId: request.requestId });
        }
        request.steamId = undefined;
        request.steamLanguage = undefined;
        request.tokenString = undefined;
    }
    next();
    return;
}
