import { Response } from 'express';
import routes from '../../index';
import { query } from 'express-validator';
import { filterLanguages } from '../../../language';
import asyncHandler from 'express-async-handler';
import { Language, LanguageModel } from '../../../models/v2/language.model';
import { validationMiddleware } from '../../../middleware/validation';
import { HerokuRequest } from '../../../middleware/requestId';
import { ErrorCode } from '../../../types';
import cl100k_base from 'gpt-tokenizer/cjs/encoding/cl100k_base';

routes.get('/fill-language/v2',
    query('name').trim().escape().isString(),
    query('english').trim().escape().isString(),
    query('japanese').trim().escape().isString(),
    query('schinese').trim().escape().isString(),
    query('french').trim().escape().isString(),
    query('russian').trim().escape().isString(),
    query('spanish').trim().escape().isString(),
    query('indonesian').trim().escape().isString(),
    query('german').trim().escape().isString(),
    query('latam').trim().escape().isString(),
    query('italian').trim().escape().isString(),
    query('dutch').trim().escape().isString(),
    query('polish').trim().escape().isString(),
    query('portuguese').trim().escape().isString(),
    query('tchinese').trim().escape().isString(),
    query('koreana').trim().escape().isString(),
    query('emoji').trim().escape().isString(),
    validationMiddleware,
    asyncHandler(async (request: HerokuRequest, response: Response) => {

        if (Language === undefined) {
            response.status(500).send({
                code: ErrorCode.UNKNOWN_ERROR,
                message: 'Database issues :/'
            });
            return;
        }

        let language: LanguageModel | undefined = undefined;
        try {
            const resultLanguage = await Language.findOne({
                where: {
                    name: `${request.query.name}`
                },
            });
            if (resultLanguage !== null) {
                language = resultLanguage;
            } else {
                const encoded = cl100k_base.encode(request.query.name as string);
                const newLanguage = await Language.create({
                    name: `${request.query.name}`,
                    english: `${request.query.english}`,
                    japanese: `${request.query.japanese}`,
                    schinese: `${request.query.schinese}`,
                    french: `${request.query.french}`,
                    russian: `${request.query.russian}`,
                    spanish: `${request.query.spanish}`,
                    indonesian: `${request.query.indonesian}`,
                    german: `${request.query.german}`,
                    latam: `${request.query.latam}`,
                    italian: `${request.query.italian}`,
                    dutch: `${request.query.dutch}`,
                    polish: `${request.query.polish}`,
                    portuguese: `${request.query.portuguese}`,
                    tchinese: `${request.query.tchinese}`,
                    koreana: `${request.query.koreana}`,
                    who_discovered: '',
                    tokens: encoded.length,
                    emoji: `${request.query.emoji}`,
                });
                language = newLanguage;
            }
        } catch(e) {
            console.error('Failed to generate new element', e, { requestId: request.requestId });
            response.status(500).send({
                code: 500,
                message: 'Failed to generate a new element, please try again later (AI Busy)'
            });
            return;
        }
        if (language === undefined) {
            try {
                const foundLanguage = await Language.findOne({
                    where: {
                        name: `${request.query.name}`
                    },
                });
                if (foundLanguage === null) {
                    throw new Error('Language model found is null');
                }
                language = foundLanguage;
            } catch (e) {
                console.error('Language is missing when it shouldnt be', e, { requestId: request.requestId });
                response.status(500).send({
                    code: 500,
                    message: 'Failed to generate a new element, please try again later (Language Issue)'
                });
                return;
            }
        }
        console.log('200', language.name);
        response.status(200).send({
            ...filterLanguages(language),
            emoji: language.emoji,
        });
        return;
    }));
