import { Model, InferAttributes, InferCreationAttributes, DataTypes, CreationOptional } from 'sequelize';
import { postgresSequelize } from '../instance';

export interface TransactionData {
    steamId: string;
    status: string;
    itemId: number;
    transactionId: string;
}

export interface TransactionModel extends Model<InferAttributes<TransactionModel>, InferCreationAttributes<TransactionModel>>, TransactionData {
    id: CreationOptional<number>;
}

export const Transaction = postgresSequelize?.define<TransactionModel>('TransactionV2', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
    },
    steamId: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    status: {
        type: DataTypes.TEXT,
        defaultValue: 'WAITING'
    },
    itemId: DataTypes.INTEGER,
    transactionId: {
        type: DataTypes.TEXT,
        defaultValue: ''
    }
}, {
    tableName: 'TransactionsV2',
    indexes: [
        {
            name: 'transactionId',
            fields: ['transactionId']
        }
    ]
});
