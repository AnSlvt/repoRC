var amqp = require('amqplib/callback_api')
    , auth = require('../config/configTW');

var connection;

//tweet entro un certo raggio -> notifica

module.exports = {
    consume: function consume(tweet) {
    // Consumer
        amqp.connect('amqp://localhost', function (err, conn) {
            conn.createChannel(function (err, ch) {
                ch.assertQueue(q, {durable:true});

                ch.consume(q, function(msg){
                   tweet = msg.content.toString();
                });
            });
        });
    }

    ,publish: function publish(tweet) {
            amqp.connect('amqp://localhost:3000', function (err, conn) {
                conn.createChannel(function (err, ch) {
                    ch.assertQueue(q, {durable: true});

                    var msg = tweet.user.name + ": " + tweet.text;
                    ch.assertQueue(q, {durable: true});
                    ch.sendToQueue(q, new Buffer(msg), {persistent: true});
                });
                conn.close();
            });
        }
    , q : 'twitter-queue'


}