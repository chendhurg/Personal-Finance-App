const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { ObjectId } = require('mongodb');

const connectToDB = require('../startup/connection');
const { incomeExpenseSchema, trendSchema } = require('../validation/Report');

router.get('/getIncomeExpenseReport', auth, async (req, res) => {
    try {
        const { error } = incomeExpenseSchema.validate(req.query);
        if (error) return res.status(400).send(error);

        const { year, month, category, type } = req.query;
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        if (start > end) return res.status(400).send("Start date cannot be higher than the End date");

        const connection = await connectToDB();
        const transactionCollection = connection.collection('Transactions');

        const matchQuery = {
            userID: new ObjectId(req.user._id),
            date: { $gte: start, $lte: end },
            ...(category && { Category: category }),
            ...(type && { Type: type })
        };

        const pipeline = [
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: { Category: "$Category", Type: "$Type" },
                    total_amount: { $sum: "$Amount" }
                }
            },
            {
                $lookup: {
                    from: "Budgets",
                    let: {
                        category: "$_id.Category",
                        month: { $month: "$date" },
                        year: { $year: "$date" }
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$category", "$$category"] },
                                        { $eq: ["$month", "$$month"] },
                                        { $eq: ["$year", "$$year"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "budgetInfo"
                }
            },
            {
                $unwind: {
                    path: "$budgetInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    Category: "$_id.Category",
                    Type: "$_id.Type",
                    total_amount: 1,
                    budget_amount: { $ifNull: ["$budgetInfo.amount", 0] },
                    _id: 0
                }
            }
        ];

        const report = await transactionCollection.aggregate(pipeline).toArray();

        if (report.length === 0) return res.status(404).send("No transactions match those credentials");

        res.status(200).json(report);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/getDashboard', auth, async (req, res) => {
    try {
        const userID = req.user._id;
        const connection = await connectToDB();

        const accountCollection = connection.collection('Accounts');
        const accounts = await accountCollection.find({ userID: userID, isActive: true }).toArray();
        const totalBalance = accounts.reduce((sum, account) => sum + account.Balance, 0);

        const transactionCollection = connection.collection('Transactions');
        const transactions = await transactionCollection.find({ userID: new ObjectId(userID) }).toArray();

        const budgetCollection = connection.collection('Budgets');
        const budgets = await budgetCollection.find({ userID: new ObjectId(userID) }).toArray();

        const dashboardReport = {
            totalBalance,
            accounts,
            transactions,
            budgets
        };

        res.status(200).json(dashboardReport);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/getTrendReport', auth, async (req, res) => {
    try {
        const { error } = trendSchema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const { start_date, end_date, Category, Type, interval } = req.body;
        const start = new Date(`${start_date}T00:00:00.000Z`);
        const end = new Date(`${end_date}T23:59:59.999Z`);

        if (start > end) return res.status(400).send("Start date higher than the End date");

        const connection = await connectToDB();
        const transactionCollection = connection.collection('Transactions');

        const matchQuery = {
            userID: new ObjectId(req.user._id),
            date: { $gte: start, $lte: end },
            ...(typeof Category === 'string' && { Category }),
            ...(typeof Type === 'string' && { Type: Type })
        };

        let groupQuery = {
            _id: { $month: "$date" },
            total_income: { $sum: { $cond: [{ $eq: ["$Type", "Credit"] }, "$Amount", 0] } },
            total_expense: { $sum: { $cond: [{ $eq: ["$Type", "Debit"] }, "$Amount", 0] } }
        };

        const pipeline = [
            { $match: matchQuery },
            { $group: groupQuery },
            { $sort: { "_id": 1 } },
            { $project: { _id: 0, total_income: 1, total_expense: 1, month: "$_id" } }
        ];

        const trendData = await transactionCollection.aggregate(pipeline).toArray();

        if (trendData.length === 0) return res.status(404).send("No transactions match those credentials");

        res.status(200).json(trendData);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
