//@ts-check
'use strict'

/** @typedef {{ dims: object, crs: string, tileSizeCell: number, originPoint: {x:number,y:number}, resolutionGeo: number, tilingBounds:import("../core/GeoCanvas.js").Envelope }} GridInfo */

import { csv } from 'd3-fetch'
import { Dataset } from '../core/Dataset.js'

/**
 * A dataset composed of a single CSV file (not tiled).
 *
 * @module dataset
 * @author Joseph Davies, Julien Gaffuri
 */
export class CSVGrid extends Dataset {
    /**
     * @param {import("../core/Map.js").Map} map The map.
     * @param {string} url The URL of the dataset.
     * @param {number} resolution The dataset resolution in geographical unit.
     * @param {{preprocess?:(function(import("../core/Dataset.js").Cell):boolean)}} opts
     */
    constructor(map, url, resolution, opts = {}) {
        super(map, url, resolution, opts)

        /**
         * @private
         * @type {Array.<import("../core/Dataset.js").Cell>} */
        this.cells = []

        /**
         * @type {string}
         * @private  */
        this.infoLoadingStatus = 'notLoaded'

        //get data
        this.getData(undefined)
    }

    /**
     * Request data within a geographic envelope.
     * @param {import("../core/GeoCanvas.js").Envelope|undefined} e
     */
    getData(e) {
        //check if data already loaded
        if (this.infoLoadingStatus != 'notLoaded') return this

        //load data
        this.infoLoadingStatus = 'loading'
            ; (async () => {
                try {
                    const data = await csv(this.url)

                    //convert coordinates in numbers
                    for (const c of data) {
                        c.x = +c.x
                        c.y = +c.y
                    }

                    //preprocess/filter
                    if (this.preprocess) {
                        this.cells = []
                        for (const c of data) {
                            const b = this.preprocess(c)
                            if (b == false) continue
                            this.cells.push(c)
                        }
                    } else {
                        this.cells = data
                    }

                    //TODO check if redraw is necessary
                    //that is if the dataset belongs to a layer which is visible at the current zoom level

                    //execute the callback, usually a draw function
                    if (this.map) this.map.redraw()

                    this.infoLoadingStatus = 'loaded'
                } catch (error) {
                    //mark as failed
                    this.infoLoadingStatus = 'failed'
                    this.cells = []
                }
            })()

        return this
    }

    /**
     * Fill the view cache with all cells which are within a geographical envelope.
     *
     * @param {import("../core/GeoCanvas.js").Envelope} extGeo
     * @returns {void}
     */
    updateViewCache(extGeo) {
        //data not loaded yet
        if (!this.cells) return

        this.cellsViewCache = []
        for (const cell of this.cells) {
            if (+cell.x + this.resolution < extGeo.xMin) continue
            if (+cell.x - this.resolution > extGeo.xMax) continue
            if (+cell.y + this.resolution < extGeo.yMin) continue
            if (+cell.y - this.resolution > extGeo.yMax) continue
            this.cellsViewCache.push(cell)
        }
    }
}
