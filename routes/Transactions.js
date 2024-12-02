const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { ObjectId } = require('mongodb');

const connectToDB = require('../startup/connection');

const { transactionSchema, transactionUpdateSchema } = require('../validation/Transaction');

router.post('/doTransaction', auth, async (req, res) => {
    try {
        const { error } = transactionSchema.validate(req.body);

        if (error) return res.status(400).send(error.details[0].message);

        const { accountID, Type, Category, Amount } = req.body;

        if (!ObjectId.isValid(new ObjectId(accountID))) return res.status(400).send("Enter the valid account number");

        const connection = await connectToDB();
        const userID = req.user._id;
        const accountCollection = connection.collection('Accounts');
        const transactionCollection = connection.collection('Transactions');
        const account = await accountCollection.findOne({ _id: new ObjectId(accountID) });

        if (account.userID.toString() !== userID.toString()) return res.status(403).send("Unauthorized Access");
        if (!account) return res.status(404).send("account not found");

        if (!account.isActive) return res.status(400).send("The account is inactive");

        let newBalance = account.Balance;

        if (Type === 'Credit') {
            newBalance += Amount;
        }
        else if (Type === 'Debit') {
            if (newBalance < Amount) {
                return res.status(400).send('Insufficient Balance');
            }
            newBalance -= Amount;
        }

        const updatedAccount = await accountCollection.updateOne(
            { _id: new ObjectId(accountID) },
            { $set: { Balance: newBalance } }
        );

        if (updatedAccount.modifiedCount === 0) return res.status(400).send("unable to update the account balance");

        const transaction = {
            accountID: new ObjectId(accountID),
            userID: new ObjectId(userID),
            Type,
            Amount,
            Category,
            date: new Date()
        };

        const transactionresult = await transactionCollection.insertOne(transaction);

        res.status(200).json({
            message: "transaction successful",
            newBalance
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/findTransaction/:id', auth, async (req, res) => {
    try {
        if (!ObjectId.isValid(new ObjectId(req.params.id))) return res.status(400).send("Enter the valid Transaction ID");

        const connection = await connectToDB();
        const transactionCollection = connection.collection('Transactions');
        const userID = req.user._id;

        const transaction = await transactionCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!transaction) {
            return res.status(404).send("Transaction not found");
        }
        if (transaction.userID.toString() !== userID.toString()) {
            return res.status(403).send("Unauthorized Access.");
        }

        res.send(transaction);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/findUserTransaction', auth, async (req, res) => {
    try {
        const connection = await connectToDB();
        const transactionCollection = connection.collection('Transactions');
        const userID = req.user._id;

        const transactions = await transactionCollection.find({ userID: new ObjectId(userID) }).toArray();

        if (transactions.length === 0) return res.status(404).send("No transactions found for this user");

        res.send(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.put('/updateTransaction/:id', auth, async (req, res) => {
    try {
        if (!ObjectId.isValid(new ObjectId(req.params.id))) return res.status(400).send("Enter the valid Transaction ID");

        const { error } = transactionUpdateSchema.validate(req.body);

        if (error) return res.status(400).send(error.details[0].message);

        const connection = await connectToDB();
        const transactionCollection = connection.collection('Transactions');
        const accountCollection = connection.collection('Accounts');
        const userID = req.user._id;

        const existingTransaction = await transactionCollection.findOne({ _id: new ObjectId(req.params.id) });

        if (!existingTransaction) return res.status(404).send("Transaction not found");

        const newAmount = req.body.Amount;
        if (newAmount !== undefined && newAmount !== existingTransaction.Amount) {
            const amountDifference = newAmount - existingTransaction.Amount;

            if (existingTransaction.Type === 'Debit') {
                amountDifference *= -1;
            }

            const updatedAccount = await accountCollection.findOneAndUpdate(
                { _id: new ObjectId(existingTransaction.accountID) },
                { $inc: { Balance: amountDifference } },
                { returnDocument: 'after' }
            );
            if (!updatedAccount) return res.status(400).send("Failed to update account balance");
        }

        const updatedTransaction = await transactionCollection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body },
            { returnDocument: 'after' }
        );

        res.send(updatedTransaction);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
