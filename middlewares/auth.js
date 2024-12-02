const jwt = require('jsonwebtoken');
const config=require('config');
function auth(req,res,next){
    const token = req.header('x-auth-token');
    if(!token) return res.status(401).send("no token provided");

    try{
        const decoded=jwt.verify(token,config.get('jwtprivatekey'));
        req.user={_id : decoded._id,email:decoded.email};
        console.log(decoded._id);
        next();
    }
    catch(ex){
        res.status(400).send("bad request");
    }



  
}

module.exports =auth;