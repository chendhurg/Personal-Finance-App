const joi = require('joi');


const signupSchema  = joi.object({
    name : joi.string().min(8).max(20).required(),
    email : joi.string().min(4).max(20).required().email(),
    password : joi.string().min(8).max(20).pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])")).required()

});


const loginSchema = joi.object({
    email : joi.string().min(4).max(20).required().email(),
    password : joi.string().min(8).max(20).pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])")).required()
});

module.exports = {
    signupSchema,
    loginSchema
};