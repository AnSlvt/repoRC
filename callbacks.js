var request = require('request')
    , qs    = require('querystring')
    , auth  = require('./config/configTW')
    , getUsersFollower  = require('./helpers/getUsersFollower')
    , getUsersFollowing = require('./helpers/getUsersFollowing');


// User id and screen_name
var UID
  , twitterScreenName;

var followers
  , following;

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
            UID = authenticatedData.user_id;
            twitterScreenName = authenticatedData.screen_name;
            console.log("\n\nAccount info");
            console.log(UID, twitterScreenName);

            var follow_params;
            getUsersFollower(UID, function(ret) { followers = ret; });
            getUsersFollowing(UID, function(ret) {
                follow_params = ret.concat(followers);
                res.redirect("/streaming/" + follow_params);
            });
        });
    }
}
