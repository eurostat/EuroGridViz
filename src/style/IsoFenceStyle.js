//@ts-check
'use strict'

import { Style } from '../core/Style.js'
import { SideStyle } from './SideStyle.js'

/** @typedef {{x:number,y:number,or:"v"|"h",c1:import('../core/Dataset.js').Cell|undefined,c2:import('../core/Dataset.js').Cell|undefined}} Side */

/**
 * @module style
 * @author Julien Gaffuri
 */
export class IsoFenceStyle extends Style {

    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /**
         * The dictionary (string -> color) which give the color of each category.
         * @type {object} */
        this.color = opts.color

        /** A function returning the height of a cell in geographical unit.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.height = opts.height || ((cell, resolution, z, viewScale) => resolution * 0.4)

        /** The perspective angle, in degree, within [-180,180], from [O,x] axis.
         * @type {number} */
        this.angle = opts.angle != undefined ? opts.angle : 50

        /** A function returning the corner line stroke style.
         * @type {function(import('../core/Dataset.js').Cell,number,number,number):string} */
        this.cornerLineStrokeColor = opts.cornerLineStrokeColor || ((c, r, z, angle) => "#999")

        /** A function returning the corner line width.
        * @type {function(import('../core/Dataset.js').Cell,number,number,number):number} */
        this.cornerLineWidth = opts.cornerLineWidth || ((c, r, z, angle) => (angle % 90 == 0 ? 0 : 0.8 * z))

        /**
        * Show vertical cross-sections.
        * @type {boolean} */
        this.sVert = opts.sVert != undefined ? opts.sVert : true

        /**
        * Show horizontal cross-sections.
        * @type {boolean} */
        this.sHor = opts.sHor != undefined ? opts.sHor : true
    }

    /**
     * @param {Array.<import("../core/Dataset.js").Cell>} cells
     * @param {import("../core/GeoCanvas.js").GeoCanvas} geoCanvas
     * @param {number} resolution
     * @override
     */
    draw(cells, geoCanvas, resolution) {

        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //
        const z = geoCanvas.view.z

        //get view scale
        const viewScale = this.viewScale ? this.viewScale(cells, resolution, z) : undefined

        //nb categories - used for radar and agepyramid
        const cats = Object.keys(this.color)

        //half resolution
        const r2 = resolution / 2

        //get offset
        // @ts-ignore
        const offset = this.offset(undefined, resolution, z), dx = offset.dx, dy = offset.dy

        //make sides
        /**  @type {Array.<Side>} */
        const sides = SideStyle.buildSides(cells, resolution, this.angle % 180 != 90 && this.sVert, this.angle % 180 != 0 && this.sHor, true)



        /*const sides = []

        //make horizontal sides - except when angle%180=0
        //sort cells by x and y
        if (this.angle % 180 != 90 && this.sVert) {
            cells.sort((c1, c2) => (c2.x == c1.x ? c1.y - c2.y : c1.x - c2.x))
            let c1 = cells[0]
            for (let i = 1; i < cells.length; i++) {
                let c2 = cells[i]

                if ((c1.y + resolution == c2.y) && (c1.x == c2.x))
                    //cells in same column and touch along horizontal side
                    //make shared side
                    sides.push({ x: c1.x + r2, y: c2.y, or: 'h', c1: c1, c2: c2 })
                else {
                    //cells do not touch along horizontal side
                    //make two sides: top one for c1, bottom for c2
                    sides.push({ x: c1.x + r2, y: c1.y + resolution, or: 'h', c1: c1, c2: undefined })
                    sides.push({ x: c2.x + r2, y: c2.y, or: 'h', c1: undefined, c2: c2 })
                }

                c1 = c2
            }
        }

        //make vertical sides - except when angle%180=90
        //sort cells by y and x
        if (this.angle % 180 != 0 && this.sHor) {
            cells.sort((c1, c2) => (c2.y == c1.y ? c1.x - c2.x : c1.y - c2.y))
            let c1 = cells[0]
            for (let i = 1; i < cells.length; i++) {
                let c2 = cells[i]

                if ((c1.x + resolution == c2.x) && (c1.y == c2.y))
                    //cells in same row and touch along vertical side
                    //make shared side
                    sides.push({ x: c2.x, y: c1.y + r2, or: 'v', c1: c1, c2: c2 })
                else {
                    //cells do not touch along vertical side
                    //make two sides: right one for c1, left for c2
                    sides.push({ x: c1.x + resolution, y: c1.y + r2, or: 'v', c1: c1, c2: undefined })
                    sides.push({ x: c2.x, y: c2.y + r2, or: 'v', c1: undefined, c2: c2 })
                }

                c1 = c2
            }
        }*/

        //
        if (sides.length == 0) return

        //angle in radians
        const aRad = this.angle * Math.PI / 180, cos = Math.cos(aRad), sin = Math.sin(aRad)

        //sort sides so that the back ones are drawn first. This depends on the angle.
        //depending on distance to the reference corner point
        const xCorner = Math.abs(this.angle) < 90 ? geoCanvas.extGeo.xMin : geoCanvas.extGeo.xMax
        const yCorner = this.angle < 0 ? geoCanvas.extGeo.yMax : geoCanvas.extGeo.yMin
        sides.sort((s1, s2) => (Math.hypot(s2.x - xCorner, s2.y - yCorner) - Math.hypot(s1.x - xCorner, s1.y - yCorner)))

        //prepare function to draw corner line for a cell *c*
        const drawCornerLine = (cell) => {

            if (!cell) return
            //line style
            const lw = this.cornerLineWidth ? this.cornerLineWidth(cell, resolution, z, this.angle) : 0.8 * z
            if (lw == 0) return
            geoCanvas.ctx.strokeStyle = this.cornerLineStrokeColor ? this.cornerLineStrokeColor(cell, resolution, z, this.angle) : "#333"
            geoCanvas.ctx.lineWidth = lw

            //height - in geo
            const hG = this.height(cell, resolution, z, viewScale)

            //draw line
            geoCanvas.ctx.beginPath()
            geoCanvas.ctx.moveTo(cell.x + r2 + dx, cell.y + r2 + dy)
            geoCanvas.ctx.lineTo(cell.x + r2 + hG * cos + dx, cell.y + r2 + hG * sin + dy)
            geoCanvas.ctx.stroke()
        }

        //draw sides
        geoCanvas.ctx.lineCap = "round";
        for (let s of sides) {

            //heights - in geo
            const hG1 = s.c1 ? this.height(s.c1, resolution, z, viewScale) : 0,
                hG2 = s.c2 ? this.height(s.c2, resolution, z, viewScale) : 0

            //compute totals for both cells
            const total1 = computeTotal(s.c1, cats),
                total2 = computeTotal(s.c2, cats)
            if (total1 == 0 && total2 == 0) continue

            let cumul1 = 0, cumul2 = 0
            for (let [column, color] of Object.entries(this.color)) {
                //draw stripe of side s and category column

                //get values for both cells
                let v1 = s.c1 ? +s.c1[column] : 0
                let v2 = s.c2 ? +s.c2[column] : 0
                if (v1 == 0 && v2 == 0) continue

                //compute heights
                const h1 = hG1 * cumul1 / total1 || 0
                const h1n = hG1 * (cumul1 + v1) / total1 || 0
                const h2 = hG2 * cumul2 / total2 || 0
                const h2n = hG2 * (cumul2 + v2) / total2 || 0

                //make path
                geoCanvas.ctx.beginPath()
                if (s.or == "h") {
                    //horizontal side - vertical section
                    //bottom left
                    geoCanvas.ctx.moveTo(s.x + h1 * cos + dx, s.y - r2 + h1 * sin + dy)
                    //top left
                    geoCanvas.ctx.lineTo(s.x + h2 * cos + dx, s.y + r2 + h2 * sin + dy)
                    //top right
                    geoCanvas.ctx.lineTo(s.x + h2n * cos + dx, s.y + r2 + h2n * sin + dy)
                    //bottom right
                    geoCanvas.ctx.lineTo(s.x + h1n * cos + dx, s.y - r2 + h1n * sin + dy)
                } else {
                    //vertical side - horizontal section
                    //bottom left
                    geoCanvas.ctx.moveTo(s.x - r2 + h1 * cos + dx, s.y + h1 * sin + dy)
                    //bottom right
                    geoCanvas.ctx.lineTo(s.x + r2 + h2 * cos + dx, s.y + h2 * sin + dy)
                    //top right
                    geoCanvas.ctx.lineTo(s.x + r2 + h2n * cos + dx, s.y + h2n * sin + dy)
                    //top left
                    geoCanvas.ctx.lineTo(s.x - r2 + h1n * cos + dx, s.y + h1n * sin + dy)
                }
                //cg.ctx.closePath()

                //fill
                geoCanvas.ctx.fillStyle = color
                geoCanvas.ctx.fill()

                cumul1 += v1
                cumul2 += v2

                //TODO draw only one line
                //draw corner line
                //if (s.or == "h") {
                drawCornerLine(s.c1)
                drawCornerLine(s.c2)
                //if (this.angle > 0 && s.or == "h") drawCornerLine(s.c2)
                //else drawCornerLine(s.c2)
                //}
            }
        }

        //update legends
        this.updateLegends({ style: this, resolution: resolution, z: z, viewScale: viewScale })
    }
}



const computeTotal = (cell, categories) => {
    if (!cell) return 0
    let total = 0
    for (let column of categories) {
        const v = cell[column]
        if (!v) continue
        total += +v
    }
    return total || 0
}
