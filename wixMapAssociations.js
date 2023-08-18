// wixAssociations.js
// Référence API Velo : https://www.wix.com/velo/reference/api-overview/introduction

import wixData from 'wix-data';
import wixWindow from 'wix-window';

$w.onReady(function () {
    var latitude, longitude, oldLat, oldLong;
    var userGeolocalisation = false, listTab = false, mapTab = true;
    var left, right, bottom, top;
    let oldLeft, oldRight, oldTop, odlBottom;
    var markers, markersWixItems, allMarkers, allMarkersWixItems;
    var filter, centreloc, comeFrom;
    var searchboolean = false, searchlocationLeft, searchlocationRight, searchlocationTop, searchlocationBottom;
    const OFFSET_MULTIPLIER = 0.0001; // Facteur de multiplication pour le décalage

    // Tabs - Onglets
    // Default behavior
    $w("#repeter").delete();
    $w("#html2").show();
    // Par default cacher le texte "aucune association"
    $w("#textNoAsso").hide();

    // List
    $w("#button5").onClick((event) => {
        console.log("Tabulation List");
        listTab = true;
        mapTab = false
        $w("#html2").hide();
        $w("#repeter").restore();
        $w("#repeter").show();
    });

    // Map
    $w("#button6").onClick((event) => {
        console.log("Tabulation Map");
        listTab = false;
        mapTab = true;
        $w("#repeter").delete();
        $w("#html2").show('fade', { duration: 400 });
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
            searchLocation();
        })
        .catch((error) => {
            // Erreur : impossible de récupérer la position géographique
            console.error('Erreur de géolocalisation:', error);
        });
    }
  
    // Récupération des valeurs du filtre
    function filterValues(){
        // Tags Catégories
        var activityCheckbox = $w('#selectionTags1').value.toString();
        //console.log("1. activityCheckbox.length : "+activityCheckbox +" - length : "+activityCheckbox.length);
        let valeursActivites = [""];

       if (activityCheckbox.length == 0) {
            findAllCategories()
                .then(handleCategories)
                .catch(error => {
                    console.error("Erreur lors de la récupération des catégories : ", error);
                });
        } else {
            handleCategories(activityCheckbox.split(",").map(function (item) {
                return item.trim();
            }));
        }
        
        function handleCategories(selectedCategories) {
            activityCheckbox = selectedCategories.join(", ");
            valeursActivites = activityCheckbox.split(",").map(function (item) {
                return item.trim();
            });
        }

        filter = {
            categories: valeursActivites,
            numberCategories: valeursActivites.length
        }
        return filter;
    }

    function findAllCategories(){
        return wixData.query("Categorie")
        .find()
        .then(results => {
            return results.items;
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des catégories : ", error);
            return [];
        });
    }

    filter = filterValues();
    findAllAsso();
    
    // Chargement des associations au load de la page
    function findAllAsso(){
        wixData.query("Locations")
            .ne("lat", 0) // Exclusion des associations sans coodonnées latitude et longitude renseignées en bdd
            .ne("lng", 0)
            .limit(1000) // Spécifiez la limite pour récupérer toutes les lignes
            .find()
            .then((results) => {
                // Créer un tableau de marqueurs à partir des résultats de la requête
                allMarkers = results.items.map(item => ({
                    //_id: item._id,
                    id: item.id ?? "No id",
                    name: item.title ?? "No name",
                    address: item.adresseSiege ?? "No adresse",
                    lat: item.lat ?? "No latitude",
                    lng: item.lng ?? "No longitude",
                    categorie: item.categorie1 ?? "No categorie",
                    description: item.description ?? "No description",
                    logo: item.logo ?? "No logo",
                    website: item.website ?? "No website"
                }));
                
                const coordinatesMap = new Map(); // Utilisé pour stocker les coordonnées et le nombre de markers

                // Mise à jour des données
                for (let i = 0; i < allMarkers.length; i++) {
                    results.items[i].website = allMarkers[i].website;
                    
                    // Gestion des coordonnées identiques
                    const latLngKey = `${allMarkers[i].lat},${allMarkers[i].lng}`;

                    if (!coordinatesMap.has(latLngKey)) {
                        coordinatesMap.set(latLngKey, 0);
                    } else {
                        const count = coordinatesMap.get(latLngKey);
                        coordinatesMap.set(latLngKey, count + 1);

                        const offset = OFFSET_MULTIPLIER * coordinatesMap.get(latLngKey);
                        const adjustedLng = allMarkers[i].lng + offset;
                        allMarkers[i].lng = adjustedLng;
                        results.items[i].lng = adjustedLng;
                    }                    
                }
                allMarkersWixItems = results.items; // Tableau des objets résultants
                markersWixItems = allMarkersWixItems;
                markers = allMarkers;

                // Envoyer les marqueurs à l'élément HTML en utilisant postMessage
                $w('#html2').postMessage({ type: 'ADD_MARKERS', data: allMarkers });             
                console.log("listMissions");
                listAssociations();
                
            })
            .catch((error) => {
                let errorMsg = error.message;
                let code = error.code;
                console.error("findAllAsso Error : "+code +" : "+errorMsg);
                console.trace(); // Affiche la pile d'appels
            });
    }
    
    // Trouver les markers en fonctions des filtres choisies par l'utilisateur
    function findMarkersByFilters(filter) {
        //console.log("findMarkersByCategories");
        let markersWixFilterd = [];
        let arrayMarkersCopy = [];
        for(let i=0;i<allMarkers.length;i++){
            if (filter.categories.some(category => allMarkers[i].categorie.includes(category))) {

                arrayMarkersCopy.push(Object.assign({}, allMarkers[i])); // Copie de l'objet marker
                markersWixFilterd.push(allMarkersWixItems[i]);
            }
        }       
        console.log("findMarkersByCategories nombre de markers filtré par catégorie : " + arrayMarkersCopy.length);
        markers = arrayMarkersCopy
        markersWixItems = markersWixFilterd;
    
        if(markers.length === 0){
            $w("#textNoAsso").show();
            // Supprimer les markers sur la carte
            $w('#html2').postMessage({ type: 'DELETE_MARKERS' });
            deleteList();
        } else {
            $w("#textNoAsso").hide();
            // Envoyer les marqueurs à l'élément HTML en utilisant postMessage
            $w('#html2').postMessage({ type: 'ADD_MARKERS', data: markers });
            listAssociations();
        }   
    }
    
    //Click bouton Loupe - Recherche ville, centre la carte sur la location cherchée
    $w("#button4").onClick((event) => {
        console.log("Botton : Recherche");
        userGeolocalisation = false;
        comeFrom = "button";
        searchLocation();
    })
    // Géolocalisation de l'utiisateur : centre la carte sur la localisation de l'utilisateur
    $w("#button3").onClick((event) => {
        console.log("Botton : Géolocalisation");
        filterValues();
        userGeolocalisation = true;
        comeFrom = "button";
        getGeolocation();
    })
    
    // Tag Catégories
    $w('#selectionTags1').onChange(function (event) {
        // Récupérez la valeur sélectionnée
        //var selectedValue = event.target.value.length;
        //console.log("$w('#selectionTags1').length : "+selectedValue);
        filter = filterValues();
        findMarkersByFilters(filter);
    });

    //recentrer la carte en fonction de la recherche
    function searchLocation(){
        
        let $lat;
        let $lng;
        
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
                try {
                    $lat = $adressSearch.value.location.latitude;
                    $lng = $adressSearch.value.location.longitude;
                } catch (error) {
                    // L'adresse n'est pas valide, par default : Paris
                    console.log("Impossible de géolocaliser l'adresse");
                    // Carte : Si pas de input de recherche vie, il ne se passse rien.
                    if(listTab === true) {
                        // List : Permet d'avoir des associations affichées sur la liste
                        latitude = 48.8566; // routage vers Paris
                        longitude = 2.3522;
                    }
                    return;
                }
            }

            latitude = $lat;
            longitude = $lng;
            
            centreloc = {lat: $lat, lng: $lng};
            
            // Le mouvement de la carte n'est effectué que si l'utilisateur déplace la carte avec la sourie.
            if(oldLat != latitude && oldLong != longitude
                || searchlocationLeft != left){
                    
                searchboolean = true;
                oldLat = latitude;
                oldLong = longitude;
                
                $w('#html2').postMessage({ 
                    type: 'SEARCH_LOCATION', 
                    data: centreloc,
                    filter: filter
                });
                if(listTab === true){
                    listAssociations();
                }
            } else {
                console.log("oldLat === latitude || oldLong === longitude")
            }
            
        } else if(comeFrom === "moveend"){
            centreloc = {
                left : left,
                bottom : bottom,
                right : right,
                top : top
            }
        }
    }

    // Suppression des associations de la liste
    function deleteList(){
        let repeater = $w('#repeter');
        var filteredFeatures = [];
        repeater.data = filteredFeatures;
    }

    // Affichage des associations sur l'onglet Liste
    function listAssociations() {

        let repeater = $w('#repeter');
        var filteredFeatures = [];
        // Supprimer tous les éléments
        repeater.data = [];
        let itemsToAdd = [];
        //console.log("listAssociations - Nombre d'associations TOTAL : " + markers.length);
        var index = 0;
        var arrayDistinct = [];
        //console.log("listAssociations - "+comeFrom);
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
                if (markers[i].lat < right && markers[i].lat > left &&
                    markers[i].lng < top && markers[i].lng > bottom) {
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

        console.log("listAssociations - Nombre d'associations affichées dans la liste : " + filteredFeatures.length);
        if (filteredFeatures.length > 0) {
            $w("#textNoAsso").hide();
            
            for (let i = 0; i < filteredFeatures.length; i++) {
                itemsToAdd.push(filteredFeatures[i]);
            }
            //console.log("itemsToAdd.length : " + itemsToAdd.length);
            //console.log("itemsToAdd[0]; : "+JSON.stringify(itemsToAdd[0]));
            //console.log("itemsToAdd[0].title : "+ JSON.stringify(itemsToAdd[0].title));
            const MAX_DESCRIPTION_LENGTH = 80; // Limite de caractères pour la description
            const MAX_CATEGORY_LENGTH = 30;

            $w("#repeter").data = itemsToAdd;
            $w("#repeter").forEachItem(($item, itemData, index) => {
                $item("#repeterName").text = itemData.title;
                
                // Gestion taille catégorie
                //$item("#repeterCategorie").text = itemData.categorie1;
                const category = itemData.categorie1;
                const truncatedCategory = category.length > MAX_CATEGORY_LENGTH ?
                                        category.substring(0, MAX_CATEGORY_LENGTH) + "..." :
                                        category;
                $item("#repeterCategorie").text = truncatedCategory;
                
                // Gestion de la taille du texte de la description
                const $descriptionClickable = $item("#repeterDescription");
                const fullDescription = itemData.description;
                var booleanFullDescription = true;
                $descriptionClickable.text = fullDescription.substring(0, MAX_DESCRIPTION_LENGTH) + "...";
                $descriptionClickable.onClick(() => {
                    if(booleanFullDescription){
                        $descriptionClickable.text = fullDescription; // Afficher le texte complet
                        booleanFullDescription = false;
                    } else {
                        $descriptionClickable.text = fullDescription.substring(0, MAX_DESCRIPTION_LENGTH) + "...";
                        booleanFullDescription = true;
                    }
                });
                
                // Créez un lien HTML pour le site internet
                const siteLink = `<a href="${itemData.website}" target="_blank" style="font-size: 14px; font-family: 'Avenir Light', sans-serif; font-weight: normal; font-style: italic; color: #E41C64;">Voir site internet</a>`;
                $item("#repeterSite").html = siteLink;
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
        
        //console.log("distance < radius : "+dist +" < "+ filter.radius);
        return dist < 30;
        
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
            
            return Math.round(dist);
        }
    }

    $w("#html2").onMessage( (event) => {
        if (event.data.type === "moveend") {
            //console.log("event.data.type === moveend");
            comeFrom = "moveend";
            let receivedMessage = event.data.value;
            left = receivedMessage.varleft;
            right = receivedMessage.varright;
            bottom = receivedMessage.varbottom;
            top = receivedMessage.vartop;

            // Màj de la Liste : Evite un déclenchement trop fréquent et réduit les appels inutiles de la fonction
            if(oldLeft != left && oldRight != right && oldTop != top && odlBottom != bottom){
                //console.log("Màj de la Liste : oldLeft != left "+oldLeft+" "+ left+" / oldRight != right "+oldRight+" "+right+" / oldTop != top "+oldTop+" "+top+" / odlBottom != bottom "+odlBottom+" "+bottom);

                oldLeft = left;
                oldRight = right;
                oldTop = top;
                odlBottom = bottom;

                // Permet d'enregistrer la recherche d'une adresse, modifier la carte, puis rechercher à nouveau cette adresse
                if(searchboolean){
                    searchlocationLeft = left;
                    searchlocationRight = right;
                    searchlocationTop = top;
                    searchlocationBottom = bottom;
                    searchboolean = false;

                }
                // Mise à jour de la liste en fonction de la carte
                listAssociations();
            }
            

        } else if(event.data.type === "loadMarkers") {
            //console.log("event.data.type === loadMarkers : "+markers.length);
            // Recupérer les markers
            $w('#html2').postMessage({ type: 'ADD_MARKERS', data: allMarkers });
        } 

    });
    
});