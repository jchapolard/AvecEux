// wixMissions.js
// Source js : https://www.wix.com/velo/reference

import wixData from 'wix-data';
import wixWindow from 'wix-window';
import moment from 'moment';
import 'moment/locale/fr';

$w.onReady(function () {
    moment.locale('fr');
    var latitude, longitude, oldLat, oldLong;
    var userGeolocalisation = false, listTab = false, mapTab = true;
    var left, right, bottom, top;
    let oldLeft, oldRight, oldTop, odlBottom;
    var markers, markersWixItems, allMarkers, allMarkersWixItems;
    var filter, centreloc, comeFrom;
    var searchboolean = false, searchlocationLeft, searchlocationRight, searchlocationTop, searchlocationBottom;
    const OFFSET_MULTIPLIER = 0.0001; // Facteur de multiplication pour le décalage des markers identiques

    // Tabs - Onglets
    // Default behavior
    $w("#repeter").delete();
    $w("#html2").show();
    // Par default cacher le texte "aucune mission"
    $w("#textNoMission").hide();
    
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
        // Fréquences
        var frequencyDropdown = $w('#dropdown1').value.toString();
        if(frequencyDropdown === "indefinie"){
            frequencyDropdown = "";
        }
        // Lieu de travail
        var workplaceDropdown = $w('#dropdown2').value.toString();
        if(workplaceDropdown === "indefini"){
            workplaceDropdown = "";
        }
        // Type : Mission ou évènement
        var typeDropdown = $w('#dropdown3').value.toString();
        if(typeDropdown === "Indéfini"){
            typeDropdown = "";
        }
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
            type : typeDropdown,
            workPlace : workplaceDropdown,
            frequency: frequencyDropdown,
            categories: valeursActivites,
            numberCategories: valeursActivites.length
        } 
        //console.log("filter : "+filter.frequency+" "+filter.categories+" "+filter.numberCategories);
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
    findAllMissions();
    
    // Chargement des missions au load de la page
    function findAllMissions(){
        wixData.query("Missions")
        .limit(1000) // Spécifiez la limite pour récupérer toutes les lignes
        .find()
        .then(async (results) => {
            // Créer un tableau de marqueurs à partir des résultats de la requête
            
            allMarkers = await Promise.all(results.items.map(async item => {
                const associationId = item.idAssociation; // ID de l'association stocké dans le champ "idAssociation" de la mission
                const association = await getAssociation(associationId);
                //console.log("association : "+association.website);
                
                return {
                    _id: item._id,
                    id: item.id ?? "No id",
                    titreMission: item.title ?? "No title",
                    type: item.type ?? "No type",
                    nameAssociation: item.association ?? "No name association",
                    address: item.adresseMission ?? "No address mission",
                    lat: item.latitude ?? "No latitude",
                    lng: item.longitude ?? "No longitude",
                    categorie: item.categorie ?? "No categorie",
                    description: item.description ?? "No description",
                    frequence: item.frequence ?? "No frequence",
                    presentiel: item.presentiel ?? "No presentiel",
                    dateDebut: formatageDate(item.dateDebut),
                    dateFin: formatageDate(item.dateFin),

                    website: association ? association.website : "No website",
                };
        
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
            console.log("allMarkers : "+allMarkers.length);
            console.log("markers : "+markers.length);
            // Envoyer les marqueurs à l'élément HTML en utilisant postMessage
            $w('#html2').postMessage({ type: 'ADD_MARKERS', data: allMarkers }); 
            console.log("listMissions");
            listMissions();

        })
        .catch((error) => {
            let errorMsg = error.message;
            let code = error.code;
            console.error("findAllMissions Error : "+code +" : "+errorMsg);
            console.trace(); // Affiche la pile d'appels
        });
    }

    // Trouver les markers en fonctions des filtres choisies par l'utilisateur
    function findMarkersByFilters(filter) {
        //console.log("findMarkersByCategories");
        
        let markersWixFilterd = [];
        let arrayMarkersCopy = [];

        for(let i=0;i<allMarkers.length;i++){
            // Sélectionner les markers en fonction des catégories choisis
            if (filter.categories === "" || filter.categories.some(category => allMarkers[i].categorie.includes(category))) {
                // // Sélectionner les markers en fonction de la fréquence choisis
                if (filter.frequency === "" || filter.frequency === allMarkers[i].frequence) {
                    // Sélectionner les markers en fonction des Lieux de travail choisis
                    if (filter.workPlace === "" || filter.workPlace === allMarkers[i].presentiel) {
                        // Sélectionner les markers en fonction du type choisis
                        if (filter.type === "" || filter.type === allMarkers[i].type) {

                            arrayMarkersCopy.push(Object.assign({}, allMarkers[i])); // Copie de l'objet marker
                            markersWixFilterd.push(allMarkersWixItems[i]);
                        }
                    }
                }
            }
        }

        console.log("findMarkersByFilters nombre de markers filtrés : " + arrayMarkersCopy.length);
        markers = arrayMarkersCopy
        markersWixItems = markersWixFilterd;
    
        if(markers.length === 0){
            $w("#textNoMission").show();
            // Supprimer les markers sur la carte
            $w('#html2').postMessage({ type: 'DELETE_MARKERS' });
            deleteList();
        } else {
            $w("#textNoMission").hide();
            // Envoyer les marqueurs à l'élément HTML en utilisant postMessage
            $w('#html2').postMessage({ type: 'ADD_MARKERS', data: markers });
            listMissions();
        }   
    }
    
    // Requete sur les Associations
    async function getAssociation(associationId) {
        try {
            const result = await wixData.query("Locations")
                .eq("id", associationId)
                .find();
            
            return result.items[0]; // Renvoie la première association trouvée
        } catch (error) {
            console.error("Error fetching association: ", error);
            return null;
        }
    }

    // Fonction de formatage des Dates
    function formatageDate(dateTotChange){
        // Type Date : Tue Jul 04 2023 00:00:00 GMT+0200 (heure d’été d’Europe centrale)
        if (dateTotChange instanceof Date) {
            return moment(dateTotChange).format('DD MMM YYYY');
        // Type String : 2023-07-22
        } else if (typeof dateTotChange === 'string') {
            const dateObject = new Date(dateTotChange);
            return moment(dateObject).format('DD MMM YYYY');
        } else {
            return "";
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
    // Dropdown : Fréquence
    $w('#dropdown1').onChange((event) => {
        //const selectedValue = event.target.value;
        //console.log('Dropdown : Fréquence - Valeur sélectionnée : ', selectedValue);
        filter = filterValues();
        ////findAllMissions(filter);
        findMarkersByFilters(filter);

    });
    // Dropdown : Lieu de travail
    $w('#dropdown2').onChange((event) => {
        filter = filterValues();
        //findAllMissions(filter);
        findMarkersByFilters(filter);
    });
    // Dropdown : Type
    $w('#dropdown3').onChange((event) => {
        filter = filterValues();
        //findAllMissions(filter);
        findMarkersByFilters(filter);
    });

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
                        // List : Permet d'avoir des missions affichées sur la liste
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
                    listMissions();
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

    // Suppression des missions de la liste
    function deleteList(){
        let repeater = $w('#repeter');
        var filteredFeatures = [];
        repeater.data = filteredFeatures;
    }

    // Affichage des missions sur l'onglet Liste
    function listMissions() {
        
        let repeater = $w('#repeter');
        var filteredFeatures = [];
        // Supprimer tous les éléments
        repeater.data = [];
        let itemsToAdd = [];
        //console.log("listMissions - Nombre de missions TOTAL : " + markers.length);
        var index = 0;
        var arrayDistinct = [];
        //console.log("listMissions - "+comeFrom);
        for(let i=0;i<markers.length;i++){
            if (comeFrom === "button") {
                // Filtre distance
                if (spatialFilter(markers[i]) ){
                    if(!arrayDistinct.includes(markers[i].titreMission)){
                        arrayDistinct.push(markers[i].titreMission);
                        filteredFeatures.push(markersWixItems[i]);
                        index++;
                    }
                    
                }
            } else if (comeFrom === "moveend") {
                //Si la mission est affichée sur la carte, alors l'afficher dans la liste
                if (markers[i].lat < right && markers[i].lat > left &&
                    markers[i].lng < top && markers[i].lng > bottom) {
                    if(!arrayDistinct.includes(markers[i].titreMission)){
                        arrayDistinct.push(markers[i].titreMission);
                        filteredFeatures.push(markersWixItems[i]);
                        index++;
                    }
                }
            }
            if(index>100){
                break;
            }
        }

        console.log("listMissions - Nombre de missions affichées dans la liste : " + filteredFeatures.length);
        if (filteredFeatures.length > 0) {
            $w("#textNoMission").hide();

            for (let i = 0; i < filteredFeatures.length; i++) {
                itemsToAdd.push(filteredFeatures[i]);
            }
            //console.log("itemsToAdd.length : " + itemsToAdd.length);
            //console.log("itemsToAdd[0]; : "+JSON.stringify(itemsToAdd[0]));
            //console.log("itemsToAdd[0].title : "+ JSON.stringify(itemsToAdd[0].title));
            const MAX_DESCRIPTION_LENGTH = 80; // Limite de caractères pour la description
            //const MAX_TITLE_LENGTH = 50;
            const MAX_CATEGORY_LENGTH = 30;
            
            $w("#repeter").data = itemsToAdd;
            $w("#repeter").forEachItem(($item, itemData, index) => {

                // Gestion taille Titre des missions
                $item("#repeterNameMission").text = itemData.title;
                /*const $NameMissionClickable = $item("#repeterNameMission");
                const fullNameMission = itemData.title;
                var booleanFullNameMission = true;
                $NameMissionClickable.text = fullNameMission;
                if(itemData.title.length > MAX_TITLE_LENGTH){
                    $NameMissionClickable.text = fullNameMission.substring(0, MAX_TITLE_LENGTH) + "...";
                }
                $NameMissionClickable.onClick(() => {
                    if(itemData.title.length > MAX_TITLE_LENGTH){
                        if(booleanFullNameMission){
                            $NameMissionClickable.text = fullNameMission; // Afficher le texte complet
                            booleanFullNameMission = false;
                        } else {
                            $NameMissionClickable.text = fullNameMission.substring(0, MAX_TITLE_LENGTH) + "...";
                            booleanFullNameMission = true;
                        }
                    }
                }); */

                $item("#repeterNameAssociation").text = itemData.association;
                $item("#repeterAdresseMission").text = itemData.adresseMission;
                $item("#repeterType").text = itemData.type;
                
                // Gestion taille catégorie
                const category = itemData.categorie;
                const truncatedCategory = category.length > MAX_CATEGORY_LENGTH ?
                                        category.substring(0, MAX_CATEGORY_LENGTH) + "..." :
                                        category;
                $item("#repeterCategorie").text = truncatedCategory;

                // $item("#repeterDateDebut").text = "Du "+itemData.dateDebut+ " au "+itemData.dateFin;
                //console.log("itemData.dateDebut / itemData.dateFin : "+itemData.dateDebut + " / " + itemData.dateFin);
                //Date de début
                let formattedStartDate = '';
                if (itemData.dateDebut !== undefined && itemData.dateDebut !== null && itemData.dateDebut !== "") {
                    formattedStartDate = "Du " + formatageDate(itemData.dateDebut);
                }
                // Date de fin
                let formattedEndDate = '';
                if (itemData.dateFin !== undefined && itemData.dateFin !== null && itemData.dateFin !== "") {
                    formattedEndDate = " au " + formatageDate(itemData.dateFin);
                }
                $item("#repeterDate").text = formattedStartDate + formattedEndDate;

                // Gestion de la taille du texte de la description
                const $descriptionClickable = $item("#repeterDescription");
                const fullDescription = itemData.description;
                var booleanFullDescription = true;
                $descriptionClickable.text = fullDescription;
                if(itemData.description.length > MAX_DESCRIPTION_LENGTH){
                    $descriptionClickable.text = fullDescription.substring(0, MAX_DESCRIPTION_LENGTH) + "...";
                }
                $descriptionClickable.onClick(() => {
                    if(itemData.description.length > MAX_DESCRIPTION_LENGTH){
                        if(booleanFullDescription){
                            $descriptionClickable.text = fullDescription; // Afficher le texte complet
                            booleanFullDescription = false;
                        } else {
                            $descriptionClickable.text = fullDescription.substring(0, MAX_DESCRIPTION_LENGTH) + "...";
                            booleanFullDescription = true;
                        }
                    }
                });
                // Créez un lien HTML pour le site internet
                $item("#repeterSite").text = itemData.website;
                // console.log("itemData.website : "+itemData.website);
                const siteLink = `<a href="${itemData.website}" target="_blank" style="font-size: 14px; font-family: 'Avenir Light', sans-serif; font-weight: normal; font-style: italic; color: #E41C64;">Voir site internet</a>`;
                $item("#repeterSite").html = siteLink;
            });
        } else {
            //Affichager si aucune mission n'est dans le périmètre
            $w("#textNoMission").show();
        }
    }

    // Filtrer les fonctionnalités qui se trouvent à moins de x mètres du point de référence
    function spatialFilter(feature) {
        var featureLatitude = feature.lat;
        var featureLongitude = feature.lng;
        //console.log("spatialFilter - Name : "+feature.title+" - lat long : "+featureLatitude+" / "+featureLongitude+" / "+latitude+ " / "+ longitude);
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
                listMissions();
            }
            

        } else if(event.data.type === "loadMarkers") {
            //console.log("event.data.type === loadMarkers : "+markers.length);
            // Recupérer les markers
            $w('#html2').postMessage({ type: 'ADD_MARKERS', data: allMarkers });
        }

    });

    
    // ----------Input Rechercher--------------
    // Récupérer la référence de l'input
    let inputSearch = $w('#input1');
     // Événement "input" pour détecter les changements dans l'input de recherche
    inputSearch.onInput((event) => {
        // Récupérer la valeur saisie dans l'input
        const searchTerm = event.target.value;
        searchMissionsByKeyWords(searchTerm);
    });

    // Fonction pour effectuer la recherche par mots clés
    function searchMissionsByKeyWords(searchTerm) {
        wixData.query("Missions")
        .contains('title', searchTerm)
        .or(
            wixData.query("Missions")
            .contains('type', searchTerm))
        .or(
            wixData.query("Missions")
            .contains('association', searchTerm))
        .or(
            wixData.query("Missions")
            .contains('adresseMission', searchTerm))
        .or(
            wixData.query("Missions")
            .contains('description', searchTerm))
        .or(
            wixData.query("Missions")
            .contains('categorie', searchTerm))
        .or(
            wixData.query("Missions")
            .contains('frequence', searchTerm))
        .or(
            wixData.query("Missions")
            .contains('presentiel', searchTerm))

        .limit(1000) // Spécifiez la limite pour récupérer toutes les lignes
        .find()
        .then(async (results) => {
            // Créer un tableau de marqueurs à partir des résultats de la requête
            
            allMarkers = await Promise.all(results.items.map(async item => {
                const associationId = item.idAssociation; // ID de l'association stocké dans le champ "idAssociation" de la mission
                const association = await getAssociation(associationId);
                //console.log("association : "+association.website);
                
                return {
                    _id: item._id,
                    id: item.id ?? "No id",
                    titreMission: item.title ?? "No title",
                    type: item.type ?? "No type",
                    nameAssociation: item.association ?? "No name association",
                    address: item.adresseMission ?? "No address mission",
                    lat: item.latitude ?? "No latitude",
                    lng: item.longitude ?? "No longitude",
                    categorie: item.categorie ?? "No categorie",
                    description: item.description ?? "No description",
                    frequence: item.frequence ?? "No frequence",
                    presentiel: item.presentiel ?? "No presentiel",
                    dateDebut: formatageDate(item.dateDebut),
                    dateFin: formatageDate(item.dateFin),

                    website: association ? association.website : "No website",
                };
        
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
            listMissions();

        })
        .catch((error) => {
            let errorMsg = error.message;
            let code = error.code;
            console.error("findAllMissions Error : "+code +" : "+errorMsg);
            console.trace(); // Affiche la pile d'appels
        });
    }

});