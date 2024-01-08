# Gridviz API reference

## Table of contents

- [Gridviz API reference](#gridviz-api-reference)
  - [Table of contents](#table-of-contents)
  - [Concepts](#concepts)
  - [Adding data](#adding-data)
  - [Basic styles](#basic-styles)
    - [Shape/Color/Size Style](#shapecolorsize-style)
    - [Square color WebGL Style](#square-color-webgl-style)
    - [Square color category WebGL style](#square-color-category-webgl-style)
    - [Composition style](#composition-style)
    - [Segment style](#segment-style)
    - [Stroke style](#stroke-style)
  - [Advanced styles](#advanced-styles)
    - [Tanaka style](#tanaka-style)
    - [Dot density style](#dot-density-style)
    - [Pillars style](#pillars-style)
    - [Text style](#text-style)
    - [Time series style](#time-series-style)
  - [Side styles](#side-styles)
    - [Side style](#side-style)
    - [Side category style](#side-category-style)
    - [Contour style](#contour-style)
    - [Isometric fence style](#isometric-fence-style)
  - [Esthetic styles](#esthetic-styles)
    - [JoyPlot Style](#joyplot-style)
    - [Mosaic style](#mosaic-style)
    - [Ninja star style](#ninja-star-style)
    - [Lego style](#lego-style)
    - [Lego category style](#lego-category-style)
  - [Kernel smoothing](#kernel-smoothing)
  - [Custom styles](#custom-styles)
  - [Background layer](#background-layer)
  - [Foreground information](#foreground-information)
  - [Transparency](#transparency)
  - [Tooltip](#tooltip)
  - [Buttons](#buttons)
  - [View scale](#view-scale)
  - [Legends](#legends)
  - [Leaflet](#leaflet)
  - [Alright?](#alright)

Anything unclear or missing? Feel free to [ask](https://github.com/eurostat/gridviz/issues/new) !

## Concepts

Here are few concepts on Gridviz to be aware of:

1. A gridviz map is composed of a stack of layers. Layers may have different types (background image, boundaries, labels, etc.). The main layer type is **GridLayer**, for gridded data. Background layers are usually drawn below, usually a single one. Boundaries and label layers should also be drawn as foreground, on top of grid layers.

2. Gridded datasets are defined independantly from their grid layer. Each gridded dataset may thus be reused by several layers: It is loaded and stored once, and reused several times.

3. A gridded dataset may be multi-resolution. Gridviz then takes care of selecting the most suitable resolution according to the visualisation zoom level (and a predefined *minPixelsPerCell* parameter). This ensures only the relevant data for the visualisation view and zoom level is loaded and displayed.

4. A grid layer draws a single gridded dataset using one or several styles. It is thus possible to combine styles and draw them on top of each other to show different aspects of the data.

5. A style specifies how to draw the cells within the view. The style is not defined at cell level only - it allows defining more advanced styling techniques using cell sets, based on the relations of each cell with its neigbours.

6. Gridviz comes with a library of [predefined styles](#basic-styles). These styles are customisable. Users are also offered a full flexibility to [define their own style](#custom-styles) and show their cells the way they need. Predefined style may be seen only as examples and inspiration sources.

7. Predefined styles parameters are usually not static values, but **functions** of usually four parameters: The *cell* to be drawn, its *resolution*, the *zoom* level, and a *viewscale* object. Styling parameters (such as colors, size, etc.) may thus be computed depending on each cell, its resolution, and the zoom level. Size parameters are usually specified in the unit of measurement of the grid coordinate reference system, usually ground meters. They may also be specified in screen pixels. These functions allow adapting the cartographic styles (colors, dimensions, etc.) to the cell values, their size and the zoom level.

8. For some predefined style parameters, *viewscale* parameter allows defining styling parameters based on the cells within the map view only. This parameter is an object computed only once from the cells within the view. It may be used for example to compute the minimum and maximum values of these cells and adapt a color scale to this for a better contrast. It should generally be used to compute scales that are view dependant - hence the name *viewscale*. See [this section](#view-scale) for some examples.

9. Gridviz zoom level, usually noted **z**, is defined in **ground UoM per pixel**. The ground UoM is usually meter. **z** value can be used directly to transorm distances from ground distance to map screen distance, in pixels, as a division. **resolution** parameter is the cell size, in ground UoM. Its size in map screen pixel is thus 'resolution / z'.

10. A grid layer shows gridded data in the grid coordinate reference system. Several gridded datasets may be overlayed, as soon as they are defined in the same coordinate reference system. Other layers (background, labels, etc.) must be defined also in the grid coordinate reference system.

## Adding data

A gridviz dataset defines how to retrieve gridded data, as a list of grid cells. A grid cell is stored as a javascript object having a **x** and **y** property, which is usually the coordinates of the grid cell lower left corner in the grid coordinate reference system. The **x** and **y** values are usually multiples of the grid resolution value.

Gridviz proposed several types of datasets: Javascript, CSV, tiled CSV. These datasets may be bundled into multi-resolution datasets, to be used for multi-scale maps:

- See [this example for raw javascript data](https://eurostat.github.io/gridviz/examples/basics/basic_JS.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/basic_JS.html)).
- See [this example for CSV data](https://eurostat.github.io/gridviz/examples/basics/basic_CSV.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/basic_CSV.html)).
- See [this example for tiled CSV data](https://eurostat.github.io/gridviz/examples/basics/basic_tiled_CSV.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/basic_tiled_CSV.html)).
- See [this example for tiled CSV data](https://eurostat.github.io/gridviz/examples/basics/basic_multiscale_CSV.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/basic_multiscale_CSV.html)).
- See [this example for tiled CSV data](https://eurostat.github.io/gridviz/examples/basics/basic_tiled_multiscale_CSV.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/basic_tiled_multiscale_CSV.html)).

The gridded data may be pre-processed after loading, and filtered:

- See [this example for basic pre-processing](https://eurostat.github.io/gridviz/examples/basics/preprocess.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/preprocess.html)).
- See [this example for basic filtering/selection](https://eurostat.github.io/gridviz/examples/basics/select.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/select.html)).
- See [this example for basic filtering/selection at style level](https://eurostat.github.io/gridviz/examples/basics/select_style.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/select_style.html)).

## Basic styles

### Shape/Color/Size Style

[![shape color size style](img/styles/shapesizecolor_sc.png)](https://eurostat.github.io/gridviz/examples/styles/shapecolorsize_size_color.html)
[![shape color size style](img/styles/shapesizecolor_s.png)](https://eurostat.github.io/gridviz/examples/styles/shapecolorsize_size.html)
[![shape color size style](img/styles/shapesizecolor_random.png)](https://eurostat.github.io/gridviz/examples/styles/shapecolorsize_random.html)
[![shape color size style](img/styles/shapesizecolor_sc_donut.png)](https://eurostat.github.io/gridviz/examples/styles/shapecolorsize_size_color.html)

This style is a generic style which allows to define the **shape**, **color** and **size** of each grid cell, independantly according to 3 different variables. Three shapes are currently available: square, circle and donut (a disk with a hole of changing size). To show grid cells as small squares with only changing color, one of the styles based on web GL [here](#square-color-webgl-style) or [here](#square-color-category-webgl-style) should rather be used, for efficiency reasons.

- See [this example with changing size](https://eurostat.github.io/gridviz/examples/styles/shapecolorsize_size.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/shapecolorsize_size.html)).
- See [this example with changing size and color](https://eurostat.github.io/gridviz/examples/styles/shapecolorsize_size_color.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/shapecolorsize_size_color.html)).
- See [this example with random shape, color and size](https://eurostat.github.io/gridviz/examples/styles/shapecolorsize_random.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/shapecolorsize_random.html)).

### Square color WebGL Style

[![square color webgl style](img/styles/squarecolorwgl_pop.png)](https://eurostat.github.io/gridviz/examples/styles/squarecolorwgl.html)
[![square color webgl style](img/styles/squarecolorwgl_dark.png)](https://eurostat.github.io/gridviz/examples/styles/squarecolorwgl_dark.html)

This style displays each cell as a square, with a changing color. This style uses webGL and should thus be used to display grid cells at detailled resolutions.

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/squarecolorwgl.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/squarecolorwgl.html)).
- See [this example with dark style](https://eurostat.github.io/gridviz/examples/styles/squarecolorwgl_dark.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/squarecolorwgl_dark.html)).

### Square color category WebGL style

[![square color webgl category style](img/styles/squarecolorcatwgl_lc.png)](https://eurostat.github.io/gridviz/examples/styles/squarecolorcatwgl.html)

This style displays each cell as a square, with a changing color based on a categorical variable. This style uses webGL and should thus be used to display grid cells at detailled resolutions.

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/squarecolorcatwgl.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/squarecolorcatwgl.html)).

### Composition style

![composition style](img/styles/composition_flag.png)
[![composition style](img/styles/composition_piechart.png)](https://eurostat.github.io/gridviz/examples/styles/composition_types.html)
![composition style](img/styles/composition_ring.png)
[![composition style](img/styles/composition_halftone.png)](https://eurostat.github.io/gridviz/examples/styles/composition_types.html)
[![composition style](img/styles/composition_random.png)](https://eurostat.github.io/gridviz/examples/styles/composition_types.html)

This style shows a composition at cell level in various different ways: Flags, pie charts, rings, segments, radar, age pyramid and halftone.

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/composition_types.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/composition_types.html)).

### Segment style

[![segment style](img/styles/segment_width.png)](https://eurostat.github.io/gridviz/examples/styles/segment_width.html)
[![segment style](img/styles/segment_random.png)](https://eurostat.github.io/gridviz/examples/styles/segment_random.html)

This style displays each cell as a segment with a changeable color, length, width and orientation.

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/segment_width.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/segment_width.html)).
- See [this example with random segment orientation, color, length and width](https://eurostat.github.io/gridviz/examples/styles/segment_random.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/segment_random.html)).

### Stroke style

[![stroke style](img/styles/stroke.png)](https://eurostat.github.io/gridviz/examples/styles/stroke.html)
[![stroke style](img/styles/stroke_random.png)](https://eurostat.github.io/gridviz/examples/styles/stroke_random.html)

This style shows the stroke of each cell with different colors, widths, shapes and sizes. This style can be used in addition to others to show the cell strokes on top of those other styles.

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/stroke.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/stroke.html)).
- See [this an example with random color, size, width and shape](https://eurostat.github.io/gridviz/examples/styles/stroke_random.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/stroke_random.html)).

## Advanced styles

### Tanaka style

[![tanaka style](img/styles/tanaka.png)](https://eurostat.github.io/gridviz/examples/styles/tanaka.html)
[![tanaka style](img/styles/tanaka_full.png)](https://eurostat.github.io/gridviz/examples/styles/tanaka_full.html)

This style shows the grid cells in a [Tanaka style](http://wiki.gis.com/wiki/index.php/Tanaka_contours), that is with discrete colors and a shadow effect.

TODO: upgrade and add doc.

### Dot density style

[![dot density style](img/styles/dotdensity.png)](https://eurostat.github.io/gridviz/examples/styles/dotdensity.html)
[![dot density style](img/styles/dotdensity_random.png)](https://eurostat.github.io/gridviz/examples/styles/dotdensity_random.html)

This style displays each cell as randomly located points, with changeable density and color.

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/dotdensity.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/dotdensity.html)).
- See [this example with random colors](https://eurostat.github.io/gridviz/examples/styles/dotdensity_random.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/dotdensity_random.html)).

### Pillars style

[![pillars style](img/styles/pillar.png)](https://eurostat.github.io/gridviz/examples/styles/pillar.html)
[![pillars style](img/styles/pillar_simple.png)](https://eurostat.github.io/gridviz/examples/styles/pillar_simple.html)

This style shows the grid cells as 3D pillars or, with changeable height, width and color.

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/pillar.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/pillar.html)).
- See [this basic example with simple style](https://eurostat.github.io/gridviz/examples/styles/pillar_simple.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/pillar_simple.html)).

### Text style

[![text style](img/styles/text_elevation.png)](https://eurostat.github.io/gridviz/examples/styles/text_elevation.html)
[![text style](img/styles/text.png)](https://eurostat.github.io/gridviz/examples/styles/text.html)

This style shows the grid cells as text labels. The text, its color and font size can be set according to some cell values.

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/text_elevation.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/text_elevation.html)).
- See [this example](https://eurostat.github.io/gridviz/examples/styles/text.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/text.html)).

### Time series style

[![time series style](img/styles/timeseries.png)](https://eurostat.github.io/gridviz/examples/styles/time_series.html)

This style shows the grid cells as a time series chart. It is particulary suitable to show data that has high temporal granularity and low geographical granurality (variation across time rather than space). The time series charts can be colored and sized according to other variables.

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/time_series.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/time_series.html)).

## Side styles

The **side styles** are special:They do not display the cells, but their sides. They can be used to show discontinuities between cell values with, for example, some shadow effect.

### Side style

[![side style](img/styles/side.png)](https://eurostat.github.io/gridviz/examples/styles/side.html)

This style displays the sides of the cells as segments with different colors and widths, depending on the values of the 2 adjacent cells.

- See [this example](https://eurostat.github.io/gridviz/examples/styles/side.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/side.html)).

### Side category style

[![side category style](img/styles/sidecat.png)](https://eurostat.github.io/gridviz/examples/styles/sidecat.html)

This style displays the sides of the cells as segments with different colors depending on the categories of the 2 adjacent cells.

- See [this example](https://eurostat.github.io/gridviz/examples/styles/sidecat.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/sidecat.html)).

### Contour style

[![contour style](img/styles/side_contour.png)](https://eurostat.github.io/gridviz/examples/styles/side_contour.html)

This style is experimental / under development. It displays the sides of the cells depending on discontinuities between the 2 adjacent cells, like contour lines.

- See [this example](https://eurostat.github.io/gridviz/examples/styles/side_contour.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/side_contour.html)).

### Isometric fence style

[![Isometric fence style](img/styles/isofence.png)](https://eurostat.github.io/gridviz/examples/styles/isofence.html)

This style shows the composition of a total quantity into categories as vertical cross-sections oriented toward North-South and East-West. It is an alternative to [composition style](#composition-style). It may also be seen as a bi-directional [joyplot style](#joyplot-style) showing categories - note that when **angle** value is set to 90°, the style is equivalent to a joyplot. This style was inspired by the [USGS geologic isometric fence diagrams (1953)](https://pubs.usgs.gov/pp/0228/).

- See [this example](https://eurostat.github.io/gridviz/examples/styles/isofence.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/isofence.html)).

## Esthetic styles

### JoyPlot Style

[![joyplot style](img/styles/joyplot.png)](https://eurostat.github.io/gridviz/examples/styles/joyplot.html)
[![joyplot style](img/styles/joyplot_full.png)](https://eurostat.github.io/gridviz/examples/styles/joyplot_shading.html)
[![joyplot style](img/styles/joyplot_random.png)](https://eurostat.github.io/gridviz/examples/styles/joyplot_random.html)

This style shows cell rows in the form of a 'joyplot' - named after Joy Division's "Unknown Pleasures" album cover. For joyplot style showing composition by categories, or for various orientations and perspective angles, see [isometric fence style](#isometric-fence-style).

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/joyplot.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/joyplot.html)).
- See [this an example of shaded joyplot](https://eurostat.github.io/gridviz/examples/styles/joyplot_shading.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/joyplot_shading.html)).
- See [this an example with random colors](https://eurostat.github.io/gridviz/examples/styles/joyplot_random.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/joyplot_random.html)).

### Mosaic style

[![mosaic style](img/styles/mosaic_basic.png)](https://eurostat.github.io/gridviz/examples/styles/mosaic.html)
[![mosaic style](img/styles/mosaic_roman.png)](https://eurostat.github.io/gridviz/examples/styles/mosaic_full.html)

This style shows the cell as pseudo-irregular square shapes giving a [mosaic](https://en.wikipedia.org/wiki/Mosaic) effect. The cells are colored depending on a variable.

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/mosaic.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/mosaic.html)).
- See [this roman style example](https://eurostat.github.io/gridviz/examples/styles/mosaic_full.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/mosaic_full.html)).

### Ninja star style

[![Ninja star style](img/styles/ninja_star.png)](https://eurostat.github.io/gridviz/examples/styles/ninja_star.html)
[![Ninja star style](img/styles/ninja_star_p.png)](https://eurostat.github.io/gridviz/examples/styles/ninja_star_p.html)

This style shows the cell as a star polygon whose compacity depends on a variable. The higher the value, the more compact the star: Maximum values correspond to a square, and minimum values correspond to a thin star. The shapes in between correspond to 4 branches stars looking like a ninja star.

- See [this basic example](https://eurostat.github.io/gridviz/examples/styles/ninja_star.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/ninja_star.html)).
- See [this other example](https://eurostat.github.io/gridviz/examples/styles/ninja_star_p.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/ninja_star_p.html)) with stars parallel to the x/y axes.

### Lego style

[![lego style](img/styles/lego.png)](https://eurostat.github.io/gridviz/examples/styles/lego.html)

This style shows the grid cells as lego bricks with changeable colors and height based on a quantitative variable.

TODO: upgrade and document.

### Lego category style

[![lego style](img/styles/lego_cat.png)](https://eurostat.github.io/gridviz/examples/styles/lego_cat.html)

This style shows the grid cells as lego bricks with changeable colors based on a categorical variable.

TODO: upgrade and document.

## Kernel smoothing

[![kernel smoothing](img/styles/kernel_smoothing.png)](https://eurostat.github.io/gridviz/examples/styles/kernelsmoothing.html)

This style allows applying a gaussian kernel smoothing to the input grid. Other styles can then be used on the smoothed grid - this style is thus more a 'filter' than a proper style.

Note that this style is available within the [gridviz-smoothing](https://github.com/eurostat/gridviz-smoothing) extension which need to be added as: `<script src="https://cdn.jsdelivr.net/npm/gridviz-smoothing"></script>`.

- See [this elementary example](https://eurostat.github.io/gridviz/examples/styles/kernelsmoothing_small.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/kernelsmoothing_small.html)).
- See [this example](https://eurostat.github.io/gridviz/examples/styles/kernelsmoothing.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/styles/kernelsmoothing.html)).

The kernel smoothing computation relies on the [fast-kde](https://www.npmjs.com/package/fast-kde) library, which produces smoothing approximation very fast. Note that the approximation degrades significantly for weak smoothing (for low sigma values).

## Custom styles

The style can be freely defined through the **drawFun**, which specifies how to draw the list of cells within the view on the map canvas. See [this example](https://eurostat.github.io/gridviz/examples/basics/custom_style.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/custom_style.html)) to define a simple custom style.

## Background layer

Background image layers may be defined:
- as a tiled layer: See [this example](https://eurostat.github.io/gridviz/examples/basics/background.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/background.html)) or [this other example](https://eurostat.github.io/gridviz/examples/basics/background_gisco.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/background_gisco.html)).
- or from a [OGC WMS - Web Map Service](https://www.ogc.org/standard/wms/): See [this example](https://eurostat.github.io/gridviz/examples/basics/background_WMS.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/background_WMS.html)).

## Foreground information

Foreground layers may be defined such as:
- label layers: See [this example](https://eurostat.github.io/gridviz/examples/basics/labels.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/labels.html)) or [this other example](https://eurostat.github.io/gridviz/examples/basics/labels_.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/labels_.html)).
- boundaries layers: See [this example](https://eurostat.github.io/gridviz/examples/basics/boundaries.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/boundaries.html)).

## Transparency

To handle layer and style transparency, blending modes and alpha values may be defined. See [this example](https://eurostat.github.io/gridviz/examples/basics/blending_alpha.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/blending_alpha.html)).

## Tooltip

A tooltip may be customised for the grid cells passed over the mouse pointer. By default, the list of properties is shown. See [this example](https://eurostat.github.io/gridviz/examples/basics/tooltip.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/tooltip.html)) to define the tooltip text.

## Buttons

To show zoom buttons, see [this example](https://eurostat.github.io/gridviz/examples/basics/buttons.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/buttons.html)).

## View scale

For some predefined style parameters, *viewscale* parameter allows defining styling parameters based on the cells within the map view only. This parameter is an object computed only once from the cells within the view. It may be used for example to compute the minimum and maximum values of these cells and adapt a color scale to this for a better contrast. It should generally be used to compute scales that are view dependant - hence the name *viewscale*.

- See [this basic example](https://eurostat.github.io/gridviz/examples/basics/viewscale_basic.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/viewscale_basic.html)).
- See [this more advanced example](https://eurostat.github.io/gridviz/examples/basics/viewscale.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/viewscale.html)) using some predefined function.
- See [this example for stretching functions](https://eurostat.github.io/gridviz/examples/basics/stretching.html) ([code](https://github.com/eurostat/gridviz/blob/master/examples/basics/stretching.html)).

## Legends

To show map style elements, see various examples here: https://github.com/eurostat/gridviz/blob/master/examples/legends/

## Leaflet

Gridviz can be used with leaflet by using the [leaflet-gridviz plugin](https://github.com/eurostat/leaflet-gridviz)


## Alright?

Anything unclear or missing? Feel free to [ask](https://github.com/eurostat/gridviz/issues/new) !
