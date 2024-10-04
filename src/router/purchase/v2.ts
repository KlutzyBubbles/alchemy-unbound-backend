import { Response } from 'express';
import { STEAM_APP_ID, TxnItems } from '../../constants';
import { TokenedRequestV2 } from '../../middleware/steam';
import { FinalizeTxn, InitTxn } from '../../steamapi/ISteamMicroTxn';
import {  SteamResponse, buildSteamAPICommon } from '../../steamapi';
import { ErrorCode } from '../../types';
import { Transaction } from '../../models/v2/transaction.model';
import { undefinedErrorFormat } from '../../helpers';
import { Op } from 'sequelize';

export async function purchaseGetV2(request: TokenedRequestV2, response: Response) {

    const item: string | undefined = request.query.item as string | undefined;
    const steamId = request.steamId;
    const steamLanguage = request.steamLanguage;

    if (Transaction === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Server issue'
        });
        return;
    }

    if (item === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined',
            fields: undefinedErrorFormat({
                item,
                steamId,
                steamLanguage
            })
        });
        return;
    }

    if (steamId === undefined || steamLanguage === undefined) {
        response.status(400).send({
            code: ErrorCode.NOT_AUTHENTICATED,
            message: 'User needs to be authenticated',
        });
        return;
    }

    if (!Object.keys(TxnItems).includes(item)) {
        response.status(400).send({
            code: ErrorCode.ITEM_UNKNOWN,
            message: 'Unknown item requested'
        });
        return;
    }

    const common = buildSteamAPICommon(undefined, process.env.STEAM_WEB_API_KEY, STEAM_APP_ID);
    if (TxnItems[item].singleUse) {
        const existing = await Transaction.findOne({
            where: {
                steamId: steamId,
                status: 'Succeeded',
                itemId: TxnItems[item].id
            }
        });
        if (existing !== null) {
            response.status(400).send({
                code: ErrorCode.ALREADY_PURCHASED,
                message: 'Already purchased item'
            });
            return;
        }
    }

    let initTxn: SteamResponse | undefined = undefined;
    const transaction = await Transaction.create({
        steamId: steamId,
        status: 'Init',
        itemId: TxnItems[item].id,
        transactionId: ''
    });

    if (transaction === null) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Unable to init transaction'
        });
        return;
    }

    try {
        initTxn = await InitTxn(common, transaction.id, steamId, steamLanguage, TxnItems[item]);
    } catch (error) {
        console.error('initTxn error', error);
        if (error instanceof Error && error.message.startsWith('Steam servers')) {
            response.status(400).send({
                code: ErrorCode.STEAM_SERVERS_DOWN,
                message: 'Steam validation servers are down'
            });
            return;
        }
        response.status(400).send({
            code: ErrorCode.STEAM_ERROR,
            message: 'Unable to init transaction'
        });
        return;
    }

    if (initTxn === undefined) {
        response.status(400).send({
            code: ErrorCode.STEAM_ERROR,
            message: 'Unable to init transaction'
        });
        return;
    } else if (initTxn.response.result !== 'OK' || Object.prototype.hasOwnProperty.call(initTxn, 'error')) {
        response.status(500).send({
            code: ErrorCode.STEAM_ERROR,
            message: 'Unable to init transaction',
            steamError: initTxn.response.error
        });
        transaction.status = initTxn.response.result;
        try {
            await transaction.save();
        } catch (error) {
            console.error('Failed saving transaction', error, { requestId: request.requestId });
        }
        return;
    }

    transaction.transactionId = `${initTxn.response.params.transid ?? ''}`;
    try {
        await transaction.save();
    } catch (error) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Unable to init transaction'
        });
        return;
    }

    response.status(200).send({
        success: true,
        orderId: initTxn.response.params.orderid,
    });
    return;
}

export async function purchaseFinalizeGetV2(request: TokenedRequestV2, response: Response) {

    const orderid: string | undefined = request.query.orderid as string | undefined;
    const user = request.user;
    const steamId = request.steamId;
    const steamLanguage = request.steamLanguage;

    if (Transaction === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Server issue'
        });
        return;
    }

    if (orderid === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined',
            fields: undefinedErrorFormat({
                orderid,
                steamId,
                steamLanguage
            })
        });
        return;
    }

    if (steamId === undefined || steamLanguage === undefined || user === undefined) {
        response.status(400).send({
            code: ErrorCode.NOT_AUTHENTICATED,
            message: 'User needs to be authenticated',
        });
        return;
    }

    const transaction = await Transaction.findOne({
        where: {
            id: orderid
        }
    });

    if (transaction === null) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Unable to finalize transaction'
        });
        return;
    }

    if (transaction.status === 'Succeeded' || transaction.status === 'Failure' || transaction.status === 'Redeemed') {
        response.status(500).send({
            code: ErrorCode.ALREADY_FINALIZED,
            message: 'Transaction already in final state',
            data: transaction.status
        });
        return;
    }

    const common = buildSteamAPICommon(undefined, process.env.STEAM_WEB_API_KEY, STEAM_APP_ID);
    let finalizeTxn: SteamResponse | undefined = undefined;

    try {
        finalizeTxn = await FinalizeTxn(common, orderid);
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('Steam servers')) {
            response.status(400).send({
                code: ErrorCode.STEAM_SERVERS_DOWN,
                message: 'Steam validation servers are down'
            });
            return;
        }
        response.status(400).send({
            code: ErrorCode.STEAM_ERROR,
            message: 'Unable to finalize transaction'
        });
        return;
    }

    if (finalizeTxn === undefined) {
        response.status(400).send({
            code: ErrorCode.STEAM_ERROR,
            message: 'Unable to finalize transaction'
        });
        return;
    } else if (finalizeTxn.response.result !== 'OK' || Object.prototype.hasOwnProperty.call(finalizeTxn, 'error')) {
        response.status(500).send({
            code: ErrorCode.STEAM_ERROR,
            message: 'Unable to finalize transaction',
            steamError: finalizeTxn.response.error
        });
        transaction.status = finalizeTxn.response.result;
        try {
            await transaction.save();
        } catch (error) {
            console.error('Failed saving transaction', error, { requestId: request.requestId });
        }
        return;
    }

    transaction.status = 'Succeeded';
    let singleUse = false;
    let item = undefined;
    for (const itemKey of Object.keys(TxnItems)) {
        if (TxnItems[itemKey].id === transaction.itemId) {
            singleUse = TxnItems[itemKey].singleUse;
            item = itemKey;
            break;
        }
    }

    if (item !== undefined) {
        if (item.startsWith('credit')) {
            user.credits += TxnItems[item].redeem;
            try {
                await user.save();
            } catch (error) {
                console.error('Failed saving user', { requestId: request.requestId });
                response.status(400).send({
                    code: ErrorCode.UNKNOWN_ERROR,
                    message: 'Unable to add credits to user'
                });
                return;
            }
        }
        transaction.status = 'Redeemed';
        if (item === 'fillHints') {
            transaction.status = 'Redeemed';
        }
    }
    if (singleUse) {
        console.info('Single');
        transaction.status = 'Redeemed';
    }
    if (transaction.status  !== 'Redeemed') {
        console.warn('Something wrong with item redeem', transaction.status, item, singleUse, { requestId: request.requestId });
    }
    try {
        await transaction.save();
    } catch (error) {
        response.status(200).send({
            success: true,
            userCredits: user.credits,
            softError: true
        });
        return;
    }

    response.status(200).send({
        success: true,
        userCredits: user.credits,
        softError: false
    });
    return;
}

export async function purchaseCheckV2(request: TokenedRequestV2, response: Response) {

    const item: string | undefined = request.query.item as string | undefined;
    const steamId = request.steamId;
    const steamLanguage = request.steamLanguage;

    if (Transaction === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Server issue'
        });
        return;
    }

    if (item === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined',
            fields: undefinedErrorFormat({
                item,
                steamId,
                steamLanguage
            })
        });
        return;
    }

    if (steamId === undefined || steamLanguage === undefined) {
        response.status(400).send({
            code: ErrorCode.NOT_AUTHENTICATED,
            message: 'User needs to be authenticated',
        });
        return;
    }

    if (!Object.keys(TxnItems).includes(item)) {
        response.status(400).send({
            code: ErrorCode.ITEM_UNKNOWN,
            message: 'Unknown item requested'
        });
        return;
    }

    const transaction = await Transaction.findOne({
        where: {
            steamId: steamId,
            itemId: TxnItems[item].id,
            status: {
                [Op.or]: ['Succeeded', 'Redeemed'],
            }
        }
    });

    if (transaction === null) {
        response.status(200).send({
            success: false
        });
        return;
    }

    response.status(200).send({
        success: true,
        status: transaction.status,
        redeemed: transaction.status === 'Redeemed'
    });
    return;
}

export async function purchaseCheckBulkV2(request: TokenedRequestV2, response: Response) {

    const items: string[] | undefined = request.body.items as string[] | undefined;
    const steamId = request.steamId;
    const steamLanguage = request.steamLanguage;

    if (Transaction === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Server issue'
        });
        return;
    }

    if (items === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined',
            fields: undefinedErrorFormat({
                items,
                steamId,
                steamLanguage
            })
        });
        return;
    }

    if (steamId === undefined || steamLanguage === undefined) {
        response.status(400).send({
            code: ErrorCode.NOT_AUTHENTICATED,
            message: 'User needs to be authenticated',
        });
        return;
    }

    const checkedItems: string[] = [];

    for (const item of items) {
        if (Object.keys(TxnItems).includes(item)) {
            checkedItems.push(item);
        }
    }

    const validatedItems: {
        item: string,
        status: string
    }[] = [];

    const transactions = await Transaction.findAll({
        where: {
            steamId: steamId,
            itemId: {
                [Op.in]: checkedItems.map((item) => TxnItems[item].id),
            },
            status: {
                [Op.or]: ['Succeeded', 'Redeemed'],
            }
        }
    });

    for (const item of items) {
        const transaction = transactions.find((value) => value.itemId === TxnItems[item].id);
    
        if (transaction !== null && transaction !== undefined) {
            validatedItems.push({
                item,
                status: transaction.status
            });
        }
    }

    response.status(200).send({
        success: true,
        items: validatedItems.map((item) => {
            return {
                item: item.item,
                status: item.status,
                redeemed: item.status === 'Redeemed'
            };
        })
    });
    return;
}


export async function purchaseRedeemV2(request: TokenedRequestV2, response: Response) {
    const item: string | undefined = request.query.item as string | undefined;
    const steamId = request.steamId;
    const user = request.user;
    const steamLanguage = request.steamLanguage;

    if (Transaction === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Server issue'
        });
        return;
    }

    if (item === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined',
            fields: undefinedErrorFormat({
                item,
                steamId,
                steamLanguage
            })
        });
        return;
    }

    if (steamId === undefined || steamLanguage === undefined || user === undefined) {
        response.status(400).send({
            code: ErrorCode.NOT_AUTHENTICATED,
            message: 'User needs to be authenticated',
        });
        return;
    }

    if (!Object.keys(TxnItems).includes(item)) {
        response.status(400).send({
            code: ErrorCode.ITEM_UNKNOWN,
            message: 'Unknown item requested'
        });
        return;
    }

    const transaction = await Transaction.findOne({
        where: {
            steamId: steamId,
            itemId: TxnItems[item].id,
            status: 'Succeeded',
        }
    });

    if (transaction === null) {
        response.status(400).send({
            code: ErrorCode.NOT_PURCHASED,
            message: 'Unable to find purhcased item'
        });
        return;
    }

    if (item.startsWith('credit')) {
        user.credits += TxnItems[item].redeem;
        try {
            await user.save();
        } catch (error) {
            console.error('Failed saving user', { requestId: request.requestId });
            response.status(400).send({
                code: ErrorCode.UNKNOWN_ERROR,
                message: 'Unable to add credits to user'
            });
            return;
        }
    }
    transaction.status = 'Redeemed';

    try {
        await transaction.save();
    } catch (error) {
        response.status(200).send({
            success: false,
            userCredits: user.credits,
        });
        return;
    }

    response.status(200).send({
        success: true,
        userCredits: user.credits,
    });
    return;
}
