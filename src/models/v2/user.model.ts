import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';
import { postgresSequelize } from '../instance';

export const defaultUser: (steamId: string) => UserData = (steamId) => {
    return {
        steamId: steamId,
        firstDiscoveries: 0,
        combines: 0,
        generations: 0,
        customCombines: 0,
        customGenerations: 0,
        credits: 100,
        highestDepth: 1,
        customHighestDepth: 1,
        supporter: false,
        generateBanned: false,
        apiBanned: false,
        leaderboardBanned: false
    };
};

export interface UserData {
    steamId: string;
    firstDiscoveries: number;
    combines: number;
    generations: number;
    customCombines: number;
    customGenerations: number;
    credits: number;
    highestDepth: number;
    customHighestDepth: number;
    supporter: boolean;
    generateBanned: boolean;
    apiBanned: boolean;
    leaderboardBanned: boolean;
}

export interface UserModel extends Model<InferAttributes<UserModel>, InferCreationAttributes<UserModel>>, UserData {}

export const User = postgresSequelize?.define<UserModel>('UserV2', {
    steamId: {
        primaryKey: true,
        type: DataTypes.TEXT,
    },
    firstDiscoveries: DataTypes.INTEGER,
    combines: DataTypes.INTEGER,
    generations: DataTypes.INTEGER,
    customCombines: DataTypes.INTEGER,
    customGenerations: DataTypes.INTEGER,
    credits: DataTypes.INTEGER,
    highestDepth: DataTypes.INTEGER,
    customHighestDepth: DataTypes.INTEGER,
    supporter: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    generateBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    apiBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    leaderboardBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'UsersV2'
});
