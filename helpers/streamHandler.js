var twitter = require('twit')
    , auth  = require('../config/configTW');

var stream = null;

module.exports = function(io, follow_params, list) {

    //Create web sockets connection.
    io.sockets.on('connection', function(socket) {

        socket.on("start tweets", function() {

            var outputListOfPoints = list;
            console.log("This is the received list:");
            console.log(outputListOfPoints);
            socket.emit("initialList", outputListOfPoints);

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

                    // Does the JSON result have coordinates
                    if (data.coordinates && data.coordinates !== null) {

                        console.log("================================================");
                        console.log("Tweet from " + data.user.name + "has coordinates");

                        //If so then build up some nice json and send out to web sockets
                        var outputPoint = {
                            "lat": data.coordinates.coordinates[0]
                            , "lng": data.coordinates.coordinates[1]
                        };
                        console.log("Coordinates are " + outputPoint);
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
