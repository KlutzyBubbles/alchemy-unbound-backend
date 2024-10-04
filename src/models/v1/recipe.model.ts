import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { postgresSequelize } from '../instance';
import { Language } from './language.model';

export const knownItems: { [key: string]: number } = {};

export interface RecipeData {
    a: string;
    b: string;
    result: string;
    depth: number;
    who_discovered: string;
    base: boolean;
}

export interface RecipeModel extends Model<InferAttributes<RecipeModel>, InferCreationAttributes<RecipeModel>>, RecipeData {
    id: CreationOptional<number>;
}

export const Recipe = postgresSequelize?.define<RecipeModel>('Recipe', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
    },
    a: DataTypes.TEXT,
    b: DataTypes.TEXT,
    result: DataTypes.TEXT,
    depth: DataTypes.INTEGER,
    who_discovered: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    base: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'Recipes',
});

if (Recipe !== undefined && Language !== undefined) {
    Recipe.belongsTo(Language, {
        foreignKey: 'result'
    });
    Language.hasMany(Recipe, {
        foreignKey: 'result',
        sourceKey: 'name'
    });
}
