var request = require("request")
    , auth  = require("../config/configTW");

module.exports = function(UID, callback) {

    var url = 'https://api.twitter.com/1.1/friends/ids.json';
    var params = '?user_id=' + UID;

    request.get({ url: url.concat(params), oauth: auth }, function(e, r, body) {

        var jsonb = JSON.parse(body);
        following = jsonb.ids;
        /*var ids = jsonb.ids;
        var following = '';
        for (var i = 0; i < ids.length; i++) {
            following += ids[i]
            if (i < ids.length - 1) following += ','
        }*/
        callback(following);
    });
}
