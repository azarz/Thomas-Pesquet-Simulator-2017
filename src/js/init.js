//************* Variables globales ********************

var timeout = 1000; //période de rafraichissement, en ms
var zoom = 7;       //niveau de zoom
var polyColor = 'lightblue'; //couleur de la trace de l'ISS


//icone de marker personalisée
var issIcon = L.icon({
    iconUrl: 'img/logo_ISS.png',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
});


//fonction lancée au chargement de la page
window.onload = init;


//éléments HTML du DOM
var latlontxt;   //texte de latitude, longitude
var suiviBtn;    //bouton pour suivre ou non l'ISS
var radioZoom;   //Ensemble des boutons radios pour le zoom
var formTCP;     //forumlaire pour tweeter
var tweetMsg;    //message du tweet
var tweetImg;    //image du tweet
var tweetDiv;
var closeIcon;   //icone de fermeture du popup


//éléments cartographiques
var map;        //carte
var marker;     //le marqueur représentant l'ISS
var polyline;   //la polyligne représentant sa trajectoire
var lastLong;   //la dernière longitude connue
var lastLat;    //la dernière latitude connue



/**************** Initialisation de la page *****************************/

function init() {

    //récupération des éléments HTML
    latlontxt = document.getElementById("latlontxt");
    suiviBtn = document.getElementById("cboxSuivi");
    radioZoom = document.getElementsByName("zoom");
    formTCP = document.getElementById("tcpForm");
    tweetMsg = document.getElementById("tweetMsg");
    tweetImg = document.getElementById("tweetImg");
    tweetDiv = document.getElementById("tweetDiv");
    closeIcon = document.getElementById("closeIcon");

    //On cache le popup de tweet
    tweetDiv.style.visibility='hidden';


    //Mise en place des écouteurs d'évènements pour le zoom (sur la liste de boutons radio pour pouvoir en ajouter/supprimer facilement)
    for(i=0; i < radioZoom.length; i++){
        radioZoom[i].addEventListener("click", function() {
            setZoom(radioZoom);
        });
    }

    //Mise en place de l'écouteur de validation de formulaire
    formTCP.addEventListener('submit', tweetCP, false)

    //Mise en plce de l'écouteur de fermeture de popup
    closeIcon.addEventListener('click', hidePopup);


    // On initialise la carte aux coordonnées 0,0
    map = new L.map('mapid').setView([0.0, 0.0], zoom);
    lastLong = 0;
    lastLat = 0;


    //Chargement du fond de carte
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.satellite',
        accessToken: 'pk.eyJ1IjoiYXphcnoiLCJhIjoiY2l5bXNrNXduMDA0MTJ3czcyOW04a2JpNSJ9.woYeTStDyhiL0p3Obd4kqA'
    }).addTo(map);


    //Gestion des requêtes AJAX
    var request = new XMLHttpRequest();
    request.addEventListener('readystatechange',  function() {
            majAJAX(request);
        });

    //Rafraichissement
    timeoutUpdateDate(timeout, request);
}







/**************** Gestion du rafraichissement des données *****************************/

function timeoutUpdateDate(timeOut, req) {
    setTimeout(function () {
        // données GET éventuelles de la requête AJAX
        req.open("GET","http://api.open-notify.org/iss-now.json",true);
        // envoi de la requête
        req.send();
        timeoutUpdateDate(timeOut, req);
    }, timeOut);
}





/**************** Fonction de mise à jour de la position de l'ISS *****************************/

function majAJAX(ajax) {
        // si l'état est le numéro 4 et que la ressource est trouvée
        if(ajax.readyState == 4 && ajax.status == 200) {

            //S'il y a déjà un marker, on le retire
            if(marker){
                map.removeLayer(marker);
            }

            //On met à jour la position de l'ISS
            var positionISS = JSON.parse(ajax.responseText);
            var latISS = positionISS.iss_position.latitude;
            var lonISS = positionISS.iss_position.longitude;

            //On ajoute notre marker
            marker = new L.marker([latISS, lonISS], {icon: issIcon});
            marker.addTo(map);
            var latlng = L.latLng(latISS, lonISS);

            //Si la polyline est nulle, ou si on change de signe en longitude (aux valeurs fortes, > 100), on l'initailise
            if(!polyline || (lastLong && (Math.sign(lastLong) != Math.sign(lonISS)) && Math.abs(lonISS) > 100)){
                polyline = new L.polyline(latlng, {color: polyColor});
                polyline.addTo(map);

            //Sinon, on lui ajoute la dernière position
            } else{
                polyline.addLatLng(latlng);
            }

            //On déplace notre caméra le cas échéant
            if(suiviBtn.checked){
                map.setView([latISS, lonISS], zoom);
            }

            //On met à jour le texte
            latlontxt.innerHTML = latISS + ", " + lonISS;

            //on stocke la dernière latitude et longitude
            lastLat = latISS;
            lastLong = lonISS;
        }
    }









/**************** Fonctions d'écouteurs d'évènement *****************************/


//Écouteur pour le changement de zoom
function setZoom(e){
    for(i = 0; i < e.length; i++){
        //Si le radioButton est checké, on change le zoom
        if(e[i].checked){
            zoom = e[i].value;
        }
    }
    map.setZoom(zoom);
}


//Écouteur pour la validation du tweet
function tweetCP(event){
    event.preventDefault();

    var token = 'pk.eyJ1IjoiYXphcnoiLCJhIjoiY2l5bXNrNXduMDA0MTJ3czcyOW04a2JpNSJ9.woYeTStDyhiL0p3Obd4kqA';
    var bearing = Math.random()*360;
    var pitch = Math.random()*60;

    var imgUrl = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/" + lastLong + "," + lastLat + "," + zoom + "," + bearing + "," + pitch + "/200x355?access_token=" + token;

    tweetImg.src = imgUrl;

    var placeUrl = "http://api.geonames.org/findNearbyPlaceNameJSON?lat=" + lastLat + "&lng=" + lastLong + "&username=azarz";


    var placeRequest = new XMLHttpRequest();
    placeRequest.addEventListener('readystatechange',  function() {
            //récupération de la position et des noms associés
            console.log(placeRequest.responseText);
            var location = JSON.parse(placeRequest.responseText);
            var name;
            var country;
            //Si on trouve un lieu
            if(location.geonames[0]){
                name = location.geonames[0].name;
                country = location.geonames[0].countryName;
            //Si rien n'est trouvé, on a un nom par défaut
            } else{
                name = "World";
                country = "hello"
            }

            var message = "Hello " + name + ", " + country;

            tweetMsg.innerHTML = message;

            tweetDiv.style.visibility='visible';
        });

    // données GET éventuelles de la requête AJAX
    placeRequest.open("GET", placeUrl, true);
    // envoi de la requête
    placeRequest.send();
}



//Écouteur pour la fermeture du popup de tweet
function hidePopup(){
    tweetDiv.style.visibility='hidden';
} 