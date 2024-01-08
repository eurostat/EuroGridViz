//@ts-check
'use strict'

import { Style } from '../core/Style.js'

/**
 * @module style
 * @author Julien Gaffuri
 */
export class TextStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the text of a cell.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):string} */
        this.text = opts.text || (() => 'X') //(c,r,z,vs) => {}

        /** A function returning the color of the cell.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):string} */
        this.color = opts.color || (() => "black") //(c,r,z,vs) => {}

        /** A function returning the font size of a cell in geo unit.
         * @type {function(import('../core/Dataset.js').Cell, number, number,object):number} */
        this.fontSize = opts.fontSize || ((cell, resolution) => resolution) //(c,r,z,vs) => {}

        /** The text font family.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):string} */
        this.fontFamily = opts.fontFamily || (() => 'Arial')

        /** The text font weight.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):string} */
        this.fontWeight = opts.fontWeight || (() => 'bold')
    }

    /**
     * Draw cells as text.
     *
     * @param {Array.<import("../core/Dataset").Cell>} cells
     * @param {import("../core/GeoCanvas").GeoCanvas} geoCanvas
     * @param {number} resolution
     */
    draw(cells, geoCanvas, resolution) {

        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //
        const z = geoCanvas.view.z

        //get view scale
        const viewScale = this.viewScale ? this.viewScale(cells, resolution, z) : undefined

        //draw with HTML canvas
        //in screen coordinates
        geoCanvas.initCanvasTransform()

        for (let cell of cells) {
            //get cell text
            const text = this.text ? this.text(cell, resolution, z, viewScale) : undefined
            if (text == undefined || text == null || text + '' === '') continue

            //color
            const col = this.color ? this.color(cell, resolution, z, viewScale) : undefined
            if (!col) continue
            geoCanvas.ctx.fillStyle = col

            //font size
            //size - in pixel unit
            const fontSizePix = this.fontSize(cell, resolution, z, viewScale) / z
            if (!fontSizePix) continue

            //set font
            const fontFamily = this.fontFamily ? this.fontFamily(cell, resolution, z, viewScale) : 'Arial'
            const fontWeight = this.fontWeight ? this.fontWeight(cell, resolution, z, viewScale) : 'bold'
            geoCanvas.ctx.font = fontWeight + ' ' + fontSizePix + 'px ' + fontFamily

            //get offset
            const offset = this.offset(cell, resolution, z)

            //text position
            geoCanvas.ctx.textAlign = 'center'
            const tx = geoCanvas.geoToPixX(cell.x + resolution * 0.5 + offset.dx)
            const ty = geoCanvas.geoToPixY(cell.y + resolution * 0.5 + offset.dy) + fontSizePix * 0.3 //it should be 0.5 but 0.3 seems to work better

            //draw the text
            geoCanvas.ctx.fillText(text, tx, ty)
        }

        //update legends
        this.updateLegends({ style: this, resolution: resolution, z: z, viewScale: viewScale })
    }

    /**
     * Build a function [0,1]->string for characters legend
     *
     * @param {Array.<string>} chars
     * @param {(function(number):number)|undefined} scale
     * @returns {function(number):string}
     */
    static textScale(chars, scale = undefined) {
        const nb = chars.length
        return (t) => {
            if (scale) t = scale(t)
            if (t == 0) return ""
            if (t >= 1) return chars[nb - 1]
            return chars[Math.floor(t * nb)]
        }
    }
}
