//@ts-check
'use strict'

import { Style } from '../Style.js'

/** @typedef {"first"|"bottom"|"center"|"top"|"last"} AnchorModeYEnum */

/**
 * Show cell as timeseries chart
 * Can be used for sparkline map of https://datagistips.hypotheses.org/488
 *
 * @author Julien Gaffuri
 */
export class TimeSeriesStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** The columns of the time series, ordered in chronological order.
         * @type {Array.<string>} */
        this.ts = opts.ts

        /** A function specifying when a value should be considered as "no data" and thus not ignored. The line will have a break at these values.
         * @type {function(string):boolean} */
        this.noData = opts.noData || ((v) => v === undefined || v == "" || v === null || isNaN(+v))

        //x
        /** in geo unit
         * @type {function(import("../Dataset.js").Cell,number,number):number} */
        this.offsetX = opts.offsetX || ((c, r, zf) => 0)
        /** @type {function(import("../Dataset.js").Cell,number,number):number} */
        this.width = opts.width || ((c, r, zf) => r)

        //y
        /** in geo unit
         * @type {function(import("../Dataset.js").Cell,number,number):number} */
        this.offsetY = opts.offsetY || ((c, r, zf) => 0)
        /** @type {function(import("../Dataset.js").Cell,number,number):number} */
        this.height = opts.height || ((c, r, zf) => r)
        /** @type {function(import("../Dataset.js").Cell,number,number):AnchorModeYEnum} */
        this.anchorModeY = opts.anchorModeY || ((c, r, zf) => "center")


        /**
         * @type {string} */
        this.lineWidthCol = opts.lineWidthCol

        /** A function returning the width of the line, in geo unit
         * @type {function(number,number,import("../Style.js").Stat|undefined,number):number} */
        this.lineWidth = opts.lineWidth || ((v, r, s, zf) => 1.5 * zf)

        /**
         * @type {string} */
        this.colorCol = opts.colorCol

        /** A function returning the color of the cell.
         * @type {function(number,number,import("../Style.js").Stat|undefined,number):string} */
        this.color = opts.color || ((v, r, s, zf) => 'black')

    }

    /**
     * Draw cells as text.
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

        let statWidth
        if (this.lineWidthCol) {
            //and compute size variable statistics
            statWidth = Style.getStatistics(cells, (c) => c[this.lineWidthCol], true)
        }

        let statColor
        if (this.colorCol) {
            //compute color variable statistics
            statColor = Style.getStatistics(cells, (c) => c[this.colorCol], true)
        }

        //compute cell amplitude
        const getAmplitude = c => {
            let min, max
            for (let t of this.ts) {
                const val = c[t];
                if (val == undefined) continue
                if (min == undefined || val < min) min = val
                if (max == undefined || val > max) max = val
            }
            if (min == undefined) return undefined
            return max - min
        }

        //compute max amplitude
        let ampMax
        for (let c of cells) {
            const amp = getAmplitude(c)
            if (amp == undefined) continue
            if (ampMax == undefined || amp > ampMax) ampMax = amp
        }
        if (!ampMax) return

        const nb = this.ts.length

        //draw with HTML canvas
        //in geo coordinates
        cg.setCanvasTransform()

        cg.ctx.lineCap = "butt"
        for (let c of cells) {

            //line width
            /** @type {number|undefined} */
            const wG = this.lineWidth ? this.lineWidth(c[this.lineWidthCol], r, statWidth, zf) : undefined
            if (!wG || wG < 0) continue

            //line color
            /** @type {string|undefined} */
            const col = this.color ? this.color(c[this.colorCol], r, statColor, zf) : undefined
            if (!col) continue


            //x
            const offX = this.offsetX ? this.offsetX(c, r, zf) : 0
            if (offX == undefined || isNaN(offX)) continue
            const w = this.width ? this.width(c, r, zf) : r
            if (w == undefined || isNaN(w)) continue

            //y
            const offY = this.offsetY ? this.offsetY(c, r, zf) : 0
            if (offY == undefined || isNaN(offY)) continue
            const h = this.height ? this.height(c, r, zf) : r
            if (h == undefined || isNaN(h)) continue
            const anchY = this.anchorModeY ? this.anchorModeY(c, r, zf) : "center"
            if (!anchY) continue

            cg.ctx.lineWidth = wG
            cg.ctx.strokeStyle = col

            //compute anchor Y figures
            let val0, y0
            if (anchY === "first") {
                //get first value
                val0 = c[this.ts[0]]
                y0 = 0
            } else if (anchY === "last") {
                //get last value
                val0 = c[this.ts[this.ts.length - 1]]
                y0 = 0
            } else if (anchY === "bottom") {
                //get min
                for (let t of this.ts) {
                    const val = +c[t];
                    if (val == undefined) continue
                    if (val0 == undefined || val < val0) val0 = val
                }
                y0 = 0
            } else if (anchY === "top") {
                //get max
                for (let t of this.ts) {
                    const val = +c[t];
                    if (val == undefined) continue
                    if (val0 == undefined || val > val0) val0 = val
                }
                y0 = r
            } else if (anchY === "center") {
                //get min and max
                let min, max
                for (let t of this.ts) {
                    const val = c[t];
                    if (val == undefined) continue
                    if (min == undefined || val < min) min = val
                    if (max == undefined || val > max) max = val
                }
                val0 = (+max + +min) * 0.5
                y0 = r / 2
            } else {
                console.log("Unexpected anchorModeY: " + anchY)
                continue;
            }

            /*/draw line
            if (val0 == undefined || isNaN(val0)) continue
            cg.ctx.beginPath()
            const sX = w / (nb - 1)
            for (let i = 0; i < nb; i++) {
                const val = c[this.ts[i]]
                if (val == undefined || isNaN(val)) break
                if (i == 0)
                    cg.ctx.moveTo(c.x + i * sX + offX, c.y + y0 + (val - val0) * h / ampMax + offY)
                else
                    cg.ctx.lineTo(c.x + i * sX + offX, c.y + y0 + (val - val0) * h / ampMax + offY)
            }
            cg.ctx.stroke()*/


            //draw line, segment by segment
            const sX = w / (nb - 1)

            //handle first point
            let v0 = c[this.ts[0]]
            if (!this.noData(v0)) {
                cg.ctx.beginPath()
                cg.ctx.moveTo(c.x + offX, c.y + y0 + (v0 - val0) * h / ampMax + offY)
            }
            //console.log(v0, isNaN(v0))

            let v1
            for (let i = 1; i < nb; i++) {
                v1 = c[this.ts[i]]

                //draw segment from v0 to v1

                //both points 'no data'
                if (this.noData(v0) && this.noData(v1)) {

                    //second point 'no data'
                } else if (!this.noData(v0) && this.noData(v1)) {
                    cg.ctx.stroke()

                    //first point 'no data'
                } else if (this.noData(v0) && !this.noData(v1)) {
                    cg.ctx.beginPath()
                    cg.ctx.moveTo(c.x + i * sX + offX, c.y + y0 + (v1 - val0) * h / ampMax + offY)

                    //both points have data: trace line
                } else {
                    cg.ctx.lineTo(c.x + i * sX + offX, c.y + y0 + (v1 - val0) * h / ampMax + offY)
                    //if it is the last point, stroke
                    if (i == nb - 1) cg.ctx.stroke()
                }
                v0 = v1
            }

        }

        //update legend, if any
        this.updateLegends({
            widthFun: this.lineWidth,
            r: r,
            zf: zf,
            sColor: statColor,
            //sLength: statLength,
            sWidth: statWidth,
        })

    }

}

