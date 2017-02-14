/****** Variables globales ******/

//Paramètres
var factVitesse = 300;

// Propriétés physiques
var rayTerre = 6371e3;				// rayon de la Terre en mètres
var vitISS = 27600/3.6;				// vitesse de l'ISS en mètres par seconde
var altISS = 400e3;					// altitude de l'ISS en mètres
var inclISS = deg2rad(51.64);		// inclinaison de l'ISS en radians


// Initialisation des coordonnées :
var radius = rayTerre + altISS;	// rayon de l'orbite de l'ISS par rapport au centre de la Terre
var azimuth = 0;				// Rotation autour de Z
var polar = deg2rad(90);		// Rotation autour de Y


// Initialisation de la gestion du temps
var date = new Date();
var lastTime;			// dernière date en millisecondes


// Rotation de la Terre
var day = 86400						// période de rotation en secondes
var angularSpeed = 2*Math.PI/day;	// vitesse de rotation de la Terre en rad/s
var rotAngle = 0;





/************ Modules Nodejs ********************/

var http = require('http');                     // Pour le serveur http
var url = require('url');                       // Pour accéder au serveur par URL
var querystring = require('querystring');       // Pour parser et formater les requêtes URL
var express = require('express');               // Pour simplifier l'écriture du code
var cors = require('cors');                     // Pour pouvoir éviter l'erreur due au Access-Control-Allow-Origin
                        
var app = express();

app.use(cors());





/************ Gestion du serveur node ***************/

app.get('/', function (req, res) {

	var params = querystring.parse(url.parse(req.url).query);
	var factVit = params['f_vitesse'];						//facteur de vitesse
	var first_connection = params['first_co'];				//booléen changé côté client

	// Gestion de la première connection
	if(first_connection){
		firstCo();
		console.log("New connection");
	}

    var responseJSON = connect(factVit);

    res.status(200).json(responseJSON);
});



// On utilise le port 8000
app.listen(8000);






/***** Gestion des connexions à l'API ****/

// Première connexion
function firstCo(){
	lastTime = date.getTime();
}

// Connexions suivantes
function connect(factVitesse){

	// Récupération de la date, calcul du deltaT en ms
	date = new Date();
	var deltaT = date.getTime() - lastTime;
	lastTime = date.getTime();

	// Calcul de la variation de distance en mètres par deltaD = vitesse * deltaT
	var deltaD = factVitesse * vitISS * (deltaT/1000);
	var deltaAzimuth = deltaD/radius;

	azimuth += deltaAzimuth;

	// Passage en coodonnées cartésiennes
	X = radius * Math.sin(polar) * Math.cos(azimuth);
	Y = radius * Math.sin(polar) * Math.sin(azimuth);
	Z = radius * Math.cos(polar);

	// Roation des coordonnées
	XYZrot = rotate(X, Y, Z, [0, 1, 0], inclISS);
	X = XYZrot[0];
	Y = XYZrot[1];
	Z = XYZrot[2];

	// Rotation de la Terre
	rotAngle += factVitesse * angularSpeed * (deltaT/1000);
	XYZday = rotate(X, Y, Z, [0, 0, -1], rotAngle);
	X = XYZday[0];
	Y = XYZday[1];
	Z = XYZday[2];


	// Passage aux coordonnées géographiques
	var lat = rad2deg( Math.asin(Z/radius) );
	var lon = rad2deg( Math.atan2(Y,X) );

	return( {iss_position: {
		latitude: parseFloat(lat).toFixed(4),
		longitude: parseFloat(lon).toFixed(4)
	}})
}





function rotate(x, y, z, axis, angle){
	/**
	Rotation 3D d'un vecteur x, y, z autour d'un axe (axis) selon un angle
	*/
	var ux = axis[0];
	var uy = axis[1];
	var uz = axis[2];

	var c = Math.cos(angle);
	var s = Math.sin(angle);

	var matRot = 	[[ ux*ux*(1-c) + c,		ux*uy*(1-c) - uz*s,		ux*uz*(1-c) + uy*s],
					 [ ux*uy*(1-c) + uz*s,	uy*uy*(1-c) + c,		uy*uz*(1-c) + ux*s],
					 [ ux*uz*(1-c) + uy*s,	uy*uz*(1-c) + ux*s,		uz*uz*(1-c) + c]]

	xRot = matRot[0][0]*x + matRot[0][1]*y + matRot[0][2]*z;
	yRot = matRot[1][0]*x + matRot[1][1]*y + matRot[1][2]*z;
	zRot = matRot[2][0]*x + matRot[2][1]*y + matRot[2][2]*z;
	return([xRot, yRot, zRot]);
}



function rad2deg(rad){ 
	/**
	Conversion de radians en degrés
	*/
	return (rad*180/Math.PI)%360; 
}

function deg2rad(deg){ 
	/**
	Conversion de degrés en radians
	*/
	return (deg*Math.PI/180)%(2*Math.PI);
}