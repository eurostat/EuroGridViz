//@ts-check
'use strict'

import { Style } from '../Style.js'

/**
 *
 * @author Joseph Davies, Julien Gaffuri
 */
export class NinjaStarStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** The name of the column/attribute of the tabular data where to retrieve the variable for color.
         * @type {string} */
        this.colorCol = opts.colorCol

        /** A function returning the color of the cell.
         * @type {function(number,number,import("../Style").Stat|undefined,number):string} */
        this.color = opts.color || (() => '#EA6BAC') //(v,r,s,zf) => {}

        /** The name of the column/attribute of the tabular data where to retrieve the variable for size.
         * @type {string} */
        this.sizeCol = opts.sizeCol

        /** A function returning the size of a cell, within [0,1]:
         *  - 0, nothing shown
         *  - 1, entire square
         * @type {function(number,number,import("../Style").Stat|undefined,number):number} */
        this.size = opts.size

        /** A function returning the shape.
         * @type {function(import("../Dataset").Cell):string} */
        this.shape = opts.shape || (() => 'o')
    }

    /**
     *
     * @param {Array.<import("../Dataset").Cell>} cells
     * @param {number} r
     * @param {import("../GeoCanvas").GeoCanvas} cg
     */
    draw(cells, r, cg) {
        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //zoom factor
        const zf = cg.getZf()

        let statSize
        if (this.sizeCol) {
            //if size is used, sort cells by size so that the biggest are drawn first
            cells.sort((c1, c2) => c2[this.sizeCol] - c1[this.sizeCol])
            //and compute size variable statistics
            statSize = Style.getStatistics(cells, (c) => c[this.sizeCol], true)
        }

        let statColor
        if (this.colorCol) {
            //compute color variable statistics
            statColor = Style.getStatistics(cells, (c) => c[this.colorCol], true)
        }

        //draw with HTML canvas
        //in geo coordinates
        cg.setCanvasTransform()

        const r2 = r * 0.5
        for (let cell of cells) {
            //color
            const col = this.color ? this.color(cell[this.colorCol], r, statColor, zf) : undefined
            if (!col || col === 'none') continue
            cg.ctx.fillStyle = col

            //shape
            const shape = this.shape ? this.shape(cell) : 'o'
            if (shape === 'none') continue

            //size
            /** @type {function(number,number,import("../Style").Stat|undefined,number):number} */
            let s_ = this.size || (() => 0.5)
            //size - in geo unit
            const sG2 = s_(cell[this.sizeCol], r, statSize, zf) * r2

            //get offset
            //TODO use
            //const offset = this.offset(cell, r, zf)

            //center position
            const cx = cell.x + r2
            const cy = cell.y + r2

            if (shape === 'p') {
                cg.ctx.beginPath()
                cg.ctx.moveTo(cx, cy + r2)
                cg.ctx.lineTo(cx + sG2, cy + sG2)
                cg.ctx.lineTo(cx + r2, cy)
                cg.ctx.lineTo(cx + sG2, cy - sG2)
                cg.ctx.lineTo(cx, cy - r2)
                cg.ctx.lineTo(cx - sG2, cy - sG2)
                cg.ctx.lineTo(cx - r2, cy)
                cg.ctx.lineTo(cx - sG2, cy + sG2)
                cg.ctx.fill()
            } else if (shape === 'o') {
                cg.ctx.beginPath()
                cg.ctx.moveTo(cx, cy + sG2)
                cg.ctx.lineTo(cx + r2, cy + r2)
                cg.ctx.lineTo(cx + sG2, cy)
                cg.ctx.lineTo(cx + r2, cy - r2)
                cg.ctx.lineTo(cx, cy - sG2)
                cg.ctx.lineTo(cx - r2, cy - r2)
                cg.ctx.lineTo(cx - sG2, cy)
                cg.ctx.lineTo(cx - r2, cy + r2)
                cg.ctx.fill()
            } else {
                throw new Error('Unexpected shape:' + shape)
            }
        }

        //update legends
        this.updateLegends({ style: this, r: r, zf: zf, sSize: statSize, sColor: statColor })
    }
}
