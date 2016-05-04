var express   = require('express')
    , request = require('request')
    , qs      = require('querystring')
    , oauth   = require('./config/configTW')
    , app     = express()
    , http = require('http')
    , server = http.Server(app)
    , io = require('socket.io')(server);

// User id and screen_name
var UID
  , twitterScreenName;

var oauthToken = ""
  , oauthTokenSecret = "";

var followers
  , stream = null;

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

        // Step-2 Redirecting the user by creating a link
        // and allowing the user to click the link
        var uri = 'https://api.twitter.com/oauth/authenticate' + '?' + qs.stringify({oauth_token: oauthToken});
        res.send('<a href = "' + uri + '"> Sign in with twitter </a>');
    });
});

// Callback to handle post authentication.
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
        res.redirect('/get-my-followers');
    });
});

app.get('/get-my-followers', function(req, res)
{
    var url = 'https://api.twitter.com/1.1/followers/list.json';
    var params = '?user_id=' + UID;
    var IDs = '';
    request.get( {url: url.concat(params), oauth: oauth}, function(e, r, body)
    {
        var jsonb = JSON.parse(body);
        var usr = jsonb.users;
        for (var i = 0; i < usr.length; i++)
        {
            IDs += usr[i].id_str;
            if (i < usr.length - 1) IDs += ',';
        }
        followers = IDs;
        console.log(followers);
        res.redirect('/socket');
    });
});

app.get('/socket', function(req, res)
{
    console.log("================== Sono dentro socket ====================");
    //Create web sockets connection.
    io.sockets.on('connection', function(socket)
    {
        socket.emit("connected");
        socket.on("start tweets", function()
        {
            if(stream === null)
            {
                //Connect to twitter stream passing in filter for followers.
                var uri = 'https://stream.twitter.com/1.1/statuses/filter.json';
                var params = '?follow=' + followers;
                console.log("Sono dentro start tweet");
                request.post( { url: uri.concat(params), oauth: oauth }, function(e, r, body)
                {
                    //twit.stream('statuses/filter', {'locations': '-180,-90,180,90'}, function(s) {
                        /*stream = s;
                        stream.on('data', function(data) {
                            // Does the JSON result have coordinates
                            if (data.coordinates && data.coordinates !== null) {
                                //If so then build up some nice json and send out to web sockets
                                var outputPoint = {"lat": data.coordinates.coordinates[0], "lng": data.coordinates.coordinates[1]};

                                socket.broadcast.emit("twitter-stream", outputPoint);

                                //Send out to web sockets channel
                                */
                                socket.emit('twitter-stream', outputPoint);/*
                            }
                        }*/
                    //});
                    console.log(body);
                    console.log(r);
                });
            }
        });
    });
});

server.listen(3000);
