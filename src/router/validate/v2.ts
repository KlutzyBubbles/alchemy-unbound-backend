import { Response } from 'express';
import { knownItems } from '../../models/v2/recipe.model';
import { Op } from 'sequelize';
import { Language } from '../../models/v2/language.model';
import { TokenedRequestV2 } from '../../middleware/steam';
import { ErrorCode } from '../../types';
import { excludeProps, undefinedErrorFormat } from '../../helpers';

export async function validatePostV2(request: TokenedRequestV2, response: Response) {

    const items: string[] | undefined = request.body.items as string[] | undefined;
    const steamId = request.steamId;
    
    if (items === undefined) {
        response.status(400).send({
            code: ErrorCode.QUERY_UNDEFINED,
            message: 'Query parameters are undefined',
            fields: undefinedErrorFormat({
                items,
                steamId
            })
        });
        return;
    }

    if (steamId === undefined) {
        response.status(400).send({
            code: ErrorCode.NOT_AUTHENTICATED,
            message: 'User needs to be authenticated',
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
    const languages = [];
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
            languages.push(excludeProps(found.toJSON(), ['who_discovered', 'createdAt', 'updatedAt']));
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
        items: output,
        languages: languages
    });
    return;
}
