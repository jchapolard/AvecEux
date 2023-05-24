import wixData from 'wix-data';

$w.onReady(function () {
    var latitude, longitude;
    var left, right, bottom, top;
    var markers, markersWixItems;
    var filter, centreloc;

    // Par default cacher le texte "aucune association"
    $w("#textNoAsso").hide();
    
    // Récupération des filtres 
    function filterValues(){
        // Récupère les valeurs du filtre
        var radius = $w("#slider1").value;
        var frequencyRadioGroup = $w('#radioGroup1').value;
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

        wixData.query("Locations")
            .eq("validee", "true")
            .contains("categorie1", valeurCategorie)
            //.ne("lat", "")
            //.ne("lng", "")
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
                searchLocation("button");                
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
        //for (const marker of markers) {
        for(let i=0;i<markers.length;i++){
            if (filter.categories.some(category => markers[i].categorie.includes(category))) {
              arrayMarkersCopy.push(markers[i]);
              markersWixFilterdCategories.push(markersWixItems[i]);
            }
        }       
        //console.log("arrayMarkersCopy.length: " + arrayMarkersCopy.length);
        return arrayMarkersCopy;
    }

    //Click bouton Loupe - Recherche ville, centre la carte sur la location cherchée
    $w("#button7").onClick((event) => {
        searchLocation("button");
    })
    // Changement de valeur du slider
    $w("#slider1").onChange((event) => {
        //let sliderValue = event.target.value;
        //console.log("La valeur du slider a changé : " + sliderValue);
        searchLocation("button");
    });
    // Radio button : Fréquence
    $w('#radioGroup1').onChange((event) => {
        let checkboxValue = event.target.value; // Récupération de la valeur de la checkbox
        //console.log("$w('#radioGroup1').onChange((event) : " + checkboxValue);
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
            centreloc = {lat: $lat, lng: $lng};
            latitude = $lat;
            longitude = $lng;

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
});