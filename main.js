// ******************************************************************* //  I
// ****    Récupération de la position actuelle de l'utilisateur  **** //
// ******************************************************************* //
var index = 0;
var longitude, latitude;
var map;
var zoom;
var vectorLayer;
var features, refineFeatures;
var options;
var optionCategorieText = "all";

// Au chargement de la page
window.addEventListener("load", getMap(2.29, 48.85, 7));

// Création d'une nouvelle carte OSM
function getMap(longitude, latitude, zoom) {
  //console.log("Chargement nouvelle map, zoom : "+ zoom);
   
  map = new ol.Map({
    target: 'map',
    // Définir les couches de la carte
    layers: [ //  les éléments visuels qui composent la carte
      new ol.layer.Tile({
        preload: 4,
        source: new ol.source.OSM() // OpenStreetMap (OSM) comme fournisseur de données pour la carte
      })
    ],
    // Définir la vue de la carte
    view: new ol.View({
      center: ol.proj.fromLonLat([longitude, latitude]), // Définir la position centrale de la carte
      //center: ol.extent.getCenter(extent),
      zoom: zoom, // Zoom de la map
      projection : 'EPSG:3857' // Projection Web Mercator de la carte utilisée pour les cartes en ligne et les applications de cartographie Web
    })
  });
}

window.addEventListener('scroll', function() {
    // obtenir la position de la div que l'on écoute
    var targetDiv = document.getElementById('map2'); // Le div au dessus de la map
    var targetPosition = targetDiv.getBoundingClientRect().top + window.pageYOffset;

    // obtenir la position actuelle de la fenêtre de l'utilisateur
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // déterminer si la position actuelle est au-dessus ou en dessous de la position souhaitée
    if (scrollTop > targetPosition) {
        if(index === 0){
            getLocation();
        }
        index++;
    }
});

map.on('moveend', function(event) {
  var zoom = map.getView().getZoom();
  console.log('Nouveau niveau de zoom : ' + zoom);
  // Map : Clean and Display
  //getMapCleanDisplay(features, longitude, latitude, optionCategorieText);
  performSearch();
});

function getLocation() {
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition, showError, {
          enableHighAccuracy: true, //  précision maximale dans la mesure du positionnement géographique
          maximumAge: 0 // le navigateur récupérera la position la plus récente (temps réel)
      });
  } else {
      alert("La géolocalisation n'est pas prise en charge par votre navigateur");
  }
}
  
// la position est récupérée avec succès
function showPosition(position) {
  
  latitude = position.coords.latitude;
  longitude = position.coords.longitude;
  //console.log("Long / lat : "+longitude +" / "+ latitude);

  // Supprimer la carte
  map.dispose();

  // Création d'une couche de points avec des coordonnées aléatoires
  features = [];
  features = getPoints(longitude, latitude);
  
  // Création de la map
  zoom = 12;
  getMap(longitude, latitude, zoom);
      
  
  // Map : Clear and Display
  getMapCleanDisplay(features, longitude, latitude);
} 
  
function showError(error) {
    /*switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("Vous avez refusé la géolocalisation");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Impossible de récupérer votre position");
            break;
        case error.TIMEOUT:
            alert("Temps d'attente dépassé");
            break;
        default:
            alert("Une erreur est survenue");
            break;
    } */
}

function getPoints(longitude, latitude){

  // Créer les points en utilisant la classe ol.Feature
  // A récupérer dans le service
  var point0 = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([longitude, latitude])),
    longitude: longitude,
    latitude: latitude,
    name: '', //'Mon emplacement',
    address: '' //address
  });
  var point1 = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([6.221862, 46.386442])),
    longitude: 6.221862,
    latitude: 46.386442,
    name: 'Association Rêves Suisse',
    address: 'Chem. d\'Eysins 32, 1260 Nyon, Suisse',
    categorie: 'Accompagnement enfant hospitalisé'
  });
  var point2 = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([6.6322734, 46.5196535])),
    longitude: 6.6322734,
    latitude: 46.5196535,
    name: 'Association ARFEC',
    address: 'Av. de la Vallonnette 17, 1012 Lausanne, Suisse',
    categorie: 'Accompagnement enfant hospitalisé'
  });
  var point3 = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([6.1431577, 46.2043907])),
    longitude: 6.1431577,
    latitude: 46.2043907,
    name: 'Paint a Smile',
    address: 'Rue de Jargonnant 2, 1207 Genève, Suisse',
    categorie: 'Aide à l\'handicap'
  });

  var point4 = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([6.641183, 46.7784736])),
    longitude: 6.641183,
    latitude: 46.7784736,
    name: 'Zoe4Life',
    address: 'district du Jura-Nord vaudois',
    categorie: 'Enfant en situation de précarité'
  });

  var point5 = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([4.835659, 45.764043])),
    longitude: 4.835659,
    latitude: 45.764043,
    name: 'Association Les Etoiles Filantes',
    address: '61 quai Jules Courmont 69002 Lyon',
    categorie: 'Accompagnement enfant hospitalisé',
  });

  var point6 = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([2.31556, 48.84522])),
    longitude: 2.31556,
    latitude: 48.84522,
    name: 'Hôpital Necker',
    address: '149 Rue de Sèvres, 75015 Paris',
    categorie: 'Accompagnement enfant hospitalisé'
  });



  features = [];
  features = [
    point0,
    point1,
    point2,
    point3,
    point4,
    point5,
    point6,
  ];

  return features;
}

function getOptionCategories(){

  options = [
    "Accompagnement enfant hospitalisé",
    "Aide à l'handicap",
    "Art et Culture",
    "Clowns à l'hôpital",
    "Divertissement",
    "Enfant du monde",
    "Enfant en situation de précarité",
    "Réalisation de rêves",
    "Sports"
  ];
  return options;
}
// ******************************************************************* //  I
// ****         Recherche et normalisation des points             **** //
// ******************************************************************* //

// Variables template :
const addressInput = document.getElementById('address');
const searchButton = document.getElementById('search');
const selectCategories = document.getElementById("selectCategories");

//-------------------
var placeholderOptionCategories = document.createElement("option");
placeholderOptionCategories.text = "Categories : Toutes";
//placeholderOption.disabled = true;
placeholderOptionCategories.selected = true;
selectCategories.add(placeholderOptionCategories);

// Récupération des catégories
options = getOptionCategories();
for (var i = 0; i < options.length; i++) {
  var option = document.createElement("option");
  option.text = options[i];
  option.value = i + 1;
  selectCategories.add(option);
}

selectCategories.addEventListener("change", function() {
  //var selectedValue = selectCategories.value;
  optionCategorieText = selectCategories.options[selectCategories.selectedIndex].text;
  console.log("Selected value: " + optionCategorieText);
});

const selectType = document.getElementById("selectType");
var placeholderOptionTypes = document.createElement("option");
placeholderOptionTypes.text = "Types : Tous";
//placeholderOption.disabled = true;
placeholderOptionTypes.selected = true;
selectType.add(placeholderOptionTypes);

//----------------
// Recherche par le bouton clavier enter
addressInput.addEventListener('keydown', function(event) {
  if (event.keyCode === 13) {
    event.preventDefault(); // empêche le rechargement de la page
    performSearch();
  }
});

// Recherche par le button id="search"
searchButton.addEventListener('click', performSearch);

// Fonction de recherche et placement des points sur la carte
function performSearch() {
        
  var address = addressInput.value;
  //console.log('Recherche de', address);
  var url = 'https://nominatim.openstreetmap.org/search?q=' + address + '&format=json';
  
  fetch(url)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      if (json.length > 0) {
        longitude = parseFloat(json[0].lon);
        latitude = parseFloat(json[0].lat);
        
        // Créer les points en utilisant la classe ol.Feature
        // A récupérer dans le service
        features = [];
        features = getPoints(longitude, latitude);

        // Map : Clean and Display
        getMapCleanDisplay(features, longitude, latitude, optionCategorieText);
      }
    });
}

// ******************************************************************* //  I
// ****        Filtre des points à afficher sur la carte          **** //
// ******************************************************************* //
function filteredFeatures(features, longitude, latitude, optionCategorieText){

  // Filtrer les fonctionnalités qui se trouvent à moins de x mètres du point de référence
  // /!\ C'est une données importante pour l'affichage des points 
  const radius = 100; // kilomètres

  function spatialFilter(feature) {
    var featureLatitude = feature.get('latitude');
    var featureLongitude = feature.get('longitude');
    const dist = distance(latitude, longitude, featureLatitude, featureLongitude);
    
    //console.log("distance < radius : "+dist +" < "+ radius);
    return dist < radius;
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

  // Créer un tableau vide pour stocker les fonctionnalités filtrées
  var refineFeatures = [];
  // Parcourir les fonctionnalités et ajouter celles qui satisfont la condition spatialFilter()
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    if (spatialFilter(feature)) {
      var name = feature.get('name');
      console.log("name : "+name);
      var categorie = feature.get('categorie');
      console.log("categorie : "+categorie);
      if(optionCategorieText == "all" || optionCategorieText == categorie){
        refineFeatures.push(feature);
        //var name = feature.get('name');
        //console.log("refineFeatures : "+name);
      }
    }
  }
  return refineFeatures;
}

// Map : Clean and Display
function getMapCleanDisplay(features, longitude, latitude, optionCategorieText){

  // Suppression des couches Points de la carte
  map.getLayers().forEach(function(layer, index) {
    if (index >= 1){ // Element 0 is the map
      map.removeLayer(layer);
    }
  });
  // Suppression de tous les overlay
  map.getOverlays().clear();

  // Créer une source de données vectorielles vide
  var vectorSource = new ol.source.Vector({
    features: []
});

  // Créer une couche vectorielle avec la source de données
  vectorLayer = new ol.layer.Vector({
    source: vectorSource
  });

  // Ajouter la couche layer filtrée avec les features à la map
  map.addLayer(vectorLayer);
   
  // Personnalisation des features
  //getCustomFeatures(features, vectorSource);

  // Créer un tableau vide pour stocker les fonctionnalités filtrées
  refineFeatures = [];
  // Filtre des points à afficher
  refineFeatures = filteredFeatures(features, longitude, latitude, optionCategorieText);
  //console.log("refineFeatures.length : "+ refineFeatures.length);

  // Personnalisation des features
  getCustomFeatures(refineFeatures, vectorSource);

  // Fonction 'moveend' : Centrage et zoom automatique lors de la localisation puis de input search 
  getExtentMoveEnd(refineFeatures);  
}

// Gestion de la fonction 'moveend'
function getExtentMoveEnd(refineFeatures){
  // Fonction de rappel de l'événement 'moveend'
  function handleMoveEnd() {
    var center = map.getView().getCenter();
    longitude = center[0];
    latitude = center[1];
    //console.log('center Longitude :', longitude, ' / center Latitude :', latitude);
  }

  // Utiliser une fonction debounce pour limiter la fréquence d'appel à handleMoveEnd
  var debounceMoveEnd = debounce(handleMoveEnd, 500);

  // Ajouter l'écouteur d'événement avec la fonction debounce
  map.on('moveend', debounceMoveEnd);

  // Fonction debounce pour ajouter un délai avant d'appeler la fonction de rappel
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  // Calcul du niveau de zoom et du centre de la carte en fonction des points
  // Créer un extent vide
  var extent = ol.extent.createEmpty();

  // Parcourir le tableau de features et étendre l'extent avec les coordonnées de chaque feature
  //refineFeatures = vectorLayer.getSource().getFeatures();
  refineFeatures.forEach(function(feature) {
    ol.extent.extend(extent, feature.getGeometry().getExtent());
    //var name = feature.get('name');
    //console.log("moveend : "+name);
  });
  // Récupérer les coordonnées xmin, ymin, xmax et ymax de l'extent étendu
  var xmin = extent[0];
  var ymin = extent[1];
  var xmax = extent[2];
  var ymax = extent[3];
  //console.log(xmin +" / "+ ymin +" / "+ xmax +" / "+ ymax);

  // Créer l'extent en utilisant les coordonnées minimales et maximales
  extent = ol.extent.createOrUpdate(xmin, ymin, xmax, ymax);
  
  // ajouter un padding pour zoomer légèrement plus loin que les points
  var padding = [50, 50, 50, 50];
  
  // Si l'étendue n'est pas vide, calculez le niveau de zoom approprié
  if (!ol.extent.isEmpty(extent)) {
    var center = ol.extent.getCenter(extent);
    
    // définir la durée de l'animation en millisecondes
    var duration = 2000;
    
    // définir la vue actuelle de la carte
    var view = map.getView();

    // Fonction flyTo d'OpenLayers pour animer la vue vers les nouvelles coordonnées
    view.animate({
      center: center,
      duration: duration,
      easing: ol.easing.easeOut,
      render: function() {
        map.renderSync();
      }
    });

    // Ajustez la vue de la carte pour que l'étendue des points soit visible à l'écran
    view.fit(extent, {
      size: map.getSize(),
      center: center,
      padding: padding,
      maxZoom: 18,
      constrainResolution: true, // une valeur booléenne qui indique si la résolution doit être maintenue lors du zoom.
      duration: duration
    }); 

  }

  // Récupérez le niveau de zoom final
  // var zoomLevel = map.getView().getZoom();
  //console.log("zoomLevel :"+ zoomLevel);
}

// ******************************************************************* //  I
// ****       Itération sur les points affichés sur la carte      **** //
// ******************************************************************* //
// Personalisation de chaque feature
function getCustomFeatures(features, vectorSource){
  
  var indexPoint = 0;
  features.forEach(function(feature, index) {
    
    //console.log("Nombre de features : ", features.length);
    var type = feature.getGeometry().getType();
    //console.log("Feature " + index + " type: " + type);
    
    if (type === 'Point') {
      if (indexPoint === 0) {
        var geometry = feature.getGeometry();
        var coordinates = geometry.getCoordinates();
        var name = feature.get('name');
        var address = feature.get('address');
        //console.log("Le premier élément est:", name + " " + address);
        
        // Créer un style pour le point avec une icône personnalisée
        var iconStyle = new ol.style.Style({
          image: new ol.style.Icon({
            src: '\img/pin-location-icon-red3.png',
            scale: 0.03 // Spécifie la taille de l'icône
          }),
          // définition du curseur sur "pointer" lorsque la souris passe sur le point
          cursor: 'pointer'
        });
        feature.setStyle(iconStyle);

      } else {

        // Créer un élément HTML pour le contenu de l'overlay
        var content = document.createElement('div');
        var address = feature.get('address');
        var name = feature.get('name');
        //console.log("Adresse élément "+index+" : ", name +" "+address);

        var nouveauNoeudTexte = document.createTextNode(name);
        content.appendChild(nouveauNoeudTexte);
        
        // Créer un élément HTML et l'ajouter à l'élément parent
        var span = document.createElement('div');
        span.innerHTML = address;
        content.appendChild(span);

        // Créer un style pour le point avec une icône personnalisée
        var iconStyle = new ol.style.Style({
          image: new ol.style.Icon({
            src: '\img/pin-location-icon-blue.png',
            scale: 0.06, // Spécifie la taille de l'icône
            className: 'animated-marker'
          })
        });
        feature.setStyle(iconStyle);
        
        // Créer un overlay pour afficher le contenu
        var overlay = new ol.Overlay({
          id: index,
          element: content,
          offset: [-15, 0], // left/right, top/bottom
          positioning: 'center-right',
          stopEvent: false // propagation des événements 
        });

        

        // Modifier le style CSS de l'overlay
        overlay.getElement().style.backgroundColor = 'rgba(255, 255, 255, 1)';
        overlay.getElement().style.color = 'black';
        overlay.getElement().style.fontFamily = 'Calibri';

        // Positionner l'overlay à l'emplacement du point
        var geometry = feature.getGeometry();
        var coordinates = geometry.getCoordinates();
        var lonlat = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
        var lon = lonlat[0];
        var lat = lonlat[1];
        overlay.setPosition(ol.proj.fromLonLat([lon, lat]));
        
        // Ajouter l'overlay à la carte OpenLayers
        features.push(overlay);
        map.addOverlay(overlay);
      }
      indexPoint++;
    }
    // Ajouter la fonctionnalité à la couche vectorielle
    vectorSource.addFeature(feature);

    // Récupère tous les overlays de la carte
    var overlays = map.getOverlays().getArray();
    console.log("overlays : "+ overlays);
  });
}



map.on('click', function(evt) {
  var coordinate = evt.coordinate;
  console.log('Clic à la position : ' + ol.proj.toLonLat(coordinate));
});