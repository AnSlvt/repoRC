var request = require("request")
    , auth  = require("../config/configTW");

module.exports = function(UID, count, callback) {

    var url = 'https://api.twitter.com/1.1/statuses/home_timeline.json';
    var params = '?user_id=' + UID + "&count=" + count;

    request.get({ url: url.concat(params), oauth: auth }, function(e, r, body) {

        var jsonb = JSON.parse(body);
        var coordinates = [];
        for (var i = 0; i < jsonb.length; i++) {
            if (jsonb[i].coordinates !== null) coordinates += jsonb[i].coordinates.coordinates;
        }
        callback(coordinates);
    });
}
