import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { postgresSequelize } from '../instance';
import { Language } from './language.model';

export const knownItems: { [key: string]: {
    depth: number,
    base: boolean
}} = {};

export const knownCustomItems: { [key: string]: {
    depth: number,
    base: boolean
}} = {};

export interface RecipeData {
    a: string;
    b: string;
    result: string;
    depth: number;
    base: boolean;
    custom: boolean;
    found_by: string;
    reversed: boolean;
}

export interface RecipeModel extends Model<InferAttributes<RecipeModel>, InferCreationAttributes<RecipeModel>>, RecipeData {
    id: CreationOptional<number>;
}

export const Recipe = postgresSequelize?.define<RecipeModel>('RecipeV2', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
    },
    a: DataTypes.TEXT,
    b: DataTypes.TEXT,
    result: DataTypes.TEXT,
    depth: DataTypes.INTEGER,
    base: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    custom: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    found_by: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    reversed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'RecipesV2',
    indexes: [
        {
            name: 'ab_recipe',
            fields: ['a', 'b']
        }
    ]
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
