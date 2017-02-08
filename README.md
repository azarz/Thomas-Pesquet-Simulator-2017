# Thomas-Pesquet-Simulator-2017

Mini-projet web IT2 de Terry Moreau et Amaury Zarzelli

Simulateur réaliste des sensations d'un spationaute français dans la Station Spatiale Internationale.

## Comment utiliser ?

Avoir Node.js installé sur sa machine est nécessaire.
Utiliser un navigateur compatible avec HTML5 (normalement cela ne devrait pas poser problème).

### Windows

+ Lancer le ficher launch_server.bat situé dans la racine. Cela a pour effet de lancer les 2 services Node.js utiles au fonctionnment de la page.

+ Ouvrir la page html nommé index.html dans le dossier src. Cela fonctionne en local (mode fichier), car seul des applications JavaScript locales sont utilisées, mais il est toujours préférable d'utiliser un serveur http local (EasyPHP par exemple)

+ Dans la page, vous pouvez utiliser ou non la localisation simulée, permettant d'obtenir une vitesse de l'ISS personalisée (bouton "Utiliser l'API de localisation faite maison". Sinon, la position réelle de l'ISS sera utilisée.

+ Vous pouvez maintenant ressentir toute la joie d'un membre de l'ISS accro à Twitter en cliquant sur le bouton "Je tweete" au dessus de votre ville préférée, avec le niveau de zoom souhaité.

### Autres systèmes d'exploitation

La première étape doit être faite à la main : lancer la commande
```shell
$ node loc.js
```
dans un terminal placé dans le dossier src/server, et, dans un autre terminal situé dans le même dossier, lancer la commande
```shell
$ node geonames_wrapper.js
```
