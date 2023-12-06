//@ts-check
'use strict'

/** @typedef {{ dims: object, crs: string, tileSizeCell: number, originPoint: {x:number,y:number}, resolutionGeo: number, tilingBounds:import("../Dataset").Envelope, format:import("../DatasetComponent").Format }} GridInfo */

// internal
import { GridTile } from './GridTile.js'
import { App } from '../App.js'
import { DatasetComponent } from '../DatasetComponent.js'
import { monitor, monitorDuration } from '../utils/Utils.js'

// external
import { json, csv } from 'd3-fetch'

/**
 * A tiled dataset, composed of CSV tiles.
 *
 * @author Joseph Davies, Julien Gaffuri
 */
export class TiledGrid extends DatasetComponent {
    /**
     * @param {string} url The URL of the dataset.
     * @param {App} app The application.
     * @param {{preprocess?:(function(import("../Dataset").Cell):boolean) }} opts
     */
    constructor(url, app, opts = {}) {
        super(url, 0, opts)

        /**
         * The app being used.
         * @type {App}
         */
        this.app = app

        /**
         * The grid info object, from the info.json file.
         *  @type {GridInfo | undefined}
         * @private
         *  */
        this.info = undefined

        /**
         * @type {string}
         * @private  */
        this.infoLoadingStatus = 'notLoaded'

        /**
         * The cache of the loaded tiles. It is double indexed: by xT and then yT.
         * Example: this.cache[xT][yT] returns the tile at [xT][yT] location.
         *
         * @type {object}
         * */
        this.cache = {}

    }

    /**
     * Load the info.json from the url.
     *
     * @param {function():void} callback
     * @returns this
     */
    loadInfo(callback) {
        if (!this.info && this.infoLoadingStatus === 'notLoaded') {
            ; (async () => {
                try {
                    const data = await json(this.url + 'info.json')
                    this.info = data
                    this.resolution = data.resolutionGeo
                    this.infoLoadingStatus = 'loaded'
                    if (callback) callback()
                } catch (error) {
                    //mark as failed
                    this.infoLoadingStatus = 'failed'
                }
            })()
        } else if (callback && (this.infoLoadingStatus === 'loaded' || this.infoLoadingStatus === 'failed'))
            callback()
        return this
    }

    /**
     * Compute a tiling envelope from a geographical envelope.
     * This is the function to use to know which tiles to download for a geographical view.
     *
     * @param {import("../Dataset").Envelope} e
     * @returns {import("../Dataset").Envelope|undefined}
     */
    getTilingEnvelope(e) {
        if (!this.info) {
            this.loadInfo(() => { })
            return
        }

        const po = this.info.originPoint,
            r = this.info.resolutionGeo,
            s = this.info.tileSizeCell

        return {
            xMin: Math.floor((e.xMin - po.x) / (r * s)),
            xMax: Math.floor((e.xMax - po.x) / (r * s)),
            yMin: Math.floor((e.yMin - po.y) / (r * s)),
            yMax: Math.floor((e.yMax - po.y) / (r * s)),
        }
    }

    /**
     * Request data within a geographic envelope.
     *
     * @param {import("../Dataset").Envelope} extGeo
     * @param {function():void} redrawFun
     * @returns {this}
     */
    getData(extGeo, redrawFun) {
        //TODO empty cache when it gets too big ?

        //check if info has been loaded
        if (!this.info) return this

        //tiles within the scope
        /** @type {import("../Dataset").Envelope|undefined} */
        const tb = this.getTilingEnvelope(extGeo)
        if (!tb) return this

        //grid bounds
        /** @type {import("../Dataset").Envelope} */
        const gb = this.info.tilingBounds

        for (let xT = Math.max(tb.xMin, gb.xMin); xT <= Math.min(tb.xMax, gb.xMax); xT++) {
            for (let yT = Math.max(tb.yMin, gb.yMin); yT <= Math.min(tb.yMax, gb.yMax); yT++) {
                //prepare cache
                if (!this.cache[xT]) this.cache[xT] = {}

                //check if tile exists in the cache
                /** @type {GridTile} */
                let tile = this.cache[xT][yT]
                if (tile) continue

                //mark tile as loading
                this.cache[xT][yT] = "loading";
                (async () => {
                    //request tile
                    /** @type {Array.<import("../Dataset").Cell>}  */
                    let cells

                    try {
                        /** @type {Array.<import("../Dataset").Cell>}  */
                        // @ts-ignore
                        const data = await csv(this.url + xT + '/' + yT + '.csv')

                        //if (monitor) monitorDuration('*** TiledGrid parse start')

                        //preprocess/filter
                        if (this.preprocess) {
                            cells = []
                            for (const c of data) {
                                const b = this.preprocess(c)
                                if (b == false) continue
                                cells.push(c)
                            }
                        } else {
                            cells = data
                        }

                        //if (monitor) monitorDuration('preprocess / filter')
                    } catch (error) {
                        //mark as failed
                        this.cache[xT][yT] = 'failed'
                        return
                    }

                    //store tile in cache
                    if (!this.info) {
                        console.error('Tile info inknown')
                        return
                    }
                    const tile_ = new GridTile(cells, xT, yT, this.info)
                    this.cache[xT][yT] = tile_

                    //if (monitor) monitorDuration('storage')

                    //if no redraw is specified, then leave
                    if (!redrawFun) return

                    //check if redraw is really needed, that is if:

                    // 1. the dataset belongs to a layer which is visible at the current zoom level
                    let redraw = false
                    //go through the layers
                    const zf = this.app.getZoomFactor()
                    for (const lay of this.app.layers) {
                        if (!lay.visible) continue
                        if (lay.getDatasetComponent(zf) != this) continue
                        //found one layer. No need to seek more.
                        redraw = true
                        break
                    }
                    //if (monitor) monitorDuration('check redraw 1')

                    if (!redraw) return

                    // 2. the tile is within the view, that is its geo envelope intersects the viewer geo envelope.
                    const env = this.app.updateExtentGeo()
                    const envT = tile_.extGeo
                    if (env.xMax <= envT.xMin) return
                    if (env.xMin >= envT.xMax) return
                    if (env.yMax <= envT.yMin) return
                    if (env.yMin >= envT.yMax) return

                    //if (monitor) monitorDuration('check redraw 2')
                    //if (monitor) monitorDuration('*** TiledGrid parse end')

                    //redraw
                    redrawFun()
                })()
            }
        }
        return this
    }

    /**
     * Fill the view cache with all cells which are within a geographical envelope.
     * @abstract
     * @param {import("../Dataset").Envelope} extGeo
     * @returns {void}
     */
    updateViewCache(extGeo) {
        //
        this.cellsViewCache = []

        //check if info has been loaded
        if (!this.info) return

        //tiles within the scope
        /** @type {import("../Dataset").Envelope|undefined} */
        const tb = this.getTilingEnvelope(extGeo)
        if (!tb) return

        //grid bounds
        /** @type {import("../Dataset").Envelope} */
        const gb = this.info.tilingBounds

        for (let xT = Math.max(tb.xMin, gb.xMin); xT <= Math.min(tb.xMax, gb.xMax); xT++) {
            if (!this.cache[xT]) continue
            for (let yT = Math.max(tb.yMin, gb.yMin); yT <= Math.min(tb.yMax, gb.yMax); yT++) {
                //get tile
                /** @type {GridTile} */
                const tile = this.cache[xT][yT]
                if (!tile || typeof tile === 'string') continue

                //get cells
                //this.cellsViewCache = this.cellsViewCache.concat(tile.cells)

                for (const cell of tile.cells) {
                    if (+cell.x + this.resolution < extGeo.xMin) continue
                    if (+cell.x - this.resolution > extGeo.xMax) continue
                    if (+cell.y + this.resolution < extGeo.yMin) continue
                    if (+cell.y - this.resolution > extGeo.yMax) continue
                    this.cellsViewCache.push(cell)
                }
            }
        }
    }
}
