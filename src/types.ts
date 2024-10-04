import { LanguagePublicProps } from './models/v2/language.model';

export interface TxnItem {
    id: number,
    description: string,
    amount: number,
    redeem: number,
    category: string,
    singleUse: boolean
}

export type LanguageObject = {
    english: string,
    schinese: string,
    russian: string,
    spanish: string,
    french: string,
    japanese: string,
    indonesian: string,
    german: string,
    latam: string,
    italian: string,
    dutch: string,
    polish: string,
    portuguese: string,
    tchinese: string,
    koreana: string
}

export type UnknownLanguageObject = {
    english: string,
    schinese?: string,
    russian: string,
    spanish: string,
    french: string,
    japanese: string,
    indonesian: string,
    german: string,
    latam?: string,
    italian: string,
    dutch: string,
    polish: string,
    portuguese: string,
    tchinese?: string,
    koreana?: string,

    // Known things the AI returns .-.
    korean?: string,
    latin?: string,
    'latin american spanish'?: string,
    'latin_american_spanish'?: string,
    latinamerican?: string,
    chinese?: string,
    'simplified chinese'?: string,
    'traditional chinese'?: string,
    'simplified_chinese'?: string,
    'traditional_chinese'?: string,
}

export const knownLanguageKeys = [
    'english',
    'schinese',
    'russian',
    'spanish',
    'french',
    'japanese',
    'indonesian',
    'german',
    'latam',
    'italian',
    'dutch',
    'polish',
    'portuguese',
    'tchinese',
    'koreana',
    'emoji',

    // Known things the AI returns .-.
    'korean',
    'latin',
    'latin american spanish',
    'latinamerican',
    'chinese',
    'simplified chinese',
    'traditional chinese'
];

export type UnknownAIResponse = UnknownLanguageObject & {
    emoji: string,
}

export type AIResponse = LanguageObject & {
    emoji: string,
}

export enum ErrorCode {
    QUERY_MISSING = 1,
    QUERY_INVALID = 2,
    QUERY_UNDEFINED = 3,
    AB_NOT_KNOWN = 4,
    STEAM_TICKET_INVALID = 5,
    TOKEN_EXPIRED = 6,
    STEAM_SERVERS_DOWN = 7,
    AB_NUMBER = 8,
    MAX_DEPTH = 9,
    STEAM_ERROR = 10,
    ITEM_UNKNOWN = 11,
    TRANSLATION_ERROR = 12,
    ALREADY_COMPLETED = 13,
    ALREADY_PURCHASED = 14,
    NOT_PURCHASED = 15,
    ALREADY_FINALIZED = 16,
    SINGLE_USE = 17,
    NOT_AUTHENTICATED = 18,
    NO_CREDITS = 19,
    UNKNOWN_ERROR = 500
}

export interface ErrorResponse {
    code: ErrorCode,
    message: string,
    fields?: string[],
    data?: unknown
}

export interface APIResponseV1 {
    result: string,
    display: LanguageObject,
    emoji: string,
    depth: number,
    who_discovered: string,
    first: boolean,
    base: boolean
}

export interface APIResponseV2 {
    result: string,
    display: LanguageObject,
    emoji: string,
    depth: number,
    who_discovered: string,
    first: boolean,
    base: boolean,
    custom: boolean,
    credits: number,
    creditAdjust: number
}

export interface SuccessResponse {
    success: boolean
}

export interface MissionLogResponse extends SuccessResponse {
    points: number,
    level: string
}

export interface MissionResponse extends SuccessResponse {
    id: number,
    expires: number,
    easy: LanguagePublicProps,
    medium: LanguagePublicProps,
    hard: LanguagePublicProps,
    random: LanguagePublicProps
}

export type TxnStatus = 'Init' | 'Approved' | 'Succeeded' | 'Failed' | 'Refunded' | 'PartialRefund' | 'Chargedback' | 'RefundedSuspectedFraud' | 'RefundedFriendlyFraud'

export type ReturnReason = 'generated' | 'timeout' | 'error' | 'noClient' | 'notGenerated';
