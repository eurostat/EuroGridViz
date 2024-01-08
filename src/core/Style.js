//@ts-check
'use strict'

import { Drawable } from "./Drawable.js"

/** @typedef {"square"|"circle"|"diamond"|"donut"|"none"} Shape */

/**
 * viewScale type
 * Returns an object from a list of cells, 
 * @typedef {function(Array.<import('./Dataset.js').Cell>,number, number):*} ViewScale */

/**
 * A style, to show a grid dataset.
 *
 * @module core
 * @author Joseph Davies, Julien Gaffuri
 */
export class Style extends Drawable {
    /**
     * @abstract
     * @param {{filter?:function(import('./Dataset').Cell):boolean, offset?:function(import('./Dataset').Cell, number, number):{dx:number,dy:number}, visible?:function(number):boolean,alpha?:function(number):number,blendOperation?:function(number):GlobalCompositeOperation,drawFun?:function,viewScale?:ViewScale}} opts
     */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /**
        * @type {ViewScale|undefined} */
        this.viewScale = opts.viewScale

        /** A filter function to apply to the cell list, to filter out some cells not to be drawn (such as for example the cells with value=0).
        * @protected
        * @type {function(import('./Dataset').Cell):boolean} */
        this.filter = opts.filter || (() => true)

        /** An offset. This is to alter the position of all symbols in a given direction. In geographical unit.
         * @protected
         * @type {function(import('./Dataset').Cell,number,number):{dx:number,dy:number}} */
        this.offset = opts.offset || ((c, r, z) => ({ dx: 0, dy: 0 }))

        /** A draw function for the style.
         * @type {function|undefined} */
        this.drawFun = opts.drawFun

        /**
         * @public
         * @type {Array.<import("./Legend").Legend>} */
        this.legends = []
    }

    /**
     * Draw cells.
     *
     * @param {Array.<import('./Dataset').Cell>} cells The cells to draw.
     * @param {import("./GeoCanvas").GeoCanvas} geoCanvas The canvas where to draw them.
     * @param {number} resolution Their resolution (in geographic unit)
     * @abstract
     */
    draw(cells, geoCanvas, resolution) {
        if (this.drawFun) this.drawFun(cells, geoCanvas, resolution)
        else throw new Error('Method draw not implemented.')
    }

    //getters and setters

    /** @returns {function(import('./Dataset').Cell,number,number):{dx:number,dy:number}} */
    getOffset() {
        return this.offset
    }
    /** @param {function(import('./Dataset').Cell,number,number):{dx:number,dy:number}} val @returns {this} */
    setOffset(val) {
        this.offset = val
        return this
    }

    /** Update legends of the style, if any
     * @param {object} opts
     * @returns {this} */
    updateLegends(opts) {
        for (const lg of this.legends) lg.update(opts)
        return this
    }

    /**
     * @param {Array.<import("./Legend").Legend>} legends
     * @returns {this} */
    addLegends(legends) {
        for (let legend of legends)
            this.legends.push(legend)
        return this
    }
}
