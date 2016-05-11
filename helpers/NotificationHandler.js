var amqp = require('amqplib/callback_api')
    , auth = require('../config/configTW');

var connection;

//tweet entro un certo raggio -> notifica

module.exports = {
    consume: function consume() {
    // Consumer
        amqp.connect('amqp://localhost', function (err, conn) {
            if (err != null) console.error(err);
            conn.createChannel(channel);
            function channel(err, ch) {
                console.log("sono in channel")
                if (err != null) console.error(err);

                ch.assertQueue(q);
                ch.consume(q, function(msg){
                    tweet = msg.content.toString();
                    ch.ack(msg);
                    return tweet;
                });
            };
            conn.close();
        });
    }

    ,publish: function publish(tweet) {
            amqp.connect('amqp://localhost', function (err, conn) {
                if (err != null) console.error(err);
                conn.createChannel(channel);

                function channel(err, ch) {
                    if (err != null) console.error(err);

                    var msg = tweet.user.name + ": " + tweet.text;
                    ch.assertQueue(q, {durable: true});
                    ch.sendToQueue(q, new Buffer(msg), {persistent: true});
                };
                conn.close();
            });
        }
    , q : 'twitter-queue'


}
