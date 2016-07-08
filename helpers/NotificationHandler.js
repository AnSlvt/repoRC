var amqp = require('amqplib/callback_api');

exports.consume = function consume(screenname, callback) {

    // Consumer
    amqp.connect('amqp://localhost', function(err, conn) {
        if (err != null) {
            console.warn(err.stack);
            console.error(err);
            process.exit;
        }

        if (conn !== null && conn !== undefined) conn.createChannel(channel);

        function channel(err, ch) {
            if (err != null) {
                console.warn(err.stack);
                console.error(err);
                process.exit;
            }

            ch.assertQueue(screenname);
            ch.consume(screenname, function(msg) {
                console.log(msg.content.toString());
                callback(msg.content.toString()); // i pass it as a callback parameter
                ch.ack(msg);
                ch.close();
            });
        }
    });
}

exports.publish = function publish(screenname, str) {

    amqp.connect('amqp://localhost', function (err, conn) {
        if (err != null) {
            console.warn(err.stack);
            console.error(err);
            process.exit;
        }

        if (conn !== null && conn !== undefined) conn.createChannel(channel);

        function channel(err, ch) {

            if (err != null) {
                console.warn(err.stack);
                console.error(err);
                process.exit;
            }

            ch.assertQueue(screenname, { durable: true });
            ch.sendToQueue(screenname, new Buffer(str), { persistent: true });
        }
    });
}
