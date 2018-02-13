# GIS_webapp_Landscape-Conservation-Design
Web application to interface with GIS maps with the intent to get specific data about selected conservation features.


### Files used with the web application
 * index.html  - Main web page that calls embeds the other files.
 * main-1.html - HTML page for the Integrated Modeling map.
 * main-2.html - HTML page for the Aquatic Modeling map.
 * main-3.html - HTML page for the Aquatic catchment score map.
 * selectSpecies.css - CSS parameters used to create a visible interface for the web app.
 * selectSpecies.js - Main javascript file. This will call the the three different map applications that are available.
 * integrated.js - javascript file that processes the Integrated modeling map service.
 * aquatic.js - javascript file that processes the Aquatic modeling map service.
 * catchscore.js - javascript file that processes the Aquatic catchment score map service.
 * integratedSpeciesIndex.js - JSON table that contains species index and attributes for each species within the integrated modeling service. 
 * aquaticSpeciesIndex.js - JSON table that contains species index and attributes for each species within the aquatic modeling service.
 

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
 
 The Box link that contains these files is at the following:
 https://clemson.box.com/s/f2mwywdsk1jx1krovpuf3kpd53tluwki
 
 
 ### Instructions on publishing tiled cache map service with geodatabase (*.gdb) and layer file (*.lyr)
      Note: this assumes you are using ArcMap 10.4.1 or higher.
  
  * With ArcMap pull in the corresponding feature class "AquaticModeling" or "IntegratedModeling" and data table "SpeciesData" from one of the geodatabases you downloaded.
  * Load the layer file you want to associate with map service.
       
        Note: You'll notice there are two feature classes and three layer files. 
        Two of the layer files (AquaticCatchScoreSymbology.lyr and AquaticModelingSymbology.lyr) 
        will be used with the same feature class (AqauticModeling).
        
   * By default when you pull in the feature class a default layer will be created in the table of contents window. After you pull in the custom layer file you can remove this default layer.
   * Now you can create a map service under your ArcGIS Server. Go to **File** menu option and select **Share As**. Then, under the submenu select **Service**. Choose the radio button **Publish a service** and click the **Next >** button.
   * The next dialog window will want you to choose the ArcGIS server you want ArcMap to connect to. Choose the ArcGIS server you desire (If you haven't connected to an ArcGIS server you'll need to find some documentation on how to do it). Also, you'll specify the Service Name of the newly published service.
   * The next dialog window asks what directory you want to put the service files under, or you can specify a new directory which will be created.
   * The next dialog will bring you to the Service Editor window. There are several sub options tabs under this window which I will go through:
      * **General**: You shouldn't have to change any of the parameters within the General tab.
      * **Parameters**: The only opition I change here is the _"Properties - Maximum number of records returned by the server:"_ which I change to **4000**.
      * **Capabilities**: Here I uncheck the KML check box as we wont be using KML. All the default parameters for the **Mapping** suboption are acceptable and do not need to be changed.
      * **Pooling**: You'll want to modify this based on your ArcGIS setup. We are only running our server on one machine and so the default values are fine.
      * **Processing**: Here all defualt values were used.
      * **Caching**: This is where we define out tile cache. 
         * You will want to change the _"Draw this map service"_ radio button to specify **"Using tiles from a cache"**
         * Under the _"Levels of Detail"_ option you will want to change the Maximum scale level to **13**. The default value of **5** for minimum scale value is fine.
         * All other default values are fine. No need to change anything in the advanced settings.
      * **Item Description**: Add a summary, keywords and other descriptive properties to your map service.
      * **Sharing**: If you're using Portal and are signed in you can specify who can have access to the service here. Otherwise you will need to go into the ArcGIS server manager to change the share properties of the service.
   * After all parameters have been finalized hit the **Analyze** menu button in the top right of the Service Editor Window to make sure all parameters are valid. You'll probably get some warnings about the size of the tile cache. You'll want to make sure you have plenty of disk space on your ArcGIS server to hold them. In my experience the total of all the tiles are around 300MB for each published map service.
   * if You have no errors and the warnings are acceptable then hit the **Publish** menu button. This function can take anywhere from 10 minutes to a couple of hours. If ArcMap shows a message it's not responding during this time period just ignore it. It will eventually finish the task and provide a message saying the published service is now available.
      
      
      
   

    
    
    
 
