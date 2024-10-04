import { Response } from 'express';
import { STEAM_APP_ID, STEAM_SUPPORTER_APP_ID } from '../../constants';
import { TokenedRequestV2 } from '../../middleware/steam';
import { AuthenticateUserTicket } from '../../steamapi/ISteamUserAuth';
import { SteamResponse, buildSteamAPICommon } from '../../steamapi';
import { createToken } from './common';
import { HerokuRequest } from '../../middleware/requestId';
import { ErrorCode } from '../../types';
import { User, UserModel, defaultUser } from '../../models/v2/user.model';
import { undefinedErrorFormat } from '../../helpers';
import { CheckAppOwnership } from '../../steamapi/ISteamUser';

export async function sessionGetV2(request: TokenedRequestV2, response: Response) {
    try {
        if (request.steamId === undefined || request.steamLanguage === undefined) {
            // outputting the same to prevent token matching
            response.status(400).send({
                code: ErrorCode.TOKEN_EXPIRED,
                message: 'Refresh token expired'
            });
            return;
        }
        const newToken = await createToken(request.steamId, request.steamLanguage);
        response.status(200).json({
            token: newToken.token,
            steamId: request.steamId,
            expiryDate: newToken.expiry
        });
        return;
    } catch (error) {
        console.error('Unhandled error in session get', error, { requestId: request.requestId });
        response.status(500).send({
            code: 500,
            message: 'Unknown error'
        });
        return;
    }
}

export async function sessionUserGetV2(request: TokenedRequestV2, response: Response) {
    try {
        const steamId: string | undefined = request.steamId as string | undefined;
        if (steamId === undefined) {
            // outputting the same to prevent token matching
            response.status(400).send({
                code: ErrorCode.NOT_AUTHENTICATED,
                message: 'Invalid steam id'
            });
            return;
        }
        let user: UserModel | undefined = undefined;

        try {
            console.log('Finding user');
            if (User !== undefined && steamId !== undefined) {
                const [temp] = await User.findOrCreate({
                    where: {
                        steamId: steamId
                    },
                    defaults: defaultUser(steamId)
                });
                if (temp !== null) {
                    user = temp;
                }
            }
            console.log('Found user');
        } catch (error) {
            console.error('Unhandled error in session post', error, { requestId: request.requestId });
            response.status(500).send({
                code: 500,
                message: 'Unknown error'
            });
            return;
        }

        if (user === undefined) {
            response.status(500).send({
                code: 500,
                message: 'Unknown error'
            });
            return;
        }

        response.status(200).json({
            success: true,
            user: {
                firstDiscoveries: user.firstDiscoveries,
                combines: user.combines,
                generations: user.generations,
                credits: user.credits,
                highestDepth: user.highestDepth,
                supporter: user.supporter,
                generateBanned: user.generateBanned,
                apiBanned: user.apiBanned
            }
        });
        return;
    } catch (error) {
        console.error('Unhandled error in session get', error, { requestId: request.requestId });
        response.status(500).send({
            code: 500,
            message: 'Unknown error'
        });
        return;
    }
}

export async function sessionPostV2(request: HerokuRequest, response: Response) {
    try {
        const steamToken: string | undefined = request.query.steamToken as string | undefined;
        const steamLanguage: string | undefined = request.query.steamLanguage as string | undefined;
        if (steamToken === undefined || steamLanguage === undefined) {
            response.status(400).send({
                code: ErrorCode.QUERY_UNDEFINED,
                message: 'Query parameters are undefined',
                fields: undefinedErrorFormat({
                    steamToken,
                    steamLanguage
                })
            });
            return;
        }
        const common = buildSteamAPICommon(undefined, process.env.STEAM_WEB_API_KEY, STEAM_APP_ID);
        let result: SteamResponse | undefined = undefined;
        try {
            result = await AuthenticateUserTicket(common, steamToken);
        } catch(error) {
            if (error instanceof Error && error.message.startsWith('Steam servers')) {
                response.status(400).send({
                    code: ErrorCode.STEAM_SERVERS_DOWN,
                    message: 'Steam validation servers are down'
                });
                return;
            }
            response.status(400).send({
                code: ErrorCode.STEAM_ERROR,
                message: 'Unable to authenticate user ticket'
            });
            return;
        }
        const steamId = (result.response as { params: Record<string, string> }).params.steamid;
        const token = await createToken(steamId, steamLanguage);
        let user: UserModel | undefined = undefined;

        try {
            if (User !== undefined && steamId !== undefined) {
                const [temp] = await User.findOrCreate({
                    where: {
                        steamId: steamId
                    },
                    defaults: defaultUser(steamId)
                });
                if (temp !== null) {
                    user = temp;
                }
            }
        } catch (error) {
            console.error('Unhandled error in session post', error, { requestId: request.requestId });
            response.status(500).send({
                code: 500,
                message: 'Unknown error'
            });
            return;
        }

        response.status(200).json({
            token: token.token,
            steamId: steamId,
            user: user === undefined ? {} : {
                firstDiscoveries: user.firstDiscoveries,
                combines: user.combines,
                generations: user.generations,
                credits: user.credits,
                highestDepth: user.highestDepth,
                supporter: user.supporter,
            },
            expiryDate: token.expiry
        });
        return;
    } catch (error) {
        console.error('Unhandled error in session post', error, { requestId: request.requestId });
        response.status(500).send({
            code: 500,
            message: 'Unknown error'
        });
        return;
    }
}

export async function sessionCheckDLCV2(request: TokenedRequestV2, response: Response) {
    try {
        const steamId: string | undefined = request.steamId as string | undefined;
        if (steamId === undefined) {
            // outputting the same to prevent token matching
            response.status(400).send({
                code: ErrorCode.NOT_AUTHENTICATED,
                message: 'Invalid steam id'
            });
            return;
        }
        let user: UserModel | undefined = undefined;

        try {
            if (User !== undefined && steamId !== undefined) {
                const [temp] = await User.findOrCreate({
                    where: {
                        steamId: steamId
                    },
                    defaults: defaultUser(steamId)
                });
                if (temp !== null) {
                    user = temp;
                }
            }
        } catch (error) {
            console.error('Unhandled error in session post', error, { requestId: request.requestId });
            response.status(500).send({
                code: 500,
                message: 'Unknown error'
            });
            return;
        }

        if (user === undefined) {
            response.status(500).send({
                code: 500,
                message: 'Unknown error'
            });
            return;
        }

        const common = buildSteamAPICommon(undefined, process.env.STEAM_WEB_API_KEY, STEAM_APP_ID);
        let result: SteamResponse | undefined = undefined;
        try {
            result = await CheckAppOwnership(common, STEAM_SUPPORTER_APP_ID, steamId);
        } catch(error) {
            console.error('error dlc', error);
            if (error instanceof Error && error.message.startsWith('Steam servers')) {
                response.status(400).send({
                    code: ErrorCode.STEAM_SERVERS_DOWN,
                    message: 'Steam validation servers are down'
                });
                return;
            }
            response.status(400).send({
                code: ErrorCode.STEAM_ERROR,
                message: 'Unable to get DLC info'
            });
            return;
        }

        const ownsSupporter = result.appownership.ownsapp as boolean;

        if (user.supporter !== ownsSupporter) {
            user.supporter = ownsSupporter;
            await user.save();
        }

        response.status(200).json({
            success: true,
            user: {
                firstDiscoveries: user.firstDiscoveries,
                combines: user.combines,
                generations: user.generations,
                credits: user.credits,
                highestDepth: user.highestDepth,
                supporter: user.supporter,
                generateBanned: user.generateBanned,
                apiBanned: user.apiBanned
            }
        });
        return;
    } catch (error) {
        console.error('Unhandled error in session get', error, { requestId: request.requestId });
        response.status(500).send({
            code: 500,
            message: 'Unknown error'
        });
        return;
    }
}
