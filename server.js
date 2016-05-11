// Require our dependencies
var streamHandler = require('./helpers/streamHandler')
    , express     = require('express')
    , http        = require('http')
    , routes      = require('./callbacks');


// Create an express instance and set a port variable
var app = express();
var port = process.env.PORT || 3000;

// Set haml as the templating engine
app.engine('.haml', require('hamljs').renderFile);

// Set /public as our static content dir
app.use("/", express.static(__dirname + "/public"));

// Route for root request
app.get("/", routes.index);

// Route for /signed-with-twitter callback
app.get("/signed-with-twitter", routes.signedIn);

// Route for find a hashtagged tweet in a given radius
app.get("/search/:tag/:geocode", routes.tagSearch);

// Route for stream
app.get("/streaming/:follow_params/:initialList", function(req, res) {

    var follow_params = req.params.follow_params;
    var list = req.params.initialList;
    streamHandler(io, follow_params, list);
    res.redirect('/index1.html');
});

// Fire it up (start our server)
var server = http.createServer(app).listen(port, function() {
  console.log('Express server at http://localhost:' + port);
});

// Initialize socket.io
var io = require('socket.io').listen(server);
