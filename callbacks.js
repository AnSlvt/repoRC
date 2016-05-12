var request    = require('request')
    , qs       = require('querystring')
    , auth     = require('./config/configTW')
    , userInfo = require('./config/userInfo')
    , getUsersFollower  = require('./helpers/getUsersFollower')
    , getUsersFollowing = require('./helpers/getUsersFollowing')
    , getRecentTweets   = require('./helpers/getRecentTweets')
    , getHashtags       = require('./helpers/getHashtaggedRadius');

module.exports = {

    index: function(req, res) {

        // URL to obtain request token from twitter
        var requestTokenUrl = "https://api.twitter.com/oauth/request_token";

        // Step-1 Obtaining a request token
        request.post({ url : requestTokenUrl, oauth : auth }, function (e, r, body) {

            // Parsing the query string containing the oauth_token and oauth_secret.
            var reqData = qs.parse(body);
            var oauthToken = reqData.oauth_token;
            auth.token_secret = reqData.oauth_token_secret;

            // Step-2 Redirecting the user by creating a link
            // and allowing the user to click the link
            var uri = 'https://api.twitter.com/oauth/authenticate' + '?'
                    + qs.stringify({ oauth_token: oauthToken });

            // replace this with a sendFile
            res.send('<a href = "' + uri + '"> Sign in with twitter </a>');
        });
    },

    // Callback to handle post authentication
    signedIn: function(req, res) {

        // Data after the authentication and before the authorization
        var authReqData = req.query;
        auth.token = authReqData.oauth_token;
        auth.verifier = authReqData.oauth_verifier;
        console.log("\n\nStampa oggetto oauth prima della conversione");
        console.log(auth);

        var accessTokenUrl = "https://api.twitter.com/oauth/access_token";

        // Step-3 Converting the request token to an access token
        request.post({ url : accessTokenUrl , oauth : auth }, function(e, r, body) {

            // Update oauth information
            var authenticatedData = qs.parse(body);
            auth.token = authenticatedData.oauth_token;
            auth.token_secret = authenticatedData.oauth_token_secret;
            console.log("\n\nStampa oggetto oauth dopo conversione");
            console.log(auth);

            // Get user_id and screen_name of the authenticated user
            userInfo.UID = authenticatedData.user_id;
            userInfo.screen_name = authenticatedData.screen_name;
            console.log("\n\nAccount info");
            console.log(userInfo.UID, userInfo.screen_name);

            var UID = userInfo.UID;

            getRecentTweets(UID, 700, function(coordinates) {
                getUsersFollower(UID, function(followers) {
                    getUsersFollowing(UID, function(following) {
                        follow_params = following.concat(followers);
                        res.redirect("/streaming/" + follow_params + "/" + coordinates);
                    });
                });
            });
        });
    },

    /* Callback to find an hashtagged tweet in a given radius.
     * URL params:
     *     hashtag: represent the hashtag to search (format: #something)
     *     geocode: represent the radius and the position (format: latitude,longitude,radius)
     */
    tagSearch: function(req, res) {

        var hashtag   = req.params.tag
            , geocode = req.params.geocode;
        getHashtags(hashtag, geocode, function(jsonRet) {
            res.send(jsonRet);
        }
    }

    recentHashtags: function(req, res) {

        // The Twitter search API URL
        var url = "https://api.twitter.com/1.1/search/tweets.json";

        // Make sure the is the # symbol at the beginning of the hashtag
        var hashtag = req.params.hashtag;
        if (hashtag[0] !== "#") hashtag = "%23" + hashtag;
        else hashtag.replace("#", "%23");

        // Prepare the query and call the Twitter API
        var query = url + "?q=" + hashtag + "&geocode=" + req.params.geocode;
        console.log("Query URL:");
        console.log(query);
        request.get({ url : query , oauth : auth }, function(e, r, body) {
            var total = 0;
            var jsonb = JSON.parse(body);
            console.log("jsonb:");
            console.log(jsonb);
            for (var i = 0; i < jsonb.statuses.length; i++) {

                // Parse the date of the current tweet
                var date = (new Date(Date.parse(jsonb.statuses[i].created_at))).getTime();
                var now = (new Date()).getTime();
                var difference = now - date;

                // Increment the counter if the tweet is recent enough
                var timespan = parseInt(req.params.hours) * 60 * 60 * 1000;
                if (timespan - difference) total += 1;
            }
            res.send("{ \"tweets_count\": " + total + " }");
        });
    },

    wordFrequency: function(req, res) {

        // The Twitter search API URL
        var url = "https://api.twitter.com/1.1/search/tweets.json";

        // Prepare the query
        var query = url + "?q=" + req.params.word + "&geocode=" + req.params.geocode;
        console.log("Query URL:");
        console.log(query);
        request.get({ url : query , oauth : auth }, function(e, r, body) {
            var count = 0;
            var tweets = "";
            var jsonb = JSON.parse(body);
            console.log("jsonb:");
            console.log(jsonb);
            for (var i = 0; i < jsonb.statuses.length; i++) {

                // Parse the date of the current tweet
                var date = (new Date(Date.parse(jsonb.statuses[i].created_at))).getTime();
                var now = (new Date()).getTime();
                var difference = now - date;

                // Increment the counter if the tweet is recent enough
                var timespan = parseInt(req.params.hours) * 60 * 60 * 1000;
                if (timespan - difference) {

                    // The filtered tweet should be added to the output
                    count += 1;
                    if (tweets !== "") tweets += ",";
                    tweets += "{ \"text\": \"" + jsonb.statuses[i].text + "\",";
                    tweets += "\"author_name\": \"" + jsonb.statuses[i].user.name + "\",";
                    tweets += "\"posted_at\": \"" + jsonb.statuses[i].created_at + "\"}";
                }
            }
            res.send("{ \"tweets_count\": " + count + ",\"tweets\": [" + tweets + "]}");
        });
    }
}
