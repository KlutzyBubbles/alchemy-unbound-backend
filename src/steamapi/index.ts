import { Response as FetchResponse } from 'node-fetch';

export interface SteamAPICommon {
    host: string,
    token: string,
    appid: string | number,
}

export interface SteamResponse {
    response: {
        result: 'OK' | 'Failure',
        params: Record<string, unknown>,
        error?: {
            errorcode: string,
            errordesc: string
        }
    }
    [key: string]: Record<string, unknown>
}

export function buildSteamAPICommon(host: string | undefined, token: string | undefined, appid: string | number, throwOnToken = true): SteamAPICommon {
    if (throwOnToken && token === undefined) {
        throw new Error('Undefined token');
    }
    return {
        host: host === undefined ? 'https://partner.steam-api.com' : host,
        token: token ?? '',
        appid
    };
}

export async function validateResponse(response: FetchResponse | undefined, skipParamCheck = false, weirdParam = false, paramName = 'params'): Promise<SteamResponse | undefined> {
    // console.log('response', response);
    if (response === undefined || !response.ok || response.body === undefined || response.body === null) {
        console.log('text', await response?.text());
        return undefined;
    }
    if (response.status !== 200) {
        if (response.status === 503) {
            throw new Error('Steam servers are down');
        }
        return undefined;
    }
    let result: SteamResponse | undefined = undefined;
    try {
        result = JSON.parse(await response.text());
        // console.log('result', result);
    } catch(e) {
        console.error('error', e);
        return undefined;
    }
    if (result === undefined) {
        return undefined;
    }
    if (paramName !== 'params') {
        if (!Object.prototype.hasOwnProperty.call(result, paramName)) {
            console.log('no params');
            return undefined;
        }
        if (Object.prototype.hasOwnProperty.call(result[paramName], 'error') || result[paramName].result !== 'OK') {
            console.log('has error or no ok');
            return undefined;
        }
    } else {
        if (weirdParam) {
            if (!Object.prototype.hasOwnProperty.call(result, 'response')) {
                return undefined;
            }
            if (!skipParamCheck) {
                if (!Object.prototype.hasOwnProperty.call(result.response, paramName)) {
                    console.log('no params');
                    return undefined;
                }
                if (Object.prototype.hasOwnProperty.call(result.response.params, 'error') || result.response.params.result !== 'OK') {
                    console.log('has error or no ok');
                    return undefined;
                }
            }
        } else {
            if (!Object.prototype.hasOwnProperty.call(result, 'response') || !Object.prototype.hasOwnProperty.call(result.response, 'result')) {
                return undefined;
            }
            if (Object.prototype.hasOwnProperty.call(result.response, 'error') || result.response.result !== 'OK') {
                return result;
                return undefined;
            }
            if (!skipParamCheck && !Object.prototype.hasOwnProperty.call(result.response, paramName)) {
                return undefined;
            }
        }
    }
    return result;
}
