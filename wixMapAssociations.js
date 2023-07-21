// Référence API Velo : https://www.wix.com/velo/reference/api-overview/introduction

import wixData from 'wix-data';
import wixWindow from 'wix-window';

$w.onReady(function () {
    var latitude, longitude, oldLat, oldLong;
    var userGeolocalisation = false, listTab = false, mapTab = true;
    var left, right, bottom, top;
    var markers, markersWixItems;
    var filter, centreloc, zoom;

    // Tabs - Onglets
    // Default behavior
    $w("#repeter").delete();
    $w("#html2").show();
    // List
    $w("#button5").onClick((event) => {
        listTab = true;
        mapTab = false
        $w("#html2").hide();
        searchLocation("button");
        listAssociationAvecFiltre("button");
        $w("#repeter").restore();
        $w("#repeter").show('fade', { duration: 700 });
    });
    // Map
    $w("#button6").onClick((event) => {
        listTab = false;
        mapTab = true;
        $w("#repeter").delete();
        $w("#html2").show('fade', { duration: 700 });
    });
    // Filter
    /*$w("#button7").onClick((event) => {
        if($w("#box6").isVisible){
            $w("#box6").hide('fade', { duration: 500 }).then(() => {});
        } else {
             $w("#box6").show('fade', { duration: 500 }).then(() => {});
        }
    }); */
    
    // WINDOWS -------------------
    // Appel de la fonction pour récupérer la géolocalisation
    //getGeolocation();
    // Fonction pour récupérer la géolocalisation
    function getGeolocation() {
        wixWindow.getCurrentGeolocation()
        .then((position) => {
            // Succès : position géographique récupérée
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            //console.log('User Géolocalisation - Latitude:', latitude);
            //console.log('User Géolocalisation - Longitude:', longitude);
            searchLocation("button");
        })
        .catch((error) => {
            // Erreur : impossible de récupérer la position géographique
            console.error('Erreur de géolocalisation:', error);
        });
    }
  
    // FILTRES - MARKERS--------
    // Par default cacher le texte "aucune association"
    $w("#textNoAsso").hide();
    
    // Récupération des filtres 
    function filterValues(){
        // Récupère les valeurs du filtre
        var radius = $w("#slider3").value;
        zoom = radius;
        //console.log(typeof radius);
        console.log("zoomSlider : "+radius);
        radius = convertZoomToKilometers(radius);
        console.log("convertZoomToKilometers : "+ radius);
        // Récupérer la valeur unique de la case à cocher sélectionnée
        //var activityCheckbox = $w('#checkboxGroup1').value.toString();
        // Récupération des valeurs des Tags Catégories
        var activityCheckbox = $w('#selectionTags1').value.toString();
        //console.log("filterValues - activityCheckbox  "+activityCheckbox);
        //let valeursActivites = activityCheckbox.split(","); // Convertit la chaîne en tableau
        let valeursActivites = activityCheckbox.split(",").map(function(item) {
            return item.trim();
          });
        //console.log("1.valeursActivites : "+valeursActivites);
        //console.log("valeursActivites.length : "+valeursActivites.length);
        
        filter = {
            radius: radius,
            categories: valeursActivites,
            numberCategories: valeursActivites.length
        }
        return filter;
    }
    filter = filterValues();
    findAllAsso(filter);
    
    //Chercher dans la base de données les associations validées et les envoyer à l'html OpenStreetMap - OpenLayers
    function findAllAsso(filter){
        var valeurCategorie = "";
        if(filter.numberCategories === 1){
            valeurCategorie = filter.categories[0].toString();
            //console.log("valeurCategorie : "+valeurCategorie);
        }
        //console.log("filter.categories.length : "+filter.categories.length);

        wixData.query("Locations")
            .eq("validee", "true")
            .contains("categorie1", valeurCategorie)
            .ne("lat", 0) // Exclusion des associations sans coodonnées latitude et longitude renseignées en bdd
            .ne("lng", 0)
            .limit(1000) // Spécifiez la limite pour récupérer toutes les lignes
            .find()
            .then((results) => {
                // Créer un tableau de marqueurs à partir des résultats de la requête
                markers = results.items.map(item => ({
                    _id: item._id,
                    id: item.id,
                    name: item.title,
                    address: item.adresseSiege,
                    lat: item.lat,
                    lng: item.lng,
                    categorie: item.categorie1,
                    description: item.description,
                    logo: item.logo,
                    website: item.website
                }));
                markersWixItems = results.items; // Tableau des objets résultants
                //const count = markersWixItems.length; // Nombre d'objets dans le tableau
                //console.log("Nombre d'objets dans markersWixItems: " + count);

                //console.log("=====> findAllAsso, nombre de markers : "+markers.length);

                if(filter.numberCategories > 1){
                    let markersFilteredCategories = [];
                    let markersWixFilterdCategories = [];
                    markersFilteredCategories = findMarkersByCategories(markers, filter, markersWixItems, markersWixFilterdCategories);
                    markers = markersFilteredCategories;
                    markersWixItems = markersWixFilterdCategories;
                }
                // Envoyer les marqueurs à l'élément HTML en utilisant postMessage
                $w('#html2').postMessage({ type: 'ADD_MARKERS', data: markers });             
                //searchLocation("button");                
            })
            .catch((error) => {
                let errorMsg = error.message;
                let code = error.code;
                console.error("findAllAsso Error : "+code +" : "+errorMsg);
            });
    }
    
    function findMarkersByCategories(markers, filter, markersWixItems, markersWixFilterdCategories) {
        //console.log("findMarkersByCategories");
        let arrayMarkersCopy = [];
        for(let i=0;i<markers.length;i++){
            if (filter.categories.some(category => markers[i].categorie.includes(category))) {
              arrayMarkersCopy.push(markers[i]);
              markersWixFilterdCategories.push(markersWixItems[i]);
            }
        }       
        //console.log("findMarkersByCategories : " + arrayMarkersCopy.length);
        return arrayMarkersCopy;
    }

    //Click bouton Loupe - Recherche ville, centre la carte sur la location cherchée
    $w("#button4").onClick((event) => {
        userGeolocalisation = false;
        searchLocation("button");
    })
    // Géolocalisation de l'utiisateur : centre la carte sur la localisation de l'utilisateur
    $w("#button3").onClick((event) => {
        userGeolocalisation = true;
        getGeolocation();
    })
    // Changement de valeur du slider
    $w("#slider3").onChange((event) => {
        let sliderValue = event.target.value;
        var maxZoom = $w("#slider3").max; // Récupérer la valeur maximale du slider
        var zoom = maxZoom - sliderValue; // convertKilometersToZoom(sliderValueKilometers, maxValue);
        //console.log("La valeur du slider a changé : " + zoom);
        
        $w('#html2').postMessage({ 
            type: 'ZOOM_LEVEL', zoom: zoom
        });

        if(listTab == true){
            console.log("#slider3 - listTab == true");
            searchLocation("button");
            listAssociationAvecFiltre("button");
        }
    });

    // Tag Catégories
    $w('#selectionTags1').onChange(function (event) {
        // Récupérez la valeur sélectionnée
        var selectedValue = event.target.value.length;
        //console.log("$w('#selectionTags1').length : "+selectedValue);
        if(selectedValue == 0){
            markers = [];
            $w('#html2').postMessage({ type: 'ADD_MARKERS', data: markers });
        }else{
            // Recupérer les markers correspondants au filtre
            filter = filterValues();
            findAllAsso(filter);
        }
        
          
    });

    // Checkbox Catégories
    /*$w('#checkboxGroup1').onChange((event) => {
        //let checkboxValues = event.target.value; // Récupération des valeurs des checkboxes sélectionnées
        //console.log("checkboxValues : "+checkboxValues);
        // Recupérer les markers correspondants au filtre
        filter = filterValues();
        findAllAsso(filter);        
     }); */

    // Slider : Convertion d'une la valeur du slider Zoom OpenLayers (0 -> 18) en kilometre 
    function convertZoomToKilometers (zoom){
        zoom = 18 - zoom;
        var distance;
        
        switch (zoom) {
            case 0:
                distance = 10000;
                break;
            case 1:
                distance = 5000;
                break;
            case 2:
                distance = 2500;
                break;
            case 3:
                distance = 1000;
                break;
            case 4:
                distance = 500;
                break;
            case 5:
                distance = 250;
                break;
            case 6:
                distance = 125;
                break;
            case 7:
                distance = 80;
                break;
            case 8:
                distance = 50;
                break;
            case 9:
                distance = 35;
                break;
            case 10:
                distance = 30;
                break;
            case 11:
                distance = 25;
                break;
            case 12:
                distance = 20;
                break;
            case 13:
                distance = 15;
                break;
            case 14:
                distance = 10;
                break;
            case 15:
                distance = 7;
                break;
            case 16:
                distance = 5;
                break;
            case 17:
                distance = 3;
                break;
            case 18:
                distance = 1;
                break;
            default:
                distance = 60; // zoom 7 - Valeur par défaut si le zoom est invalide
                break;
        }
        return distance;
    }

    // Centrer la carte en fonction de la recherche géographique
    function searchLocation(comeFrom){
        
        let $lat;
        let $lng;
        // Récupèration des valeurs du filtre
        filter = filterValues();
        
        // Adresse recherchée
        if(comeFrom === "button"){
            //console.log("comeFrom : "+comeFrom);

            // Utilisation des données long/lat de la fonction getGeolocation
            if(userGeolocalisation === true){
                console.log("userGeolocalisation === true");
                //console.log("latitude : "+latitude);
                $lat = latitude;
                $lng = longitude;
            } else {
                let $adressSearch = $w('#inputLocation');
                //let address = addressSearch.value;
                try {
                    $lat = $adressSearch.value.location.latitude;
                    $lng = $adressSearch.value.location.longitude;
                } catch (error) {
                    // L'adresse n'est pas valide, par default : Paris
                    console.log("Impossible de géolocaliser l'adresse"); //, routage vers Paris");
                    // Carte : Si pas de input de recherche vie, il ne se passse rien.
                    if(listTab === true) {
                        // List : Permet d'avoir des associations affichées sur la liste
                        latitude = 48.8566;
                        longitude = 2.3522;
                    }
                    return;
                }
            }

            latitude = $lat;
            longitude = $lng;
                
            centreloc = {lat: $lat, lng: $lng};
            
            if(oldLat != latitude || oldLong != longitude  || zoom <= 7 || zoom >= 9){
                console.log("oldLat != latitude || oldLong != longitude. Zoom : "+zoom);
                oldLat = latitude;
                oldLong = longitude;
                // Map OSM
                if(mapTab == true){
                    $w('#html2').postMessage({ 
                        type: 'SEARCH_LOCATION', 
                        data: centreloc,
                        filter: filter
                    });
                } else {
                    //console.log("listAssociationAvecFiltre");
                    listAssociationAvecFiltre(comeFrom);
                }
            } else {
                console.log("oldLat === latitude || oldLong === longitude")
            }
            

        } else if(comeFrom === "moveend"){
            //console.log("comeFrom : "+comeFrom);
            centreloc = {
                left : left,
                bottom : bottom,
                right : right,
                top : top
            }
        }
    }

    // Recupération des markers sans appelle à la bdd
    function listAssociationAvecFiltre(comeFrom) {
        //AFFICHER LES ASSO SOUS FORME DE LISTE
        let repeater = $w('#repeter');
        var filteredFeatures = [];
        // Supprimer tous les éléments
        repeater.data = [];
        let itemsToAdd = [];
        console.log("listAssociationAvecFiltre - markers.length : " + markers.length);
        console.log("filter.radius : "+ filter.radius);
        var index = 0;
        var arrayDistinct = [];
        for(let i=0;i<markers.length;i++){
            if (comeFrom === "button") {
                // Filtre distance
                if (spatialFilter(markers[i])) {
                    if(!arrayDistinct.includes(markers[i].name)){
                        arrayDistinct.push(markers[i].name);
                        filteredFeatures.push(markersWixItems[i]);
                        index++;
                    }
                    
                }
            } else if (comeFrom === "moveend") {
                //Si l'association est affichée sur la carte, alors l'afficher dans la liste
                if (markers[i].lat < right && left < markers[i].lat &&
                    markers[i].lng < top && bottom < markers[i].lng) {
                    if(!arrayDistinct.includes(markers[i].name)){
                        arrayDistinct.push(markers[i].name);
                        filteredFeatures.push(markersWixItems[i]);
                        index++;
                    }
                }
            }
            if(index>100){
                break;
            }
        }

        // Si aucune association dans le périmétre, augmenter le zoom
        /*if (filteredFeatures.length == 0) {
            console.log("Aucune asso dans périmétre. Augmenter Zoom à 12");
            $w("#slider3").value = 12;
            filter.radius = convertZoomToKilometers($w("#slider3").value);
            for(let i=0;i<markers.length;i++){
                if (spatialFilter(markers[i])) {
                    if(!arrayDistinct.includes(markers[i].name)){
                        arrayDistinct.push(markers[i].name);
                        filteredFeatures.push(markersWixItems[i]);
                        index++;
                    }
                    
                }
            }
        } */

        console.log("filteredFeatures.length : " + filteredFeatures.length);
        if (filteredFeatures.length > 0) {
            $w("#textNoAsso").hide();
            
            for (let i = 0; i < filteredFeatures.length; i++) {
                itemsToAdd.push(filteredFeatures[i]);
            }
            //console.log("itemsToAdd.length : " + itemsToAdd.length);
            //console.log("itemsToAdd[0]; : "+JSON.stringify(itemsToAdd[0]));
            //console.log("itemsToAdd[0].title : "+ JSON.stringify(itemsToAdd[0].title));
            
            $w("#repeter").data = itemsToAdd;
            $w("#repeter").forEachItem(($item, itemData, index) => {
                $item("#repeterName").text = itemData.title;
                $item("#repeterCategorie").text = itemData.categorie1;
                $item("#repeterDescription").text = itemData.description;
                $item("#repeterSite").text = itemData.website;
                $item("#repeterLogo").src = itemData.logo;
            });
        } else {
            //Affichage/ désaffichage du texte si aucune association n'est dans le périmètre
            $w("#textNoAsso").show();
        }
    }

    // Filtrer les fonctionnalités qui se trouvent à moins de x mètres du point de référence
    function spatialFilter(feature) {
        var featureLatitude = feature.lat;
        var featureLongitude = feature.lng;
        //console.log("spatialFilter - Name : "+feature.name+" - lat long : "+featureLatitude+" / "+featureLongitude+" / "+latitude+ " / "+ longitude);
        const dist = distance(latitude, longitude, featureLatitude, featureLongitude);
        if(dist < filter.radius){
            //console.log("spatialFilter - Name : "+feature.name+" - "+feature.address+" /  lat long : "+featureLatitude+" / "+featureLongitude+" / "+latitude+ " / "+ longitude+ " // dist : "+dist);
        }
        
        //console.log("distance < radius : "+dist +" < "+ filter.radius);
        return dist < filter.radius; // 200
    }

    // Calculer la distance entre la fonctionnalité et le point de référence
    // * lat1, lon1 = Latitude and Longitude of referencePoint (in decimal degrees)
    // * lat2, lon2 = Latitude and Longitude of featureCoordinates (in decimal degrees)
    function distance(lat1, lon1, lat2, lon2) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        }
        else {
            var radlat1 = Math.PI * lat1/180;
            var radlat2 = Math.PI * lat2/180;
            var theta = lon1-lon2;
            var radtheta = Math.PI * theta/180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
            dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180/Math.PI;
            dist = dist * 60 * 1.1515;
            dist = dist * 1.609344;
            
            return dist;
        }
    }


    $w("#html2").onMessage( (event) => {
        if (event.data.type === "moveend") {
            //console.log("event.data.type === moveend");
            
            let receivedMessage = event.data.value;
            left = receivedMessage.varleft;
            right = receivedMessage.varright;
            bottom = receivedMessage.varbottom;
            top = receivedMessage.vartop;

            listAssociationAvecFiltre("moveend");

        } else if(event.data.type === "loadMarkers") {
            //console.log("event.data.type === loadMarkers : "+markers.length);
            // Recupérer les markers
            $w('#html2').postMessage({ type: 'ADD_MARKERS', data: markers });
        
        } else if(event.data.type === "zoomLevel") {
            var zoom = 18 - event.data.value;
            //console.log("event.data.type : zoomLevel, event.data.value : "+event.data.value+ " / zoom : "+zoom);
            $w("#slider3").value = zoom;
        }

    });
});