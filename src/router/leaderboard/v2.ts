import { Response } from 'express';
import { TokenedRequestV2 } from '../../middleware/steam';
import { ErrorCode } from '../../types';
import { undefinedErrorFormat } from '../../helpers';
import { User, UserModel } from '../../models/v2/user.model';
import { Mission, MissionModel } from '../../models/v2/mission.model';
import { InferAttributes, Sequelize, WhereOptions } from 'sequelize';

export async function userLeaderboardV2(request: TokenedRequestV2, response: Response) {
    const stat = request.params.stat;
    const amount: string | undefined = request.query.amount as string | undefined;

    if (stat === undefined || !['firstDiscoveries', 'highestDepth', 'customGenerations', 'customHighestDepth'].includes(stat)) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined or invalid',
            fields: undefinedErrorFormat({
                stat
            })
        });
        return;
    }

    const amountNum = parseInt(amount ?? '25');

    if (amountNum < 1 || amountNum > 100) {
        response.status(400).send({
            code: ErrorCode.QUERY_INVALID,
            message: 'Invalid amount',
        });
        return;
    }

    if (User === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Database issues :/'
        });
        return;
    }

    const records = await User.findAll({
        where: {
            leaderboardBanned: false
        },
        attributes: ['steamId', 'supporter', stat],
        order: [[stat, 'DESC']],
        limit: amountNum
    });

    response.status(200).send({
        success: true,
        stat: stat,
        items: records.map((item) => {
            return {
                steamId: item.steamId,
                hasSupporter: item.supporter,
                value: item[stat as keyof UserModel]
            };
        }),
    });
    return;
}

export async function missionLeaderboardV2(request: TokenedRequestV2, response: Response) {
    const missionType: string = request.params.missionType;
    const stat: string = request.params.stat;
    const missionLevel: string | undefined = request.params.missionLevel;
    const missionId: string | undefined = request.query.missionId as string | undefined;
    const amount: string | undefined = request.query.amount as string | undefined;

    if (missionType === undefined || !['daily', 'weekly'].includes(missionType)
        || stat === undefined || !['count', 'combines'].includes(stat)) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined or invalid',
            fields: undefinedErrorFormat({
                missionType,
                stat
            })
        });
        return;
    }

    if (missionLevel !== undefined && !['easy', 'medium', 'hard', 'random'].includes(missionLevel)) {
        response.status(400).send({
            code: ErrorCode.QUERY_INVALID,
            message: 'Mission level is incorrect'
        });
        return;
    }

    const amountNum = parseInt(amount ?? '25');

    if (amountNum < 1 || amountNum > 100) {
        response.status(400).send({
            code: ErrorCode.QUERY_INVALID,
            message: 'Invalid amount',
        });
        return;
    }

    if (User === undefined || Mission === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Database issues :/'
        });
        return;
    }

    if (missionLevel === undefined) {
        if (stat === 'combines') {
            if (missionId === undefined) {
                response.status(400).send({
                    code: ErrorCode.QUERY_UNDEFINED,
                    message: 'Query parameters are undefined or invalid',
                    fields: undefinedErrorFormat({
                        missionId
                    })
                });
                return;
            }
            const result: {
                success: boolean,
                stat: string,
                items: {
                    [key: string]: {
                        count: number,
                        items: {
                            steamId: string,
                            hasSupporter: boolean,
                            value: number
                        }[]
                    }
                }
            } = {
                success: true,
                stat: stat,
                items: {}
            };
            const tempHold: {
                [key: string]: {
                    count: number,
                    items: MissionModel[]
                }
            } = {};
            const steamIds: string[] = [];
            for (const level of ['easy', 'medium', 'hard', 'random']) {
                const { count, rows } = await Mission.findAndCountAll({
                    where: {
                        missionId: missionId,
                        type: missionType,
                        level: level,
                        leaderboardBanned: false
                    },
                    limit: amountNum,
                    attributes: ['steamId', stat],
                    order: [[stat, 'ASC']]
                });
                tempHold[level] = {
                    count: count,
                    items: rows
                };
                for (const record of rows) {
                    if (!steamIds.includes(record.steamId)) {
                        steamIds.push(record.steamId);
                    }
                }
            }
            const users = await User.findAll({
                where: {
                    steamId: steamIds
                }
            });
            for (const level of ['easy', 'medium', 'hard', 'random']) {
                const mapperFunc = (item: MissionModel) => {
                    return {
                        steamId: item.steamId,
                        hasSupporter: (users.find((user) => user.steamId === item.steamId) ?? { supporter: false }).supporter,
                        value: item.get(stat)
                    };
                };
                result.items[level] = {
                    count: tempHold[level].count,
                    items: tempHold[level].items.map(mapperFunc)
                };
            }
            response.status(200).send(result);
            return;
        } else if (stat === 'count') {
            const whereProps: WhereOptions<InferAttributes<MissionModel, {
                omit: never;
            }>> = {
                type: missionType,
                leaderboardBanned: false
            };
            if (missionId !== undefined) {
                whereProps.missionId = missionId;
            }
            const { count, rows } = await Mission.findAndCountAll({
                where: whereProps,
                limit: amountNum,
                attributes: [
                    'steamId',
                    [Sequelize.fn('COUNT', Sequelize.col('steamId')), stat]
                ],
                group: [
                    'steamId',
                ],
                order: [[stat, 'DESC']]
            });
            const users = await User.findAll({
                where: {
                    steamId: rows.map((item) => item.steamId)
                }
            });
            response.status(200).send({
                success: false,
                stat: stat,
                count: count.length,
                items: rows.map((item) => {
                    return {
                        steamId: item.steamId,
                        hasSupporter: (users.find((user) => user.steamId === item.steamId) ?? { supporter: false }).supporter,
                        value: parseInt(item.get(stat) as string)
                    };
                }),
            });
            return;
        }
    } else {
        if (stat === 'combines') {
            if (missionId === undefined) {
                response.status(400).send({
                    code: ErrorCode.QUERY_UNDEFINED,
                    message: 'Query parameters are undefined or invalid',
                    fields: undefinedErrorFormat({
                        missionId
                    })
                });
                return;
            }
            const steamIds: string[] = [];
            const { count, rows } = await Mission.findAndCountAll({
                where: {
                    missionId: missionId,
                    type: missionType,
                    level: missionLevel,
                    leaderboardBanned: false
                },
                limit: amountNum,
                attributes: ['steamId', stat],
                order: [[stat, 'ASC']]
            });
            for (const record of rows) {
                if (!steamIds.includes(record.steamId)) {
                    steamIds.push(record.steamId);
                }
            }
            const users = await User.findAll({
                where: {
                    steamId: steamIds
                }
            });
            const mapperFunc = (item: MissionModel) => {
                return {
                    steamId: item.steamId,
                    hasSupporter: (users.find((user) => user.steamId === item.steamId) ?? { supporter: false }).supporter,
                    value: item.get(stat)
                };
            };
            response.status(200).send({
                success: true,
                stat: stat,
                amount: amountNum,
                total: count,
                items: rows.map(mapperFunc)
            });
            return;
        } else if (stat === 'count') {
            const whereProps: WhereOptions<InferAttributes<MissionModel, {
                omit: never;
            }>> = {
                type: missionType,
                level: missionLevel,
                leaderboardBanned: false
            };
            if (missionId !== undefined) {
                whereProps.missionId = missionId;
            }
            const { count, rows } = await Mission.findAndCountAll({
                where: whereProps,
                limit: amountNum,
                attributes: [
                    'steamId',
                    [Sequelize.fn('COUNT', Sequelize.col('steamId')), stat]
                ],
                group: [
                    'steamId',
                ],
                order: [[stat, 'DESC']]
            });
            const users = await User.findAll({
                where: {
                    steamId: rows.map((item) => item.steamId)
                }
            });
            response.status(200).send({
                success: false,
                stat: stat,
                count: count.length,
                items: rows.map((item) => {
                    return {
                        steamId: item.steamId,
                        hasSupporter: (users.find((user) => user.steamId === item.steamId) ?? { supporter: false }).supporter,
                        value: parseInt(item.get(stat) as string)
                    };
                }),
            });
            return;
        }
    }

    response.status(500).send({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Unknown input issues'
    });
    return;
}
