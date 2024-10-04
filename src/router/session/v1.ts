import { Response } from 'express';
import { STEAM_APP_ID } from '../../constants';
import { TokenedRequestV1 } from '../../middleware/steam';
import { AuthenticateUserTicket } from '../../steamapi/ISteamUserAuth';
import { SteamResponse, buildSteamAPICommon } from '../../steamapi';
import { createToken } from './common';
import { HerokuRequest } from '../../middleware/requestId';
import { ErrorCode } from '../../types';

export async function sessionGetV1(request: TokenedRequestV1, response: Response) {
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


export async function sessionPostV1(request: HerokuRequest, response: Response) {
    try {
        const steamToken: string | undefined = request.query.steamToken as string | undefined;
        const steamLanguage: string | undefined = request.query.steamLanguage as string | undefined;
        if (steamToken === undefined || steamLanguage === undefined) {
            response.status(400).send({
                code: ErrorCode.QUERY_UNDEFINED,
                message: 'Query parameters are undefined'
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
        response.status(200).json({
            token: token.token,
            steamId: steamId,
            expiryDate: token.expiry
        });
        return;
    } catch (error) {
        console.error('Unhandled error in session post', error, { requestId: request.requestId });
        response.status(500).send({
            code: 500,
            message: 'Unknown error'
        });
    }
}
