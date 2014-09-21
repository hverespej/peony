$( document ).ready(function() {
  console.log( "ready!" );
  $('.check').click(function(){
    if ($(this).is(':checked')){
      $(this).next('.qty').toggleClass('hide');
      console.log('test');
    }
    else{
      $(this).next('.qty').toggleClass('hide');
    }
  }); 
});

function initialize() {
  var myLatlng = new google.maps.LatLng(47.672824,-122.1957);
  var mapOptions = {
    center: myLatlng,
    zoom: 14
  };

  var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

  var marker = new google.maps.Marker({
    position: myLatlng,
    map: map,
    title: 'Hello World!'
  });

  google.maps.event.addListener(map, 'center_changed', function() {
    // 0.1 seconds after the center of the map has changed,
    // set back the marker position.
    window.setTimeout(function() {
      var center = map.getCenter();
      marker.setPosition(center);
    }, 0);
  });
}

google.maps.event.addDomListener(window, 'load', initialize);

