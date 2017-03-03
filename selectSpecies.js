    require([
	  "esri/Color",
	  "esri/config",
	  "esri/dijit/Legend",
	  "esri/geometry/scaleUtils",
      "esri/InfoTemplate",
      "esri/map",
      "esri/layers/FeatureLayer",
	  "esri/layers/ArcGISTiledMapServiceLayer",
	  "esri/layers/ArcGISImageServiceLayer",
	  "esri/renderers/SimpleRenderer",
	  "esri/request",
	  "esri/symbols/PictureMarkerSymbol",
      "esri/symbols/SimpleFillSymbol",
      "esri/symbols/SimpleLineSymbol",
      "esri/tasks/query",
	  "esri/tasks/RelationshipQuery",
      "esri/toolbars/draw",
	  "dgrid/Grid",
      "dojo/dom",
	  "dojo/json",
      "dojo/on",
	  "dojo/number",
      "dojo/parser",
	  "dojo/sniff",
      "dojo/_base/array",
	  "dojo/_base/lang",
      "dijit/form/Button",
      "dijit/layout/BorderContainer",
      "dijit/layout/ContentPane",	  
      "dojo/domReady!"
    ],
function (Color, esriConfig, Legend, scaleUtils, InfoTemplate, Map, FeatureLayer, ArcGISTiledMapServiceLayer, ArcGISImageServiceLayer,
		SimpleRenderer, request, PictureMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, Query, RelationshipQuery, Draw, Grid,
        dom, JSON, on, number, parser, sniff, arrayUtils, lang, Button) {

	
		// The Dojo Parser is a module which is used to convert specially decorated nodes in the DOM and convert them 
		// into Dijits, Widgets or other Objects. By decorated we mean the dom element has a "data-dojo-type" attribute. 
        parser.parse();
		
	    // The portalURL variable and esriConfig.defaults.io.proxyUrl property specify what ArcGIS online site to send an
		// uploaded shapefile to so that it can be converted into a feature layer and accessed by this application.
		// I just use Esri's ArcGIS online URL since no other requirements or setup is necessary.
		var portalUrl = "https://www.arcgis.com";
        esriConfig.defaults.io.proxyUrl = "/proxy/";
		
		// Declare some variables that will be used throughout the script. 
        var selectionToolbar, tiledLayer, featureLayer, dataLayer, map,
			imageLayer, speciesOutputGrid, shapeFileFeatureLayer;
			
		// Delcare the table layout that will be displayed below the map.
		var tableLayout = [
			{'label': 'Conservation Target', 'field': 'speciesName', 'width': 'auto'},
			{'label': 'Amount (sq. km)', 'field': 'speciesAmount', 'width': 'auto'},
			{'label': 'Range Restricted Area (% Total Targeted)','field': 'total', 'width': 'auto'}
		];

		// dgrid.Grid object let's you create a simple HTML table with parameters you specify.
		// In this case the fields will specify data from our dataLayer feature layer.
		speciesOutputGrid = new Grid(
			{columns: tableLayout},
			'speciesGrid'
		);
		
		// Load the basemap from Esri's streets catalog.
        map = new Map("mapDiv", {
			basemap: "streets",
			center: [-80, 38],
			zoom: 6,
			minZoom: 6,
			maxZoom: 12,
			shapeSelected: false
        });
		
		// After base map is loaded load the tile layer maps we have published.
        map.on("load", initSelectToolbar);
		tiledLayer = new ArcGISTiledMapServiceLayer("https://webgis.coe.clemson.edu/arcgis/rest/services/Hosted/HexagonMap_status_13levels/MapServer",
			{
				opacity: .75
			}
		);

		// Load the polygon feature layer for selection.
		featureLayer = new FeatureLayer("https://webgis.coe.clemson.edu/arcgis/rest/services/AppLLC/MapServer/0", 
			{
				mode: FeatureLayer.MODE_SELECTION,
				showAttribution: false,
				opacity: 0.5,
				outFields: ["*"]
			}
		);
		
		// Load the data table from the publsihed data layer.
		dataLayer = new FeatureLayer("https://webgis.coe.clemson.edu/arcgis/rest/services/AppLLC/MapServer/1",		
			{
				outFields: ["*"]
			}
		);
		

//////////////////////////////////////////////////////////////////////////////
		// After each layer is loaded we'll add the layer to the map Object 
		// which will display it within the app. Of course the dataLayer does
		// not get added to the basemap.

		featureLayer.on("load", function(layer) {
			console.log("featureLayer is loaded");
			//console.log("featureLayer = ", featureLayer);
		
			var selectionSymbol = new SimpleFillSymbol().setColor(new Color([255, 255, 0,.5]));
			featureLayer.setSelectionSymbol(selectionSymbol);
			
			map.addLayer(featureLayer);
		});
		
		tiledLayer.on("load", function(layer) {
				console.log("tiledLayer is loaded");
				//console.log("tiledLayer = ", tiledLayer);
				map.addLayer(tiledLayer);
				
		});
		
		dataLayer.on("load", function(layer) {
				console.log("dataLayer is loaded");
				//console.log("dataLayer = ", dataLayer);
		});

		
/////////////////////////////////////////////////////////////////////////////	
		// We'll load and display the legend of the tileLayered map.
		// Whenever a layer is finished being added to the map object
		// this function will kick off. We'll check to see if the layer
		// that's finished is the tiledLayer. If it is we'll setup
		// a legned dijit (dojo widget) that will be added to our 
		// DOM tree.
		map.on("layer-add-result", function (event) {
			//console.log("layer-add-result event...", event);
			var layerInfos = event.layer.layerInfos;
			
			// We have to check for layerInfos property because when a shape file is 
			// loaded and added to the map this function will cause an error since 
			// the shapefile layer doesn't have a layerInfos property.
			if (layerInfos) {
				//console.log("layerInfo = ", layerInfo);
				var layerName = event.layer.layerInfos[0].name;
	
				// The name of the tiledLayer is called "Export_Output" (Didn't think ahead
				// on this one) so we'll check to see if that's the layer that was added.
				if (layerName === "Export_Output") {
					// set the name of the tiledLayer to empty 
					// because the legend displays the name of the tiledLayer and 
					// don't want the legend to display "Export_Output"
					event.layer.layerInfos[0].name = "";				
					//console.log("layers detected...");
					//console.log("tiledLayer = ", tiledLayer);
					
					// Create a layerInfo object that will be sent to the Legend dijit.
					var layerInfo = [{
						title: "Integrated Solution",
						layer: tiledLayer
					}];

					// Create the Legend dijit. 
					var legendDijit = new Legend({
						layerInfos: layerInfo,
						map: map
					}, legendDiv);
					legendDijit.startup();
				}
			}
		});

		// Every time the user tries to zoom either in or out this function will
		// kick off. We've set some restrictions on the zoom. A user will not
		// be able to zoom further then level 6 because there is no point to.
		// and the user will not be able to zoom closer than level 12 because
		// the tiled layer only has tiles defined up to level 12.
		// We'll also set the opacity of the tiled layer as the user zooms in 
		// and out.
		map.on("zoom-end", function(z) {
				//console.log("zoom level = ", z.level);
				var minZoom = 6;
				var maxZoom = 12;
				
				if (z.level <= minZoom) 
					tiledLayer.setOpacity(.65);
				if ((z.level > minZoom) && (z.level < maxZoom)) 
					tiledLayer.setOpacity(.45);
				if (z.level >= maxZoom) 
					tiledLayer.setOpacity(.45);
		});


//////////////////////////////////////////////////////////////////////////////
		// This function is the meat of the application. 
		// The basic algorithm for this function goes as follows:
		// 1) Create Draw event for anything on the map.
		// 2) When the draw event completes we check to see if it's a polygon or point.
		// 3) We query the feature layer based on the selected geomtry from the user.
		// 4) Once we've selected the feature(s) from the feature layer we perform
		//    a relationship query against the datalayer to get the needed data 
		//    for the table.
		// 5) Once this data is obtained we call summerizeSpeciesAmounts() to 
		//    update the table.
		
	    function initSelectToolbar (event) {
		
			// Disable infowindow on map. We don't need it.
			map.setInfoWindowOnClick(false); 
			
			// New Draw object checked against our map.
			selectionToolbar = new Draw(event.map);
			// Create a new Query object.
			var selectFeatureQuery = new Query();
			// Create a new Relationship query object.
			var relatedDataQuery = new RelationshipQuery();
			// We want to get all the fields from the relationship query.
			relatedDataQuery.outFields = ["*"];
			relatedDataQuery.relationshipId = 0;

			// User's selected something let's get the geomtry and query the feature layer
			// for the selection.
			on(selectionToolbar, "DrawEnd", function (geometry) {
				selectFeatureQuery.geometry = geometry;
				
				// If selected feature is polygon...
				if (geometry.type == "polygon") {
					var featuresBtn = dom.byId("selectFeaturesButton");
					var btnEvent = new Event('click');
					featuresBtn.dispatchEvent(btnEvent);
					//we don't want the user to select more than one polygon.
					selectionToolbar.deactivate();
					featureLayer.selectFeatures(selectFeatureQuery,FeatureLayer.SELECTION_ADD);
					
				// Else we assume selected feature is a point within a single PU.
				} else {
					//console.log("single feature query select...");
					featureLayer.queryIds(selectFeatureQuery, function(objectIds) {
					    //console.log("objectIds = ", objectIds);
						var graphics = featureLayer.getSelectedFeatures();
						//console.log("graphics = ", graphics);
						var selectSubtract = false;
						selectSubtract = graphics.some( function (feature) {
						    //console.log("feature.attributes.objectid = " + feature.attributes.OBJECTID);
							return (objectIds[0] == feature.attributes.OBJECTID);
						});
						if (selectSubtract) {
							featureLayer.selectFeatures(selectFeatureQuery,	FeatureLayer.SELECTION_SUBTRACT);
							speciesOutputGrid.refresh();
						} else {
							featureLayer.selectFeatures(selectFeatureQuery,	FeatureLayer.SELECTION_ADD);
						}
					});
				}
			});
			
			on (featureLayer,"selection-complete", function (results,method) {
				var graphics = featureLayer.getSelectedFeatures();
				var objectids = new Array;
				
				//console.log("Selection query is finished");
				//console.log("graphics = ", graphics);
				//console.log("graphics.length = " + graphics.length);
				
				graphics.forEach( function (feature) {
					//console.log("feature = ", feature);
					//console.log("feature.attributes = " + Object.keys(feature.attributes));
					//console.log("feature.attributes.objectid = " + feature.attributes.objectid);
					objectids.push(feature.attributes.OBJECTID);
				});
				//console.log("objectids = ", objectids);
				
				relatedDataQuery.objectIds = objectids;
				featureLayer.queryRelatedFeatures(relatedDataQuery, null, function(err) {
					console.log("related query error: ", err);
				});

			});
			
			on (featureLayer,"query-related-features-complete", function (results) {
				var features = results.featureSets;
				//console.log("results = ", results);
				var objectids = new Array;
				//console.log("Related query is finished.");
				//console.log("Related features = ", features);
				summerizeSpeciesAmounts(features);
			});

        }

		
		// When the user selects this button we set the Draw object to create
		// a polygon
		on(dom.byId("selectFeaturesButton"), "click", function (event) {
			var featuresBtn = dom.byId("selectFeaturesButton");
			var featureBtn = dom.byId("selectFeatureButton");
		
			if (!featuresBtn.toggle) {
				featuresBtn.className = "btn-active";
				featuresBtn.toggle = true;
				featureBtn.className = "btn";
				featureBtn.toggle = false;
				selectionToolbar.activate(Draw.POLYGON);
			} else {
				featuresBtn.className = "btn";
				featuresBtn.toggle = false;
				selectionToolbar.deactivate();
			}
        });
		
		// When the user selects this button we set the Draw object to create
		// a point.
		on(dom.byId("selectFeatureButton"), "click", function (event) {
			var featuresBtn = dom.byId("selectFeaturesButton");
			var featureBtn = dom.byId("selectFeatureButton");
		
			if (!featureBtn.toggle) {
				featureBtn.className = "btn-active";
				featureBtn.toggle = true;
				featuresBtn.className = "btn";
				featuresBtn.toggle = false;
				selectionToolbar.activate(Draw.POINT);
			} else {
				featureBtn.className = "btn";
				featureBtn.toggle = false;
				selectionToolbar.deactivate();
			}		
        });

		// This button will cause a file explorer window to be displayed
		// which will allow the user to choose a shapefile.
		on(dom.byId("uploadForm"), "change", function (event) {
			var fileName = event.target.value.toLowerCase();
			
			//filename is full path in IE so extract the file name
			if (sniff("ie")) { 
				var arr = fileName.split("\\");
				fileName = arr[arr.length - 1];
            }
			
			//Is fileName zip file?
            if (fileName.indexOf(".zip") !== -1) {
				generateFeatureCollection(fileName);
            }
			//Notify user file needs to be zipped.
            else {
				dom.byId('statusMessage').innerHTML = '<p class="status-message-bad" id="statusMessage">Error: Shapefile needs to be zipped</p>';
            }
		});
	
		// This button clears all selected features on the map as well
		// as any shape files that were loaded.
        on(dom.byId("clearSelectionButton"), "click", function () {
			var featuresBtn = dom.byId("selectFeaturesButton");
			var featureBtn = dom.byId("selectFeatureButton");
		
			if (shapeFileFeatureLayer) {
				var formLabelId = dom.byId('formLabelId');
				map.removeLayer(shapeFileFeatureLayer);
				shapeFileFeatureLayer = null;
			}

			featureBtn.className = "btn";
			featureBtn.toggle = false;
			featuresBtn.className = "btn";
			featuresBtn.toggle = false;
			
			selectionToolbar.deactivate()
			featureLayer.clearSelection();
			speciesOutputGrid.refresh();
			map.shapeSelected = false;
			
        });
		
		
		// Get the data from the queries and apply it to the table.
		function summerizeSpeciesAmounts(features) {
		
			var graphics = featureLayer.getSelectedFeatures();
			var selectedFeatures = new Array();
			var selectedFeaturesOut = new Array();
			var totalNumSpecies = 30;
			var dataAvailable = false;
			
			for (var i=0;i<totalNumSpecies;i++) { 
				selectedFeatures.push({
					"speciesId" : 0,
					"speciesName" : "",
					"speciesAmount" : 0,
					"total" : 0.0
				});
			}
			
			//console.log("selectedFeatures = ", selectedFeatures);
			//console.log("graphics = ", graphics);
			//console.log("features = ", features);

			graphics.forEach( function (feature) {
				strObjectId = "" + feature.attributes.OBJECTID;
				//console.log("objectID = " + strObjectId);
				if (features[strObjectId]) {
					dataAvailable = true;
					var puFeatures = features[strObjectId].features;
					//console.log("puFeatures = ", puFeatures); 
					puFeatures.forEach( function (puFeature) {
						selectedFeatures[puFeature.attributes.species].speciesId = puFeature.attributes.species;
						selectedFeatures[puFeature.attributes.species].speciesName = puFeature.attributes.name;
						selectedFeatures[puFeature.attributes.species].speciesAmount += puFeature.attributes.amount;
					});
				}
			});
			
			selectedFeatures.forEach( function (selectedFeature) {
				if (selectedFeature.speciesId > 0) {
					tmpObject = speciesIndex[selectedFeature.speciesId-1];
					selectedFeature.speciesName = tmpObject["Conservation Target"];
					selectedFeature.total = (selectedFeature.speciesAmount / tmpObject["reservedarea"] * 100);
					selectedFeature.total = number.format(number.round(selectedFeature.total,4), {
						places: 4});
					if (selectedFeature.total == 0) selectedFeature.total = "value less than 0.0001";
						
					// make sure the next calculation is done after the selectedFeature.total is calculated.
					//console.log("selectedFeature.speciesAmount = " + selectedFeature.speciesAmount);
					selectedFeature.speciesAmount = number.format(number.round((selectedFeature.speciesAmount / 1000000),3), {
						places: 3});
					if (selectedFeature.speciesAmount == 0) selectedFeature.speciesAmount = "value less than 0.001";
					selectedFeaturesOut.push(selectedFeature);
				}
			});
				
			if (!dataAvailable) {
				selectedFeaturesOut.push({speciesName:"No data available for that area"});
			}
			speciesOutputGrid.refresh();
			speciesOutputGrid.renderArray(selectedFeaturesOut);
			
			//console.log("selectedFeatures = ", selectedFeatures);
			
			return;
		}
		
		// Take the loaded shape file and generate a feature layer that can be displayed on the map.
		function  generateFeatureCollection(fileName) {
			var name = fileName.split(".");
			
            //Chrome and IE add c:\fakepath to the value - we need to remove it
            //See this link for more info: http://davidwalsh.name/fakepath
            name = name[0].replace("c:\\fakepath\\", "");
			
			dom.byId('statusMessage').innerHTML = '<p class="status-message-neutral" id="statusMessage">Status: Loading... ' + name + '</p>' 
			
            //Define the input params for generate see the rest doc for details
            //http://www.arcgis.com/apidocs/rest/index.html?generate.html
            var params = {
				'name': name,
				'targetSR': map.spatialReference,
				'maxRecordCount': 500,
				'enforceInputFileSizeLimit': true,
				'enforceOutputJsonSizeLimit': true
            };
			
            //generalize features for display Here we generalize at 1:40,000 which is approx 10 meters
            //This should work well when using web mercator.
			var extent = scaleUtils.getExtentForScale(map, 40000);
            var resolution = extent.getWidth() / map.width;
            params.generalize = true;
            params.maxAllowableOffset = resolution;
            params.reducePrecision = true;
            params.numberOfDigitsAfterDecimal = 0;
			
            var myContent = {
				'filetype': 'shapefile',
				'publishParameters': JSON.stringify(params),
				'f': 'json',
				'callback.html': 'textarea'
            };
			
            request({
				url: portalUrl + '/sharing/rest/content/features/generate',
				content: myContent,
				form: dom.byId('uploadForm'),
				handleAs: 'json',
				load: lang.hitch(this, function (response) {
					if (response.error) {
						console.log("error was hit...");
						errorHandler(response.error);
						return;
					}
					var layerName = response.featureCollection.layers[0].layerDefinition.name;
					dom.byId('statusMessage').innerHTML = '<p class="status-message-good" id="statusMessage">Status: shapefile is loaded</p>';
					addShapefileToMap(response.featureCollection);
				}),
				error: lang.hitch(this, shapeFileErrorHandler)
            });
			
			function shapeFileErrorHandler(error) {
				dom.byId('statusMessage').innerHTML = '<p class="status-message-bad" id="statusMessage">Error: Failed to load shapefile</p>';
				console.log('Error loading shapefile.');
				console.log('Error Message = ', error);
			}

		}
	
		// Add the shapefile to the map.
        function addShapefileToMap (featureCollection) {
			//add the shapefile to the map and zoom to the feature collection extent
			//If you want to persist the feature collection when you reload browser you could store the collection in
			//local storage by serializing the layer using featureLayer.toJson()  see the 'Feature Collection in Local Storage' sample
			//for an example of how to work with local storage.
			var fullExtent;
            var layers = [];
			var selectShapeQuery = new Query();
			var featuresBtn = dom.byId("selectFeaturesButton");
			var featureBtn = dom.byId("selectFeatureButton");

            arrayUtils.forEach(featureCollection.layers, function (layer) {
				var infoTemplate = new InfoTemplate("Details", "${*}");
				shapeFileFeatureLayer = new FeatureLayer(layer, {
					infoTemplate: infoTemplate
				});
				//associate the feature with the popup on click to enable highlight and zoom to
				shapeFileFeatureLayer.on('click', function (event) {
					//map.infoWindow.setFeatures([event.graphic]);
					if ((!featureBtn.toggle) && (!featuresBtn.toggle) && (!map.shapeSelected)) {
						selectShapeQuery.geometry = event.graphic.geometry;
						map.shapeSelected = true;
						featureLayer.selectFeatures(selectShapeQuery,FeatureLayer.SELECTION_ADD);
					}
				});
				
				//change default symbol if desired. Comment this out and the layer will draw with the default symbology
				changeRenderer(shapeFileFeatureLayer);
				fullExtent = fullExtent ? fullExtent.union(shapeFileFeatureLayer.fullExtent) : shapeFileFeatureLayer.fullExtent;
				layers.push(shapeFileFeatureLayer);
            });
			
            map.addLayers(layers);
            map.setExtent(fullExtent.expand(1.25), true);

			dom.byId('statusMessage').innerHTML = "";
          }

		  // This sets out the shape file is rendered on the map.
          function changeRenderer (layer) {
            //change the default symbol for the feature collection for polygons and points
            var symbol = null;
            switch (layer.geometryType) {
              case 'esriGeometryPoint':
                symbol = new PictureMarkerSymbol({
                  'angle': 0,
                  'xoffset': 0,
                  'yoffset': 0,
                  'type': 'esriPMS',
                  'url': 'https://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png',
                  'contentType': 'image/png',
                  'width': 20,
                  'height': 20
                });
                break;
              case 'esriGeometryPolygon':
                symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                  new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([112, 112, 112]), 1), new Color([136, 136, 136, 0.25]));
                break;
            }
            if (symbol) {
              layer.setRenderer(new SimpleRenderer(symbol));
            }
          }
	
});
