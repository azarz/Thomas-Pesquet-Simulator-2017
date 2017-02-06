/************ Modules ********************/

var http = require('http');                     // Pour le serveur http
var fastXmlParser = require('fast-xml-parser'); // Pour parser les string en xml puis en json
var url = require('url');                       // Pour accéder au serveur par URL
var querystring = require('querystring');       // Pour parser et formater les requêtes URL
var express = require('express');               // Pour simplifier l'écriture du code
var cors = require('cors');                     // Pour pouvoir éviter l'erreur due au Access-Control-Allow-Origin

var app = express();                            


app.use(cors()); 

app.get("/", function (req, res) {
    var params = querystring.parse(url.parse(req.url).query);

    // Options pour se connecter à l'API geonames
    var options = {
        hostname: "api.geonames.org",
        method : 'GET',
        path: genomamesURL(params['lat'], params['lng'])
    };

    var gsaReq = http.get(options, function (response) {
        console.log("Envoi de requête à l'API Geonames...");

        //Construction de la réponse de manière itérative
        var responseXML = '';
        response.on('data', function (chunk) {
            responseXML += chunk;
        });

        response.on('end', function() {
            console.log('Conversion en JSON...');
            var responseJSON = fastXmlParser.parse(responseXML);
            res.status(200).json(responseJSON);
            console.log("Done");
            console.log("");
        })

    }).on('error', function (e) {
        console.log('problem with request: ' + e.message);
        res.write('problem with request: ' + e.message);
    });
});


function genomamesURL(lat,lng){
    var path = '/extendedFindNearby?lat='
    path += lat +'&lng='
    path += lng
    path += '&username=azarz'
    return path
}


// On utilise le port 8080
app.listen(8080);
