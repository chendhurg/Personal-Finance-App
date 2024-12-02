
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { ObjectId } = require('mongodb');

const connectToDB = require('../startup/connection');

const { accountSchema, accountupdateSchema } = require('../validation/Account');

router.post('/createAccount', auth, async (req, res) => {
    try {
        const { error } = accountSchema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const userID = new ObjectId(req.user._id);// perform authorization here so that only ht elogged in user can create accounts here 
        const { account_type, balance, account_name } = req.body;

        const connection = await connectToDB();
        const accountCollection = connection.collection('Accounts');

        const existingAccount = await accountCollection.findOne({ userID: userID, account_name: account_name });

        if (existingAccount) return res.status(400).send("account already exists");

        const is_active = true;
        const account = await accountCollection.insertOne({ account_type: account_type, balance, is_active, account_name, userID });
        if (account) return res.send(account);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/findAccount/:id', auth, async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) return res.status(400).send("Invalid Account ID");//change this to a logic where all the account ids are checked and not the object id alone

        const userID = req.user._id;
        const connection = await connectToDB();

        const accountCollection = connection.collection('Accounts');
        const account = await accountCollection.findOne({ _id: new ObjectId(req.params.id) });//use findbyid

        

        if (!account) return res.status(404).send("account not found");

        if (account.userID.toString() !== userID.toString()) return res.status(403).send("Unauthorized Access");

        res.send(account);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.put('/updateAccount/:id', auth, async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) return res.status(400).send("Invalid Account ID");//same check for only the account id 

        const { error } = accountupdateSchema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const userID = req.user._id;

        const connection = await connectToDB();
        const accountCollection = connection.collection('Accounts');

        const existingAccount = await accountCollection.findOne({ _id: new ObjectId(req.params.id) });//use findbyid


        if (!existingAccount) return res.status(404).send("account not found");

        if (existingAccount.userID.toString() !== userID.toString()) return res.status(403).send("Unauthorized Access");


        if (!existingAccount.is_active) return res.status(400).send("Cannot update inactive account");

        const updatedAccount = await accountCollection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body },
            { returnDocument: 'after' }
        );

        res.send(updatedAccount);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.put('/deleteAccount/:id', auth, async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) return res.status(400).send("Invalid Account ID");//check only for the account id 

        const connection = await connectToDB();
        const userID = req.user._id;
        const accountCollection = connection.collection('Accounts');

        const account = await accountCollection.findOne({ _id: new ObjectId(req.params.id) });


        if (!account) return res.status(404).send("account not found");

        if (account.userID.toString() !== userID.toString()) return res.status(403).send("Unauthorized Access");


        const updatedAccount = await accountCollection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: { isActive: false } },
            { returnDocument: 'after' }
        );

        res.send("Account closed successfully");// after this if the account is already closed then return the error message as there is no account under this id anymore 
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/findUserAccount', auth, async (req, res) => {
    try {
        const userID = req.user._id;

        if (!ObjectId.isValid(new ObjectId(userID))) return res.status(400).send("Invalid User ID");//change for only account id , perofrm authorization

        const connection = await connectToDB();

        const accountCollection = connection.collection('Accounts');
        const accounts = await accountCollection.find({ userID: userID }).toArray();

        if (accounts.length === 0) return res.status(404).send("No accounts were found");// not needed use the alternative

        return res.status(200).json({
            accounts
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;