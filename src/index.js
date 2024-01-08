//@ts-check
'use strict'

// the application
export { Map } from './core/Map.js'
export { GeoCanvas } from './core/GeoCanvas.js'
export { Style } from './core/Style.js'
export { Layer } from './core/Layer.js'
export { MultiResolutionDataset } from './core/MultiResolutionDataset.js'

// export dataset types
export { TiledGrid } from './dataset/TiledGrid.js'
export { CSVGrid } from './dataset/CSVGrid.js'
export { JSGrid } from './dataset/JSGrid.js'

// export styles
export { ShapeColorSizeStyle } from './style/ShapeColorSizeStyle.js'
export { StrokeStyle } from './style/StrokeStyle.js'
export { JoyPlotStyle } from './style/JoyPlotStyle.js'
export { CompositionStyle } from './style/CompositionStyle.js'
export { SegmentStyle } from './style/SegmentStyle.js'
export { TextStyle } from './style/TextStyle.js'
export { PillarStyle } from './style/PillarStyle.js'
export { SideStyle } from './style/SideStyle.js'
//export { ContourStyle } from './style/ContourStyle.js'
export { SideCategoryStyle } from './style/SideCategoryStyle.js'
export { DotDensityStyle } from './style/DotDensityStyle.js'
//export { TanakaStyle } from './style/TanakaStyle.js'
//export { LegoStyle } from './style/LegoStyle.js'
export { SquareColorWebGLStyle } from './style/SquareColorWebGLStyle.js'
export { SquareColorCategoryWebGLStyle } from './style/SquareColorCategoryWebGLStyle.js'
export { MosaicStyle } from './style/MosaicStyle.js'
export { NinjaStarStyle } from './style/NinjaStarStyle.js'
export { TimeSeriesStyle } from './style/TimeSeriesStyle.js'
export { IsoFenceStyle } from './style/IsoFenceStyle.js'

// export additional layers
export { GridLayer } from './layer/GridLayer.js'
export { BackgroundLayer } from './layer/BackgroundLayer.js'
export { BackgroundLayerWMS } from './layer/BackgroundLayerWMS.js'
export { LabelLayer } from './layer/LabelLayer.js'
export { GeoJSONLayer } from './layer/GeoJSONLayer.js'

// export legends
export { ColorLegend } from './legend/ColorLegend.js'
export { ColorDiscreteLegend } from './legend/ColorDiscreteLegend.js'
export { ColorCategoryLegend } from './legend/ColorCategoryLegend.js'
export { SizeLegend, sizeLegend, sizeLegendViewScale, sizeDiscreteLegend, sizeDiscreteViewScaleLegend } from './legend/SizeLegend.js'
export { OrientationLegend, orientationLegend } from './legend/OrientationLegend.js'

// export { goToStraight, zoomTo } from "./utils/zoomUtils"
export * from './utils/stretching.js'
export * from './utils/scale.js'
export { nice } from './utils/utils.js'

import { GeoCanvas } from './core/GeoCanvas.js'
export const getParameterByName = GeoCanvas.getParameterByName

// set default d3 locale
import { formatDefaultLocale } from 'd3-format'
formatDefaultLocale({
    decimal: '.',
    thousands: ' ',
    grouping: [3],
    currency: ['', '€'],
})
