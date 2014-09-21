$(document).ready(function() {
	initializeMap(function(err, map) {
		if (err) {
			alert(err);
		}
		$('#set-loc-btn').click(function(){
			var loc = map.getCenter();
			alert('lat: ' + loc.lat() + ', lng: ' + loc.lng());
		}); 
	});
});

function initializeMap(callback) {
	var nytecLatLng = new google.maps.LatLng(47.672824, -122.1957);
	getGeolocation(function(err, latLng) {
		if (err) {
			console.log('Failed to get geolocation, so using default. Err: ' + err);
			latLng = nytecLatLng;
		}
		var map = new google.maps.Map(document.getElementById("map-canvas"), {
			center: latLng,
			zoom: 15,
			panControl: false,
			zoomControl: false,
			mapTypeControl: false,
			scaleControl: false,
			streetViewControl: false,
			overviewMapControl: false
		});
		callback(null, map);
	});
}

function getGeolocation(callback) {
	// Try W3C Geolocation
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			callback(null, new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
		}, function(err) {
			callback(err);
		});
	} else {
		callback(new Error('Geolocation lookup not supported'));
	}
}

