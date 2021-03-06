//************* Variables globales ********************

var timeout = 1000;         //période de rafraichissement, en ms
var zoom = 7;               //niveau de zoom
var polyColor = 'black';    //couleur de la trace de l'ISS
var wrapperEnabled = true;  //utilisation ou non du wrapper d'api pour un positionnement précis
var use_debug_loc = true;   //utilisaton de l'API de localisation personalisée


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
var tweetDiv;    //div du tweet
var closeIcon;   //icone de fermeture du popup
var locBtn;      //bouton pour utiliser ou non l'API de localisation maison
var vitTxt;      //texte du facteur de vitesse pour l'API maison
var factVitDiv;  //div du facteur de vitesse


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
    locBtn = document.getElementById("cboxLocAPI");
    vitTxt = document.getElementById("vitTxt");
    factVitDiv = document.getElementById("facteurVitDiv");

    //On cache le popup de tweet
    tweetDiv.style.visibility = "hidden";


    //**** Ecouteurs d'évènements
    //Mise en place des écouteurs d'évènements pour le zoom (sur la liste de boutons radio pour pouvoir en ajouter/supprimer facilement)
    for(i=0; i < radioZoom.length; i++){
        radioZoom[i].addEventListener("click", function() {
            setZoom(radioZoom);
        });
    }

    //Mise en place de l'écouteur de validation de formulaire
    formTCP.addEventListener('submit', tweetCP, false);

    //Mise en place de l'écouteur de fermeture de popup
    closeIcon.addEventListener('click', hidePopup);

    //Mise en place de l'écouteur de changement d'API de loalisation
    locBtn.addEventListener('click', changeLocAPI);


    // On initialise la carte aux coordonnées 0,0
    map = new L.map('mapid').setView([0.0, 0.0], zoom);
    lastLong = 0;
    lastLat = 0;

    //initialisation du zoom
    setZoom(radioZoom);

    //initialisation de l'utilisetion de l'API de localisation
    changeLocAPI();


    //Chargement du fond de carte
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiYXphcnoiLCJhIjoiY2l5bXNrNXduMDA0MTJ3czcyOW04a2JpNSJ9.woYeTStDyhiL0p3Obd4kqA'
    }).addTo(map);


    //Gestion des requêtes AJAX
    var request = new XMLHttpRequest();
    request.addEventListener('readystatechange',  function() {
            majAJAX(request);
        });

    // première requête de position de l'ISS
    getISSPosition(request, true);

    //Rafraichissement
    timeoutUpdateDate(timeout, request);
}




/************* Appel de l'API de localisation **********************/
function getISSPosition(xhr, first_co){

    // Si l'on utilise le service en ligne
    if (!use_debug_loc){
        // requête de position de l'ISS
        xhr.open("GET","http://api.open-notify.org/iss-now.json", true);

    //Si l'on utilise l'API locale
    } else {
        // requête de position de l'ISS
        // De manière synchrone car sinon, un redémarrage du serveur alors qu'une page a envoyé des requêtes empêche le serveur de fonctionner
        xhr.open("GET","http://127.0.0.1:8000/?f_vitesse=" + vitTxt.value + "&first_co=" + first_co, false);
    }

    // envoi de la requête
    xhr.send();
}




/**************** Gestion du rafraichissement des données *****************************/

function timeoutUpdateDate(timeOut, req) {
    setTimeout(function () {
        getISSPosition(req, '');
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

        //Si la polyline est n'xiste pas, ou si on change de signe en longitude (aux valeurs fortes, > 150), on l'initailise
        if(!polyline || (lastLong && (Math.sign(lastLong) != Math.sign(lonISS)) && Math.abs(lonISS) > 150)){
            polyline = new L.polyline(latlng, {color: polyColor});
            polyline.addTo(map);
        }

        //On lui ajoute la dernière position
        polyline.addLatLng(latlng);

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

    // On empêche le comportement par défaut
    event.preventDefault();

    // Paramètres de l'image aérienne : token = clef d'accès, bearing et pitch : angles de rotation de l'image
    var token = 'pk.eyJ1IjoiYXphcnoiLCJhIjoiY2l5bXNrNXduMDA0MTJ3czcyOW04a2JpNSJ9.woYeTStDyhiL0p3Obd4kqA';
    var bearing = Math.random()*360;
    var pitch = Math.random()*60;

    // Construction de l'URL
    var imgUrl = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/" + lastLong + "," + lastLat + "," + zoom + "," + bearing + "," + pitch + "/200x355?access_token=" + token;

    // On charge l'image dans le HTML
    tweetImg.src = imgUrl;

    // On utilise le wrapper ou non en fonction des paramètres
    if(wrapperEnabled){
        var placeUrl = "http://127.0.0.1:8080/?lat=" + lastLat + "&lng=" + lastLong;
    } else{
        var placeUrl = "http://api.geonames.org/findNearbyPlaceNameJSON?lat=" + lastLat + "&lng=" + lastLong + "&username=azarz";
    }

    // Personnalisation du message (fichier messages.json du dossier server)
    var messageRequest= new XMLHttpRequest();
    var beforeLoc;
    var afterLoc;
    messageRequest.addEventListener('readystatechange',  function() {
        // si l'état est le numéro 4 et que la ressource est trouvée
        if(messageRequest.readyState == 4 && messageRequest.status == 200) {
            //récupération de la liste de messages possibles
            var messList = JSON.parse(messageRequest.responseText);
            //choix aléatoire d'un message
            var id = Math.random() * messList.length;
            id = Math.floor(id);
            var mess = messList[id];

            beforeLoc = mess.before;
            afterLoc = mess.after;
        }
    });


    // Requête pour le nom du lieu proche
    var placeRequest = new XMLHttpRequest();
    placeRequest.addEventListener('readystatechange',  function() {
        // si l'état est le numéro 4 et que la ressource est trouvée
        if(placeRequest.readyState == 4 && placeRequest.status == 200) {
            //récupération de la position et des noms associés
            var location = JSON.parse(placeRequest.responseText);
            var name;
            var country;
            var ocean;
            //Si on trouve un lieu non océanique
            if(wrapperEnabled && location.geonames.geoname){
                length = location.geonames.geoname.length;
                name = location.geonames.geoname[length - 1].name;
                country = location.geonames.geoname[length - 1].countryName;

            // Si l'on trouve un océan
            } else if(wrapperEnabled && location.geonames.ocean){
                ocean = location.geonames.ocean.name;

            // Si le wrapper n'est pas activé
            } else if(!wrapperEnabled && location.geonames[0]){
                name = location.geonames[0].name;
                country = location.geonames[0].countryName;

            //Si rien n'est trouvé, on a un nom par défaut
            } else{
                name = "Earth";
                country = "Planet";
            }

            // requête pour le message (fichier messages.json du dossier server)
            messageRequest.open("GET", "server/messages.json", false);   // De manière synchone car on se sert du résultat ensuite
            //envoi de la requête
            messageRequest.send();


            //si on est au dessus d'un océan (variable ocean définie), on utilise son nom
            var message = '';
            if(ocean){
                message = beforeLoc + "<b>#" + ocean + "</b>" + afterLoc;

            //Sinon, comportement par défaut
            }else{
                message = beforeLoc + "<b>#" + name + ", " + country + "</b>" + afterLoc;
            }

            // On charge le message dans le HTML
            tweetMsg.innerHTML = message;

            // On affiche le tweet
            tweetDiv.style.visibility = "visible";
        }
    });

    // requête pour la localisation
    placeRequest.open("GET", placeUrl, true);
    // envoi de la requête
    placeRequest.send();
}



//Écouteur pour la fermeture du popup de tweet
function hidePopup(){
    tweetDiv.style.visibility = "hidden";
} 


//Écouteur pour le changement d'API de localisation
function changeLocAPI(){

    use_debug_loc = locBtn.checked;

    // Changement de la couleur de la polyligne
    if(locBtn.checked){
        polyColor = 'red';
        factVitDiv.style.visibility = "visible";
    } else{
        polyColor = 'black';
        factVitDiv.style.visibility = "hidden";
    }

    // Création d'une nouvelle polyligne
    var lastLatlng = L.latLng(lastLat, lastLong);
    polyline = null;
}