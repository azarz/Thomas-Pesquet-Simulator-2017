function init() {
    // On initialise la carte
    var mymap = L.map('mapid').setView([0.0, 0.0], 13);

    navigator.geolocation.getCurrentPosition(function (position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude
        mymap.setView([lat, lon], 13);
        var marker = L.marker([lat, lon]).addTo(mymap);
        marker.bindPopup("<b>Coucou</b><br>Vous êtes ici").openPopup();
    });

    var couche_res = L.featureGroup()
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mymap);


    var champRech = document.getElementById('form');
    var champ = document.getElementById('champRech');
    var resultatRecherche = [];

    champRech.addEventListener('submit', function(e){
    e.preventDefault();

    var ajax = new XMLHttpRequest();

    ajax.addEventListener('readystatechange',  function(e) {
        // si l'état est le numéro 4 et que la ressource est trouvée
        if(ajax.readyState == 4 && ajax.status == 200) {
            // le texte de la réponse
            resultatRecherche = JSON.parse(ajax.responseText);
        }
    });

    // données POST éventuelles de la requête AJAX
    console.log("https://maps.googleapis.com/maps/api/geocode/json?address="+champ.value);
    ajax.open("POST","https://maps.googleapis.com/maps/api/geocode/json?address="+champ.value,true);

    // envoi de la requête
    ajax.send();

    couche_res.clearLayers()
    couche_res = L.featureGroup()
    for(var i = 0; i < resultatRecherche.results.length; i++){
    var lat = resultatRecherche.results[i].geometry.location.lat;
    var lon = resultatRecherche.results[i].geometry.location.lng;
    var marker = L.marker([lat, lon]).addTo(couche_res);
    }

    couche_res.addTo(mymap);
    mymap.fitBounds(couche_res.getBounds())
    });
}

/**************** Gestion de l'affichage des flux wms *****************************/

function openWMS(){
    // On affiche le fond de carte
    var urls = [ "http://gcweb.geoconcept.com/gws/wmts" ];
    var layer = new GCUI.Layer.GeoConcept("GeoConcept Layer", urls, {
            layer : 'France',
    });
    layer.events.on({
            'init' : function() {
                map.zoomTo(2.5);
                map.setCenter(new OpenLayers.LonLat(376030,2279186));
            },
            'move' : function() {
                $('#dialogFam').hide();
                $('#dialog').hide();
            }
    });
    map.addLayer(layer);
}


/**************** Gestion du rafraichissement *****************************/

function timeoutUpdateDate(timeOut) {
    setTimeout(function () {
        //...
        timeoutUpdateDate(timeOut);
    }, timeOut);
}