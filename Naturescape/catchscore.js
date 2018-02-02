define([
	  "esri/Color",
	  "esri/config",
	  "esri/dijit/HomeButton",
	  "esri/dijit/Legend",
	  "esri/dijit/OpacitySlider",
	  "esri/dijit/PopupTemplate",
	  "esri/geometry/scaleUtils",
	  "esri/graphic",
      "esri/InfoTemplate",
      "esri/map",
      "esri/layers/FeatureLayer",
	  "esri/layers/ArcGISTiledMapServiceLayer",
	  "esri/layers/ArcGISImageServiceLayer",
	  "esri/renderers/SimpleRenderer",
	  "esri/renderers/UniqueValueRenderer",
	  "esri/request",
	  "esri/symbols/PictureMarkerSymbol",
      "esri/symbols/SimpleFillSymbol",
      "esri/symbols/SimpleLineSymbol",
      "esri/tasks/query",
	  "esri/tasks/RelationshipQuery",
      "esri/toolbars/draw",
	  "dgrid/Grid",
	  "dgrid/Selection",
	  "dojo/aspect",
      "dojo/dom",
	  "dojo/json",
      "dojo/on",
	  "dojo/number",
      "dojo/parser",
	  "dojo/query",
	  "dojo/sniff",
	  "dojo/window",
      "dojo/_base/array",
	  "dojo/_base/declare",
	  "dojo/_base/lang",
      "dijit/form/Button",
      "dijit/layout/BorderContainer",
      "dijit/layout/ContentPane",	  	  
      "dojo/domReady!"
    ],
function (Color, esriConfig, HomeButton, Legend, OpacitySlider, PopupTemplate, scaleUtils, Graphic, InfoTemplate, Map, FeatureLayer, 
			ArcGISTiledMapServiceLayer, ArcGISImageServiceLayer, SimpleRenderer, UniqueValueRenderer, request, PictureMarkerSymbol, 
			SimpleFillSymbol, SimpleLineSymbol, Query, RelationshipQuery, Draw, Grid, Selection, aspect, dom, JSON, on, number, parser, 
			dojoQuery, sniff, dojoWindow, arrayUtils, declare, lang, Button, BorderContainer, ContentPane) {
				
		return function (layerParms) {
			
			// layerParms function argument should be an object with the following properties populated:
			// {
			//		"featureLayerServiceURL": /*string*/,
			//      "tileLayerServiceURL": /*string*/,
			//      "dataLayerServiceURL": /*string*/
			// }				
				
			// Declare some variables that will be used throughout the script. 
			var selectionToolbar, tiledLayer, featureLayer, dataLayer, map,
				imageLayer, shapeFileFeatureLayer, infoTemplate, catchmentGrid;
				
			// The portalURL variable and esriConfig.defaults.io.proxyUrl property specify what ArcGIS online site to send an
			// uploaded shapefile to so that it can be converted into a feature layer and accessed by this application.
			// I just use Esri's ArcGIS online URL since no other requirements or setup is necessary.
			var portalUrl = "https://www.arcgis.com";
			esriConfig.defaults.io.proxyUrl = "/proxy/";				
				
			// Delcare infoTemplate for feature layer attribute display window
			var infoTemplate = new InfoTemplate("Catchment Score","${CatchScore}");
			
				// Delcare the table layout that will be displayed below the map.
			var tableLayout = [
				{'id': 'puid', 'label': 'Planning Unit(PU) ID', 'field': 'PUId'},
				{'id': 'cscore', 'label': 'Catchment Score', 'field': 'catchScore'}
			];

			// Create custom dgrid class that includes the "dgrid/Selection" mixin object.
			CustomGrid = declare([Grid, Selection]);
			
			// dgrid.Grid object let's you create a simple HTML table with parameters you specify.
			// In this case the fields will specify data from our dataLayer feature layer.
			
			catchmentGrid = new CustomGrid({
				columns: tableLayout,
				selectionMode: "single",
				allowTextSelection: true,
				selectedHighlight: null
			},	'speciesGrid-3');
			
			catchmentGrid.on('dgrid-select', targetRowSelect);
			catchmentGrid.on('dgrid-deselect', targetRowDeselect);
			catchmentGrid.on('.dgrid:mouseover', targetRowMouseover);
			catchmentGrid.on('.dgrid:mouseout', targetRowMouseout);
			

			// Load the basemap from Esri's streets catalog.
			map = new Map("mapDiv-3", {
				basemap: "satellite",
				center: [-80, 38],
				zoom: 6,
				minZoom: 6,
				maxZoom: 13,
				shapeSelected: false
			});
			
			// Create a home button to reset map position.
			var homeButton = new HomeButton({
					map: map
				},"homebutton-3");
			homeButton.startup();	
			
			// Setup the opacity info object to be passed to the opacity slider.
			var oInfo = {
				field: "fieldName",
				handles: [0],
				stops: [
					{value:8, opacity:1}
				]
			};

			// Create opacity slider for users.
			var opacitySlider = new OpacitySlider({
					opacityInfo: oInfo,
					maxValue: 10,
					minValue: 0,
					showLabels: false
				},"opacityslider-3");
				
			opacitySlider.startup();

			opacitySlider.on("handle-value-change", function(data) {
				//console.log("data = ", data);
				tiledLayer.setOpacity((data.stops[0].value / 10));
			});	
		
			// After base map is loaded load the tile layer maps we have published.
			map.on("load", initSelectToolbar);
			
			tiledLayer = new ArcGISTiledMapServiceLayer(layerParms.tileLayerServiceURL,
				{
					opacity: (opacitySlider.opacityInfo.stops[0].value / 10)
				}
			);
			
			// Load the polygon feature layer for selection.
			featureLayer = new FeatureLayer(layerParms.featureLayerServiceURL,
				{
					mode: FeatureLayer.MODE_SELECTION,
					outFields: ["*"],
					infoTemplate: infoTemplate,
					showAttribution: false
				}
			);
			
			// Load the data table from the publsihed data layer.
			dataLayer = new FeatureLayer(layerParms.dataLayerServiceURL,
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
				
				//Set the color and stlye of selected features.
				var selectionSymbol = new SimpleFillSymbol(
					SimpleFillSymbol.STYLE_DIAGONAL_CROSS,    
					new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2),
					new Color([0,0,0,0])
				);			
				featureLayer.setSelectionSymbol(selectionSymbol);
				
				// Add the feature layer to the map.
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
					var maxZoom = 13;
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
			
				//console.log("map = ", map);
				
				
				// Disable infowindow on map. We don't need it.
				map.setInfoWindowOnClick(false); 
				
				// New Draw object checked against our map.
				selectionToolbar = new Draw(event.map);
				// Create a new Query object.
				var selectFeatureQuery = new Query();
				
				// Create a new Relationship query object.
				// var relatedDataQuery = new RelationshipQuery();
				// // We want to get all the fields from the relationship query.
				// relatedDataQuery.outFields = ["*"];
				// relatedDataQuery.relationshipId = 0;

				// User's selected something let's get the geomtry and query the feature layer
				// for the selection.
				on(selectionToolbar, "DrawEnd", function (geometry) {
					selectFeatureQuery.geometry = geometry;
					
					
					// If selected feature is polygon...
					if (geometry.type == "polygon") {
						var featuresBtn = dom.byId("selectFeaturesButton-3");
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
								//console.log("subtracting selected feature");
								catchmentGrid.refresh();
							} else {
								featureLayer.selectFeatures(selectFeatureQuery,	FeatureLayer.SELECTION_ADD);
							}
							//console.log("graphics = ", graphics);
						});
					}
				});
				
		
				on (featureLayer,"selection-complete", function (results,method) {
					//console.log("results = ", results);
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
					listCatchScores(graphics);
				});
			}
			
			// When the user selects this button we set the Draw object to create
			// a polygon
			on(dom.byId("selectFeaturesButton-3"), "click", function (event) {
				var featuresBtn = dom.byId("selectFeaturesButton-3");
				var featureBtn = dom.byId("selectFeatureButton-3");
			
				// Is button active?
				// No
				if (!featuresBtn.toggle) {
					featuresBtn.className = "btn-active";
					featuresBtn.toggle = true;
					featureBtn.className = "btn";
					featureBtn.toggle = false;
					selectionToolbar.activate(Draw.POLYGON);
					// Turn off feature highlighting.
					startHighlight(false,featureLayer);
				// Yes
				} else {
					featuresBtn.className = "btn";
					featuresBtn.toggle = false;
					selectionToolbar.deactivate();
					// Turn on feature highlighting.
					startHighlight(true,featureLayer);
				}
			});
			
			// When the user selects this button we set the Draw object to create
			// a point.
			
			on(dom.byId("selectFeatureButton-3"), "click", function (event) {
				var featuresBtn = dom.byId("selectFeaturesButton-3");
				var featureBtn = dom.byId("selectFeatureButton-3");
				
				// Is button active?
				// No	
				if (!featureBtn.toggle) {
					featureBtn.className = "btn-active";
					featureBtn.toggle = true;
					featuresBtn.className = "btn";
					featuresBtn.toggle = false;
					selectionToolbar.activate(Draw.POINT);
					// Turn off feature highlighting.
					startHighlight(false,featureLayer);
				// Yes	
				} else {
					featureBtn.className = "btn";
					featureBtn.toggle = false;
					selectionToolbar.deactivate();
					// Turn on feature highlighting.
					startHighlight(true,featureLayer);
				}		
			});

			// This button will cause a file explorer window to be displayed
			// which will allow the user to choose a shapefile.
			on(dom.byId("uploadForm-3"), "change", function (event) {
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
					dom.byId('statusMessage-3').innerHTML = '<p class="status-message-bad" id="statusMessage-3">Error: Shapefile needs to be zipped</p>';
				}
			});
		
			// This button clears all selected features on the map as well
			// as any shape files that were loaded.
			on(dom.byId("clearSelectionButton-3"), "click", function () {
				var featuresBtn = dom.byId("selectFeaturesButton-3");
				var featureBtn = dom.byId("selectFeatureButton-3");
			
				if (shapeFileFeatureLayer) {
					var formLabelId = dom.byId('formLabelId-3');
					map.removeLayer(shapeFileFeatureLayer);
					shapeFileFeatureLayer = null;
				}

				featureBtn.className = "btn";
				featureBtn.toggle = false;
				featuresBtn.className = "btn";
				featuresBtn.toggle = false;
				
				selectionToolbar.deactivate()
				featureLayer.clearSelection();
				catchmentGrid.refresh();
				map.shapeSelected = false;
				
				document.getElementsByClassName("descriptionModelBox")[0].style.display = "none";
				catchmentGrid.clearSelection();
				dom.byId("totalFeaturesSelected-3").innerHTML = "Total Features Selected: 0"
				
				// Turn off feature highlighting.
				startHighlight(false,featureLayer);
			
			});
			
			
			function startHighlight(onOffFlag, fLayer) {
				//console.log("startHightlight... starting: " + onOffFlag);
				//console.log("fLayer.isHighlighted = " + fLayer.isHighlighted);

				if (onOffFlag) {
					//console.log("Turning on Hightlighting...");
					fLayer.highlightClickHandler = on(fLayer,"click", function(evt){
						// var cColor = getCatchmentScoreColor(evt.graphic.attributes.CatchScore);
						// var highlightSymbol = new SimpleFillSymbol(
							// SimpleFillSymbol.STYLE_SOLID,
							// new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, cColor, 3),
							// new Color(cColor)
						// );
						
						//console.log("mouse clicked the feature layer evt = ", evt);
						//var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
						var objectIdList = new Array();
						
						for (var dgridRow in catchmentGrid._rowIdToObject) {
							if (!catchmentGrid._rowIdToObject.hasOwnProperty(dgridRow)) continue;
							objectIdList.push(catchmentGrid._rowIdToObject[dgridRow].feature.attributes.OBJECTID);
						}
						// search table array for highlighted OBJECTID then select that row in table.
						objectIdList.some(function (objid,index) {
							if (objid == evt.graphic.attributes.OBJECTID) {
								
								// This isn't working for some reason can't create a border around the cell.
								// if ($("#speciesGrid-3 .dgrid-selected")[0]) {
									// $("#speciesGrid-3 .dgrid-selected").css("background", "#f5f5f5");
								// //		$("#speciesGrid-3 .dgrid-selected").css("border", "none");
								// }
								catchmentGrid.clearSelection();
								catchmentGrid.row(index).element.scrollIntoView();
								catchmentGrid.select(index);
								
								// // change color to catchscore legend color.
								// $("#speciesGrid-3 .dgrid-selected .dgrid-cell").css("border", "4px !important");
								// $("#speciesGrid-3 .dgrid-selected .dgrid-cell").css("border-color", cColor.toCss(false) + " !important");
								// //$("#speciesGrid-3 .dgrid-selected .dgrid-cell").css("background", "#ccc");
								return true;
							}
						});
						// map.graphics.clear();
						// map.graphics.add(highlightGraphic);
					});
				} else {
					if (fLayer.highlightClickHandler) {
						fLayer.highlightClickHandler.remove();
					} 					
					// if ($("#speciesGrid-3 .dgrid-selected")[0]) {
						// $("#speciesGrid-3 .dgrid-selected").css("background", "#f5f5f5");
						// $("#speciesGrid-3 .dgrid-selected").css("border", "none");
					// }
					catchmentGrid.clearSelection();
				
					//console.log("Turning off Hightlighting...");
					map.graphics.clear();
				}
			}
			
			// Get the data from the queries and apply it to the table.
			function listCatchScores(graphics) {
			
				var graphics = featureLayer.getSelectedFeatures();
				var totalNumberFeaturesSelected = graphics.length;
				var selectedFeatures = new Array();
				var selectedFeaturesOut = new Array();
				var totalNumSpecies = 30;
				var dataAvailable = false;
				//console.log("selectedFeatures = ", selectedFeatures);
				//console.log("graphics = ", graphics);
				//console.log("features = ", features);

				graphics.forEach( function (feature) {
					selectedFeatures.push({
						"feature": feature,
						"PUId": feature.attributes.Unit_ID, 
						"catchScore": feature.attributes.CatchScore});
				});
				
				catchmentGrid.refresh();
				catchmentGrid.renderArray(selectedFeatures);
				dom.byId("totalFeaturesSelected-3").innerHTML = "Total Features Selected: " + totalNumberFeaturesSelected;
				//console.log("selectedFeatures = ", selectedFeatures);
				return;
			}
			
			// Take the loaded shape file and generate a feature layer that can be displayed on the map.
			function  generateFeatureCollection(fileName) {
				var name = fileName.split(".");
				
				//Chrome and IE add c:\fakepath to the value - we need to remove it
				//See this link for more info: http://davidwalsh.name/fakepath
				name = name[0].replace("c:\\fakepath\\", "");
				
				dom.byId('statusMessage-3').innerHTML = '<p class="status-message-neutral" id="statusMessage-3">Status: Loading... ' + name + '</p>' 
				
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
					form: dom.byId('uploadForm-3'),
					handleAs: 'json',
					load: lang.hitch(this, function (response) {
						if (response.error) {
							console.log("error was hit...");
							errorHandler(response.error);
							return;
						}
						var layerName = response.featureCollection.layers[0].layerDefinition.name;
						dom.byId('statusMessage-3').innerHTML = '<p class="status-message-good" id="statusMessage-3">Status: shapefile is loaded</p>';
						addShapefileToMap(response.featureCollection);
					}),
					error: lang.hitch(this, shapeFileErrorHandler)
				});
				
				function shapeFileErrorHandler(error) {
					dom.byId('statusMessage-3').innerHTML = '<p class="status-message-bad" id="statusMessage-3">Error: Failed to load shapefile</p>';
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
				var featuresBtn = dom.byId("selectFeaturesButton-3");
				var featureBtn = dom.byId("selectFeatureButton-3");

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
							map.removeLayer(shapeFileFeatureLayer);
						}
					});
					
					//change default symbol if desired. Comment this out and the layer will draw with the default symbology
					changeRenderer(shapeFileFeatureLayer);
					fullExtent = fullExtent ? fullExtent.union(shapeFileFeatureLayer.fullExtent) : shapeFileFeatureLayer.fullExtent;
					layers.push(shapeFileFeatureLayer);
				});
				
				map.addLayers(layers);
				map.setExtent(fullExtent.expand(1.25), true);

				dom.byId('statusMessage-3').innerHTML = "";
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

			// This function highlights selected grid row and pops up description of selected target.
			function targetRowSelect (evt) {
				//console.log("targetRowSelect clicked = ", evt);
				var feature = evt.rows[0].data.feature;
				//console.log("grid = ", evt.grid);
				//console.log("featureLayer = ", featureLayer);
				var cColor = getCatchmentScoreColor(feature.attributes.CatchScore);
				var highlightSymbol = new SimpleFillSymbol(
					SimpleFillSymbol.STYLE_SOLID,
					new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, cColor, 3),
					new Color(cColor)
				);
				var highlightGraphic = new Graphic(feature.geometry,highlightSymbol);

				map.graphics.clear();
				map.graphics.add(highlightGraphic);
			}

			function targetRowDeselect (evt) {
				map.graphics.clear();
			}

			function targetRowMouseover (evt) {
				//console.log("mouseover evt = ", evt);
				//console.log("speciesOutputGrid = ", speciesOutputGrid);
				
				// Show the tooltip if there are rows in the table and one isn't selected.
				if (($("#speciesGrid-3 .dgrid-row").get().length) && (!($("#speciesGrid-3 .dgrid-selected").get().length))) {					
					var x = evt.clientX, y = evt.clientY;
					$("#speciesGrid-3 .tooltip")[0].style.display = "block";
					$("#speciesGrid-3 .tooltip")[0].style.top = (y+20) + 'px';
					$("#speciesGrid-3 .tooltip")[0].style.left = (x+20) + 'px';
				}
				else 
					$("#speciesGrid-3 .tooltip")[0].style.display = "none";
			}

			function targetRowMouseout (evt) {
				$("#speciesGrid-3 .tooltip")[0].style.display = "none";
			}
			
			// Take the catchment Score and return the color based on it's value.
			function getCatchmentScoreColor(cScore) {
				
				// always go through the switch.
				switch (true) {
					// "Low" catchment score
					case (cScore <= -0.442937):
						rColor = new Color([214,47,39]);
						break;
					// "Medium-low" catchment score
					case (cScore <= -0.144995):
						rColor = new Color([245,152,105]);
						break;
					// "Medium" catchment score
					case (cScore <= 0.095795):
						rColor = new Color([255,255,191]);
						break;
					// "Medium-high" catchment score
					case (cScore <= 0.363898):
						rColor = new Color([162,180,189]);
						break;
					// "High" catchment score
					default:
						rColor = new Color([69,117,181]);
						break;
				}
				return rColor;
			}

			function getJSON(url, callback) {
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url, true);
				xhr.responseType = 'json';
				xhr.onreadystatechange = function() { 
					if (xhr.readState === 4) {
						var status = xhr.status;
							if (status === 200) {
								callback(null, xhr.response);
							} else {
								callback(status, xhr.response);
							}
					}
				};
				xhr.send();
			}
		}
});
