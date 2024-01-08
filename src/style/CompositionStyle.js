//@ts-check
'use strict'

import { Style } from '../core/Style.js'

/** @typedef {"flag"|"piechart"|"ring"|"segment"|"radar"|"agepyramid"|"halftone"} CompositionType */

/**
 * A style showing the composition of a total in different categories, with different color hues.
 * It consists of a symbol with different parts, whose size reflect the proportion of the corresponding category.
 * For a list of supported symbols, @see CompositionType
 * The symbol can be scaled depending on the cell importance.
 *
 * @module style
 * @author Julien Gaffuri
 */
export class CompositionStyle extends Style {
    /** @param {object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /**
         * The dictionary (string -> color) which give the color of each category.
         * @type {object} */
        this.color = opts.color

        /**
         * A function returning the type of decomposition symbol of a cell, @see CompositionType
         * @type {function(import("../core/Dataset.js").Cell,number, number,object):CompositionType} */
        this.type = opts.type || (() => "flag") //(c,r,z,vs) => {}

        /** A function returning the size of a cell in geographical unit.
         * @type {function(import('../core/Dataset.js').Cell, number, number, object):number} */
        this.size = opts.size || ((c, r) => r) //(c,r,z,vs) => {}

        /** For style types with stripes (flag, segment), the orientation of the stripes (0 for horizontal, other for vertical).
         * @type {function(import("../core/Dataset.js").Cell,number,number,object):number} */
        this.stripesOrientation = opts.stripesOrientation || (() => 0) //(c,r,z,vs) => ...

        /** The function specifying an offset angle for a radar, halftone or pie chart style.
         * The angle is specified in degree. The rotation is anti-clockwise.
         * @type {function(import("../core/Dataset.js").Cell,number,number,object):number} */
        this.offsetAngle = opts.offsetAngle || (() => 0) //(c,r,z,vs) => ...

        /** The function specifying the height of the age pyramid, in geo unit.
         * @type {function(import("../core/Dataset.js").Cell,number,number,object):number} */
        this.agePyramidHeight = opts.agePyramidHeight || ((c, r) => r) //(c,r,z,vs) => ...

        /** For pie chart, this is parameter for internal radius, so that the pie chart looks like a donut.
         * 0 for normal pie charts, 0.5 to empty half of the radius.
         * @type {number} */
        this.pieChartInternalRadiusFactor = opts.pieChartInternalRadiusFactor || 0
    }

    /**
     * Draw cells as squares depending on their value.
     *
     * @param {Array.<import("../core/Dataset.js").Cell>} cells
     * @param {import("../core/GeoCanvas.js").GeoCanvas} geoCanvas
     * @param {number} resolution
     */
    draw(cells, geoCanvas, resolution) {

        //filter
        if (this.filter) cells = cells.filter(this.filter)

        //
        const z = geoCanvas.view.z

        //get view scale
        const viewScale = this.viewScale ? this.viewScale(cells, resolution, z) : undefined

        //nb categories - used for radar and agepyramid
        const nbCat = Object.entries(this.color).length

        //draw calls
        for (let cell of cells) {

            //size
            const sG = this.size ? this.size(cell, resolution, z, viewScale) : resolution
            if (!sG) continue

            //get offset
            const offset = this.offset(cell, resolution, z)

            //get symbol type
            const type_ = this.type ? this.type(cell, resolution, z, viewScale) : 'flag'

            //compute center position
            const xc = cell.x + offset.dx + (type_ === 'agepyramid' ? 0 : resolution * 0.5)
            const yc = cell.y + offset.dy + (type_ === 'agepyramid' ? 0 : resolution * 0.5)

            //compute offset angle, when relevant
            const offAng = this.offsetAngle ? (this.offsetAngle(cell, resolution, z, viewScale) * Math.PI) / 180 : 0

            if (type_ === 'agepyramid' || type_ === 'radar' || type_ === 'halftone') {
                //get cell category max value
                let maxVal = -Infinity
                for (let key of Object.keys(this.color)) {
                    const v = +cell[key]
                    if (v > maxVal) maxVal = v
                }

                //cumul
                let cumul = 0
                if (type_ === 'agepyramid' && this.agePyramidHeight)
                    cumul = (resolution - this.agePyramidHeight(cell, resolution, z, viewScale)) / 2
                if (type_ === 'radar' || type_ === 'halftone') cumul = Math.PI / 2 + offAng

                //compute the increment, which is the value to increment the cumul for each category
                const incr =
                    type_ === 'agepyramid'
                        ? (this.agePyramidHeight ? this.agePyramidHeight(cell, resolution, z, viewScale) : resolution) / nbCat
                        : type_ === 'radar' || type_ === 'halftone'
                            ? (2 * Math.PI) / nbCat
                            : undefined
                if (incr === undefined) throw new Error('Unexpected symbol type:' + type_)

                for (let [column, color] of Object.entries(this.color)) {
                    if (type_ === 'agepyramid') {
                        //set category color
                        geoCanvas.ctx.fillStyle = color

                        //get category value
                        const val = cell[column]

                        //compute category length - in geo
                        /** @type {number} */
                        const wG = (sG * val) / maxVal

                        //draw bar
                        geoCanvas.ctx.fillRect(xc + (resolution - wG) / 2, yc + cumul, wG, incr)

                        //next height
                        cumul += incr
                    } else if (type_ === 'radar') {
                        //set category color
                        geoCanvas.ctx.fillStyle = color

                        //get categroy value
                        const val = cell[column]

                        //compute category radius - in geo
                        /** @type {number} */
                        //const rG = this.radius(val, r, stat, cellStat, z)
                        const rG = (sG / 2) * Math.sqrt(val / maxVal)

                        //draw angular sector
                        geoCanvas.ctx.beginPath()
                        geoCanvas.ctx.moveTo(xc, yc)
                        geoCanvas.ctx.arc(xc, yc, rG, cumul - incr, cumul)
                        geoCanvas.ctx.lineTo(xc, yc)
                        geoCanvas.ctx.fill()

                        //next angular sector
                        cumul += incr
                    } else if (type_ === 'halftone') {
                        //set category color
                        geoCanvas.ctx.fillStyle = color

                        //get categroy value
                        const val = cell[column]

                        //compute category radius - in geo
                        /** @type {number} */
                        const rG = sG * 0.333 * Math.sqrt(val / maxVal)

                        //draw circle
                        geoCanvas.ctx.beginPath()
                        geoCanvas.ctx.arc(
                            xc + resolution * 0.25 * Math.cos(cumul),
                            yc + resolution * 0.25 * Math.sin(cumul),
                            rG,
                            0,
                            2 * Math.PI
                        )
                        geoCanvas.ctx.fill()

                        //next angular sector
                        cumul += incr
                    } else {
                        throw new Error('Unexpected symbol type:' + type_)
                    }
                }
            } else {
                //compute total
                let total = 0
                for (let column of Object.keys(this.color)) {
                    const v = +cell[column]
                    if (!v) continue
                    total += v
                }
                if (!total || isNaN(total)) continue

                //draw decomposition symbol
                let cumul = 0
                const d = resolution * (1 - sG / resolution) * 0.5
                const ori = this.stripesOrientation(cell, resolution, z, viewScale)

                for (let [column, color] of Object.entries(this.color)) {
                    //get share
                    const share = cell[column] / total
                    if (!share || isNaN(share)) continue

                    //set color
                    geoCanvas.ctx.fillStyle = color

                    //draw symbol part
                    if (type_ === 'flag') {
                        //draw flag stripe
                        if (ori == 0) {
                            //horizontal
                            geoCanvas.ctx.fillRect(
                                cell.x + d + offset.dx,
                                cell.y + d + cumul * sG + offset.dy,
                                sG,
                                share * sG
                            )
                        } else {
                            //vertical
                            geoCanvas.ctx.fillRect(
                                cell.x + d + cumul * sG + offset.dx,
                                cell.y + d + offset.dy,
                                share * sG,
                                sG
                            )
                        }
                    } else if (type_ === 'piechart') {
                        //draw pie chart angular sector

                        //compute angles
                        const a1 = cumul * 2 * Math.PI
                        const a2 = (cumul + share) * 2 * Math.PI

                        //draw
                        geoCanvas.ctx.beginPath()
                        geoCanvas.ctx.moveTo(xc, yc)
                        geoCanvas.ctx.arc(xc, yc, sG * 0.5, a1 + offAng, a2 + offAng)
                        if (this.pieChartInternalRadiusFactor)
                            geoCanvas.ctx.arc(
                                xc,
                                yc,
                                sG * 0.5 * this.pieChartInternalRadiusFactor,
                                a1 + offAng,
                                a2 + offAng,
                                true
                            )
                        geoCanvas.ctx.closePath()
                        geoCanvas.ctx.fill()
                    } else if (type_ === 'ring') {
                        //draw ring
                        geoCanvas.ctx.beginPath()
                        geoCanvas.ctx.arc(xc, yc, Math.sqrt(1 - cumul) * sG * 0.5, 0, 2 * Math.PI)
                        geoCanvas.ctx.fill()
                    } else if (type_ === 'segment') {
                        //draw segment sections
                        const wG = (sG * sG) / resolution
                        if (ori == 0) {
                            //horizontal
                            geoCanvas.ctx.fillRect(
                                cell.x + offset.dx,
                                cell.y + (resolution - wG) / 2 + cumul * wG + offset.dy,
                                resolution,
                                share * wG
                            )
                        } else {
                            //vertical
                            geoCanvas.ctx.fillRect(
                                cell.x + cumul * resolution + offset.dx,
                                cell.y + (resolution - wG) / 2 + offset.dy,
                                share * resolution,
                                wG
                            )
                        }
                    } else {
                        throw new Error('Unexpected symbol type:' + type_)
                    }

                    cumul += share
                }
            }
        }

        //update legends
        this.updateLegends({ style: this, resolution: resolution, z: z, viewScale: viewScale })
    }
}
