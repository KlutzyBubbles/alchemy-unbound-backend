import { Model, InferAttributes, InferCreationAttributes, DataTypes, CreationOptional } from 'sequelize';
import { postgresSequelize } from '../instance';

export interface MissionData {
    steamId: string;
    points: number;
    combines: number;
    level: string;
    type: string;
    missionId: number;
    leaderboardBanned: boolean;
}

export interface MissionModel extends Model<InferAttributes<MissionModel>, InferCreationAttributes<MissionModel>>, MissionData {
    id: CreationOptional<number>;
}

export const Mission = postgresSequelize?.define<MissionModel>('MissionV2', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
    },
    steamId: DataTypes.TEXT,
    points: DataTypes.INTEGER,
    combines: DataTypes.INTEGER,
    level: DataTypes.TEXT,
    type: DataTypes.TEXT,
    missionId: DataTypes.INTEGER,
    leaderboardBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'MissionV2'
});
