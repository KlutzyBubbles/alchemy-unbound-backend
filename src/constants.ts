import { LanguageObject, TxnItem, TxnStatus } from './types';

export const JWT_REFRESH_EXPIRATION = 3600;

export const STEAM_APP_ID = 2858840;
export const STEAM_SUPPORTER_APP_ID = 2911170;

export const MAX_DEPTH = 1369000;
export const MAX_CUSTOM_DEPTH = 1369000000;

// export const LanguageKeys: { [key in keyof LanguageObject]: string } = {
//     english: 'en',
//     schinese: 'zh-Hans',
//     russian: 'ru',
//     spanish: 'es',
//     french: 'fr',
//     japanese: 'ja',
//     indonesian: 'id',
//     german: 'de',
//     latam: 'es', // TODO: Should be addressed
//     italian: 'it',
//     dutch: 'nl',
//     polish: 'pl',
//     portuguese: 'pt',
//     tchinese: 'zh-Hant',
//     koreana: 'ko'
// };

export const SteamLanguageKeys: { [key in keyof LanguageObject]: string } = {
    english: 'en',
    schinese: 'zh-CN',
    russian: 'ru',
    spanish: 'es',
    french: 'fr',
    japanese: 'ja',
    indonesian: 'id',
    german: 'de',
    latam: 'es-419',
    italian: 'it',
    dutch: 'nl',
    polish: 'pl',
    portuguese: 'pt',
    tchinese: 'zh-TW',
    koreana: 'ko'
};

export const LanguageKeys: { [key: string]: keyof LanguageObject } = {
    'en': 'english',
    'zh-Hans': 'schinese',
    'ru': 'russian',
    'es': 'spanish',
    'fr': 'french',
    'ja': 'japanese',
    'id': 'indonesian',
    'de': 'german',
    // latam: 'es': 'latam', // TODO: Should be addressed (Not supported on Azure, deprecating it)
    'it': 'italian',
    'nl': 'dutch',
    'pl': 'polish',
    'pt': 'portuguese',
    'zh-Hant': 'tchinese',
    'ko': 'koreana'
};

export const TxnItems: { [key: string]: TxnItem } = {
    fillHints: {
        id: 1,
        description: 'Fill hints to the max you can hold',
        amount: 99,
        redeem: 0,
        category: 'hint',
        singleUse: false
    },
    aiHints: {
        id: 2,
        description: 'Hints now generate for AI items',
        amount: 199,
        redeem: 0,
        category: 'hint',
        singleUse: true
    },
    credit250: {
        id: 3,
        description: 'Add 250 AI credits',
        amount: 99,
        redeem: 250,
        category: 'credits',
        singleUse: false
    },
    credit750: {
        id: 4,
        description: 'Add 750 AI credits',
        amount: 199,
        redeem: 750,
        category: 'credits',
        singleUse: false
    },
    credit1500: {
        id: 5,
        description: 'Add 1500 AI credits',
        amount: 349,
        redeem: 1500,
        category: 'credits',
        singleUse: false
    },
    credit3500: {
        id: 6,
        description: 'Add 3500 AI credits',
        amount: 749,
        redeem: 3500,
        category: 'credits',
        singleUse: false
    },
    themeSand: {
        id: 7,
        description: 'Beach Theme',
        amount: 299,
        redeem: 0,
        category: 'theme',
        singleUse: true
    },
    themePurple: {
        id: 8,
        description: 'Purple Theme',
        amount: 299,
        redeem: 0,
        category: 'theme',
        singleUse: true
    },
    themeOrange: {
        id: 9,
        description: 'Orange Theme',
        amount: 299,
        redeem: 0,
        category: 'theme',
        singleUse: true
    },
    themePink: {
        id: 10,
        description: 'Blossom Theme',
        amount: 299,
        redeem: 0,
        category: 'theme',
        singleUse: true
    },
    themeBlue: {
        id: 11,
        description: 'Sky Theme',
        amount: 299,
        redeem: 0,
        category: 'theme',
        singleUse: true
    }
};

export const MissionPoints: { [key: string]: number } = {
    easy: 5,
    medium: 10,
    hard: 15,
    random: 20
};

export const WeeklyMultiplier = 5;

export const RevokeStatus: TxnStatus[] = [
    'Refunded',
    'PartialRefund',
    'Chargedback',
    'RefundedFriendlyFraud',
    'RefundedSuspectedFraud'
];

export const SteamEResult = {
    '0': 'Invalid',
    '1': 'OK',
    '2': 'Fail',
    '3': 'NoConnection',
    '5': 'InvalidPassword',
    '6': 'LoggedInElsewhere',
    '7': 'InvalidProtocolVer',
    '8': 'InvalidParam',
    '9': 'FileNotFound',
    '10': 'Busy',
    '11': 'InvalidState',
    '12': 'InvalidName',
    '13': 'InvalidEmail',
    '14': 'DuplicateName',
    '15': 'AccessDenied',
    '16': 'Timeout',
    '17': 'Banned',
    '18': 'AccountNotFound',
    '19': 'InvalidSteamID',
    '20': 'ServiceUnavailable',
    '21': 'NotLoggedOn',
    '22': 'Pending',
    '23': 'EncryptionFailure',
    '24': 'InsufficientPrivilege',
    '25': 'LimitExceeded',
    '26': 'Revoked',
    '27': 'Expired',
    '28': 'AlreadyRedeemed',
    '29': 'DuplicateRequest',
    '30': 'AlreadyOwned',
    '31': 'IPNotFound',
    '32': 'PersistFailed',
    '33': 'LockingFailed',
    '34': 'LogonSessionReplaced',
    '35': 'ConnectFailed',
    '36': 'HandshakeFailed',
    '37': 'IOFailure',
    '38': 'RemoteDisconnect',
    '39': 'ShoppingCartNotFound',
    '40': 'Blocked',
    '41': 'Ignored',
    '42': 'NoMatch',
    '43': 'AccountDisabled',
    '44': 'ServiceReadOnly',
    '45': 'AccountNotFeatured',
    '46': 'AdministratorOK',
    '47': 'ContentVersion',
    '48': 'TryAnotherCM',
    '49': 'PasswordRequiredToKickSession',
    '50': 'AlreadyLoggedInElsewhere',
    '51': 'Suspended',
    '52': 'Cancelled',
    '53': 'DataCorruption',
    '54': 'DiskFull',
    '55': 'RemoteCallFailed',
    '56': 'PasswordUnset',
    '57': 'ExternalAccountUnlinked',
    '58': 'PSNTicketInvalid',
    '59': 'ExternalAccountAlreadyLinked',
    '60': 'RemoteFileConflict',
    '61': 'IllegalPassword',
    '62': 'SameAsPreviousValue',
    '63': 'AccountLogonDenied',
    '64': 'CannotUseOldPassword',
    '65': 'InvalidLoginAuthCode',
    '66': 'AccountLogonDeniedNoMail',
    '67': 'HardwareNotCapableOfIPT',
    '68': 'IPTInitError',
    '69': 'ParentalControlRestricted',
    '70': 'FacebookQueryError',
    '71': 'ExpiredLoginAuthCode',
    '72': 'IPLoginRestrictionFailed',
    '73': 'AccountLockedDown',
    '74': 'AccountLogonDeniedVerifiedEmailRequired',
    '75': 'NoMatchingURL',
    '76': 'BadResponse',
    '77': 'RequirePasswordReEntry',
    '78': 'ValueOutOfRange',
    '79': 'UnexpectedError',
    '80': 'Disabled',
    '81': 'InvalidCEGSubmission',
    '82': 'RestrictedDevice',
    '83': 'RegionLocked',
    '84': 'RateLimitExceeded',
    '85': 'AccountLoginDeniedNeedTwoFactor',
    '86': 'ItemDeleted',
    '87': 'AccountLoginDeniedThrottle',
    '88': 'TwoFactorCodeMismatch',
    '89': 'TwoFactorActivationCodeMismatch',
    '90': 'AccountAssociatedToMultiplePartners',
    '91': 'NotModified',
    '92': 'NoMobileDeviceAvailable',
    '93': 'TimeIsOutOfSync',
    '94': 'SMSCodeFailed',
    '95': 'AccountLimitExceeded',
    '96': 'AccountActivityLimitExceeded',
    '97': 'PhoneActivityLimitExceeded',
    '98': 'RefundToWallet',
    '99': 'EmailSendFailure',
    '100': 'NotSettled',
    '101': 'NeedCaptcha',
    '102': 'GSLTDenied',
    '103': 'GSOwnerDenied',
    '104': 'InvalidItemType',
    '105': 'IPBanned'
};
