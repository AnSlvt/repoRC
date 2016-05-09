var twitter = require('twitter')
    , auth  = require('../config/configTW');

var twit = new twitter({

    consumer_key: auth.consumer_key
    , consumer_secret: auth.consumer_secret
    , access_token_key: auth.token
    , access_token_secret: auth.token_secret
});

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

                twit.stream('statuses/filter', params, function(s) {

                    stream = s;
                    console.log("OK");
                    console.log(stream);
                    stream.on('data', function(data) {

                        // Does the JSON result have coordinates
                        console.log(data);
                        if (data.coordinates && data.coordinates !== null) {

                            //If so then build up some nice json and send out to web sockets
                            var outputPoint = {
                                "lat": data.coordinates.coordinates[0]
                                , "lng": data.coordinates.coordinates[1]
                            };

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
            }
        });
        socket.emit("connected");
    });
}
