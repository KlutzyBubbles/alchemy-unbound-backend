import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';
import { postgresSequelize } from '../instance';

export interface LanguageModel extends Model<InferAttributes<LanguageModel>, InferCreationAttributes<LanguageModel>> {
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

export const Language = postgresSequelize?.define<LanguageModel>('Language', {
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
    emoji: DataTypes.TEXT
}, {
    tableName: 'Languages',
    indexes: [
        {
            unique: true,
            fields: ['name']
        }
    ]
});
