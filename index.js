const express = require('express');

const connectToDB = require('./startup/connection');


const app = express();


app.use(express.json());


async function startServer() {
    const connection = await connectToDB();
    app.locals.connection = connection;

    require('./startup/routes')(app);

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Listening on port ${port}...`));
}

startServer();

