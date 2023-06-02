// Source js : https://www.wix.com/velo/reference

import wixData from 'wix-data';
import wixWindow from 'wix-window';

$w.onReady(function () {
    var latitude, longitude;
    var userGeolocalisation = false;
    var left, right, bottom, top;
    var markers, markersWixItems;
    var filter, centreloc;

    // Tabs - Onglets
    // Default behavior
    $w("#box8").hide();
    $w("#html2").show();
    $w("#repeterNameAssociation").hide();

    // List
    $w("#button5").onClick((event) => {
        $w("#html2").hide();
        $w("#box8").show('fade', { duration: 600 }).then(() => {});
    });
    // Map
    $w("#button6").onClick((event) => {
        $w("#box8").hide();
        $w("#html2").show('fade', { duration: 700 }).then(() => {});
    });
    // Filter
    $w("#button9").onClick((event) => {
        if($w("#box1").isVisible){
            $w("#box1").hide('fade', { duration: 500 }).then(() => {});
        } else {
             $w("#box1").show('fade', { duration: 500 }).then(() => {});
        }
    });

    // Liste - Bouton "voir le nom Association"
    $w("#repeter").onItemReady(($item, itemData, index) => {
        const button = $item("#repeterVoirPlus"); // Replace "buttonId" with the actual ID of your button
    
        // Set the onClick event handler for the button
        button.onClick((event) => {
            $w("#repeterNameAssociation").show();
            $w("#repeterVoirPlus").hide();
            // You can access the item data and index if needed
            //console.log("Button clicked in repeater at index:", index);
            //console.log("Item data:", itemData);
        });
    });


    // WINDOWS -------------------
    // Appel de la fonction pour récupérer la géolocalisation
    getGeolocation();
    // Fonction pour récupérer la géolocalisation
    function getGeolocation() {
        wixWindow.getCurrentGeolocation()
        .then((position) => {
            // Succès : position géographique récupérée
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            //console.log('User Géolocalisation - Latitude:', latitude);
            //console.log('User Géolocalisation - Longitude:', longitude);
            userGeolocalisation = true;
        })
        .catch((error) => {
            // Erreur : impossible de récupérer la position géographique
            console.error('Erreur de géolocalisation:', error);
        });
    }

    // FILTRES - MARKERS--------
    // Par default cacher le texte "aucune association"
    $w("#textNoMission").hide();
    
    // Récupération des filtres 
    function filterValues(){
        // Récupère les valeurs du filtre
        var radius = $w("#slider1").value;
        var frequencyRadioGroup = $w('#radioGroup1').value;
        if(frequencyRadioGroup === "noPreference"){ // ponctuel ; recurrent ; noPreference
            frequencyRadioGroup = "";
        }
        // Récupérer la valeur unique de la case à cocher sélectionnée
        var activityCheckbox = $w('#checkboxGroup1').value.toString();
        //console.log("filterValues - activityCheckbox  "+activityCheckbox);
        //let valeursActivites = activityCheckbox.split(","); // Convertit la chaîne en tableau
        let valeursActivites = activityCheckbox.split(",").map(function(item) {
            return item.trim();
          });
        //console.log("1.valeursActivites : "+valeursActivites);
        //console.log("valeursActivites.length : "+valeursActivites.length);
        
        filter = {
            radius: radius,
            frequency: frequencyRadioGroup,
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

        let categorieQuery = wixData.query("Missions")
            .eq("type", "Mission")
            .contains("categorie", valeurCategorie);

        let frequenceQuery = wixData.query("Missions")
            .eq("type", "Mission")
            .contains("frequence", filter.frequency);

        categorieQuery.and(frequenceQuery)
            .limit(1000) // Spécifiez la limite pour récupérer toutes les lignes
            .find()
            .then((results) => {
                // Créer un tableau de marqueurs à partir des résultats de la requête
                markers = results.items.map(item => ({
                    _id: item._id,
                    id: item.id,
                    titreMission: item.title,
                    type: item.type,
                    nameAssociation: item.association,
                    address: item.adresseMission,
                    lat: item.latitude,
                    lng: item.longitude,
                    categorie: item.categorie,
                    description: item.description,
                    frequence: item.frequence,
                    presentiel: item.presentiel
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
                searchLocation("button");                
            })
            .catch((error) => {
                let errorMsg = error.message;
                let code = error.code;
                //console.error("findAllAsso Error : "+code +" : "+errorMsg);
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
    $w("#button7").onClick((event) => {
        userGeolocalisation = false;
        searchLocation("button");
    })
    // Géolocalisation de l'utiisateur : centre la carte sur la localisation de l'utilisateur
    $w("#button8").onClick((event) => {
        getGeolocation();
        filter = filterValues();
        findAllAsso(filter);
    })
    // Changement de valeur du slider
    $w("#slider1").onChange((event) => {
        //let sliderValue = event.target.value;
        //console.log("La valeur du slider a changé : " + sliderValue);
        searchLocation("button");
    });
    // Radio button : Fréquence
    $w('#radioGroup1').onChange((event) => {
        //let checkboxValue = event.target.value; // Récupération de la valeur de la checkbox
        //console.log("$w('#radioGroup1').onChange((event) : " + checkboxValue);
        filter = filterValues();
        findAllAsso(filter);
    });
    // Checkbox Catégories
    $w('#checkboxGroup1').onChange((event) => {
        //let checkboxValues = event.target.value; // Récupération des valeurs des checkboxes sélectionnées
        // Recupérer les markers correspondants au filtre
        filter = filterValues();
        findAllAsso(filter);        
     });

    //recentrer la carte en fonction de la recherche
    function searchLocation(comeFrom){
        
        let $lat;
        let $lng;
        // Récupèration des valeurs du filtre
        filter = filterValues();
        
        // Adresse recherchée
        if(comeFrom === "button"){
            //console.log("comeFrom : "+comeFrom);
            let $adressSearch = $w('#inputLocation');
            //let address = addressSearch.value;
            try {
                $lat = $adressSearch.value.location.latitude;
                $lng = $adressSearch.value.location.longitude;
            } catch (error) {
                // L'adresse n'est pas valide, par default : Paris
                //console.log("Impossible de géolocaliser l'adresse, routage vers Paris");
                $lat = 48.8566;
                $lng = 2.3522;
            }
            // Utilisation des données long/lat de la fonction getGeolocation
            if(userGeolocalisation === true){
                //console.log("userGeolocalisation === true");
                //console.log("latitude : "+latitude);
                $lat = latitude;
                $lng = longitude;
            }
            latitude = $lat;
            longitude = $lng;
                
            centreloc = {lat: $lat, lng: $lng};
            
            // Map OSM
            $w('#html2').postMessage({ 
                type: 'SEARCH_LOCATION', 
                data: centreloc,
                filter: filter
            });

        } else if(comeFrom === "moveend"){
            //console.log("comeFrom : "+comeFrom);
            centreloc = {
                left : left,
                bottom : bottom,
                right : right,
                top : top
            }
        }
        // Liste 
        //console.log("listAssociationAvecFiltre");
        listAssociationAvecFiltre(comeFrom);
    }

    // Recupération des markers sans appelle à la bdd
    function listAssociationAvecFiltre(comeFrom) {
        //AFFICHER LES ASSO SOUS FORME DE LISTE
        let repeater = $w('#repeter');
        var filteredFeatures = [];
        // Supprimer tous les éléments
        repeater.data = [];
        let itemsToAdd = [];
        //console.log("listAssociationAvecFiltre - markers.length : " + markers.length);
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
                //Si l'association est affichée dans la carte, alors l'afficher dans la liste
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

        //console.log("filteredFeatures.length : " + filteredFeatures.length);
        if (filteredFeatures.length > 0) {
            $w("#textNoMission").hide();
            
            for (let i = 0; i < filteredFeatures.length; i++) {
                itemsToAdd.push(filteredFeatures[i]);
            }
            //console.log("itemsToAdd.length : " + itemsToAdd.length);
            //console.log("itemsToAdd[0]; : "+JSON.stringify(itemsToAdd[0]));
            //console.log("itemsToAdd[0].title : "+ JSON.stringify(itemsToAdd[0].title));
            
            $w("#repeter").data = itemsToAdd;
            $w("#repeter").forEachItem(($item, itemData, index) => {
                $item("#repeterNameMission").text = itemData.title;
                $item("#repeterNameAssociation").text = itemData.association;
                $item("#repeterType").text = itemData.type;
                $item("#repeterCategorie").text = itemData.categorie;
                $item("#repeterDescription").text = itemData.description;
                //$item("#repeterSite").text = itemData.website;
                //$item("#repeterLogo").src = itemData.logo;
            });
        } else {
            //Affichage/ désaffichage du texte si aucune association n'est dans le périmètre
            $w("#textNoMission").show();
        }
    }


//----------------
    // Filtrer les fonctionnalités qui se trouvent à moins de x mètres du point de référence
    function spatialFilter(feature) {
        var featureLatitude = feature.lat;
        var featureLongitude = feature.lng;
        //console.log("spatialFilter - Name : "+feature.title+" - lat long : "+featureLatitude+" / "+featureLongitude+" / "+latitude+ " / "+ longitude);
        const dist = distance(latitude, longitude, featureLatitude, featureLongitude);
        
        //console.log("distance < radius : "+dist +" < "+ filter.radius);
        return dist < filter.radius;
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

            searchLocation("moveend");

        } else if(event.data.type === "loadAllMarkers") {
            //console.log("event.data.type === loadAllMarkers : "+markers.length);
            // Recupérer les markers correspondants au filtre
            //filter = filterValues();
            //findAllAsso(filter);
            $w('#html2').postMessage({ type: 'ADD_MARKERS', data: markers });
        }

    });

    
    // ----------Input Rechercher--------------
    // Récupérer la référence de l'input
    let inputSearch = $w('#input1');
     // Événement "input" pour détecter les changements dans l'input de recherche
    inputSearch.onInput((event) => {
        userGeolocalisation = true;
        // Récupérer la valeur saisie dans l'input
        const searchTerm = event.target.value;
        searchLocations(searchTerm);
    });

    // Fonction pour effectuer la recherche
    function searchLocations(searchTerm) {
    // Effectuer la requête avec les filtres
    wixData.query("Locations")
        .eq("validee", "true")
        .contains('description', searchTerm)
        .or(
            wixData.query("Locations")
            .eq("validee", "true")
            .contains('title', searchTerm) 
        )
        .find()
        .then(results => {
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
            let items = results.items;
            items.forEach(item => {
                //console.log("Title: " + item.title);
                //console.log("Categorie: " + item.categorie1);
                latitude = item.lat;
                longitude = item.lng;
            });
            markersWixItems = results.items; // Tableau des objets résultants
            //const count = markersWixItems.length; // Nombre d'objets dans le tableau
            //console.log("Nombre d'objets dans markersWixItems: " + count);

            //console.log("=====> findAllAsso, nombre de markers : "+markers.length);
            /*
            if(filter.numberCategories > 1){
                let markersFilteredCategories = [];
                let markersWixFilterdCategories = [];
                markersFilteredCategories = findMarkersByCategories(markers, filter, markersWixItems, markersWixFilterdCategories);
                markers = markersFilteredCategories;
                markersWixItems = markersWixFilterdCategories;
            } */
            // Envoyer les marqueurs à l'élément HTML en utilisant postMessage
            $w('#html2').postMessage({ type: 'ADD_MARKERS', data: markers });             
            searchLocation("button");
        })
        .catch(error => {
        // Gérer les erreurs de la requête
        console.error(error);
        });
    }

});