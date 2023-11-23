//@ts-check
'use strict'

import { Style } from '../Style.js'

/**
 * A very generic style that shows grid cells with specific color, size and shape.
 * It can be used to show variables as cell colors, cell size, cell shape, or any combination of the three visual variables.
 *
 * @author Joseph Davies, Julien Gaffuri
 */
export class ShapeColorSizeStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the view scale.
         * @type {function(Array.<import('../Dataset.js').Cell>,number, number):object} */
        this.viewScale = opts.viewScale //(cells,r,z) => {}

        /** A function returning the color of the cell.
         * @type {function(import('../Dataset.js').Cell,number, number,object):string} */
        this.color = opts.color || (() => "#EA6BAC") //(c,r,z,vs) => {}

        /** A function returning the size of a cell in geographical unit.
         * @type {function(import('../Dataset.js').Cell,number, number,object):number} */
        this.size = opts.size || ((c,r) => r) //(c,r,z,vs) => {}

        /** A function returning the shape of a cell.
         * @type {function(import("../Dataset.js").Cell,number, number,object):import("../Style.js").Shape} */
        this.shape = opts.shape || (() => "square") //(c,r,z,vs) => {}
    }

    /**
     * Draw cells as squares, with various colors and sizes.
     */
    draw(cells, canvas, resolution, view) {
        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //zoom
        const z = view.z

        //get view scale
        const vs = this.viewScale ? this.viewScale(cells, resolution, z) : undefined

        const r2 = resolution * 0.5
        for (let c of cells) {
            //color
            let col = this.color ? this.color(c, resolution, z, vs) : "black"
            if (!col || col === 'none') continue

            //size
            const size = this.size ? this.size(c, resolution, z, vs) : resolution
            if (!size) continue

            //shape
            const shape = this.shape ? this.shape(c, resolution, z, vs) : 'square'
            if (shape === 'none') continue

            //get offset
            const offset = this.offset(c, resolution, z)

            canvas.ctx.fillStyle = col
            if (shape === 'square') {
                //draw square
                const d = resolution * (1 - size / resolution) * 0.5
                canvas.ctx.fillRect(c.x + d + offset.dx, c.y + d + offset.dy, size, size)
            } else if (shape === 'circle') {
                //draw circle
                canvas.ctx.beginPath()
                canvas.ctx.arc(c.x + r2 + offset.dx, c.y + r2 + offset.dy, size * 0.5, 0, 2 * Math.PI, false)
                canvas.ctx.fill()
            } else if (shape === 'donut') {
                //draw donut
                const xc = c.x + r2 + offset.dx,
                    yc = c.y + r2 + offset.dy
                canvas.ctx.beginPath()
                canvas.ctx.moveTo(xc, yc)
                canvas.ctx.arc(xc, yc, r2, 0, 2 * Math.PI)
                canvas.ctx.arc(xc, yc, (1 - size / resolution) * r2, 0, 2 * Math.PI, true)
                canvas.ctx.closePath()
                canvas.ctx.fill()
            } else if (shape === 'diamond') {
                const s2 = size * 0.5
                canvas.ctx.beginPath()
                canvas.ctx.moveTo(c.x + r2 - s2, c.y + r2)
                canvas.ctx.lineTo(c.x + r2, c.y + r2 + s2)
                canvas.ctx.lineTo(c.x + r2 + s2, c.y + r2)
                canvas.ctx.lineTo(c.x + r2, c.y + r2 - s2)
                canvas.ctx.fill()
            } else {
                throw new Error('Unexpected shape:' + shape)
            }
        }

        //update legends
        this.updateLegends({ style: this, r: resolution, zf: z, viewScale: vs })
    }
}
