import { Model, InferAttributes, InferCreationAttributes, DataTypes, CreationOptional } from 'sequelize';
import { postgresSequelize } from '../instance';

export interface WeeklyData {
    expires: Date;
    easy: string;
    medium: string;
    hard: string;
    random: string;
}

export interface WeeklyModel extends Model<InferAttributes<WeeklyModel>, InferCreationAttributes<WeeklyModel>>, WeeklyData {
    id: CreationOptional<number>;
}

export const Weekly = postgresSequelize?.define<WeeklyModel>('WeeklyV2', {
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
    tableName: 'WeeklyV2'
});
