import { SteamAPICommon, SteamResponse, validateResponse } from '.';
import fetch, { Response as FetchResponse } from 'node-fetch';
import { LanguageObject, TxnItem } from '../types';
import { SteamLanguageKeys } from '../constants';
import FormData from 'form-data';

let CATEGORY = 'ISteamMicroTxn';
if (process.env.NODE_ENV === 'DEVELOPMENT') {
    CATEGORY = 'ISteamMicroTxnSandbox';
}

export async function GetUserInfo(common: SteamAPICommon, steamId: string) {
    let ticket: FetchResponse | undefined = undefined;
    try {
        ticket = await fetch(`${common.host}/${CATEGORY}/GetUserInfo/v2/?key=${common.token}&appid=${common.appid}&steamid=${steamId}`);
    } catch (error) {
        console.error(`Failed fetching ${CATEGORY}/GetUserInfo`, error);
        throw error;
    }
    let result: SteamResponse | undefined = undefined;
    try {
        result = await validateResponse(ticket);
    } catch (error) {
        console.error(`Failed fetching ${CATEGORY}/GetUserInfo`, error);
        throw error;
    }
    if (result === undefined) {
        throw new Error('Failed validating response');
    }
    return result;
}

export async function InitTxn(common: SteamAPICommon, orderId: number, steamId: string, steamLanguage: keyof LanguageObject, item: TxnItem) {
    let response: FetchResponse | undefined = undefined;
    try {
        const form = new FormData();
        form.append('key', common.token);
        form.append('orderid', orderId);
        form.append('steamid', steamId);
        form.append('appid', common.appid);
        form.append('language', SteamLanguageKeys[steamLanguage]);
        form.append('itemcount', 1);
        form.append('currency', 'USD');
        form.append('itemid[0]', item.id);
        form.append('qty[0]', 1);
        form.append('amount[0]', item.amount);
        form.append('description[0]', item.description );
        form.append('category[0]', item.category);

        response = await fetch(
            `${common.host}/${CATEGORY}/InitTxn/v3/`,
            {
                method: 'POST',
                body: form
            }
        );
    } catch (error) {
        console.error(`Failed fetching ${CATEGORY}/InitTxn`, error);
        throw error;
    }
    let result: SteamResponse | undefined = undefined;
    try {
        result = await validateResponse(response);
    } catch (error) {
        console.error(`Failed fetching ${CATEGORY}/InitTxn`, error);
        throw error;
    }
    if (result === undefined) {
        throw new Error('Failed validating response');
    }
    return result;
}

export async function FinalizeTxn(common: SteamAPICommon, orderId: string) {
    let response: FetchResponse | undefined = undefined;
    try {
        const form = new FormData();
        form.append('key', common.token);
        form.append('orderid', orderId);
        form.append('appid', common.appid);
        response = await fetch(
            `${common.host}/${CATEGORY}/FinalizeTxn/v2/`,
            {
                method: 'POST',
                body: form
            }
        );
    } catch (error) {
        console.error(`Failed fetching ${CATEGORY}/FinalizeTxn`, error);
        throw error;
    }
    let result: SteamResponse | undefined = undefined;
    try {
        result = await validateResponse(response);
    } catch (error) {
        console.error(`Failed fetching ${CATEGORY}/FinalizeTxn`, error);
        throw error;
    }
    if (result === undefined) {
        throw new Error('Failed validating response');
    }
    return result;
}
