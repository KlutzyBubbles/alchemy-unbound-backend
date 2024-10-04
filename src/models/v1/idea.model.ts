import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { postgresSequelize } from '../instance';

export interface IdeaData {
    a: string;
    b: string;
    result: string;
    suggested: string;
}

export interface IdeaModel extends Model<InferAttributes<IdeaModel>, InferCreationAttributes<IdeaModel>>, IdeaData {
    id: CreationOptional<number>;
}

export const Idea = postgresSequelize?.define<IdeaModel>('Idea', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
    },
    a: DataTypes.TEXT,
    b: DataTypes.TEXT,
    result: DataTypes.TEXT,
    suggested: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
}, {
    tableName: 'Ideas',
});
