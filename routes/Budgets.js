const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { ObjectId } = require('mongodb');

const connectToDB = require('../startup/connection');
const { budgetSchema, budgetUpdateSchema } = require('../validation/Budget');

router.post('/createBudget', auth, async (req, res) => {
    try {
        const { error } = budgetSchema.validate(req.body);
        if (error) return res.status(400).send(error.message);

        const { category, amount, month, year } = req.body;

        const connection = await connectToDB();

        const budgetCollection = connection.collection('Budgets');

        const userID = req.user._id;//perform authorization here

        const existingBudget = await budgetCollection.findOne({//findone by id
            category: category,
            amount: amount,
            month: month,
            userID: new ObjectId(userID),
            year : year
        });

        if (existingBudget) return res.status(400).send("The budget with the same credentials already exists");

        const newBudget = {
            category,
            amount,
            month,
            userID: new ObjectId(userID),//use uuid as the alternative here
            year, 
            date: new Date()
        }

        const budgetResult = await budgetCollection.insertOne(newBudget);

        res.send(newBudget);//response must be a object strictly
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/getAllBudgets', auth, async (req, res) => {
    try {
        const userID = req.user._id;//perform authorization here too
        const connection = await connectToDB();
        const budgetCollection = connection.collection('Budgets');

        const budgets = await budgetCollection.find({ userID: new ObjectId(userID) }).toArray();

        if (budgets.length === 0) {
            return res.status(404).send("No budgets found for this user.");// not needed remove and find alternative
        }

        return res.status(200).json(budgets);
    } catch (err) {
        console.error("Error fetching budgets:", err.message);
        return res.status(500).send("Internal Server Error");
    }
});

router.get('/getBudgetById/:id', auth, async (req, res) => {
    try {
        const userID = req.user._id;
        const budgetID = req.params.id;

        if (!ObjectId.isValid(new ObjectId(budgetID))) {
            return res.status(400).send("Invalid Budget ID format");//check only the budget id
        }

        const connection = await connectToDB();
        const budgetCollection = connection.collection('Budgets');

        const budget = await budgetCollection.findOne({//use findonebyid 
            _id: new ObjectId(budgetID),
            userID: new ObjectId(userID)//use uuid
        });

        if (!budget) {
            return res.status(404).send("Budget not found");
        }

        return res.status(200).json(budget);
    } catch (err) {
        console.error("Error fetching budget:", err.message);
        return res.status(500).send("Internal Server Error");
    }
});

router.put('/updateBudget/:id', auth, async (req, res) => {
    try {
        const userID = req.user._id;//perform the authorization here 
        const budgetID = req.params.id;

        if (!ObjectId.isValid(budgetID)) {
            return res.status(400).send("Invalid Budget ID format");//use this only foir budget id 
        }

        const { error } = budgetUpdateSchema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const connection = await connectToDB();
        const budgetCollection = connection.collection('Budgets');

        const existingBudget = await budgetCollection.findOne({//findbyid
            _id: new ObjectId(budgetID),
            userID: new ObjectId(userID)//uuid
        });

        if (!existingBudget) {
            return res.status(404).send("Budget not found");
        }

        const updatedBudget = await budgetCollection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body },
            { returnDocument: 'after' }
        );

        if (updatedBudget.modifiedCount === 0) {
            return res.status(400).send("Failed to update the budget");
        }

        return res.status(200).send(updatedBudget);//response object
    } catch (err) {
        console.error("Error updating budget:", err.message);
        return res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
