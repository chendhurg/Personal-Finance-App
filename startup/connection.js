const {  MongoClient }= require('mongodb');

const uri  = 'mongodb://localhost:27017';

const dbname = 'personal-financeDB';

let databaseconnection;

async function connectToDB(){
    if(databaseconnection){
        return databaseconnection;
    }

    try{
        const client = new MongoClient(uri);
        await client.connect();
        databaseconnection = client.db(dbname);
        console.log("Successfully connected to MongoDB");
        return databaseconnection;
    }
    catch(error){
        console.error("Error connecting to MongoDB");
        process.exit(1);
    }
}


module.exports = connectToDB;




