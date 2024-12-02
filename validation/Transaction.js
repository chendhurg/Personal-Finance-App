const joi = require('joi');

const transactionSchema = joi.object({
    accountID: joi.string().length(24).required(),
    Type: joi.string().valid('Credit', 'Debit').required(),
    Category: joi.string()
        .valid(
            'Groceries',
            'Transportation',
            'Medical',
            'Food',
            'Savings',
            joi.when('Type', { is: 'Credit', then: joi.valid('Salary', 'Returns') })
        )
        .required(),
    Amount: joi.number().min(1).max(50000).required()
});

const transactionUpdateSchema = joi.object({
    accountID: joi.string().length(24),
    Type: joi.string().valid('Credit', 'Debit'),
    Category: joi.string()
        .valid(
            'Groceries',
            'Transportation',
            'Medical',
            'Food',
            'Savings',
            joi.when('Type', { is: 'Credit', then: joi.valid('Salary', 'Returns') })
        ),
    Amount: joi.number().min(1).max(50000)
});

module.exports = { transactionSchema, transactionUpdateSchema };
