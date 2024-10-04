import { JWT_REFRESH_EXPIRATION } from '../../constants';
import jwt from 'jsonwebtoken';

export async function createToken(steamId: string, steamLanguage: string): Promise<{
    token: string,
    expiry: number,
}> {
    const expiry = Math.floor(Date.now() / 1000) + JWT_REFRESH_EXPIRATION;
    const token = jwt.sign({
        exp: expiry,
        data: {
            steamId: steamId,
            steamLanguage: steamLanguage,
        }
    }, process.env.JWT_SECRET ?? '32MWrhc3482cn7tH75x9ujdh23nNEgcL67n', {
        algorithm: 'HS512',
        issuer: 'alchemyunboundoverlords'
    });
    return {
        token,
        expiry
    };
}