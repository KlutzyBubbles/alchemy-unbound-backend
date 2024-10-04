import { Response } from 'express';
import { isNumeric } from '../../helpers';
import { Recipe, RecipeData, RecipeModel, knownItems } from '../../../models/v2/recipe.model';
import { Op } from 'sequelize';
import { MAX_DEPTH, MissionPoints, WeeklyMultiplier } from '../../../constants';
import { Language, LanguageModel, LanguagePublicProps } from '../../../models/v2/language.model';
import { TokenedRequestV2 } from '../../../middleware/steam';
import { ErrorCode, ErrorResponse, MissionLogResponse, MissionResponse } from '../../../types';
import { Weekly, WeeklyModel } from '../../../models/v2/weekly.model';
import { Daily, DailyModel } from '../../../models/v2/daily.model';
import { Mission } from '../../../models/v2/mission.model';
import { excludeProps, undefinedErrorFormat } from '../../../helpers';
import { getFormattedDate, getFormattedDateEnd, getMonday } from '../../../schedules/helpers';

export async function missionCheckV2(request: TokenedRequestV2, response: Response<ErrorResponse | MissionLogResponse>) {
    const a: string | undefined = request.query.a as string | undefined;
    const b: string | undefined = request.query.b as string | undefined;
    const result: string | undefined = request.query.result as string | undefined;
    const type: string | undefined = request.query.type as string | undefined;
    const combines: string | undefined = request.query.combines as string | undefined;
    const steamId = request.steamId;
    const user = request.user;

    if (a === undefined || b === undefined || result === undefined || type === undefined || combines === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined',
            fields: undefinedErrorFormat({
                a,
                b,
                result,
                type,
                steamId,
                user,
                combines
            })
        });
        return;
    }

    if (steamId === undefined || user === undefined) {
        response.status(400).send({
            code: ErrorCode.NOT_AUTHENTICATED,
            message: 'User needs to be authenticated',
        });
        return;
    }
    
    if (!['weekly', 'daily'].includes(type)) {
        response.status(400).send({
            code: ErrorCode.QUERY_INVALID,
            message: 'Type needs to be daily or weekly'
        });
        return;
    }

    if (isNumeric(a)) {
        response.status(400).send({
            code: ErrorCode.AB_NUMBER,
            message: 'A Input is a number, this is not allowed'
        });
        return;
    }

    if (isNumeric(b)) {
        response.status(400).send({
            code: ErrorCode.AB_NUMBER,
            message: 'B Input is a number, this is not allowed'
        });
        return;
    }

    if (!isNumeric(combines)) {
        response.status(400).send({
            code: ErrorCode.QUERY_INVALID,
            message: 'Combines Input is not a number, this is not allowed'
        });
        return;
    }

    let itemsKnown = false;
    if (Object.keys(knownItems).includes(a) && Object.keys(knownItems).includes(b)) {
        itemsKnown = true;
    } else {
        if (!Object.keys(knownItems).includes(a)) {
            const aExists = Recipe === undefined ? null : await Recipe.findOne({
                where: {
                    result: a
                },
                attributes: ['result', 'depth']
            });
            if (aExists !== null) {
                knownItems[aExists.result] = {
                    depth: aExists.depth,
                    base: aExists.base
                };
            }
        }
        if (!Object.keys(knownItems).includes(b)) {
            const bExists = Recipe === undefined ? null : await Recipe.findOne({
                where: {
                    result: b
                },
                attributes: ['result', 'depth', 'base']
            });
            if (bExists !== null) {
                knownItems[bExists.result] = {
                    depth: bExists.depth,
                    base: bExists.base
                };
            }
        }
        if (Object.keys(knownItems).includes(a) && Object.keys(knownItems).includes(b)) {
            itemsKnown = true;
        }
    }
    if (itemsKnown === false) {
        response.status(400).json({
            code: ErrorCode.AB_NOT_KNOWN,
            message: 'Requested a/b are not known'
        });
        return;
    }

    if (knownItems[a].depth > MAX_DEPTH || knownItems[b].depth > MAX_DEPTH) {
        response.status(400).send({
            code: ErrorCode.MAX_DEPTH,
            message: 'Max depth, maybe diversify your holdings'
        });
        return;
    }

    if (Recipe === undefined || Language === undefined || Daily === undefined || Weekly === undefined || Mission === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Database issues :/'
        });
        return;
    }

    const recipe: RecipeModel | RecipeData | null = await Recipe.findOne({
        where: {
            [Op.or]: [{
                a: a,
                b: b
            }, {
                a: b,
                b: a
            }]
        }
    });
    if (recipe === null) {
        response.status(500).send({
            code: ErrorCode.QUERY_INVALID,
            message: 'Recipe doesnt match'
        });
        return;
    }
    let mission: WeeklyModel | DailyModel | undefined = undefined;
    try {
        const foundMission: WeeklyModel | DailyModel | null = await getMission(type as 'weekly' | 'daily');
        if (foundMission === null) {
            response.status(500).send({
                code: ErrorCode.ITEM_UNKNOWN,
                message: 'No missions available'
            });
            return;
        }
        mission = foundMission;
    } catch (error) {
        if (error instanceof Error && error.message !== undefined && error.message.includes('too many connections')) {
            console.error('Too many database connections', error.message, { requestId: request.requestId });
        }
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to find mission'
        });
        return;
    }
    if (mission.easy !== result && mission.medium !== result && mission.hard !== result && mission.random !== result) {
        response.status(500).send({
            code: ErrorCode.ITEM_UNKNOWN,
            message: 'Result not currently a mission'
        });
        return;
    }
    let level = '';
    if (mission.easy === result) {
        level = 'easy';
    } else if (mission.medium === result) {
        level = 'medium';
    } else if (mission.hard === result) {
        level = 'hard';
    } else if (mission.random === result) {
        level = 'random';
    }
    if (level === '') {
        response.status(500).send({
            code: ErrorCode.ITEM_UNKNOWN,
            message: 'Result not currently a mission (unknown item)'
        });
        return;
    }


    const missionLogs = await Mission.findAll({
        where: {
            missionId: mission.id,
            type: type,
            steamId: steamId
        }
    });
    let hasCompleted = false;
    for (const log of missionLogs) {
        if (log.level === level) {
            hasCompleted = true;
            break;
        }
    }
    if (hasCompleted) {
        response.status(500).send({
            code: ErrorCode.ALREADY_COMPLETED,
            message: 'You have already completed this mission'
        });
        return;
    }

    if (recipe.result !== mission[level as keyof WeeklyModel | keyof DailyModel]) {
        response.status(500).send({
            code: ErrorCode.QUERY_INVALID,
            message: 'Result doesnt match mission'
        });
        return;
    }

    let points = MissionPoints[level] ?? 5;
    if (type === 'weekly') {
        points *= WeeklyMultiplier;
    }

    await Mission.create({
        steamId: steamId,
        points: points,
        level: level,
        type: type,
        missionId: mission.id,
        combines: parseInt(combines),
        leaderboardBanned: user.leaderboardBanned
    });

    user.credits += points;
    await user.save();

    response.status(200).send({
        success: true,
        points: points,
        level: level
    });
    return;
}

export async function missionGetV2(request: TokenedRequestV2, response: Response<ErrorResponse | MissionResponse>) {
    const type = request.params.type;

    if (type === undefined || !['daily', 'weekly'].includes(type)) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined or invalid',
            fields: undefinedErrorFormat({
                type,
            })
        });
        return;
    }

    if (Daily === undefined || Language === undefined) {
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Database issues :/'
        });
        return;
    }

    try {
        const foundMission: WeeklyModel | DailyModel | null = await getMission(type as 'daily' | 'weekly');
        if (foundMission === null) {
            response.status(500).send({
                code: ErrorCode.ITEM_UNKNOWN,
                message: 'No missions available'
            });
            return;
        }
        const list = [
            foundMission.easy,
            foundMission.medium,
            foundMission.hard,
            foundMission.random
        ];
        const languages = await getLanguagesFor(list);
        const output: LanguagePublicProps[] = [];
        for (const found of languages) {
            if (list.includes(found.name)) {
                output.push(excludeProps(found.toJSON(), ['who_discovered', 'createdAt', 'updatedAt', 'tokens']));
            }
        }
        if (languages.length !== 4) {
            response.status(500).send({
                code: ErrorCode.TRANSLATION_ERROR,
                message: 'Unable to find language for mission'
            });
            return;
        }
        const result: Partial<MissionResponse> = {
            success: true,
            id: foundMission.id,
            expires: foundMission.expires.valueOf(),
            easy: output.find((item) => item.name === foundMission.easy),
            medium: output.find((item) => item.name === foundMission.medium),
            hard: output.find((item) => item.name === foundMission.hard),
            random: output.find((item) => item.name === foundMission.random)
        };

        if (result.easy === undefined || result.medium === undefined || result.hard === undefined || result.random === undefined) {
            response.status(500).send({
                code: ErrorCode.TRANSLATION_ERROR,
                message: 'Unable to find language for mission'
            });
            return;
        }
        response.status(200).send(result as MissionResponse);
        return;
    } catch (error) {
        if (error instanceof Error && error.message !== undefined && error.message.includes('too many connections')) {
            console.error('Too many database connections', error.message, { requestId: request.requestId });
        }
        response.status(500).send({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to find mission'
        });
        return;
    }
}

async function getLanguagesFor(results: string[]): Promise<LanguageModel[]> {
    if (Language === undefined) {
        return [];
    }

    return Language.findAll({
        where: {
            name: {
                [Op.in]: results
            }
        }
    });
}

async function getMission(type: 'weekly' | 'daily'): Promise<DailyModel | WeeklyModel | null> {
    if (Weekly === undefined || Daily === undefined) {
        return null;
    }
    let start = getFormattedDate(new Date(new Date().getTime() + ((type === 'weekly' ? 7 : 1) * 24 * 60 * 60 * 1000)));

    // Used for testing 60 second turnover
    // let start = getFormattedDate(new Date(new Date().getTime() + (60 * 1000)));
    if (type === 'weekly') {
        start = getMonday(start).getTime();
    }
    const end = getFormattedDateEnd(new Date(start));
    return (type === 'weekly' ? Weekly : Daily).findOne({
        where: {
            expires: {
                [Op.between]: [start, end]
            }
        }
    });
}

// Used for testing 60 second turnover
// function getFormattedDate(date: Date): number {
//     return date.setUTCSeconds(0, 0);
// }
// 
// function getFormattedDateEnd(date: Date): number {
//     return date.setUTCSeconds(59, 999);
// }
