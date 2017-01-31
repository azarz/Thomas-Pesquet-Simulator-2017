function init() {
    // On initialise la carte
    var mymap = L.map('mapid').setView([0.0, 0.0], 13);

    var lat = 0;
    var lon = 0;
    var positionISS = null;
    mymap.setView([lat, lon], 13);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mymap);

/*
    var champRech = document.getElementById('form');
    var champ = document.getElementById('champRech');
    var positionISS = [];

    champRech.addEventListener('submit', function(e){
    e.preventDefault();
*/
    var ajax = new XMLHttpRequest();

    ajax.addEventListener('readystatechange',  function(e) {
        // si l'état est le numéro 4 et que la ressource est trouvée
        if(ajax.readyState == 4 && ajax.status == 200) {
            // le texte de la réponse
            positionISS = JSON.parse(ajax.responseText);
            var latISS = positionISS.iss_position.latitude;
            var lonISS = positionISS.iss_position.longitude;
            var marker = L.marker([latISS, lonISS]).addTo(mymap);
            mymap.setView([latISS, lonISS], 13);
        }
    });

    // données GET éventuelles de la requête AJAX
    ajax.open("GET","http://api.open-notify.org/iss-now.json",true);

    // envoi de la requête
    ajax.send();

}

/**************** Gestion du rafraichissement *****************************/

function timeoutUpdateDate(timeOut) {
    setTimeout(function () {
        //...
        timeoutUpdateDate(timeOut);
    }, timeOut);
}