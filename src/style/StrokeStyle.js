//@ts-check
'use strict'

import { Style } from '../core/Style.js'

/**
 * @module style
 * @author Julien Gaffuri
 */
export class StrokeStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the color of the cell.
         * @type {function(import('../core/Dataset.js').Cell,number,number,object):string} */
        this.strokeColor = opts.strokeColor || (() => "#666") //(c,r,z,vs) => {}

        /** A function returning the size of a cell in geographical unit.
         * @type {function(import('../core/Dataset.js').Cell,number,number,object):number} */
        this.size = opts.size || ((cell, resolution) => resolution) //(c,r,z,vs) => {}

        /** The stroke line width in geographical unit.
         * @type {function(import('../core/Dataset.js').Cell,number,number,object):number} */
        this.strokeWidth = opts.strokeWidth || ((cell, resolution, z) => z * 1.5) //(c,r,z,vs) => {}

        /** A function returning the shape of a cell.
        * @type {function(import("../core/Dataset.js").Cell,number,number,object):import("../core/Style.js").Shape} */
        this.shape = opts.shape || (() => "square") //(c,r,z,vs) => {}
    }

    /**
     * Draw cells as squares, with various colors and size.
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

        const r2 = resolution * 0.5
        for (let cell of cells) {

            //color
            const col = this.strokeColor ? this.strokeColor(cell, resolution, z, viewScale) : undefined
            if (!col || col === 'none') continue
            geoCanvas.ctx.strokeStyle = col

            //size - in geo unit
            const sG = this.size ? this.size(cell, resolution, z, viewScale) : resolution

            //width
            const wi = this.strokeWidth ? this.strokeWidth(cell, resolution, z, viewScale) : 1 * z
            if (!wi || wi <= 0) continue
            geoCanvas.ctx.lineWidth = wi

            //shape
            const shape = this.shape ? this.shape(cell, resolution, z, viewScale) : 'square'
            if (shape === 'none') continue

            //get offset
            const offset = this.offset(cell, resolution, z)

            if (shape === 'square') {
                //draw square
                const d = resolution * (1 - sG / resolution) * 0.5
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.rect(cell.x + d + offset.dx, cell.y + d + offset.dy, sG, sG)
                geoCanvas.ctx.stroke()
            } else if (shape === 'circle') {
                //draw circle
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.arc(cell.x + r2 + offset.dx, cell.y + r2 + offset.dy, sG * 0.5, 0, 2 * Math.PI, false)
                geoCanvas.ctx.stroke()
            } else if (shape === 'diamond') {
                const s2 = sG * 0.5
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.moveTo(cell.x + r2 - s2, cell.y + r2)
                geoCanvas.ctx.lineTo(cell.x + r2, cell.y + r2 + s2)
                geoCanvas.ctx.lineTo(cell.x + r2 + s2, cell.y + r2)
                geoCanvas.ctx.lineTo(cell.x + r2, cell.y + r2 - s2)
                geoCanvas.ctx.lineTo(cell.x + r2 - s2, cell.y + r2)
                geoCanvas.ctx.stroke()
            } else if (shape === 'donut') {
                console.error('Not implemented')
            } else {
                throw new Error('Unexpected shape:' + shape)
            }
        }

        //update legends
        this.updateLegends({ style: this, resolution: resolution, z: z, viewScale: viewScale })
    }
}
