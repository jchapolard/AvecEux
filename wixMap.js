//import { getLocations } from 'backend/locations';
import wixData from 'wix-data';

$w.onReady(function () {

    let receivedMessage;
    let left ;
    let right ;
    let bottom ;
    let top ;
    var markersData; 
    var filter;

    //Cacher le texte si aucune association
    $w("#textNoAsso").hide();

    findAllAsso();
    //Chercher dans la base de données les associations validées et les envoyer à l'html OPENAYERS MAP
    function findAllAsso(){
        markersData = [];
        wixData.query("Locations")
            .eq("valide", true)
            .find()
            .then((results) => {
                    // Créer un tableau de marqueurs à partir des résultats de la requête
                const markers = results.items.map(item => ({
                    lat: item.lat,
                    lng: item.lng,
                    name: item.title,
                    address: item.address,
                    description: item.description,
                    logo: item.logo,
                    categorie: item.categorie
                }));
                markersData.push(markers);
                
                // Envoyer les marqueurs à l'élément HTML en utilisant postMessage
                $w('#html2').postMessage({ type: 'ADD_MARKERS', data: markers });

                searchLocation();
            /*})
            .catch((error) => {
                let errorMsg = error.message;
                let code = error.code;
                console.error("findAllAsso /  wixData.query(Locations) : "+code +" : "+errorMsg); */
            });
    }
    
    //Click bouton recherche d'une ville, centre la carte sur la location cherchée
    $w("#buttonChercher").onClick((event) => {
        searchLocation();
    })

    //recentrer la carte en fonction de la recherche
    function searchLocation(){
        let $lat;
        let $lng;
        // Récupère les valeurs du filtre
        var radius = $w("#slider1").value;
        var frequencyRadioGroup = $w('#radioGroup1').value;
        var activityCheckbox =    $w('#checkboxGroup1').value;
        //var selectedCategories = $w('#checkboxGroup1').selectedValues;
        //console.log("selectedCategories  "+selectedCategories);
        console.log("frequencyRadioGroup  "+frequencyRadioGroup);
        
        /*var arrayselectedCategories = [];
        $w('#checkboxGroup1').value.forEach(function(item) {
            arrayselectedCategories.push(item.value);
        });
        console.log("arrayselectedCategories  "+arrayselectedCategories.length);
        */
        // Adresse recherchée
        let $adressSearch = $w('#inputLocation');
        try {
            $lat = $adressSearch.value.location.latitude;
            $lng = $adressSearch.value.location.longitude;
        } catch (error) {
            // L'adresse n'est pas valide, afficher un message d'erreur
            console.log("Impossible de géolocaliser l'adresse, routage vers Paris");
            // Par default : Paris
            $lat = 48.8566;
            $lng = 2.3522;
        }
        
        let centreloc = {lat: $lat, lng: $lng};
        filter = {
            radius: radius,
            frequency: frequencyRadioGroup,
            categories: activityCheckbox
        }
        // Map OSM
        $w('#html2').postMessage({ 
            type: 'SEARCH_LOCATION', 
            data: centreloc,
            filter: filter
        });

        // Liste 
        console.log("listAssociationAvecFiltre");
        listAssociationAvecFiltre(centreloc, filter);
    }

    //Afficher les associations dans l'onglet liste
    function listAssociationAvecFiltre(centreloc, filter){
        var latitude = centreloc.lat;
        var longitude = centreloc.lng;

        //AFFICHER LES ASSO SOUS FORME DE LISTE
        let repeater = $w('#repeter');
        var filteredFeatures = [];
        // Supprimer tous les éléments
        repeater.data=[];
        console.log("markersData : "+markersData.length);
        wixData.query("Locations")
            .eq("valide", true)
            //.hasSome("categorie", filter.categories)
            .find()
            .then((results) => { 
                const itemsToAdd = [];
                console.log("results.items.length : "+results.items.length);
                if(results.items.length > 0){
                    
                    for(let i = 0; i < results.items.length; i++){
                        const feature = results.items[i];
                        // Filtre distance
                        if (spatialFilter(feature)) {
                            filteredFeatures.push(feature);
                        }
                    }

                    console.log("filteredFeatures.length : "+filteredFeatures.length);
                    if(filteredFeatures.length > 0){
                        const data = [];
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
                                $item("#repeterCategorie").text = itemData.categorie;
                                $item("#repeterDescription").text = itemData.description;
                                $item("#repeterSite").text = itemData.website;
                                $item("#repeterLogo").src = itemData.logo;
                            });
                        }

                        //Affichage/ désaffichage du texte si aucune association n'est dans le périmètre
                        $w("#textNoAsso").show();
                        if(filteredFeatures.length > 0){
                            $w("#textNoAsso").hide();
                        }
                    }
                }
            /*})
            .catch((error) => {
                let errorMsg = error.message;
                let code = error.code;
                console.error("findAllAsso /  wixData.query(Locations) : "+code +" : "+errorMsg); */
            });
        
        
        // Filtrer les fonctionnalités qui se trouvent à moins de x mètres du point de référence
        function spatialFilter(feature) {
            var featureLatitude = feature.lat;
            var featureLongitude = feature.lng;
            //console.log("lat long : "+featureLatitude+" / "+featureLongitude+" / "+latitude+ " / "+ longitude);
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
            let count =0;

            receivedMessage = event.data.value;
            left = receivedMessage.varleft;
            right = receivedMessage.varright;
            bottom = receivedMessage.varbottom;
            top = receivedMessage.vartop;

            //AFFICHER LES ASSO SOUS FORME DE LISTE
            let repeter = $w('#repeter');
            
            wixData.query("Locations")
                .eq("valide", true)
                .find()
                .then((results) => { 
                    const itemsToAdd = [];
                    
                    // Supprimer tous les éléments
                    repeter.data=[]

                    if(results.items.length > 0){
                        
                        for(let i = 0; i < results.items.length; i++){

                            //Si l'association est affichée dans la carte, alors l'afficher dans la liste
                            if(results.items[i].lat < right  
                                && left < results.items[i].lat 
                                && results.items[i].lng < top  
                                && bottom < results.items[i].lng ){

                                $w("#textNoAsso").show();
                                count = 1;
                                
                                let name = results.items[i].title;
                                let cat = results.items[i].categorie;
                                let desc = results.items[i].description;
                                let site = results.items[i].website;
                                let log = results.items[i].logo;

                                const itemToAdd = {
                                    "repeterName" : name,
                                    "repeterCategorie" : cat,
                                    "repeterDescription" : desc,
                                    "repeterSite" : site,
                                    "repeterLogo" : log,
                                }

                                itemsToAdd.push(results.items[i]);
                                $w("#repeter").data = itemsToAdd;

                                $w("#repeter").forEachItem(($item, itemData, index) => {
                                    $item("#repeterName").text = itemData.title;
                                    $item("#repeterCategorie").text = itemData.categorie;
                                    $item("#repeterDescription").text = itemData.description;
                                    $item("#repeterSite").text = itemData.website;
                                    $item("#repeterLogo").src = itemData.logo;
                                });
                            }    
                        }
                    }

                    //Affichage/ désaffichage du texte si aucune association n'est dans le périmètre
                    if(count!=0){
                        $w("#textNoAsso").hide();
                    }
                    else{
                        $w("#textNoAsso").show();
                    }

            });

        } else if(event.data.type === "loadAllMarkers") {
            console.log("event.data.type === loadAllMarkers");
            findAllAsso();
        }

    });

});