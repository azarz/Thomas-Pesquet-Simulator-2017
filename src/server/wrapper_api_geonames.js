/*
les différentes librairies utilisées
http : pour créer le serveur
express : pour faciliter l'écriture bas niveau de node
fast-xml-parser : pour convertir le string xml du serveur en xml
puis convertir ce xml en json
*/
var http = require('http');
var express = require('express');
var fastXmlParser = require('fast-xml-parser');
var url = require('url');
var querystring = require('querystring');
var app = express();


app.get("/", function (req, res) {
    var params = querystring.parse(url.parse(req.url).query);
  // on ouvre un serveur
    var options = {
        hostname: "api.geonames.org",
        method : 'GET',
        path: create_path_geonames(params['lat'],params['lng'])
    };

    var gsaReq = http.get(options, function (response) {
        console.log('envoi d\' une requête au serveur');
        var completeResponse = '';
        response.on('data', function (chunk) {
            completeResponse += chunk;
        });
        response.on('end', function() {
            console.log('réponse du serveur reçu');
            var jsonObj = fastXmlParser.parse(completeResponse);
            console.log('Convertissement XML to JSON terminé');
            console.log(jsonObj);
            res.jsonp(JSON.stringify(jsonObj));
            res.end();
        })
    }).on('error', function (e) {
        console.log('problem with request: ' + e.message);
        res.write('problem with request: ' + e.message);
    });
});

function create_path_geonames(lat,lng){
    var path = '/extendedFindNearby?lat='
    path    += lat +'&lng='
    path    += lng
    path    += '&username=arnaudgregoire'
    console.log("requête envoyé à l'url : " + path);
    return path
}

app.listen(8080);
