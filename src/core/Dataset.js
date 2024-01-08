//@ts-check
'use strict'

/**
 * A grid cell.
 * @typedef {{x: number, y: number}} Cell */

/**
 * A dataset component, of grid cells.
 * @abstract
 *
 * @module core
 * @author Joseph Davies, Julien Gaffuri
 */
export class Dataset {
    /**
     * @param {import("./Map.js").Map} map The map.
     * @param {string} url The URL of the dataset.
     * @param {number} resolution The dataset resolution, in the CRS geographical unit.
     * @param {{preprocess?:function(Cell):boolean}} opts
     * @abstract
     */
    constructor(map, url, resolution, opts = {}) {

        /**
         * The map.
         * @protected
         * @type {import("./Map.js").Map} */
        this.map = map

        /**
         * The url of the dataset.
         * @protected
         * @type {string} */
        this.url = url

        /**
         * The dataset resolution in geographical unit.
         * @protected
         * @type {number} */
        this.resolution = resolution

        /**
         * A preprocess to run on each cell after loading. It can be used to apply some specific treatment before or compute a new column. And also to determine which cells to keep after loading.
         * @type {(function(Cell):boolean )| undefined } */
        this.preprocess = opts.preprocess || undefined

        /** The cells within the view
         * @protected
         * @type {Array.<Cell>} */
        this.cellsViewCache = []
    }

    /**
     * Request data within a geographic envelope.
     *
     * @abstract
     * @param {import("./GeoCanvas").Envelope|undefined} extGeo
     * @returns {this}
     */
    getData(extGeo = undefined) {
        throw new Error('Method getData not implemented.')
    }

    /**
     * Fill the view cache with all cells which are within a geographical envelope.
     * @abstract
     * @param {import("./GeoCanvas").Envelope} extGeo The view geographical envelope.
     * @returns {void}
     */
    updateViewCache(extGeo) {
        throw new Error('Method updateViewCache not implemented.')
    }

    /**
     * Get a cell under a given position, if any.
     *
     * @param {{x:number,y:number}} posGeo
     * @param {Array.<Cell>} cells Some cells from the dataset (a subset if necessary, usually the view cache).
     * @returns {Cell|undefined}
     */
    getCellFromPosition(posGeo, cells) {
        //compute candidate cell position
        /** @type {number} */
        //const r = this.getResolution()
        /** @type {number} */
        //const cellX = r * Math.floor(posGeo.x / r)
        /** @type {number} */
        //const cellY = r * Math.floor(posGeo.y / r)

        /*/get cell
        for (const cell of cells) {
            if (cell.x != cellX) continue
            if (cell.y != cellY) continue
            return cell
        }
        return undefined*/

        /** @type {number} */
        const r = this.getResolution()
        for (const cell of cells) {
            if (posGeo.x < cell.x) continue
            else if (cell.x + r < posGeo.x) continue
            else if (posGeo.y < cell.y) continue
            else if (cell.y + r < posGeo.y) continue
            else return cell
        }
        return undefined

    }

    //getters and setters

    /** @returns {number} */
    getResolution() {
        return this.resolution
    }

    /** @returns {Array.<Cell>} */
    getViewCache() {
        return this.cellsViewCache
    }

    /**
     * Return the relevant dataset for a specified zoom.
     * @param {number} z
     * @param {number} minPixelsPerCell
     * @returns {Dataset|undefined}
     * */
    getDataset(z, minPixelsPerCell) {
        return this
    }

}
