var map, heatmap, center;
var socket = null;

function initMap() {

    var rome = new google.maps.LatLng(41.8919300, 12.5113300);

    // Setup Google Map
    var myOptions = {
        zoom: 3,
        mapTypeId: google.maps.MapTypeId.SATELLITE
    };

    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

    // Setup heat map and link to Twitter array we will append data to -- Fa errore PD
    var liveTweets = new google.maps.MVCArray();
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: liveTweets,
        map: map
    });

    // Set the center
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            center = position;
            map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
        });
    }
    else {
        alert("Geolocalization does not work on you browser. We set you in Rome");
        center = rome;
        map.setCenter(rome);
    }

    if (io !== undefined) {

        socket = io.connect('http://localhost:3000/');

        // Image used for the marker
        var image = "../small-dot-icon.png";

        socket.on("username", function(username) {
            document.getElementById('user_name').innerHTML = '@' + username;
            user_name = username;
        });

        socket.on("initialList", function(list) {

            if (list === "NONE") {
                console.log("No geolocalized tweet");
                return;
            }

            // Add the coordinates from the list to the map
            console.log(list);
            var coordinates = list.split("&");
            for (var i = 0; i < coordinates.length; i++) {
                var latlng = coordinates[i].split(",");
                var point = new google.maps.LatLng(latlng[1], latlng[0]);
                liveTweets.push(point);
            }
        });

        socket.on("notification", function(data){
            noty({
                text: data,
                layout: "bottomLeft",
                maxVisible: 3,
                timeout: 3000
            })
        });

        // This listens on the "twitter-steam" channel and data is
        // received everytime a new tweet is receieved.
        socket.on('twitter-stream', function(data) {
            // Add tweet to the heat map array.
            var tweetLocation = new google.maps.LatLng(data.lng, data.lat);
            liveTweets.push(tweetLocation);
            setTimeout(function() {
                liveTweets.removeAt(0);
            }, 60000);

            var marker = new google.maps.Marker({
                position: tweetLocation,
                map: map,
                icon: image
            });
            setTimeout(function() {
                marker.setMap(null);
            }, 600);
        });

        // Listens for a success response from the server to
        // say the connection was successful.
        socket.on("connected", function(r) {
            // Now that we are connected to the server let's tell
            // the server we are ready to start receiving tweets.
            socket.emit("start tweets");
        });
    }
}

function toggleHeatmap() {
    heatmap.setMap(heatmap.getMap() ? null : map);
}

function changeGradient() {
    var gradient = [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
    ]
    heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
}

function changeRadius() {
    heatmap.set('radius', heatmap.get('radius') ? null : 20);
}

function changeOpacity() {
    heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
}

function recenter() {
    map.panTo(new google.maps.LatLng(center.coords.latitude, center.coords.longitude));
}

function logOutBtn() {
    if (socket !== null) {
        socket.emit("logout");
        socket.disconnect(true);
        window.location = "http://localhost:3000/";
    }
}
