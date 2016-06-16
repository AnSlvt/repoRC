var userInfo = require('../config/userInfo'),
    mongoose = require('mongoose');


var db;
var Schema = mongoose.Schema;
var UserModel;
exports.creation =  function creation() {
    mongoose.connect('mongodb://localhost:27017/ProgettoRC');

    db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error'));

    var UserSchema = new Schema({
        screenname: {type: String, unique: true},
        count: Number,
        socket_id: String
    });

    UserModel = mongoose.model('User', UserSchema);
}
exports.addUser =  function addUser(screenname, count, socket_id) {
        var User = new UserModel();
        User.screenname = screenname;
        User.count = count;
        User.socket_id = socket_id;

        User.save(function (err) {
            console.log(err);
        });
    }

exports.getUser = function getUser(name,callback){
    var query = UserModel.where({ screenname : name });
    query.findOne(function (err, user) {
        if (err) {
            console.log(err);
            return handleError(err);
        }
        var bool = false;
        console.log(user);
        if (user.screenname === "")  bool =true;
        callback(bool);
    });
}

exports.updateCount = function updateCount(name, count) {
        var query = UserModel.where({ screenname : name});
        query.findOne(function (err, user) {
            if (err) console.log(err);
            user.count = count;
        });
}


exports.getSocketID =  function getSocketID(name,callback) {
        var socket;
        var query = UserModel.where({ screenname : name });
        query.findOne(function (err, user) {
            if (err) {
                console.log(err);
                return handleError(err);
            }
            socket = user.socket_id;
            callback(socket);
        });

}

exports.getCount = function getCount(name,callback) {
        var count;
        var query = UserModel.where({ screenname : name });
        query.findOne(function (err, user) {
            if (err) console.log(err);
            count = user.count;
            callback(count);
        });
}

exports.disconnect = function disconnect() {
    mongoose.disconnect();
}


