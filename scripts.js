function initialize() {
            var myLatlng = new google.maps.LatLng(-25.363882,131.044922);
                var mapOptions = {
                  center: myLatlng,
                  zoom: 8
                };

            var map = new google.maps.Map(document.getElementById("map-canvas"),
                mapOptions);

            marker.setMap(null);
            // var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/'

            // var marker = new google.maps.Marker({
            //       position: myLatlng,
            //       map: map,
            //       title: 'Hello World!'
            //       // icon: iconBase;
            // });

            google.maps.event.addListener(map, 'center_changed', function() {
                // 0.1 seconds after the center of the map has changed,
                // set back the marker position.
                window.setTimeout(function() {
                  var center = map.getCenter();
                  marker.setPosition(center);
                }, 100);
            });
        }
      google.maps.event.addDomListener(window, 'load', initialize);