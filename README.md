# GIS_webapp_Landscape-Conservation-Design
Web application to interface with GIS maps with the intent to get specific data about selected conservation features.


### Files used with the web application
 * index.html  - Main web page that calls embeds the other files.
 * selectSpecies.css - CSS parameters used to create a visible interface for the web app.
 * selectSpecies.js - Main javascript file that contains all the functions needed to execute the web app.
 * selectIndex.js - JSON table that contains species index and attributes for each species. 
 

### Requirements for the backend of the web application.
 * The web app can be hosted on most any web server.
 * ArcGIS for Server 1.4.1 (or higher) is required to host the feature layers to which the app requires access.
 * Access www.arcgis.com (ArcGIS online) portal rest services. You can use your own portal site but I chose to use ArcGIS online.
 
 
### Resources that were used but are not hosted on this repository.
 * 2 geodatabase that contains:
    * the polygon feature class 
    * conservation data table that contains attributes for each polygon feature.
    * relationship class that does a one to many maping between each polygon feature and the attributes within the conservation data table.
    * 3 layer files that create the symbology for each map
    
    
    
 
