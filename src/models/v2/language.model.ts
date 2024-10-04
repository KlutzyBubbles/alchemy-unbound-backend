import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';
import { postgresSequelize } from '../instance';

export interface LanguagePublicProps {
    name: string;
    english: string;
    japanese: string;
    schinese: string;
    french: string;
    russian: string;
    spanish: string;
    indonesian: string;
    german: string;
    latam: string;
    italian: string;
    dutch: string;
    polish: string;
    portuguese: string;
    tchinese: string;
    koreana: string;
    emoji: string;
}

export interface LanguageModel extends Model<InferAttributes<LanguageModel>, InferCreationAttributes<LanguageModel>>, LanguagePublicProps {
    who_discovered: string;
    tokens: number;
}

export const Language = postgresSequelize?.define<LanguageModel>('LanguageV2', {
    name: {
        primaryKey: true,
        type: DataTypes.TEXT,
    },
    english: DataTypes.TEXT,
    japanese: DataTypes.TEXT,
    schinese: DataTypes.TEXT,
    french: DataTypes.TEXT,
    russian: DataTypes.TEXT,
    spanish: DataTypes.TEXT,
    indonesian: DataTypes.TEXT,
    german: DataTypes.TEXT,
    latam: DataTypes.TEXT,
    italian: DataTypes.TEXT,
    dutch: DataTypes.TEXT,
    polish: DataTypes.TEXT,
    portuguese: DataTypes.TEXT,
    tchinese: DataTypes.TEXT,
    koreana: DataTypes.TEXT,
    emoji: DataTypes.TEXT,
    who_discovered: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    tokens: DataTypes.INTEGER,
}, {
    tableName: 'LanguagesV2',
    indexes: [
        {
            unique: true,
            fields: ['name']
        }
    ]
});
