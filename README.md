# Gridviz

![npm bundle size](https://img.shields.io/bundlephobia/minzip/gridviz)
![npm](https://img.shields.io/npm/v/gridviz)
![license](https://img.shields.io/badge/license-EUPL-success)

[Gridviz](https://github.com/eurostat/gridviz/) is a JavaScript library to visualise gridded data (or any tabular dataset with x/y position) in the browser in a large variety of advanced cartographic styles. Unlike traditional raster-based web mapping tools, [Gridviz](https://github.com/eurostat/gridviz/) renders everything client-side, on the fly.

[![](/docs/img/overviews/ov_accessibility.png)](https://eurostat.github.io/gridviz/docs/reference#shapecolorsize-style)
[![](/docs/img/overviews/ov_side_cat.png)](https://eurostat.github.io/gridviz/docs/reference#side-category-style)
[![](/docs/img/overviews/ov_age_balance.png)](https://eurostat.github.io/gridviz/docs/reference#shapecolorsize-style)
[![ninja star map](/docs/img/overviews/ov_ninja.png)](https://eurostat.github.io/gridviz/docs/reference#ninja-star-style)
[![shadow effect map](/docs/img/overviews/ov_choco.png)](https://eurostat.github.io/gridviz/docs/reference#side-style)
[![](/docs/img/overviews/ov_dark.png)](https://eurostat.github.io/gridviz/docs/reference#square-color-webgl-style)
[![](/docs/img/overviews/ov_kersmoo.png)](https://eurostat.github.io/gridviz/docs/reference#kernel-smoothing)
[![](/docs/img/overviews/ov_pillar_simple.png)](https://eurostat.github.io/gridviz/docs/reference#pillars-style)
[![](/docs/img/overviews/ov_donut.png)](https://eurostat.github.io/gridviz/docs/reference#shapecolorsize-style)
[![tanaka style map](/docs/img/overviews/ov_tanaka_dark.png)](https://eurostat.github.io/gridviz/docs/reference#tanaka-style)
[![](/docs/img/overviews/ov_flag.png)](https://eurostat.github.io/gridviz/docs/reference#composition-style)
[![joyplot map](/docs/img/overviews/ov_joyplot_shade.png)](https://eurostat.github.io/gridviz/docs/reference#joyplot-style)
[![lego map](/docs/img/overviews/ov_lego.png)](https://eurostat.github.io/gridviz/docs/reference#lego-style)
[![timeseries map](/docs/img/overviews/ov_timeseries.png)](https://eurostat.github.io/gridviz/docs/reference#time-series-style)
[![mosaic map](/docs/img/overviews/ov_mosaic.png)](https://eurostat.github.io/gridviz/docs/reference#mosaic-style)
[![](/docs/img/overviews/ov_piechart.png)](https://eurostat.github.io/gridviz/docs/reference#composition-style)
[![](/docs/img/overviews/ov_pillar.png)](https://eurostat.github.io/gridviz/docs/reference#pillars-style)
[![](/docs/img/overviews/ov_text_elevation.png)](https://eurostat.github.io/gridviz/docs/reference#text-style)
[![dot density map](/docs/img/overviews/ov_dotdensity_random.png)](https://eurostat.github.io/gridviz/docs/reference#dot-density-style)
[![](/docs/img/overviews/ov_popchange.png)](https://eurostat.github.io/gridviz/docs/reference#shapecolorsize-style)
[![](/docs/img/overviews/ov_ring.png)](https://eurostat.github.io/gridviz/docs/reference#composition-style)
[![](/docs/img/overviews/ov_segment.png)](https://eurostat.github.io/gridviz/docs/reference#segment-style)
[![tanaka style map](/docs/img/overviews/ov_tanaka.png)](https://eurostat.github.io/gridviz/docs/reference#tanaka-style)
[![dot density map](/docs/img/overviews/ov_dotdensity.png)](https://eurostat.github.io/gridviz/docs/reference#dot-density-style)
[![joyplot map](/docs/img/overviews/ov_joyplot.png)](https://eurostat.github.io/gridviz/docs/reference#joyplot-style)
[![](/docs/img/overviews/ov_stroke.png)](https://eurostat.github.io/gridviz/docs/reference#stroke-style)

## Examples

-   [Europe - 1km resolution - GEOSTAT/GISCO](https://eurostat.github.io/gridviz/examples/EUR.html)
-   [Germany - 100m resolution - Zensus 2011](https://eurostat.github.io/gridviz/examples/DE.html)
-   [France - 200m resolution - INSEE Filosofi](https://eurostat.github.io/gridviz/examples/FR.html)
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

See the **[API reference](https://eurostat.github.io/gridviz/docs/reference)**.

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
