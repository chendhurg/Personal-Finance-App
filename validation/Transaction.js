const joi = require('joi');

const transactionSchema = joi.object({
    accountID: joi.string().length(24).required(),
    type: joi.string().valid('Credit', 'Debit').required(),
    category: joi.string()
        .valid(
            'Groceries',
            'Transportation',
            'Medical',
            'Food',
            'Savings',
            joi.when('type', { is: 'Credit', then: joi.valid('Salary', 'Returns') })
        )
        .required(),
    amount: joi.number().min(1).max(50000).required()
});

const transactionUpdateSchema = joi.object({
    accountID: joi.string().length(24),//change to accept only the valid objectid
    type: joi.string().valid('Credit', 'Debit'),
    category: joi.string()
        .valid(
            'Groceries',
            'Transportation',
            'Medical',
            'Food',
            'Savings',
            joi.when('type', { is: 'Credit', then: joi.valid('Salary', 'Returns') })
        ),
    amount: joi.number().min(1).max(50000)
});

module.exports = { transactionSchema, transactionUpdateSchema };
