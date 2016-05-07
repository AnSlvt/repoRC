// Require our dependencies
var express   = require('express')
    , request = require('request')
    , qs      = require('querystring')
    , http    = require('http')
    , twitter = require('twitter')
    , auth    = require('./config/configTW');

// Create an express instance and set a port variable
var app = express();
var port = process.env.PORT || 3000;

// Set haml as the templating engine
app.engine('.haml', require('hamljs').renderFile);

// Set /public as our static content dir
app.use("/", express.static(__dirname + "/public/"));

// User id and screen_name
var UID
  , twitterScreenName;

var oauthToken = ""
  , oauthTokenSecret = "";

var followers
  , following;

app.get('/', function (req, res) {

    //URL To obtain Request Token from Twitter
    var requestTokenUrl = "https://api.twitter.com/oauth/request_token";

    //Step-1 Obtaining a request token
    request.post({ url : requestTokenUrl, oauth : auth }, function (e, r, body) {

        //Parsing the Query String containing the oauth_token and oauth_secret.
        var reqData = qs.parse(body);
        oauthToken = reqData.oauth_token;
        oauthTokenSecret = reqData.oauth_token_secret;

        // Step-2 Redirecting the user by creating a link
        // and allowing the user to click the link
        var uri = 'https://api.twitter.com/oauth/authenticate' + '?' + qs.stringify({oauth_token: oauthToken});

        res.send('<a href = "' + uri + '"> Sign in with twitter </a>'); // replace this with a sendFile
    });
});

// Callback to handle post authentication.
app.get("/signed-with-twitter", function(req, res) {

    var authReqData = req.query;
    auth.token = authReqData.oauth_token;
    auth.token_secret = oauthTokenSecret;
    auth.verifier = authReqData.oauth_verifier;
    console.log("\n\nStampa oggetto oauth prima della conversione");
    console.log(auth);

    var accessTokenUrl = "https://api.twitter.com/oauth/access_token";

    //Step-3 Converting the request token to an access token
    request.post({ url : accessTokenUrl , oauth : auth }, function(e, r, body) {

        var authenticatedData = qs.parse(body);
        // Update oauth information
        auth.token = authenticatedData.oauth_token;
        auth.token_secret = authenticatedData.oauth_token_secret;
        console.log("\n\nStampa oggetto oauth dopo conversione");
        console.log(auth);
        UID = authenticatedData.user_id;
        twitterScreenName = authenticatedData.screen_name;
        console.log("\n\nAccount info");
        console.log(UID, twitterScreenName);

        getUsersFollower(res);
    });
});

var twit = new twitter({

    consumer_key: auth.consumer_key
    , consumer_secret: auth.consumer_secret
    , access_token_key: auth.token
    , access_token_secret: auth.token_secret
});

var getUsersFollower = function(res) {

    var url = 'https://api.twitter.com/1.1/followers/ids.json';
    var params = '?user_id=' + UID;

    request.get({ url: url.concat(params), oauth: auth }, function(e, r, body) {
        var jsonb = JSON.parse(body);
        followers = jsonb.ids;
        /*var ids = jsonb.ids;
        followers = '';
        for (var i = 0; i < ids.length; i++) {
            followers += ids[i]
            if (i < ids.length - 1) followers += ','
        }*/
        getUsersFollowing(res);
    });
}

var getUsersFollowing = function(res) {

    var url = 'https://api.twitter.com/1.1/friends/ids.json';
    var params = '?user_id=' + UID;
    request.get({ url: url.concat(params), oauth: auth }, function(e, r, body) {
        var jsonb = JSON.parse(body);
        following = jsonb.ids;
        streamHandling(res);
    });
}

var streamHandling = function(res) {

    //Create web sockets connection.
    io.sockets.on('connection', function(socket) {

        socket.on("start tweets", function() {

            if(stream === null) {

                //Connect to twitter stream passing in filter for followers.
                var url = 'https://stream.twitter.com/1.1/statuses/filter.json';
                //var url = 'https://userstream.twitter.com/1.1/user.json';

                var params = { 'follow': followers.concat(following) };
                //var params = { 'with': followers };
                var requestParams = {
                    url: url,
                    qs: params,
                    oauth: auth
                    //headers: { 'Authorization': 'Oauth ' + JSON.stringify(auth) }
                }

                console.log(params);

                //request.post(requestParams, function(e, r, body) {
                //request.get(requestParams, function(e, r, body) {
                twit.stream('statuses/filter', params, function(stream) {

                    console.log("OK");
                    console.log(stream);
                    stream.on('data', function(data) {

                        console.log(data);
                        // Does the JSON result have coordinates
                        if (data.coordinates && data.coordinates !== null) {
                            //If so then build up some nice json and send out to web sockets
                            var outputPoint = {
                                "lat": data.coordinates.coordinates[0]
                                , "lng": data.coordinates.coordinates[1]
                            };

                            socket.broadcast.emit("twitter-stream", outputPoint);

                            //Send out to web sockets channel
                            socket.emit('twitter-stream', outputPoint);
                        }
                    });
                    stream.on('limit', function(limitMessage) {
                        return console.log(limitMessage);
                    });

                    stream.on('warning', function(warning) {
                        return console.log(warning);
                    });

                    stream.on('disconnect', function(disconnectMessage) {
                        return console.log(disconnectMessage);
                    });
                });
            }
        });
        socket.emit("connected");
    });

    res.redirect('index1.html');
}

// Fire it up (start our server)
var server = http.createServer(app).listen(port, function() {
  console.log('Express server at http://localhost:' + port);
});

// Initialize socket.io
var io = require('socket.io').listen(server);
