//@ts-check
'use strict'

import { Style } from '../core/Style.js'

/**
 * A very generic style that shows grid cells with specific color, size and shape.
 * It can be used to show variables as cell colors, cell size, cell shape, or any combination of the three visual variables.
 *
 * @module style
 * @author Joseph Davies, Julien Gaffuri
 */
export class ShapeColorSizeStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the color of the cell.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):string} */
        this.color = opts.color || (() => "#EA6BAC") //(c,r,z,vs) => {}

        /** A function returning the size of a cell in geographical unit.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.size = opts.size || ((cell, resolution) => resolution) //(c,r,z,vs) => {}

        /** A function returning the shape of a cell.
         * @type {function(import("../core/Dataset.js").Cell,number, number,object):import("../core/Style.js").Shape} */
        this.shape = opts.shape || (() => "square") //(c,r,z,vs) => {}
    }

    /**
     * Draw cells as squares, with various colors and sizes.
     * 
     * @param {Array.<import("../core/Dataset.js").Cell>} cells
     * @param {import("../core/GeoCanvas.js").GeoCanvas} geoCanvas
     * @param {number} resolution
     * @override
     */
    draw(cells, geoCanvas, resolution) {

        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //zoom
        const z = geoCanvas.view.z

        //get view scale
        const viewScale = this.viewScale ? this.viewScale(cells, resolution, z) : undefined

        const r2 = resolution * 0.5
        for (let c of cells) {
            //color
            let col = this.color ? this.color(c, resolution, z, viewScale) : "black"
            if (!col || col === 'none') continue

            //size
            const size = this.size ? this.size(c, resolution, z, viewScale) : resolution
            if (!size) continue

            //shape
            const shape = this.shape ? this.shape(c, resolution, z, viewScale) : 'square'
            if (shape === 'none') continue

            //get offset
            const offset = this.offset(c, resolution, z)

            geoCanvas.ctx.fillStyle = col
            if (shape === 'square') {
                //draw square
                const d = resolution * (1 - size / resolution) * 0.5
                geoCanvas.ctx.fillRect(c.x + d + offset.dx, c.y + d + offset.dy, size, size)
            } else if (shape === 'circle') {
                //draw circle
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.arc(c.x + r2 + offset.dx, c.y + r2 + offset.dy, size * 0.5, 0, 2 * Math.PI, false)
                geoCanvas.ctx.fill()
            } else if (shape === 'donut') {
                //draw donut
                const xc = c.x + r2 + offset.dx,
                    yc = c.y + r2 + offset.dy
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.moveTo(xc, yc)
                geoCanvas.ctx.arc(xc, yc, r2, 0, 2 * Math.PI)
                geoCanvas.ctx.arc(xc, yc, (1 - size / resolution) * r2, 0, 2 * Math.PI, true)
                geoCanvas.ctx.closePath()
                geoCanvas.ctx.fill()
            } else if (shape === 'diamond') {
                const s2 = size * 0.5
                geoCanvas.ctx.beginPath()
                geoCanvas.ctx.moveTo(c.x + r2 - s2, c.y + r2)
                geoCanvas.ctx.lineTo(c.x + r2, c.y + r2 + s2)
                geoCanvas.ctx.lineTo(c.x + r2 + s2, c.y + r2)
                geoCanvas.ctx.lineTo(c.x + r2, c.y + r2 - s2)
                geoCanvas.ctx.fill()
            } else {
                throw new Error('Unexpected shape:' + shape)
            }
        }

        //update legends
        this.updateLegends({ viewScale: viewScale, resolution: resolution, z: z, cells: cells })
    }
}
