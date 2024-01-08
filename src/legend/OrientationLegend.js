//@ts-check
'use strict'

import { Legend } from '../core/Legend.js'

/**
 * A legend element for segment orientation.
 *
 * @module legend
 * @author Joseph Davies, Julien Gaffuri
 */
export class OrientationLegend extends Legend {
    /** @param {Object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        //orientation
        this.orientation = opts.orientation || 0
        //color
        this.color = opts.color || ((resolution, z, viewScale) => 'gray')
        //width
        this.width = opts.width || ((resolution, z, viewScale) => 3 * z)
        //length
        this.length = opts.length || ((resolution, z, viewScale) => resolution)

        //label
        this.label = opts.label || "-"
    }

    /**
     * @param {{ style: import("../style/SegmentStyle.js").SegmentStyle, resolution: number, z: number, viewScale:object }} opts
     */
    update(opts) {

        //clear
        this.div.selectAll('*').remove()

        //title
        this.makeTitle()

        const d = this.div.append('div')

        //compute segment color, width and length
        const color = this.color(opts.resolution, opts.z, opts.viewScale)
        const widthPix = this.width(opts.resolution, opts.z, opts.viewScale) / opts.z
        const lengthPix = this.length(opts.resolution, opts.z, opts.viewScale) / opts.z

        //draw SVG segment
        const svgS = Math.max(lengthPix, widthPix)
        const svg = d.append('svg').attr('width', svgS).attr('height', svgS).style('', 'inline-block')

        const cos = Math.cos((-this.orientation * Math.PI) / 180)
        const sin = Math.sin((-this.orientation * Math.PI) / 180)
        const dc = svgS * 0.5,
            l2 = lengthPix * 0.5
        svg.append('line')
            .attr('x1', dc - cos * l2)
            .attr('y1', dc - sin * l2)
            .attr('x2', dc + cos * l2)
            .attr('y2', dc + sin * l2)
            .style('stroke', color)
            .style('stroke-width', widthPix)


        //label
        d.append('div')
            .style('display', 'inline')
            .style('padding-left', '5px')
            .style('font-size', this.labelFontSize)
            .text(this.label + (this.labelUnitText ? ' ' : '') + this.labelUnitText)
    }
}

/**
 * 
 * @param {Array.<number>} orientations 
 * @param {Array.<string>} labels 
 * @param {object} opts 
 * @returns  { Array.<OrientationLegend> }
 */
export function orientationLegend(orientations, labels, opts = {}) {
    const legends = []
    for (let i = 0; i < orientations.length; i++) {
        opts.title = i == 0 ? opts.title : undefined;
        opts.orientation = orientations[i]
        opts.label = labels[i]
        legends.push(new OrientationLegend(opts))
    }
    return legends
}
