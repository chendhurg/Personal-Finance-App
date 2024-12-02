const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const connectToDB = require('../startup/connection');
const jwt = require('jsonwebtoken');
const config = require('config');

const { signupSchema, loginSchema } = require('../validation/User');

router.post('/signup', async (req, res) => {
    try {
        const { error } = signupSchema.validate(req.body);
        if (error) {
            return res.status(400).send(error.message);
        }

        const { name, email, password } = req.body;
        const connection = await connectToDB();
        const usersCollection = connection.collection('users');
        const existingUser = await usersCollection.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send("Account with the email already exists");
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await usersCollection.insertOne({ name: name, email: email, password: hashedPassword });

        const token = jwt.sign({
            _id: result.insertedId, email: email
        },
            config.get('jwtprivatekey'),
            { expiresIn: '12h' }
        );

        res.header('x-auth-token', token).send('Signup successful');
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/login', async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) return res.status(400).send('Invalid credentials');

        const { email, password } = req.body;
        const connection = await connectToDB();
        const usersCollection = connection.collection('users');

        const user = await usersCollection.findOne({ email });
        if (!user) return res.status(400).send('Invalid username or password');

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).send('Invalid username or password');

        const token = jwt.sign(
            { _id: user._id, email: user.email },
            config.get('jwtprivatekey'),
            { expiresIn: '12h' }
        );

        res.header('x-auth-token', token).send('Login successful');
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
