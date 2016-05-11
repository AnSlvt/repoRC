var request    = require('request')
    , auth     = require('../config/configTW');

function measure(lat1, lon1, lat2, lon2) {

    var R = 6378.137; // Radius of earth in KM
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000; // meters
}

module.exports = function(tag, geocode, callback) {

    if (tag[0] !== "#") tag = "%23" + tag;
    else tag.replace("#", "%23");

    var url = 'https://api.twitter.com/1.1/search/tweets.json'
        , params = "?q=" + tag + "&" + "geocode=" + geocode;

    request.get({ url: url.concat(params), oauth: auth }, function(e, r, body) {

        var partialRet = {

            text: ""
            , author: ""
            , date: ""
            , distance: ""
        };

        var ret = [];

        var jsonb = JSON.parse(body)
            , statuses = jsonb.statuses;
            , geoParams = geocode.split(",")
            , lat = geoParams[0]
            , lng = geoParams[1];

        for (var i = 0; i < statuses.length; i++) {

            partialRet.text = statuses[i].text
            partialRet.author = statuses[i].name
            partialRet.date = statuses[i].created_at;

            if (statuses[i].coordinates !== null) {
                var tweetlng = statuses[i].coordinates.coordinates[0]
                    , tweetlat = statuses[i].coordinates.coordinates[1];
                partialRet.distance = measure(lat, lng, tweetlat, tweetlng);
            }
            ret.push(partialRet);
        }

        callback(JSON.stringify(ret));
    });
}
