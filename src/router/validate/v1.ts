import { Response } from 'express';
import { knownItems } from '../../models/v1/recipe.model';
import { Op } from 'sequelize';
import { Language } from '../../models/v1/language.model';
import { TokenedRequestV1 } from '../../middleware/steam';
import { ErrorCode } from '../../types';

export async function validatePostV1(request: TokenedRequestV1, response: Response) {

    const items: string[] | undefined = request.body.items as string[] | undefined;
    
    if (items === undefined || request.steamId === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined'
        });
        return;
    }

    if (items.length === 0) {
        response.status(200).send({
            items: []
        });
        return;
    }

    const output = [];
    const moreItems = [];

    for (const input of items) {
        if (Object.keys(knownItems).includes(input)) {
            output.push(input);
            continue;
        } else {
            moreItems.push(input);
        }
    }

    if (moreItems.length === 0) {
        response.status(200).send({
            items: output
        });
        return;
    }
    
    try {
        const foundLanguage = Language === undefined ? [] : await Language.findAll({
            where: {
                name: {
                    [Op.in]: moreItems
                }
            },
        });

        for (const found of foundLanguage) {
            output.push(found.name);
        }
    } catch (e) {
        console.error('Failed to find languages', e, { requestId: request.requestId });
        response.status(500).send({
            code: 500,
            message: 'Failed to find languages, try again later'
        });
        return;
    }

    response.status(200).send({
        items: output
    });
    return;
}
