import { SteamAPICommon, SteamResponse, validateResponse } from '.';
import fetch, { Response as FetchResponse } from 'node-fetch';

const CATEGORY = 'ISteamUser';

export async function CheckAppOwnership(common: SteamAPICommon, appId: number, steamId: string) {
    let ownership: FetchResponse | undefined = undefined;
    try {
        ownership = await fetch(`${common.host}/${CATEGORY}/CheckAppOwnership/v2/?key=${common.token}&steamid=${steamId}&appid=${appId}`);
    } catch (error) {
        console.error(`Failed fetching ${CATEGORY}/CheckAppOwnership`, error);
        throw error;
    }
    let result: SteamResponse | undefined = undefined;
    try {
        result = await validateResponse(ownership, false, true, 'appownership');
    } catch (error) {
        console.error(`Failed fetching ${CATEGORY}/CheckAppOwnership`, error);
        throw error;
    }
    if (result === undefined) {
        throw new Error('Failed validating response');
    }
    return result;
}
