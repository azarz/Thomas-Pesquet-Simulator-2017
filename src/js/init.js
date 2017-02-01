//************* Variables globales ********************

var timeout = 1000; //période de rafraichissement, en ms
var zoom = 4;       //niveau de zoom



//icone de marker personalisée
var issIcon = L.icon({
    iconUrl: 'img/logo_ISS.png',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
});



function init() {
    // On initialise la carte
    var map = new L.map('mapid').setView([0.0, 0.0], zoom);
    var marker;
    var polyline;
    var lastLong;

    //récupération des éléments HTML
    var latlontxt = document.getElementById("latlontxt");
    var suiviBtn = document.getElementById("cboxSuivi");

    var lat = 0;
    var lon = 0;
    var positionISS = null;
    map.setView([lat, lon], 13);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.outdoors',
    accessToken: 'pk.eyJ1IjoiYXphcnoiLCJhIjoiY2l5bXNrNXduMDA0MTJ3czcyOW04a2JpNSJ9.woYeTStDyhiL0p3Obd4kqA'
}).addTo(map);

    var ajax = new XMLHttpRequest();

    ajax.addEventListener('readystatechange',  function(e) {
        // si l'état est le numéro 4 et que la ressource est trouvée
        if(ajax.readyState == 4 && ajax.status == 200) {

            //S'il y a déjà un marker, on le retire
            if(marker){
                map.removeLayer(marker);
            }

            //On met à jour la position de l'ISS
            positionISS = JSON.parse(ajax.responseText);
            var latISS = positionISS.iss_position.latitude;
            var lonISS = positionISS.iss_position.longitude;

            //On ajoute notre marker
            marker = new L.marker([latISS, lonISS], {icon: issIcon});
            marker.addTo(map);
            var latlng = L.latLng(latISS, lonISS);

            //Si la polyline est nulle, ou si on change de signe en longitude (aux valeurs fortes, > 100), on l'initailise

            if(!polyline || (lastLong && (Math.sign(lastLong) != Math.sign(lonISS)) && Math.abs(lonISS) > 100)){

                polyline = new L.polyline(latlng, {color: 'black'});

            //Sinon, on lui ajoute la dernière position
            } else{
                polyline.addLatLng(latlng);
            }
            polyline.addTo(map);

            //On déplace notre caméra le cas échéant
            if(suiviBtn.checked){
                map.setView([latISS, lonISS], zoom);
            }

            //On met à jour le texte
            latlontxt.innerHTML = latISS + ", " + lonISS;

            //on stocke la dernière longitude (pour le passage à -180°)
            lastLong = lonISS;
        }
    });

/*
    var champRech = document.getElementById('form');
    var champ = document.getElementById('champRech');
    var positionISS = [];

    champRech.addEventListener('submit', function(e){
    e.preventDefault();
*/

    timeoutUpdateDate(timeout, ajax);
}


/**************** Gestion du rafraichissement *****************************/

function timeoutUpdateDate(timeOut, req) {
    setTimeout(function () {
        // données GET éventuelles de la requête AJAX
        req.open("GET","http://api.open-notify.org/iss-now.json",true);
        // envoi de la requête
        req.send();
        timeoutUpdateDate(timeOut, req);
    }, timeOut);
}