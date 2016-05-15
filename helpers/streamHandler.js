<<<<<<< HEAD
var twitter    = require('twit')
    , auth     = require('../config/configTW')
    , userInfo = require('../config/userInfo');

var stream = null;

=======
var twitter = require('twit')
    , auth  = require('../config/configTW')
    , NotificationHandler = require("./NotificationHandler")
    , pusher = require('pusher');


var stream = null;


>>>>>>> ac024c9b09fd4436d20e2dbf1ca09bfc60563691
module.exports = function(io, follow_params, list) {

    //Create web sockets connection.
    io.sockets.on('connection', function(socket) {

        socket.on("start tweets", function() {

            var outputListOfPoints = list;
            console.log("This is the received list:");
            console.log(outputListOfPoints);
            socket.emit("initialList", outputListOfPoints);
<<<<<<< HEAD
            socket.emit("username", userInfo.screen_name);
=======
>>>>>>> ac024c9b09fd4436d20e2dbf1ca09bfc60563691

            if(stream === null) {

                var params = { follow: follow_params };
                console.log(params);

                var twit = new twitter({
                    consumer_key         : auth.consumer_key
                    , consumer_secret    : auth.consumer_secret
                    , access_token       : auth.token
                    , access_token_secret: auth.token_secret
                });

                //stream = twit.stream('statuses/filter', params);
                stream = twit.stream('statuses/filter', { locations: '-180,-90,180,90' });

                stream.on('tweet', function(data) {

                    console.log("Tweet from " + data.user.name + ": " + data.text);

<<<<<<< HEAD
                    // Does the JSON result have coordinates
                    if (data.coordinates && data.coordinates !== null) {

=======


                    // Does the JSON result have coordinates
                    if (data.coordinates && data.coordinates !== null) {

                        NotificationHandler.publish(data);
                        NotificationHandler.consume(function(tweet) {
                            socket.emit("notification", tweet);
                        });



>>>>>>> ac024c9b09fd4436d20e2dbf1ca09bfc60563691
                        console.log("================================================");
                        console.log("Tweet from " + data.user.name + "has coordinates");

                        //If so then build up some nice json and send out to web sockets
                        var outputPoint = {
                            "lat": data.coordinates.coordinates[0]
                            , "lng": data.coordinates.coordinates[1]
                        };
<<<<<<< HEAD
                        //console.log("Coordinates are " + outputPoint.coords.latitude + ", " + outputPoint.coords.longitude);
=======
                        console.log("Coordinates are " + outputPoint);
>>>>>>> ac024c9b09fd4436d20e2dbf1ca09bfc60563691
                        console.log("================================================");

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
            }
        });
        socket.emit("connected");
    });
}
