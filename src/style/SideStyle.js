//@ts-check
'use strict'

import { Style } from '../Style.js'

/** @typedef {{x:number,y:number,or:"v"|"h",value:number}} Side */

/**
 *
 * @author Julien Gaffuri
 */
export class SideStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** The name of the column/attribute of the tabular data where to retrieve the variable for the cell values.
         * @type {string} */
        this.valueCol = opts.valueCol

        /** A function returning the value of a cell side. This value is computed from the two adjacent cell values.
         * For horizontal sides, v1 is the value of the cell below and v2 the value of the cell above.
         * For vertical sides, v1 is the value of the cell left and v2 the value of the cell right.
         * @type {function(number|undefined,number|undefined,number,import("../Style").Stat|undefined,number):number} */
        this.value = opts.value || ((v1, v2, r, s, zf) => 1)

        /** A function returning the color of a cell side.
         * @type {function(Side,number,import("../Style").Stat|undefined,number):string} */
        this.color = opts.color || (() => '#EA6BAC')

        /** A function returning the width of a cell side, in geo unit
         * @type {function(Side,number,import("../Style").Stat|undefined,number):number} */
        this.width = opts.width || ((side, r, s, zf) => (r * side.value) / 5)

        /** orientation. Set to 90 to show sides as slope lines for example.
         * @type {number} */
        this.orientation = opts.orientation || 0

        /** A fill color for the cells.
         * @type {function(import("../Dataset").Cell):string} */
        this.fillColor = opts.fillColor
    }

    /**
     * @param {Array.<import("../Dataset").Cell>} cells
     * @param {number} r
     * @param {import("../GeoCanvas").GeoCanvas} cg
     */
    draw(cells, r, cg) {
        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //zoom factor
        const zf = cg.getZf()

        //compute stats on cell values
        let statValue
        if (this.valueCol) {
            //compute color variable statistics
            statValue = Style.getStatistics(cells, (c) => c[this.valueCol], true)
        }

        /**  @type {Array.<Side>} */
        const sides = []

        //make horizontal sides
        //sort cells by x and y
        cells.sort((c1, c2) => (c2.x == c1.x ? c1.y - c2.y : c1.x - c2.x))
        let c1 = cells[0]
        for (let i = 1; i < cells.length; i++) {
            let c2 = cells[i]

            if ((c1.y + r == c2.y) && (c1.x == c2.x))
                //cells in same column and touch along horizontal side
                //make shared side
                sides.push({
                    x: c1.x,
                    y: c2.y,
                    or: 'h',
                    value: this.value(c1[this.valueCol], c2[this.valueCol], r, statValue, zf),
                })
            else {
                //cells do not touch along horizontal side
                //make two sides: top one for c1, bottom for c2
                sides.push({
                    x: c1.x,
                    y: c1.y + r,
                    or: 'h',
                    value: this.value(c1[this.valueCol], undefined, r, statValue, zf),
                })
                sides.push({
                    x: c2.x,
                    y: c2.y,
                    or: 'h',
                    value: this.value(undefined, c2[this.valueCol], r, statValue, zf),
                })
            }

            c1 = c2
        }

        //make vertical sides
        //sort cells by y and x
        cells.sort((c1, c2) => (c2.y == c1.y ? c1.x - c2.x : c1.y - c2.y))
        c1 = cells[0]
        for (let i = 1; i < cells.length; i++) {
            let c2 = cells[i]

            if ((c1.x + r == c2.x) && (c1.y == c2.y))
                //cells in same row and touch along vertical side
                //make shared side
                sides.push({
                    x: c1.x + r,
                    y: c1.y,
                    or: 'v',
                    value: this.value(c1[this.valueCol], c2[this.valueCol], r, statValue, zf),
                })
            else {
                //cells do not touch along vertical side
                //make two sides: right one for c1, left for c2
                sides.push({
                    x: c1.x + r,
                    y: c1.y,
                    or: 'v',
                    value: this.value(c1[this.valueCol], undefined, r, statValue, zf),
                })
                sides.push({
                    x: c2.x,
                    y: c2.y,
                    or: 'v',
                    value: this.value(undefined, c2[this.valueCol], r, statValue, zf),
                })
            }

            c1 = c2
        }

        //
        if (sides.length == 0) return

        //compute stats on sides
        const statSides = SideStyle.getSideStatistics(sides, true)

        //draw in geo coordinates
        cg.setCanvasTransform()

        //draw cells, if fillColor specified
        if (this.fillColor)
            for (let c of cells) {
                const fc = this.fillColor(c)
                if (!fc || fc == 'none') continue
                cg.ctx.fillStyle = fc
                cg.ctx.fillRect(c.x, c.y, r, r)
            }

        //draw sides
        cg.ctx.lineCap = 'butt'
        const r2 = r / 2
        for (let s of sides) {
            //color
            /** @type {string|undefined} */
            const col = this.color ? this.color(s, r, statSides, zf) : undefined
            if (!col || col == 'none') continue

            //width
            /** @type {number|undefined} */
            const wG = this.width ? this.width(s, r, statSides, zf) : undefined
            if (!wG || wG <= 0) continue

            //set color and width
            cg.ctx.strokeStyle = col
            cg.ctx.lineWidth = wG

            //draw segment with correct orientation
            cg.ctx.beginPath()
            if (this.orientation == 90) {
                cg.ctx.moveTo(s.x + r2, s.y + r2)
                if (s.or === 'h') cg.ctx.lineTo(s.x + r2, s.y - r2)
                else cg.ctx.lineTo(s.x - r2, s.y + r2)
            } else {
                cg.ctx.moveTo(s.x, s.y)
                cg.ctx.lineTo(s.x + (s.or === 'h' ? r : 0), s.y + (s.or === 'v' ? r : 0))
            }
            cg.ctx.stroke()
        }

        //update legends
        this.updateLegends({ style: this, r: r, zf: zf })
    }

    /**
     * Compute some statistics on a value of some sides.
     * This is used to define how to draw specifically the sides within the view.
     *
     * @param {Array.<Side>} sides
     * @param {boolean} ignoreZeros
     * @returns {import("../Style").Stat | undefined}
     */
    static getSideStatistics(sides, ignoreZeros) {
        if (!sides || sides.length == 0) return undefined
        let min = Infinity
        let max = -Infinity
        //let sum = 0
        //let nb = 0
        for (const s of sides) {
            const v = s.value
            if (ignoreZeros && !v) continue
            if (v < min) min = v
            if (v > max) max = v
            //sum += v
            //nb++
        }
        return { min: min, max: max }
    }
}
