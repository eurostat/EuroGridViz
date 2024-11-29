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
        this.color = opts.color || (() => '#EA6BAC') //(c,r,z,vs) => {}

        /** A function returning the size of a cell in geographical unit.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.size = opts.size || ((cell, resolution) => resolution) //(c,r,z,vs) => {}

        /** A function returning the shape of a cell.
         * @type {function(import("../core/Dataset.js").Cell,number, number,object):import("../core/Style.js").Shape} */
        this.shape = opts.shape || (() => 'square') //(c,r,z,vs) => {}
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
            let col = this.color ? this.color(c, resolution, z, viewScale) : 'black'
            if (!col || col === 'none') continue

            //size
            const size = this.size ? this.size(c, resolution, z, viewScale) : resolution
            if (!size) continue

            //shape
            const shape = this.shape ? this.shape(c, resolution, z, viewScale) : 'square'
            if (shape === 'none') continue

            //get offset
            const offset = this.offset(c, resolution, z)

            //get context
            const ctx = geoCanvas.offscreenCtx
            ctx.fillStyle = col
            if (shape === 'square') {
                //draw square
                const d = resolution * (1 - size / resolution) * 0.5
                ctx.fillRect(c.x + d + offset.dx, c.y + d + offset.dy, size, size)
            } else if (shape === 'circle') {
                //draw circle
                ctx.beginPath()
                ctx.arc(c.x + r2 + offset.dx, c.y + r2 + offset.dy, size * 0.5, 0, 2 * Math.PI, false)
                ctx.fill()
            } else if (shape === 'donut') {
                //draw donut
                const xc = c.x + r2 + offset.dx,
                    yc = c.y + r2 + offset.dy
                ctx.beginPath()
                ctx.moveTo(xc, yc)
                ctx.arc(xc, yc, r2, 0, 2 * Math.PI)
                ctx.arc(xc, yc, (1 - size / resolution) * r2, 0, 2 * Math.PI, true)
                ctx.closePath()
                ctx.fill()
            } else if (shape === 'diamond') {
                const s2 = size * 0.5
                ctx.beginPath()
                ctx.moveTo(c.x + r2 - s2, c.y + r2)
                ctx.lineTo(c.x + r2, c.y + r2 + s2)
                ctx.lineTo(c.x + r2 + s2, c.y + r2)
                ctx.lineTo(c.x + r2, c.y + r2 - s2)
                ctx.fill()
            } else if (shape === 'triangle_up') {
                const dr2 = (size - resolution) / 2
                ctx.beginPath()
                ctx.moveTo(c.x - dr2, c.y - dr2)
                ctx.lineTo(c.x + r2, c.y + resolution + dr2)
                ctx.lineTo(c.x + resolution + dr2, c.y - dr2)
                ctx.fill()
            } else if (shape === 'triangle_down') {
                const dr2 = (size - resolution) / 2
                ctx.beginPath()
                ctx.moveTo(c.x - dr2, c.y + resolution + dr2)
                ctx.lineTo(c.x + r2, c.y - dr2)
                ctx.lineTo(c.x + resolution + dr2, c.y + resolution + dr2)
                ctx.fill()
            } else if (shape === 'triangle_left') {
                const dr2 = (size - resolution) / 2
                ctx.beginPath()
                ctx.moveTo(c.x + resolution + dr2, c.y + resolution + dr2)
                ctx.lineTo(c.x - dr2, c.y + r2)
                ctx.lineTo(c.x + resolution + dr2, c.y - dr2)
                ctx.fill()
            } else if (shape === 'triangle_right') {
                const dr2 = (size - resolution) / 2
                ctx.beginPath()
                ctx.moveTo(c.x - dr2, c.y - dr2)
                ctx.lineTo(c.x + resolution + dr2, c.y + r2)
                ctx.lineTo(c.x - dr2, c.y + resolution + dr2)
                ctx.fill()
            } else {
                throw new Error('Unexpected shape:' + shape)
            }
        }

        //update legends
        this.updateLegends({ viewScale: viewScale, resolution: resolution, z: z, cells: cells })
    }
}
