//@ts-check
'use strict'

// the application
export { App } from './App.js'
export { GeoCanvas } from './GeoCanvas.js'
export { Style } from './Style.js'
export { Layer } from './Layer.js'
export { Dataset } from './Dataset.js'
export { DatasetComponent } from './DatasetComponent.js'

// export dataset types
export { TiledGrid } from './dataset/TiledGrid.js'
export { GridTile } from './dataset/GridTile.js'
export { CSVGrid } from './dataset/CSVGrid.js'
//export { GeoTIFF } from "./dataset/GeoTIFF"

// export styles
export { ShapeColorSizeStyle } from './style/ShapeColorSizeStyle.js'
export { StrokeStyle } from './style/StrokeStyle.js'
export { JoyPlotStyle } from './style/JoyPlotStyle.js'
export { CompositionStyle } from './style/CompositionStyle.js'
export { SegmentStyle } from './style/SegmentStyle.js'
export { TextStyle } from './style/TextStyle.js'
export { PillarStyle } from './style/PillarStyle.js'
export { SideStyle } from './style/SideStyle.js'
export { ContourStyle } from './style/ContourStyle.js'
export { SideCatStyle } from './style/SideCatStyle.js'
export { DotDensityStyle } from './style/DotDensityStyle.js'
export { TanakaStyle } from './style/TanakaStyle.js'
export { LegoStyle } from './style/LegoStyle.js'
export { SquareColorWGLStyle } from './style/SquareColorWGLStyle.js'
export { SquareColorCatWGLStyle } from './style/SquareColorCatWGLStyle.js'
export { MosaicStyle } from './style/MosaicStyle.js'
export { NinjaStarStyle } from './style/NinjaStarStyle.js'
export { TimeSeriesStyle } from './style/TimeSeriesStyle.js'

// export additional layers
export { BackgroundLayer } from './BackgroundLayer.js'
export { BackgroundLayerWMS } from './BackgroundLayerWMS.js'
export { LabelLayer } from './LabelLayer.js'
export { LineLayer as BoundaryLayer } from './LineLayer.js'

// export legends
export { ColorLegend } from './legend/ColorLegend.js'
export { ColorDiscreteLegend } from './legend/ColorDiscreteLegend.js'
export { ColorCategoryLegend } from './legend/ColorCategoryLegend.js'
export { SizeLegend } from './legend/SizeLegend.js'
export { SegmentWidthLegend } from './legend/SegmentWidthLegend.js'
export { SegmentOrientationLegend } from './legend/SegmentOrientationLegend.js'

// export { goToStraight, zoomTo } from "./utils/zoomUtils"
export * from './utils/stretching.js'

export { getClass } from './utils/Utils.js'




import { GeoCanvas } from './GeoCanvas.js'
import { geoAzimuthalEqualArea } from 'd3-geo'

/**
 * Returns label layer from Eurostat, for ETRS89-LAEA grids.
 * From Euronym data: https://github.com/eurostat/euronym
 *
 * @returns {object}
 */
export const getEuronymeLabelLayer = function (cc = 'EUR', res = 50, opts) {
    opts = opts || {}
    const ex = opts.ex || 1.2
    const fontFamily = opts.fontFamily || 'Arial'
    const exSize = opts.exSize || 1
    opts.style =
        opts.style ||
        ((lb, zf) => {
            if (lb.rs < ex * zf) return
            if (lb.r1 < ex * zf) return exSize + 'em ' + fontFamily
            return exSize * 1.5 + 'em ' + fontFamily
        })
    //ETRS89-LAEA projection
    opts.proj =
        opts.proj ||
        geoAzimuthalEqualArea()
            .rotate([-10, -52])
            .reflectX(false)
            .reflectY(true)
            .scale(6378137)
            .translate([4321000, 3210000])
    opts.preprocess = (lb) => {
        //exclude countries
        //if(opts.ccOut && lb.cc && opts.ccOut.includes(lb.cc)) return false;
        if (opts.ccIn && lb.cc && !(opts.ccIn.indexOf(lb.cc) >= 0)) return false

        //project from geo coordinates to ETRS89-LAEA
        const p = opts.proj([lb.lon, lb.lat])
        lb.x = p[0]
        lb.y = p[1]
        delete lb.lon
        delete lb.lat
    }
    opts.baseURL = opts.baseURL || 'https://raw.githubusercontent.com/eurostat/euronym/main/pub/v2/UTF/'
    opts.url = opts.baseURL + res + '/' + cc + '.csv'
    return opts
}

/**
 * @returns {object}
 */
export const getEurostatBoundariesLayer = function (opts) {
    opts = opts || {}
    const nutsYear = opts.nutsYear || '2021'
    const crs = opts.crs || '3035'
    const scale = opts.scale || '03M'
    const nutsLevel = opts.nutsLevel || '3'
    const col = opts.col || '#888'
    const colKosovo = opts.colKosovo || '#bcbcbc'
    const showOth = opts.showOth == undefined ? true : opts.showOth

    opts.color =
        opts.color ||
        ((f, zf) => {
            const p = f.properties
            if (!showOth /*&& p.co == "F"*/ && p.eu != 'T' && p.cc != 'T' && p.efta != 'T' && p.oth === 'T')
                return
            if (p.id >= 100000) return colKosovo
            if (p.co === 'T') return col
            if (zf < 400) return col
            else if (zf < 1000) return p.lvl >= 3 ? '' : col
            else if (zf < 2000) return p.lvl >= 2 ? '' : col
            else return p.lvl >= 1 ? '' : col
        })

    opts.width =
        opts.width ||
        ((f, zf) => {
            const p = f.properties
            if (p.co === 'T') return 0.5
            if (zf < 400) return p.lvl == 3 ? 2.2 : p.lvl == 2 ? 2.2 : p.lvl == 1 ? 2.2 : 4
            else if (zf < 1000) return p.lvl == 2 ? 1.8 : p.lvl == 1 ? 1.8 : 2.5
            else if (zf < 2000) return p.lvl == 1 ? 1.8 : 2.5
            else return 1.2
        })

    opts.lineDash =
        opts.lineDash ||
        ((f, zf) => {
            const p = f.properties
            if (p.co === 'T') return []
            if (zf < 400)
                return p.lvl == 3
                    ? [2 * zf, 2 * zf]
                    : p.lvl == 2
                    ? [5 * zf, 2 * zf]
                    : p.lvl == 1
                    ? [5 * zf, 2 * zf]
                    : [10 * zf, 3 * zf]
            else if (zf < 1000)
                return p.lvl == 2 ? [5 * zf, 2 * zf] : p.lvl == 1 ? [5 * zf, 2 * zf] : [10 * zf, 3 * zf]
            else if (zf < 2000) return p.lvl == 1 ? [5 * zf, 2 * zf] : [10 * zf, 3 * zf]
            else return [10 * zf, 3 * zf]
        })

    opts.baseURL = opts.baseURL || 'https://raw.githubusercontent.com/eurostat/Nuts2json/master/pub/v2/'
    opts.url = opts.baseURL + nutsYear + '/' + crs + '/' + scale + '/nutsbn_' + nutsLevel + '.json'
    return opts
}

export const getParameterByName = GeoCanvas.getParameterByName

// set default d3 locale
import { formatDefaultLocale } from 'd3-format'
formatDefaultLocale({
    decimal: '.',
    thousands: ' ',
    grouping: [3],
    currency: ['', '€'],
})
