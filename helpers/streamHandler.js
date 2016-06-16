var twitter = require('twit')
    , auth  = require('../config/configTW')
    , userInfo = require('../config/userInfo')
    , NotificationHandler = require("./NotificationHandler")
    , qs = require('querystring')
    , pusher = require('pusher');

var stream = null;

process.setMaxListeners(0);

module.exports = function(io, follow_params, list) {

    //Create web sockets connection.
    io.sockets.once('connection', function(socket) {

        socket.on("start tweets", function() {

            var outputListOfPoints = list;
            socket.emit("initialList", outputListOfPoints);
            socket.emit("username", userInfo.screen_name);

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
            }
            
            socket.on("logout", function() {

                delete auth.token;
                delete auth.token_secret;
                delete auth.verifier;
                delete userInfo.UID;
                delete userInfo.screen_name;
                stream.stop();
                socket.removeAllListeners();
                socket.disconnect(true);
                stream = null;
            });

            var lastTweetId = -1;

            stream.on('tweet', function(data) {

                if (lastTweetId === data.id) return;
                lastTweetId = data.id;

                console.log("Tweet from " + data.user.name + ": " + data.text);

                // Does the JSON result have coordinates
                if (data.coordinates && data.coordinates !== null) {

                    NotificationHandler.publish(data);
                    NotificationHandler.consume(function(tweet) {
                        socket.emit("notification", tweet);
                    });

                    console.log("================================================");
                    console.log("Tweet from " + data.user.name + "has coordinates");

                    //If so then build up some nice json and send out to web sockets
                    var outputPoint = {
                        "lat": data.coordinates.coordinates[0]
                        , "lng": data.coordinates.coordinates[1]
                    };
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
        });
        socket.emit("connected");
    });
}
