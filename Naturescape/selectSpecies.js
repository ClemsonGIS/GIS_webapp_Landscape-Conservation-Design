    require([
	  "esri/Color",
	  "esri/config",
	  "esri/dijit/Legend",
	  "esri/dijit/PopupTemplate",
	  "esri/geometry/scaleUtils",
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
	  "dojo/sniff",
	  "dojo/window",
      "dojo/_base/array",
	  "dojo/_base/declare",
	  "dojo/_base/lang",
      "dijit/form/Button",
      "dijit/layout/BorderContainer",
      "dijit/layout/ContentPane",
	  "main/aquatic",
	  "main/catchscore",
	  "main/integrated",
      "dojo/domReady!"
    ],
function (Color, esriConfig, Legend, PopupTemplate, scaleUtils, InfoTemplate, Map, FeatureLayer, ArcGISTiledMapServiceLayer, 
		ArcGISImageServiceLayer, SimpleRenderer, UniqueValueRenderer, request, PictureMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, Query, 
		RelationshipQuery, Draw, Grid, Selection, aspect, dom, JSON, on, number, parser, sniff, dojoWindow, arrayUtils, declare, lang, Button, 
		BorderContainer, ContentPane, Aquatic, Catchscore, Integrated) {
			
		// The Dojo Parser is a module which is used to convert specially decorated nodes in the DOM and convert them 
		// into Dijits, Widgets or other Objects. By decorated we mean the dom element has a "data-dojo-type" attribute. 
        parser.parse();
		
		// Set the selection tabs to make certain Div tags hidden and visible based on the tab selected.
		$(".tab").click(function(event){
			$(".tab").removeClass("tab_selected");
			event.currentTarget.classList.add("tab_selected");
			//console.log("tab = ", event.currentTarget);
			tabId = "#tabs-" + event.currentTarget.getAttribute("tabnum");
			//console.log("tabId = " + tabId);
			
			$("[id^='tabs-']").css("visibility", "hidden");
			$(tabId).css({ "visibility":"visible"});
		});
		
		Integrated({
			"featureLayerServiceURL": "https://webgis.coe.clemson.edu/arcgis/rest/services/AppLLC/IntegratedModeling/MapServer/1",
			"tileLayerServiceURL": "https://webgis.coe.clemson.edu/arcgis/rest/services/AppLLC/IntegratedModeling/MapServer",
			"dataLayerServiceURL": "https://webgis.coe.clemson.edu/arcgis/rest/services/AppLLC/IntegratedModeling/MapServer/2"
		});
		
		Aquatic({
			"featureLayerServiceURL": "https://webgis.coe.clemson.edu/arcgis/rest/services/AppLLC/AquaticModeling_2/MapServer/2",
			"tileLayerServiceURL": "https://webgis.coe.clemson.edu/arcgis/rest/services/AppLLC/AquaticModeling_2/MapServer",
			"dataLayerServiceURL": "https://webgis.coe.clemson.edu/arcgis/rest/services/AppLLC/AquaticModeling_2/MapServer/1"
		});
		
		Catchscore({
			"featureLayerServiceURL": "https://webgis.coe.clemson.edu/arcgis/rest/services/AppLLC/AquaticModelingCatchScore_3/MapServer/3",
			"tileLayerServiceURL": "https://webgis.coe.clemson.edu/arcgis/rest/services/AppLLC/AquaticModelingCatchScore_3/MapServer",
			"dataLayerServiceURL": "https://webgis.coe.clemson.edu/arcgis/rest/services/AppLLC/AquaticModelingCatchScore_3/MapServer/3"
		});
	  
});
