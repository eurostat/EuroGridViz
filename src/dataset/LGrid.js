//@ts-check
'use strict'

/** @typedef {{ dims: object, crs: string, tileSizeCell: number, originPoint: {x:number,y:number}, resolutionGeo: number, tilingBounds:import("../Dataset.js").Envelope }} GridInfo */

import { csv } from 'd3-fetch'
import { DatasetComponent } from '../DatasetComponent.js'

/**
 * A dataset composed of a single CSV file (not tiled).
 *
 * @author Joseph Davies, Julien Gaffuri
 */
export class LGrid extends DatasetComponent {
    /**
     * @param {string} url The URL of the dataset.
     * @param {number} resolution The dataset resolution in geographical unit.
     * @param {{preprocess?:(function(import("../Dataset.js").Cell):boolean)}} opts
     */
    constructor(url, resolution, opts = {}) {
        super(url, resolution, opts)

        /**
         * @private
         * @type {Array.<import("../Dataset.js").Cell>} */
        this.cells = opts.cells || []

        /**
         * @type {string}
         * @private  */
        this.infoLoadingStatus = 'notLoaded'
    }

    /**
     * Request data within a geographic envelope.
     *
     * @param {import("../Dataset.js").Envelope|undefined} e
     * @param {function():void} redraw
     */
    getData(e, redraw) { return this }

    /**
     * Fill the view cache with all cells which are within a geographical envelope.
     *
     * @param {import("../Dataset.js").Envelope} extGeo
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
