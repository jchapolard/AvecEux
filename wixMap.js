import wixData from 'wix-data';

$w.onReady(function () {
    var latitude, longitude;
    var left, right, bottom, top;
    var markers; 
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
        console.log("1.valeursActivites : "+valeursActivites);
        console.log("valeursActivites.length : "+valeursActivites.length);
        
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
            console.log("valeurCategorie : "+valeurCategorie);
        }
        console.log("filter.categories.length : "+filter.categories.length);

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
                    id: item.id,
                    name: item.title,
                    address: item.adresseSiege,
                    lat: item.lat,
                    lng: item.lng,
                    categorie: item.categorie1,
                    description: item.description,
                    logo: item.logo
                }));
                console.log("=====> findAllAsso, nombre de markers : "+markers.length);

                if(filter.numberCategories === 1){
                    $w('#html2').postMessage({ type: 'ADD_MARKERS', data: markers });
                } else {
                    let markersFilteredCategories = [];
                markersFilteredCategories = findMarkersByCategories(markers, filter);

                // Envoyer les marqueurs à l'élément HTML en utilisant postMessage
                $w('#html2').postMessage({ type: 'ADD_MARKERS', data: markersFilteredCategories });
                }
                                
                //searchLocation("button");                
            })
            .catch((error) => {
                let errorMsg = error.message;
                let code = error.code;
                console.error("findAllAsso Error : "+code +" : "+errorMsg);
            });
    }
    
    function findMarkersByCategories(markers, filter) {
        console.log("findMarkersByCategories");
        let arrayMarkersCopy = [];
        var index = 1;
        for (let i = 0; i < markers.length; i++) {
            for (let j = 0; j < filter.numberCategories; j++) {
                //console.log("filter.categories[j] : "+filter.categories[j]);
                //console.log("markers[i].categorie : "+markers[i].categorie);
                if (markers[i].categorie.includes(filter.categories[j])) {
                    //console.log("index : "+index);
                    //console.log(`findMarkersByCategories - name, categorie: ${markers[i].id} / ${markers[i].name} / marker.categorie: ${markers[i].categorie} / ${markers[i].address}`);
                    arrayMarkersCopy.push(markers[i]);
                    index++;
                    break;
                }
            }
        }

        /*for (let i = 0; i < markers.length; i++) {
            for (let j = 0; j < filter.categories.length; j++) {
                //console.log("filter.categories[j] : "+filter.categories[j]);
                //console.log("markers[i].categorie : "+markers[i].categorie);
                if (markers[i].categorie.includes(filter.categories[j])) {
                console.log(`findMarkersByCategories - name, categorie: ${markers[i].name} / ${filter.categories[j]} / marker.categorie: ${markers[i].categorie}`);
                arrayMarkersCopy.push(markers[i]);
                }
            }
        } */


        /*// Définir les chaînes de caractères à rechercher
        let searchStrings = filter.categories;
        // Créer une expression régulière qui recherchera tous les mots spécifiés dans la chaîne de recherche
        let regexString = searchStrings.join("|");
        let regex = new RegExp(regexString, "i");

        for (let i = 0; i < markers.length; i++) {
            console.log("markers.name : "+markers[i].id+" - "+markers[i].name +" / Adresse : "+markers[i].address);
            // Définir une chaîne de caractères avec les éléments séparés par une virgule
            let stringList = markers[i].categorie;
            // Diviser la chaîne de caractères en un tableau de chaînes de caractères
            let stringArray = stringList.split(", ");
            
            // Itérer sur chaque élément du tableau et vérifier si la chaîne de recherche est contenue dans chaque élément
            for (let j = 0; j < stringArray.length; j++) {
                console.log("stringArray : "+stringArray[j])
                if (regex.test(stringArray[j])) {
                    // La chaîne de recherche est contenue dans cet élément de la liste
                    //console.log(`La chaîne "${searchStrings.join(", ")}" est contenue dans "${stringArray[i]}"`);
                    
                    arrayMarkersCopy.push(markers[j]);
                }
            }
        } */
        
        console.log("arrayMarkersCopy.length: " + arrayMarkersCopy.length);
        return arrayMarkersCopy;
    }

    //Click bouton recherche d'une ville, centre la carte sur la location cherchée
    $w("#button7").onClick((event) => {
        searchLocation("button");
    })
    // Changement de valeur du slider
    $w("#slider1").onChange((event) => {
        //let sliderValue = event.target.value;
        //console.log("La valeur du slider a changé : " + sliderValue);
        searchLocation("button");
    });
    $w('#radioGroup1').onChange((event) => {
        // Code à exécuter lorsque la valeur de la checkbox change
        let checkboxValue = event.target.value; // Récupération de la valeur de la checkbox
        console.log("$w('#radioGroup1').onChange((event) : " + checkboxValue);
    });
    $w('#checkboxGroup1').onChange((event) => {
        // Code à exécuter lorsque la valeur du groupe de checkboxes change
        //let checkboxValues = event.target.value; // Récupération des valeurs des checkboxes sélectionnées
        //console.log("$w('#checkboxGroup1').onChange((event) : " + checkboxValues);
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
            console.log("comeFrom : "+comeFrom);
            let $adressSearch = $w('#inputLocation');
            //let address = addressSearch.value;
            try {
                $lat = $adressSearch.value.location.latitude;
                $lng = $adressSearch.value.location.longitude;
            } catch (error) {
                // L'adresse n'est pas valide, par default : Paris
                console.log("Impossible de géolocaliser l'adresse, routage vers Paris");
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
            console.log("comeFrom : "+comeFrom);
            centreloc = {
                left : left,
                bottom : bottom,
                right : right,
                top : top
            }
        }
        
        // Liste 
        console.log("listAssociationAvecFiltre");
        listAssociationAvecFiltre(comeFrom, filter);
    }

    //Afficher les associations dans l'onglet liste
    function listAssociationAvecFiltre(comeFrom, filter){

        //AFFICHER LES ASSO SOUS FORME DE LISTE
        let repeater = $w('#repeter');
        var filteredFeatures = [];
        // Supprimer tous les éléments
        repeater.data=[];
        
        wixData.query("Locations")
            .eq("validee", "true")
            //.distinct("title")
            //.hasSome("categorie1", filter.categories)
            //.contains("categorie1", filter.categories)
            .find()
            .then((results) => { 
                const itemsToAdd = [];
                console.log("results.items.length : "+results.items.length);
                if(results.items.length > 0){
                    
                    for(let i = 0; i < results.items.length; i++){
                        const feature = results.items[i];
                        if(comeFrom === "button"){
                            // Filtre distance
                            if (spatialFilter(feature)) {
                                filteredFeatures.push(feature);
                            }
                        } else if(comeFrom === "moveend"){
                            //Si l'association est affichée dans la carte, alors l'afficher dans la liste
                            if(feature.lat < right && left < feature.lat 
                                && feature.lng < top && bottom < feature.lng ){
                                    filteredFeatures.push(feature);
                                }
                        }
                    }

                    console.log("filteredFeatures.length : "+filteredFeatures.length);
                    if(filteredFeatures.length > 0){
                        $w("#textNoAsso").hide();

                        for(let i = 0; i < filteredFeatures.length; i++){

                            /*let name = filteredFeatures[i].title;
                            console.log("name : "+name);
                            let cat = filteredFeatures[i].categorie;
                            let desc = filteredFeatures[i].description;
                            let site = filteredFeatures[i].website;
                            let log = filteredFeatures[i].logo; */
                           
                            itemsToAdd.push(filteredFeatures[i]);
                            $w("#repeter").data = itemsToAdd;

                            $w("#repeter").forEachItem(($item, itemData, index) => {
                                $item("#repeterName").text = itemData.title;
                                $item("#repeterCategorie").text = itemData.categorie1;
                                $item("#repeterDescription").text = itemData.description;
                                $item("#repeterSite").text = itemData.website;
                                $item("#repeterLogo").src = itemData.logo;
                            });
                        }
                    } else {
                        //Affichage/ désaffichage du texte si aucune association n'est dans le périmètre
                        $w("#textNoAsso").show();
                    }
                }
            })
            .catch((error) => {
                let errorMsg = error.message;
                let code = error.code;
                console.error("listAssociationAvecFiltre Error : "+code +" : "+errorMsg);
            });
        
        
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
    }


    $w("#html2").onMessage( (event) => {
        if (event.data.type === "moveend") {
            console.log("event.data.type === moveend");
            
            let receivedMessage = event.data.value;
            left = receivedMessage.varleft;
            right = receivedMessage.varright;
            bottom = receivedMessage.varbottom;
            top = receivedMessage.vartop;

            searchLocation("moveend");

        } else if(event.data.type === "loadAllMarkers") {
            console.log("event.data.type === loadAllMarkers");
            // Recupérer les markers correspondants au filtre
            //filter = filterValues();
            //findAllAsso(filter);
            $w('#html2').postMessage({ type: 'ADD_MARKERS', data: markers });
        }

    });

    // Mise a jour des Associations
    function updateAssociation(){
        console.log("6.Dans updateAssociation");
        if(markers.length > 0){
            var index =1;
            markers.forEach(marker => {
                var idAssociation = marker._id;
                console.log("7.idAssociation: "+idAssociation);
                var adresseAssociation = marker.address;
                console.log("8.adresseAssociation: "+adresseAssociation);

                var latitudeAssociation;
                var longitudeAssociation;

                console.log("11.latitudeAssociation / longitudeAssociation : "+latitudeAssociation +" / "+longitudeAssociation);
                
                // Mettre à jour les champs de l'adresse dans votre base de données Wix
                let toUpdate = {
                    "_id":      idAssociation,
                    "address":  { formatted: adresseAssociation, latitude: latitudeAssociation, longitude: longitudeAssociation },
                    "lat":      latitudeAssociation,
                    "lng":      longitudeAssociation
                };
                  
                /*return wixData.update("Locations", toUpdate)
                    .then((results) => {
                        console.log("12. "+results); //voir l'élément ci-dessous
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                */
            });
        } else {
            console.log("13.updateAsso, markers.length = "+markers.length);
        }
    }
    

});