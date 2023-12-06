//@ts-check
'use strict'

/**
 * Statistics of a set of values
 * @typedef {{min:number,max:number}} Stat */

/** @typedef {"square"|"circle"|"diamond"|"donut"|"none"} Shape */

/**
 * A style, to show a grid dataset.
 *
 * @author Joseph Davies, Julien Gaffuri
 */
export class Style {
    /**
     * @abstract
     * @param {{filter?:function(import('./Dataset').Cell):boolean,offset?:function(import('./Dataset').Cell,number,number):{dx:number,dy:number},visible?:boolean,alpha?:function(number):number,blendOperation?:function(number):GlobalCompositeOperation,minZoom?:number,maxZoom?:number,drawFun?:function}} opts
     */
    constructor(opts) {
        opts = opts || {}

        /** A filter function to apply to the cell list, to filter out some cells not to be drawn (such as for example the cells with value=0).
         * @protected
         * @type {function(import('./Dataset').Cell):boolean} */
        this.filter = opts.filter || (() => true)

        /** An offset. This is to alter the position of all symbols in a given direction. In geographical unit.
         * @protected
         * @type {function(import('./Dataset').Cell,number,number):{dx:number,dy:number}} */
        this.offset = opts.offset || ((c, r, zf) => ({ dx: 0, dy: 0 }))

        /** An attribute to specify if a style should be drawn or not
         * @type {boolean} */
        this.visible = opts.visible === false ? false : true

        /** A function returning the alpha (transparency/opacity), between 0.0 (fully transparent) and 1.0 (fully opaque).
         *  The function parameter is the zoom factor.
         * (see CanvasRenderingContext2D: globalAlpha property)
         * @type {function(number):number|undefined} */
        this.alpha = opts.alpha

        /** A function returning the blend operation. The function parameter is the zoom factor.
         * (see CanvasRenderingContext2D: globalCompositeOperation property)
         * @type {function(number):GlobalCompositeOperation} */
        this.blendOperation = opts.blendOperation || (zf => "source-over")

        /** The minimum zoom factor: Below this level, the layer is not shown.
         * @type {number}
         * */
        this.minZoom = opts.minZoom || 0

        /** The maximum zoom factor: Above this level, the layer is not shown.
         * @type {number}
         * */
        this.maxZoom = opts.maxZoom || Infinity

        /** A draw function for the style.
         * @type {function} */
        this.drawFun = opts.drawFun

        //ensure acceptable values for the zoom limits.
        if (this.minZoom >= this.maxZoom)
            throw new Error('Unexpected zoom limits for layer. Zoom min should be smaller than zoom max.')

        /**
         * @public
         * @type {Array.<import("./Legend").Legend>} */
        this.legends = []
    }

    /**
     * Draw cells.
     *
     * @param {Array.<import('./Dataset').Cell>} cells The cells to draw.
     * @param {number} resolution Their resolution (in geographic unit)
     * @param {import("./GeoCanvas").GeoCanvas} cg The canvas where to draw them.
     * @abstract
     */
    draw(cells, resolution, cg) {
        if (this.drawFun) this.drawFun(cells, resolution, cg)
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

    /** Hide all legend elements of the style, if any
     * @param {object} opts
     * @returns {this} */
    updateLegends(opts) {
        for (const lg of this.legends) lg.update(opts)
        return this
    }

    /**
     * Compute some statistics on a value of some cells.
     * This is used to define how to draw specifically the cells within the view.
     * TODO: compute median ?
     *
     * @param {Array.<import('./Dataset').Cell>} cells
     * @param {function(import('./Dataset').Cell):number} valFun
     * @param {boolean} ignoreZeros
     * @returns {Stat | undefined}
     */
    static getStatistics(cells, valFun, ignoreZeros) {
        if (!cells || cells.length == 0) return undefined
        let min = Infinity
        let max = -Infinity
        //let sum = 0
        //let nb = 0
        for (const cell of cells) {
            const v = +valFun(cell)
            if (ignoreZeros && !v) continue
            if (v < min) min = v
            if (v > max) max = v
            //sum += v
            //nb++
        }
        return { min: min, max: max }
    }
}
