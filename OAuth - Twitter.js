var express   = require('express')
    , request = require('request')
    , qs      = require('querystring')
    , oauth   = require('./config/configTW')
    , app     = express();

// User id and screen_name
var UID
  , twitterScreenName;

var oauthToken = ""
  , oauthTokenSecret = "";

app.get('/', function (req, res)
{
    //URL To obtain Request Token from Twitter
    var requestTokenUrl = "https://api.twitter.com/oauth/request_token";

    //Step-1 Obtaining a request token
    request.post( {url : requestTokenUrl, oauth : oauth}, function (e, r, body)
    {
        //Parsing the Query String containing the oauth_token and oauth_secret.
        var reqData = qs.parse(body);
        oauthToken = reqData.oauth_token;
        oauthTokenSecret = reqData.oauth_token_secret;

        //Step-2 Redirecting the user by creating a link
        //and allowing the user to click the link
        var uri = 'https://api.twitter.com/oauth/authenticate' + '?' + qs.stringify({oauth_token: oauthToken});
        res.send('<a href = "' + uri + '"> Sign in with twitter </a>');
    });
});

//Callback to handle post authentication.
app.get("/signin-with-twitter", function(req, res)
{
    oauth.token_secret = oauthTokenSecret;
    var authReqData = req.query;
    oauth.token = authReqData.oauth_token;
    oauth.verifier = authReqData.oauth_verifier;
    console.log("\n\nStampa oggetto oauth prima della conversione");
    console.log(oauth);

    var accessTokenUrl = "https://api.twitter.com/oauth/access_token";

    //Step-3 Converting the request token to an access token
    request.post( {url : accessTokenUrl , oauth : oauth}, function(e, r, body)
    {
        var authenticatedData = qs.parse(body);
        // Update oauth information
        oauth.token = authenticatedData.oauth_token;
        oauth.token_secret = authenticatedData.oauth_token_secret;
        console.log("\n\nStampa oggetto oauth dopo conversione");
        console.log(oauth);
        UID = authenticatedData.user_id;
        twitterScreenName = authenticatedData.screen_name;
        console.log("\n\nAccount info");
        console.log(UID, twitterScreenName);
    });

    res.send('I made you my bitch <br/> <a href="http://localhost:3000/get-my-last-rt/">Retrieve my rt</a> <br/> ' +
        '<a href="http://localhost:3000/get-my-followers/">Retrieve my followers</a>');
});

app.get('/get-my-last-rt', function(req, res)
{
    var url = "https://api.twitter.com/1.1/statuses/retweets_of_me.json";
    var params = "?count=1";
    request.get( {url: url.concat(params), oauth: oauth}, function(e, r, body)
    {
        var RTinfo = JSON.parse(body)[0];
        res.send(RTinfo.text + "<br /> Created at: " + RTinfo.created_at + " by " + twitterScreenName);
        console.log("\n\nLast rt");
        console.log(RTinfo);
    });
});

app.get('/get-my-followers', function(req, res)
{
    var url = 'https://api.twitter.com/1.1/followers/list.json';
    var params = '?user_id=' + UID;
    var names = [];
    request.get( {url: url.concat(params), oauth: oauth}, function(e, r, body)
    {
        var jsonb = JSON.parse(body);
        var usr = jsonb.users;
        for (var i = 0; i < usr.length; i++)
        {
            names.push(usr[i].name);
        }
        res.send(names);
    });
});

app.listen(3000, function()
{
    console.log('Server up: http://localhost:3000');
});