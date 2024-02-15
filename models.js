const sequelize = require('./db')
const {DataTypes} = require('sequelize')



const Client = sequelize.define('Client', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    chatId: {type: DataTypes.BIGINT, unique: true},
    checks: {type: DataTypes.INTEGER, defaultValue: 0},
    freeCheck: {type: DataTypes.BOOLEAN, defaultValue: false}
}, {
    timestamps: false,
    tableName: 'Client'
})

module.exports = Client