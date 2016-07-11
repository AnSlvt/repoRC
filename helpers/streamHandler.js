var twitter               = require('twit')
    , auth                = require('../config/configTW')
    , userInfo            = require('../config/userInfo')
    , NotificationHandler = require("./NotificationHandler")
    , qs                  = require('querystring')
    , pusher              = require('pusher')
    , DBHandler           = require('./DBHandler');

var stream = null;
var count = 0;
var messagePresence = false;

process.setMaxListeners(0);

module.exports = function(io, follow_params, list) {

    //Create web sockets connection.
    io.sockets.once('connection', function(socket) {

        // function called as a callback on every disconnect event
        var disconnectCallback = function() {

            // stop the stream if exist and disconnect the socket
            if (stream !== null) {
                stream.stop();
                stream = null;
            }
            socket.removeAllListeners();
            socket.disconnect(true);

            // handle the notification, publish the message to be consumed
            console.log("NUMERO DI TWEET " + count);
            var str = "Numero di tweet nella sessione precedente: " + count;
            console.log(str);
            NotificationHandler.publish(userInfo.screen_name, str);
            DBHandler.updateCount(userInfo.screen_name, count);
            messagePresence = true;

            // reset the received message
            count = 0;

            // delete the user specific info
            delete auth.token;
            delete auth.token_secret;
            delete auth.verifier;
            delete userInfo.UID;
            delete userInfo.screen_name;
        }

        socket.on("disconnect", disconnectCallback);
        socket.on("logout", disconnectCallback);

        socket.on("start tweets", function() {

            // when the browser is connected check for user
            DBHandler.getUser(userInfo.screen_name, function(notFound) {

                // verify if the user is on the db or is a new user
                if (notFound) DBHandler.addUser(userInfo.screen_name, 0, socket.id);
                else {

                    if (messagePresence) {

                        // if the user exist in the db there is a message for him
                        NotificationHandler.consume(userInfo.screen_name, function(str) {
                            console.log("Consumo");
                            socket.emit('notification', str);
                            console.log(str);
                            messagePresence = false;
                        });
                    }
                }
            });

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

            stream.on('tweet', function(data) {

                //console.log("Tweet from " + data.user.name + ": " + data.text);

                // Does the JSON result have coordinates
                if (data.coordinates && data.coordinates !== null) {

                    count++;
                    console.log(count);

                    /*console.log("================================================");
                    console.log("Tweet from " + data.user.name + "has coordinates");*/

                    //If so then build up some nice json and send out to web sockets
                    var outputPoint = {
                        "lat": data.coordinates.coordinates[0]
                        , "lng": data.coordinates.coordinates[1]
                    };
                    //console.log("================================================");

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
