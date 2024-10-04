import { SteamAPICommon, SteamResponse, validateResponse } from '.';
import fetch, { Response as FetchResponse } from 'node-fetch';

const CATEGORY = 'ISteamUserAuth';

export async function AuthenticateUserTicket(common: SteamAPICommon, steamToken: string) {
    let ticket: FetchResponse | undefined = undefined;
    try {
        ticket = await fetch(`${common.host}/${CATEGORY}/AuthenticateUserTicket/v1/?key=${common.token}&appid=${common.appid}&ticket=${steamToken}`);
    } catch (error) {
        console.error(`Failed fetching ${CATEGORY}/AuthenticateUserTicket`, error);
        throw error;
    }
    let result: SteamResponse | undefined = undefined;
    try {
        result = await validateResponse(ticket, false, true);
    } catch (error) {
        console.error(`Failed fetching ${CATEGORY}/AuthenticateUserTicket`, error);
        throw error;
    }
    if (result === undefined) {
        throw new Error('Failed validating response');
    }
    return result;
}
