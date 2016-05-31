var request    = require('request')
    , qs       = require('querystring')
    , auth     = require('./config/configTW')
    , userInfo = require('./config/userInfo')
    , getUsersFollower  = require('./helpers/getUsersFollower')
    , getUsersFollowing = require('./helpers/getUsersFollowing')
    , getRecentTweets   = require('./helpers/getRecentTweets')
    , DBHandler         = require('./helpers/DBHandler')
    , getHashtags       = require('./helpers/getHashtaggedRadius');

var database;

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
            res.render("index", { twitterLink: uri });

            // replace this with a sendFile
        });
    },

    // Callback to handle post authentication
    signedIn: function(req, res) {

        DBHandler.creation();
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
        });
    },

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
    },

    trendsandplaces: function(req, res) {

        // Get the Twitter places URL
        var twitterPlacesUrl = "https://api.twitter.com/1.1/trends/closest.json?";
        var placesQuery = twitterPlacesUrl + "lat=" + req.params.lat + "&long=" + req.params.long;

        // Query the places
        request.get({url: placesQuery, oauth: auth}, function (e, r, body) {
            var placeBody = JSON.parse(body)[0];
            var woeid = placeBody.woeid;

            // Get the local trends
            var trendsUrl = "https://api.twitter.com/1.1/trends/place.json?id=";
            var trendsQuery = trendsUrl + woeid;
            request.get({url: trendsQuery, oauth: auth}, function (e2, r2, body2) {
                var trendsBody = JSON.parse(body2)[0];

                // Add the trends to the output JSON
                var output = "{ \"trends\": [";
                var trends = "";
                for (var i = 0; i < trendsBody.trends.length; i++) {
                    if (trendsBody.trends[i].name[0] !== "#") continue;
                    if (trends.length > 0) trends += ",";
                    trends += "{ \"name\": \"" + trendsBody.trends[i].name + "\"";
                    trends += ", \"tweets_count\": " + trendsBody.trends[i].tweet_volume + "}";
                }
                output += trends + "],";

                // Google Maps URLs and API keys
                var mapsUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
                var googleAPIKey = "AIzaSyDUfXDMc-ghv4glhDlaRvM6C_R_VBo81Y8"

                // Call the Google Maps API
                var mapsQuery = mapsUrl + "key=" + googleAPIKey + "&location="
                    + req.params.lat + "," + req.params.long + "&radius=" + req.params.radius;
                request.get({url: mapsQuery}, function (e3, r3, body3) {
                    var jsonb = JSON.parse(body3);
                    console.log("Places:");
                    console.log(jsonb);

                    // Check if there's at least one valid result
                    var results = jsonb.results;
                    if (results === null || results.length < 1) {
                        output += "\"places\": []}";
                        res.send(output);
                    }

                    // Extract the nearby places
                    var places = "";
                    for (var i = 0; i < results.length; i++) {
                        if (places.lenth > 0) places += ",";
                        places += "{ \"name\": \"" + results[i].name + "\",";
                        places += "\"vicinity\": \"" + results[i].vicinity + "\"}";
                    }

                    // Return the result
                    output += "\"places\": [" + places + "]}";
                    res.send(output);
                });
            });
        });
    }

}
