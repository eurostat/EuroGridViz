//@ts-check
'use strict'

import { Style } from '../Style.js'

/**
 * A very generic style that shows grid cells with specific color, size and shape.
 * It can be used to show variables as cell colors, cell size, cell shape, or any combination of the three visual variables.
 *
 * @author Joseph Davies, Julien Gaffuri
 */
export class ShapeColorSizeStyle_ extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the view scale.
         * @type {function(Array.<import('../Dataset.js').Cell>,number, number):object} */
        this.viewScale = opts.viewScale //(cells,r,z) => {}

        /** A function returning the color of the cell.
         * @type {function(import('../Dataset.js').Cell,number, number,object):string} */
        this.color = opts.color //(c,r,z,o) => {}

        /** A function returning the size of a cell in geographical unit.
         * @type {function(import('../Dataset.js').Cell,number, number,object):number} */
        this.size = opts.size //(c,r,z,o) => {}

        /** A function returning the shape of a cell.
         * @type {function(import("../Dataset.js").Cell,number, number,object):import("../Style.js").Shape} */
        this.shape = opts.shape //(c,r,z,o) => {}
    }

    /**
     * Draw cells as squares, with various colors and sizes.
     *
     * @param {Array.<import("../Dataset.js").Cell>} cells
     * @param {number} r
     * @param {import("../GeoCanvas.js").GeoCanvas} cg
     */
    draw(cells, r, cg) {
        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //zoom factor
        const zf = cg.getZf()

        //get view scale
        const vc = this.viewScale ? this.viewScale(cells, r, zf) : undefined

        //draw with HTML canvas in geo coordinates
        cg.setCanvasTransform()

        const r2 = r * 0.5
        for (let c of cells) {
            //color
            let col = this.color ? this.color(c, r, zf, vc) : "black"
            if (!col || col === 'none') continue

            //size
            const size = this.size ? this.size(c, r, zf, vc) : r
            if (!size) continue

            //shape
            const shape = this.shape ? this.shape(c, r, zf, vc) : 'square'
            if (shape === 'none') continue

            //get offset
            const offset = this.offset(c, r, zf)

            cg.ctx.fillStyle = col
            if (shape === 'square') {
                //draw square
                const d = r * (1 - size / r) * 0.5
                cg.ctx.fillRect(c.x + d + offset.dx, c.y + d + offset.dy, size, size)
            } else if (shape === 'circle') {
                //draw circle
                cg.ctx.beginPath()
                cg.ctx.arc(c.x + r2 + offset.dx, c.y + r2 + offset.dy, size * 0.5, 0, 2 * Math.PI, false)
                cg.ctx.fill()
            } else if (shape === 'donut') {
                //draw donut
                const xc = c.x + r2 + offset.dx,
                    yc = c.y + r2 + offset.dy
                cg.ctx.beginPath()
                cg.ctx.moveTo(xc, yc)
                cg.ctx.arc(xc, yc, r2, 0, 2 * Math.PI)
                cg.ctx.arc(xc, yc, (1 - size / r) * r2, 0, 2 * Math.PI, true)
                cg.ctx.closePath()
                cg.ctx.fill()
            } else if (shape === 'diamond') {
                const s2 = size * 0.5
                cg.ctx.beginPath()
                cg.ctx.moveTo(c.x + r2 - s2, c.y + r2)
                cg.ctx.lineTo(c.x + r2, c.y + r2 + s2)
                cg.ctx.lineTo(c.x + r2 + s2, c.y + r2)
                cg.ctx.lineTo(c.x + r2, c.y + r2 - s2)
                cg.ctx.fill()
            } else {
                throw new Error('Unexpected shape:' + shape)
            }
        }

        //update legends
        this.updateLegends({ style: this, r: r, zf: zf, viewScale: vc })
    }
}
