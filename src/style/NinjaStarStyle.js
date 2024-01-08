//@ts-check
'use strict'

import { Style } from '../core/Style.js'

/**
 * @module style
 * @author Joseph Davies, Julien Gaffuri
 */
export class NinjaStarStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the color of the cell.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):string} */
        this.color = opts.color || (() => "#EA6BAC") //(c,r,z,vs) => {}

        /** A function returning the size of a cell, within [0,1]:
         *  - 0, nothing shown
         *  - 1, entire square
          * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.size = opts.size || ((cell, resolution) => resolution) //(c,r,z,vs) => {}

        /** A function returning the shape.
         * @type {function(import("../core/Dataset").Cell):string} */
        this.shape = opts.shape || (() => 'o')
    }

    /**
     *
     * @param {Array.<import('../core/Dataset.js').Cell>} cells
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

        const r2 = resolution * 0.5
        for (let cell of cells) {
            //color
            const col = this.color ? this.color(cell, resolution, z, viewScale) : undefined
            if (!col || col === 'none') continue
            geoCanvas.ctx.fillStyle = col

            //size - in geo unit
            let k = this.size(cell, resolution, z, viewScale)
            k = k < 0 ? 0 : k > 1 ? 1 : k
            const sG2 = k * r2

            //shape
            const shape = this.shape ? this.shape(cell) : 'o'
            if (shape === 'none') continue

            //get offset
            //TODO use
            //const offset = this.offset(cell, r, z)

            //center position
            const cx = cell.x + r2
            const cy = cell.y + r2

            if (shape === 'p') {
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.moveTo(cx, cy + r2)
                geoCanvas.ctx.lineTo(cx + sG2, cy + sG2)
                geoCanvas.ctx.lineTo(cx + r2, cy)
                geoCanvas.ctx.lineTo(cx + sG2, cy - sG2)
                geoCanvas.ctx.lineTo(cx, cy - r2)
                geoCanvas.ctx.lineTo(cx - sG2, cy - sG2)
                geoCanvas.ctx.lineTo(cx - r2, cy)
                geoCanvas.ctx.lineTo(cx - sG2, cy + sG2)
                geoCanvas.ctx.fill()
            } else if (shape === 'o') {
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.moveTo(cx, cy + sG2)
                geoCanvas.ctx.lineTo(cx + r2, cy + r2)
                geoCanvas.ctx.lineTo(cx + sG2, cy)
                geoCanvas.ctx.lineTo(cx + r2, cy - r2)
                geoCanvas.ctx.lineTo(cx, cy - sG2)
                geoCanvas.ctx.lineTo(cx - r2, cy - r2)
                geoCanvas.ctx.lineTo(cx - sG2, cy)
                geoCanvas.ctx.lineTo(cx - r2, cy + r2)
                geoCanvas.ctx.fill()
            } else {
                throw new Error('Unexpected shape:' + shape)
            }
        }

        //update legends
        this.updateLegends({ style: this, resolution: resolution, z: z, viewScale: viewScale })
    }
}
