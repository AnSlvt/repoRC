// To be obtained from the app created on Twitter
const CONSUMER_KEY    = "Jz2WGDGqafKcxEqPlgOXl02mM"
    , CONSUMER_SECRET = "Zd71swilBAO1Sk1HmqroCB4OsWILk5rjQP6CU7HALQEIASovaI";

// Oauth Object to be used to obtain Request token and Access token from Twitter
module.exports = {

    callback          : "http://localhost:3000/signed-with-twitter"
    , consumer_key    : CONSUMER_KEY
    , consumer_secret : CONSUMER_SECRET
};
