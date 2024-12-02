const express = require('express');
const user = require('../routes/Users');
const auth = require('../middlewares/auth');
const accounts = require('../routes/Accounts');
const transactions = require('../routes/Transactions');
const budgets = require('../routes/Budgets');
const reports = require('../routes/Reports');


module.exports = function (app) {
    console.log('routes');
    app.use('/api/users', user);
    app.use('/api/auth', auth);
    app.use('/api/accounts', accounts);
    app.use('/api/transactions', transactions);
    app.use('/api/budgets', budgets);
    app.use('/api/reports', reports);
}