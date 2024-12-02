const joi = require('joi');


const incomeExpenseSchema = joi.object({
    year: joi.number().required(),
    month: joi.number().required(),
    category: joi.string().valid('Groceries', 'Transportation', 'Medical', 'Food', 'Savings', 'Salary', 'Returns'),
    type: joi.string().valid('Credit', 'Debit')
});

const trendSchema = joi.object({
    year: joi.date().required(),
    month: joi.date().required(),
    category: joi.string().valid('Groceries', 'Transportation', 'Medical', 'Food', 'Savings', 'Salary', 'Returns'),
    type: joi.string().valid('Credit', 'Debit')
});



module.exports = { incomeExpenseSchema, trendSchema };