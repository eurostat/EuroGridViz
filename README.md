# Gridviz

![npm bundle size](https://img.shields.io/bundlephobia/minzip/gridviz)
![npm](https://img.shields.io/npm/v/gridviz)
![license](https://img.shields.io/badge/license-EUPL-success)

<p align="center" style="height: 350px;">
    <img src="docs/img/banner.png">
</p>


[Gridviz](https://github.com/eurostat/gridviz/) is a JavaScript library for visualizing gridded data (or any tabular dataset with x/y coordinates for that matter) in the browser using a large variety of [cartographic styles and techniques](https://eurostat.github.io/gridviz/docs/reference). Unlike traditional raster-based web mapping tools, Gridviz renders everything client-side, on the fly.

## Styles

[Visit the style gallery](https://github.com/eurostat/gridviz/blob/master/docs/gallery.md) to see the different customisable styles available for visualizing gridded data with gridviz.


[<img src="docs/img/overviews/ov_accessibility.png" width="70" height="70">](https://eurostat.github.io/gridviz/docs/reference#shapecolorsize-style)
[<img src="docs/img/overviews/ov_side_cat.png" width="70" height="70">](https://eurostat.github.io/gridviz/docs/reference#side-category-style)
[<img src="docs/img/overviews/ov_age_balance.png" width="70" height="70">](https://eurostat.github.io/gridviz/docs/reference#shapecolorsize-style)
[<img src="docs/img/overviews/ov_dark.png" width="70" height="70">](https://eurostat.github.io/gridviz/docs/reference#square-color-webgl-style)
[<img src="docs/img/overviews/ov_kersmoo.png" width="70" height="70">](https://eurostat.github.io/gridviz/docs/reference#kernel-smoothing)
[<img src="docs/img/overviews/ov_tanaka_dark.png" width="70" height="70">](https://eurostat.github.io/gridviz/docs/reference#tanaka-style)
[<img src="docs/img/overviews/ov_joyplot_shade.png" width="70" height="70">](https://eurostat.github.io/gridviz/docs/reference#joyplot-style)
[<img src="docs/img/overviews/ov_lego.png" width="70" height="70">](https://eurostat.github.io/gridviz/docs/reference#lego-style)
[<img src="docs/img/overviews/ov_text_elevation.png" width="70" height="70">](https://eurostat.github.io/gridviz/docs/reference#text-style)
[<img src="docs/img/overviews/ov_dotdensity.png" width="70" height="70">](https://eurostat.github.io/gridviz/docs/reference#dot-density-style)
[<img src="docs/img/overviews/ov_joyplot.png" width="70" height="70">](https://eurostat.github.io/gridviz/docs/reference#joyplot-style)


## Live Demos

-   [Europe - 1km resolution - GEOSTAT/GISCO](https://eurostat.github.io/gridviz/examples/EUR.html)
-   [Germany - 100m resolution - Zensus 2011](https://eurostat.github.io/gridviz/examples/DE.html)
-   [France - 200m resolution - INSEE Filosofi](https://eurostat.github.io/gridviz/examples/FR.html). Focus on [total population](https://eurostat.github.io/gridviz/examples/FR_pop.html) and [income](https://eurostat.github.io/gridviz/examples/FR_income.html).
-   [Norway - 250m resolution - SSB](https://eurostat.github.io/gridviz/examples/NO.html)
-   [Croatia - 1km resolution - DZS 2015 grid](https://eurostat.github.io/gridviz/examples/HR.html)
-   [France population, dark style](https://eurostat.github.io/gridviz/examples/styles/squarecolorwgl_dark.html)
-   [Europe population as a mosaic](https://eurostat.github.io/gridviz/examples/styles/mosaic_full.html)

## Installation

### Node.js

```Shell
npm install gridviz
```

then

```javascript
import * as gridviz from 'gridviz'
```

Or you can cherry-pick only the modules that you need, for example:

```javascript
import { App, SquareColorWGLStyle } from 'gridviz'
```

### Basic example

Here’s a basic example that loads a CSV file of a European population grid (5km resolution):

```javascript
let myApp = new gridviz.App(containerDiv)
    //set position and zoom
    .setGeoCenter({ x: 4500000, y: 2900000 })
    .setZoomFactor(3000)
    //add CSV layer
    .addCSVGridLayer(
        //data URL
        'https://raw.githubusercontent.com/eurostat/gridviz/master/assets/csv/Europe/pop_2018_5km.csv',
        //resolution, in CRS unit (m)
        5000,
        //the style
        [
            new gridviz.SquareColorWGLStyle({
                //the CSV column to show
                colorCol: 'Population',
                //value to [0,1] mapping function
                tFun: (value) => gridviz.sExp(Math.min(value / 100000, 1), -15),
            }),
        ]
    )
```

See the **[documentation page](https://eurostat.github.io/gridviz/docs/reference)** for more information.

### standalone

```javascript
<script src="https://unpkg.com/gridviz/dist/gridviz.min.js"></script>
```

## Documentation

See the **[gridviz documentation page](https://github.com/eurostat/gridviz/blob/master/docs/reference.md)**.

## Grid tiling

In order to visualize large grids efficiently, you can produce tiled grids in a [tiled grid format](https://eurostat.github.io/gridviz/docs/tiledformat) with **[GridTiler](https://github.com/eurostat/gridtiler)**.

## About

|                |                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _contributors_ | [<img src="https://github.com/jgaffuri.png" height="40" />](https://github.com/jgaffuri) [<img src="https://github.com/JoeWDavies.png" height="40" />](https://github.com/JoeWDavies) |
| _version_      | See [npm](https://www.npmjs.com/package/gridviz?activeTab=versions)                                                                                                                   |
| _status_       | Since 2020                                                                                                                                                                            |
| _license_      | [EUPL 1.2](LICENSE)                                                                                                                                                                   |

### Support and contribution

Feel free to [ask support](https://github.com/eurostat/gridviz/issues/new), fork the project or simply star it (it's always a pleasure).

### Copyright

The [Eurostat NUTS dataset](http://ec.europa.eu/eurostat/web/nuts/overview) is copyrighted. There are [specific provisions](https://ec.europa.eu/eurostat/web/gisco/geodata/reference-data/administrative-units-statistical-units) for the usage of this dataset which must be respected. The usage of these data is subject to their acceptance. See the [Eurostat-GISCO website](http://ec.europa.eu/eurostat/web/gisco/geodata/reference-data/administrative-units-statistical-units/nuts) for more information.

### Disclaimer

The designations employed and the presentation of material on these maps do not imply the expression of any opinion whatsoever on the part of the European Union concerning the legal status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers or boundaries. Kosovo*: This designation is without prejudice to positions on status, and is in line with UNSCR 1244/1999 and the ICJ Opinion on the Kosovo declaration of independence. Palestine*: This designation shall not be construed as recognition of a State of Palestine and is without prejudice to the individual positions of the Member States on this issue.
