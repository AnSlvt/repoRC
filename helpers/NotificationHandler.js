var amqp = require('amqplib/callback_api');

//tweet entro un certo raggio -> notifica

module.exports = {

    consume: function consume(callback) {

        // Consumer
        amqp.connect('amqp://localhost', function (err, conn) {
            if (err != null) {
                console.warn(err.stack);
                console.error(err);
                process.exit;
            }

            if (conn !== null && conn != undefined) conn.createChannel(channel);

            function channel(err, ch) {
                if (err != null) {
                    console.warn(err.stack);
                    console.error(err);
                    process.exit;
                }

                ch.assertQueue("twitter-queue");
                ch.consume('twitter-queue', function(msg) {
                    callback(msg.content.toString()); // i pass it as a callback parameter
                    ch.ack(msg);
                });
            };
        });
    },

    publish: function publish(tweet) {

        amqp.connect('amqp://localhost', function (err, conn) {
            if (err != null) {
                console.warn(err.stack);
                console.error(err);
                process.exit;
            }

            if (conn !== null && conn != undefined) conn.createChannel(channel);

            function channel(err, ch) {

                if (err != null) {
                    console.warn(err.stack);
                    console.error(err);
                    process.exit;
                }

                var msg = tweet.user.name + ": " + tweet.text;
                ch.assertQueue('twitter-queue', { durable: true });
                ch.sendToQueue('twitter-queue', new Buffer(msg), { persistent: true });
            };
        });
    }
}
