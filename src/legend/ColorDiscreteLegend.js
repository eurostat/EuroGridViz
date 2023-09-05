//@ts-check
'use strict'

import { Legend } from '../Legend.js'

/**
 * A legend element for discrete color style.
 * Inspiration: https://observablehq.com/@d3/color-legend
 *
 * @author Julien Gaffuri
 */
export class ColorDiscreteLegend extends Legend {
    /** @param {Object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** @private @type {Array.<Array.<string>>} */
        this.colors = opts.colors
        /** @private @type {Array.<Array.<string>>} */
        this.breaksText = opts.breaksText

        this.width = opts.width || 300
        this.height = opts.height || 15

        this.title = opts.title
        this.titleFontSize = opts.titleFontSize || '0.8em'
        this.titleFontWeight = opts.titleFontWeight || 'bold'

        this.tickSize = opts.tickSize || 3

        //label
        this.labelFontSize = opts.labelFontSize || '0.8em'
        this.invert = opts.invert
    }

    /**
     * @param {{ style: import("../Style").Style, r: number, zf: number, sSize: import("../Style").Stat, sColor: import("../Style").Stat }} opts
     */
    update(opts) {
        //clear
        this.div.selectAll('*').remove()

        //build

        //title
        if (this.title)
            this.div
                .append('div')
                .style('font-size', this.titleFontSize)
                .style('font-weight', this.titleFontWeight)
                .style('margin-bottom', '7px')
                .text(this.title)

        //classes
        const nb = this.colors.length
        if (nb == 0) return
        const w = this.width / nb

        //make svg element
        const svg = this.div
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height + this.tickSize + 2 + 10)

        //draw graphic elements
        for (let i = 0; i < nb; i++) {
            svg.append('rect')
                .attr('x', i * w)
                .attr('y', 0)
                .attr('width', w)
                .attr('height', this.height)
                .style('fill', this.colors[i])
        }

        //tick line
        for (let i = 1; i < nb; i++) {
            svg.append('line')
                .attr('x1', w * i)
                .attr('y1', 0)
                .attr('x2', w * i)
                .attr('y2', this.height + this.tickSize)
                .style('stroke', 'black')
        }

        //labels
        for (let i = 1; i < nb; i++) {
            //prepare label
            svg.append('text')
                .attr('id', 'ticklabel_' + i)
                .attr('x', w * i)
                .attr('y', this.height + this.tickSize + 2)
                .style('font-size', this.labelFontSize)
                //.style("font-weight", "bold")
                //.style("font-family", "Arial")
                .style('text-anchor', i == 0 ? 'start' : i == this.ticks - 1 ? 'end' : 'middle')
                .style('alignment-baseline', 'top')
                .style('dominant-baseline', 'hanging')
                .style('pointer-events', 'none')
                .text(this.breaksText[i - 1])
        }
    }
}
