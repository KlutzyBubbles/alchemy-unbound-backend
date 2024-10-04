import * as redis from 'redis';
import { ReturnReason } from '../types';

const url = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';

let client: redis.RedisClientType | undefined = undefined;
let pubSubClient: redis.RedisClientType | undefined = undefined;

let retryConnection: number | undefined = undefined;
let retryPubSubConnection: number | undefined = undefined;

export async function initRedis() {
    await initClient();
    await initPubSubClient();
}

async function initClient() {
    try {
        client = redis.createClient({
            url: url,
            disableOfflineQueue: true
        });
        client.on('error', (error) => {
            console.error('Redis error', error);
            client?.disconnect();
            client = undefined;
            setClientRetry();
        });
        await client.connect();
    } catch (error) {
        console.warn('Failed creating redis client, this is degraded', error);
        client = undefined;
        setClientRetry();
    }
}

async function initPubSubClient() {
    try {
        pubSubClient = redis.createClient({
            url: url,
            disableOfflineQueue: true
        });
        pubSubClient.on('error', (error) => {
            console.error('Redis pubsub error', error);
            pubSubClient?.disconnect();
            pubSubClient = undefined;
            setPubSubClientRetry();
        });
        await pubSubClient.connect();
    } catch (error) {
        console.warn('Failed creating redis pub sub client, this is degraded', error);
        pubSubClient = undefined;
        setPubSubClientRetry();
    }
}

function setClientRetry() {
    if (retryConnection === undefined) {
        retryConnection = (new Date()).getTime() + (5 * 60000);
    }
}

function setPubSubClientRetry() {
    if (retryPubSubConnection === undefined) {
        retryPubSubConnection = (new Date()).getTime() + (5 * 60000);
    }
}

export async function isRedisAlive(): Promise<boolean> {
    await clientSanitize();
    await pubSubClientSanitize();
    return client !== undefined && pubSubClient !== undefined;
}

export async function closeRedis() {
    await client?.disconnect();
    await pubSubClient?.disconnect();
}

async function clientSanitize() {
    if (client === undefined) {
        if (retryConnection !== undefined && retryConnection < (new Date()).getTime()) {
            retryConnection = undefined;
            await initClient();
        }
        return;
    }
    if (!client.isOpen) {
        try {
            await client.connect();
            if (!client.isOpen) {
                console.warn('Client isnt open after connect');
                client = undefined;
                setClientRetry();
            }
        } catch (error) {
            console.warn('Failed sanitize connecting redis client', error);
            client = undefined;
            setClientRetry();
        }
    }
}

async function pubSubClientSanitize() {
    if (pubSubClient === undefined) {
        if (retryPubSubConnection !== undefined && retryPubSubConnection < (new Date()).getTime()) {
            retryPubSubConnection = undefined;
            await initPubSubClient();
        }
        return;
    }
    if (!pubSubClient.isReady) {
        try {
            await pubSubClient.connect();
            if (!pubSubClient.isReady) {
                console.warn('pubSubClient isnt ready after connect');
                pubSubClient = undefined;
                setPubSubClientRetry();
            }
        } catch (error) {
            console.warn('Failed sanitize connecting redis pubSubClient', error);
            pubSubClient = undefined;
            setPubSubClientRetry();
        }
    }
}

function generateKey(a: string, b: string): string {
    let key = `${a}:${b}`;
    if (a.localeCompare(b) < 0) {
        key = `${b}:${a}`;
    }
    return key;
}


export async function waitForGeneration(a: string, b: string, timeout = 15000): Promise<ReturnReason> {
    await clientSanitize();
    await pubSubClientSanitize();
    if (client === undefined || pubSubClient === undefined) {
        return 'noClient';
    }
    try {
        const key = generateKey(a, b);
        if (await client.exists(key) !== 1) {
            return 'notGenerated';
        }
        const mainPromise = new Promise<ReturnReason>((resolve) => {
            if (pubSubClient === undefined) {
                return resolve('noClient');
            }
            pubSubClient.subscribe(key, (error: string) => {
                if (error !== '') {
                    return resolve('error');
                }
                return resolve('generated');
            });
        });
        const timeoutPromise = new Promise<ReturnReason>((resolve) => setTimeout(() => resolve('timeout'), timeout));
        return await Promise.race([mainPromise, timeoutPromise]);
    } catch (error) {
        console.warn(`Failed waitForGeneration for ${a} and ${b}`, error);
        throw error;
    }
} 

export async function startGenerating(a: string, b: string): Promise<void> {
    await clientSanitize();
    if (client === undefined) {
        return;
    }
    try {
        const key = generateKey(a, b);
        if (await client.exists(key) !== 1) {
            await client.set(key, 1);
            await client.expire(key, 30);
        }
    } catch (error) {
        console.warn(`Failed startGenerating for ${a} and ${b}`, error);
    }
}

export async function setFinished(a: string, b: string, error: boolean): Promise<void> {
    await clientSanitize();
    if (client === undefined) {
        return;
    }
    try {
        const key = generateKey(a, b);
        if (await client.exists(key) === 1) {
            await client.del(key);
        }
        client.publish(key, error ? 'error' : '');
    } catch (error) {
        console.warn(`Failed setFinished for ${a} and ${b}`, error);
    }
}

export async function isGenerating(a: string, b: string): Promise<boolean> {
    await clientSanitize();
    if (client === undefined) {
        return false;
    }
    try {
        const key = generateKey(a, b);
        if (await client.exists(key) === 1) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.warn(`Failed isGenerating for ${a} and ${b}`, error);
        return false;
    }
}

export {
    client
};
