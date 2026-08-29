'use strict';

const path = require('path');

let instance = null;

class Database {
    static getInstance() {
        if (instance === null) {
            const mysql = require('mysql2/promise');

            const config = require(path.join(__dirname, '..', 'config.js'));

            instance = mysql.createPool({
                host: config.DB_HOST,
                database: config.DB_NAME,
                user: config.DB_USER,
                password: config.DB_PASS,
                charset: 'utf8mb4',
                waitForConnections: true,
                connectionLimit: 10,
                namedPlaceholders: false,
            });
        }
        return instance;
    }
}

module.exports = Database;
