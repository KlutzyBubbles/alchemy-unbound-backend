import { Model, InferAttributes, InferCreationAttributes, DataTypes, CreationOptional } from 'sequelize';
import { postgresSequelize } from '../instance';

export interface DailyData {
    expires: Date;
    easy: string;
    medium: string;
    hard: string;
    random: string;
}

export interface DailyModel extends Model<InferAttributes<DailyModel>, InferCreationAttributes<DailyModel>>, DailyData {
    id: CreationOptional<number>;
}

export const Daily = postgresSequelize?.define<DailyModel>('DailyV2', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
    },
    expires: DataTypes.DATE,
    easy: DataTypes.TEXT,
    medium: DataTypes.TEXT,
    hard: DataTypes.TEXT,
    random: DataTypes.TEXT,
}, {
    tableName: 'DailyV2'
});
