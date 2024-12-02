const joi = require('joi');

const budgetSchema = joi.object({
    category: joi.string()
        .valid(
            'Groceries',
            'Transportation',
            'Medical',
            'Food',
            joi.when('type', { is: 'Credit', then: joi.valid('Savings', 'Salary', 'Returns') })
        )
        .required(),
    amount: joi.number().min(1).max(50000).required(),
    month: joi.number().min(1).max(12).required(),
    year : joi.number().min(2024).max(2100).required()
});

const budgetUpdateSchema = joi.object({
    category: joi.string()
        .valid(
            'Groceries',
            'Transportation',
            'Medical',
            'Food',
            joi.when('type', { is: 'Credit', then: joi.valid('Savings', 'Salary', 'Returns') })
        ),
    amount: joi.number().min(1).max(50000),
    month: joi.number().min(1).max(12),
    year : joi.number().min(2024).max(2100).required()

});

module.exports = { budgetSchema, budgetUpdateSchema };
