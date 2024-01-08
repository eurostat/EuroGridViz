# Change log

## Version 3

### General

- *gviz* module bject replaced with *gridviz*
- *core* folder includes high level classes.
- *App* class renamed *Map*
- New *map.setView(x,y,z)* method to set map view (position x,y and zoom z)
- *getGeoCenter*, *setGeoCenter* methods replaced with *getView* and *setView* methods.
- Removal of *map.addLayerXXX* methods. Layers can now be created individually and then linked to a map with *map.layers* property.
- Style parameters are now based on cell directly, not the value of a predefined column/prperty.
- Creation of the *viewScale* attribute at style level to compute view level data to be used to draw the cells individually.
- *zExtent* property renamed *zoomExtent*
- *pixNb* property renamed *minPixelsPerCell*
- *canvas* property renamed *geocanva*
- Notion of "zoom factor" removed to keep only "zoom". *zf* parameters renamed simply *z*.
- *Enveloppe* type duplicate removed.
- New simpler way to create multiresolution datasets.
- *DatasetComponent* class renamed into *Dataset*. And former *Dataset* class into *MultiResolutionDataset*.
- Revamping of *TiledGrid* class. *GridTile* class removed.
- Layers grouping: No more distinction beteen grid layers, background layers and other layers. One stack of layers par map, whatever the type, order and number.
- New abstract class *Drawable*, which groups common elements of *Layer* and *Style* classes.
- Change of signature for the *draw* method of *Style* class. It is now: *draw(cells, canvas, resolution)*. It should be reflected on all custom styles.
- New abstract class *Layer*. The former *Layer* class was renamed *GridLayer*.
- *filterColor* property now available for layers.
- A new property is available on Style to allow filtering cells at this level and avoid drawing unecessary cells.
- *visible* property added on *Style* and *Layer*, and is now a function of zoom *z*. Removal of *maxzoom* and *minzoom* properrties.
- Map properties *showBgLayers*, *showLabels* and *showBoundaries* removed. Use the new generic *visible* property instead.
- *LineLayer* class was renamed *GeoJSONLayer* to prepare support for new geometry types.
- Stretching function structure change and renaming. See examples.
- Add *layers_()* method to *Map* class, to get or set map layers.
- Add *styles_()* method to *GridLayer* class, to get or set layer styles.

### Legends

- Many changes in legends.
- Creation of examples for all use cases.
- Segment width legend was merged with size legend. Set shape property to "line".

### Modules

- In gridviz-eurostat module, a new function to ease GISCO background layers creation.
- Modules gridviz-smoothing and gridviz-eurostat were upgraded to a new version which is compatible with this new version 3.
- No upgrade so far for gridviz-parquet and gridviz-leaflet

### Out

- Lego and Tanaka styles not included: coming back soon !
