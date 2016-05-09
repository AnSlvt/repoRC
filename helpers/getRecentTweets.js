var request = require("request")
    , auth  = require("../config/configTW");

module.exports = function(UID, count, callback) {

    var url = 'https://api.twitter.com/1.1/statuses/home_timeline.json';
    var params = '?user_id=' + UID + "&count=" + count;

    request.get({ url: url.concat(params), oauth: auth }, function(e, r, body) {

        var jsonb = JSON.parse(body);

        var filtered = jsonb.filter(function(element, index, array) {
            return element.coordinates != null;
        });

        var coordinates = "";
        for (var i = 0; i < filtered.length; i++) {
            coordinates += filtered[i].coordinates.coordinates[0] +
            "," + filtered[i].coordinates.coordinates[1];
            if (i < filtered.length - 1) coordinates += "&";
        }
        console.log("SERIALIZED:");
        console.log(coordinates);
        callback(coordinates);
    });
}
