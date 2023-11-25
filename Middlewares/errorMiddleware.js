function errorHandler(statusCode,err,req, res, next){
    console.error(err.stack);
    
    if(res.headersSent){
        return next(err);
    }
    console.log("error middleware called")
    res.status(statusCode || 500).json({
        ok : false, // Set the "ok" field to false for errors
        message : err.message
    });
}

module.exports = errorHandler;