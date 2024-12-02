const joi = require('joi');

const accountSchema = joi.object({
    account_type : joi.string().valid('Savings','Checking','Credit').required(),
    balance : joi.number().min(1).required(),
    account_name : joi.string().min(5).max(20).required()
});

const accountupdateSchema = joi.object({
    account_type : joi.string().valid('Savings','Checking','Credit'),
    balance : joi.number().min(1),
    account_name : joi.string().min(5).max(20)
});



module.exports = { accountSchema,accountupdateSchema };