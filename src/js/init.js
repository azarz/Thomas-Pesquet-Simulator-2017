function init() {
    // On initialise la carte
    map = new OpenLayers.Map('map', {
            projection : new OpenLayers.Projection("EPSG:27572"),
            maxExtent : new OpenLayers.Bounds(5000, 1620000, 1198000, 2678000),
    });
    var layer_switcher = new OpenLayers.Control.LayerSwitcher();
    map.addControl(layer_switcher);
    layer_switcher.maximizeControl();
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