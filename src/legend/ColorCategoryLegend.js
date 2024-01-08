//@ts-check
'use strict'

import { Legend } from '../core/Legend.js'

/**
 * A legend element for color categrories.
 *
 * @module legend
 * @author Joseph Davies, Julien Gaffuri
 */
export class ColorCategoryLegend extends Legend {
    /** @param {Object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        //col/categories array, in display order
        /**
         * @private
         * @type {Array.<[string,string]>} */
        this.colorLabel = opts.colorLabel || [['gray', '-']]

        /**
         * @private
         * @type {import("../core/Style.js").Shape} */
        this.shape = opts.shape || 'circle'
        this.dimension = opts.dimension || { r: 8 }
        this.strokeColor = opts.strokeColor || 'gray'
        this.strokeWidth = opts.strokeWidth || 1
    }

    /**
     */
    update() {

        //clear
        this.div.selectAll('*').remove()

        //title
        this.makeTitle()

        //categories
        const nb = this.colorLabel.length
        if (nb == 0) return

        for (let i = 0; i < nb; i++) {
            const cat = this.colorLabel[i]

            //make div for category
            const d = this.div.append('div')
            //to enable vertical centering
            //.style("position", "relative")

            const sw = this.strokeWidth

            //draw graphic element: box / circle
            if (this.shape === 'square') {
                const h = this.dimension.h || 15
                const w = this.dimension.w || 20
                d.append('div')
                    .style('display', 'inline')

                    .append('svg')
                    .attr('width', w + 2 * sw)
                    .attr('height', h + 2 * sw)

                    .append('rect')
                    .attr('x', sw)
                    .attr('y', sw)
                    .attr('width', w)
                    .attr('height', h)
                    .style('fill', cat[0])
                    .style('stroke', this.strokeColor)
                    .style('stroke-width', this.strokeWidth)
            } else if (this.shape === 'circle') {
                const r = this.dimension.r || 8
                const h = 2 * r + 2 * sw
                d.append('div')
                    .style('display', 'inline')

                    .append('svg')
                    .attr('width', h)
                    .attr('height', h)

                    .append('circle')
                    .attr('cx', r + sw)
                    .attr('cy', r + sw)
                    .attr('r', r)
                    .style('fill', cat[0])
                    .style('stroke', this.strokeColor)
                    .style('stroke-width', this.strokeWidth)
            } else {
                throw new Error('Unexpected shape:' + this.shape)
            }

            //write label text
            d.append('div')
                //show on right of graphic
                .style('display', 'inline')

                //center vertically
                //.style("position", "absolute").style("top", "0").style("bottom", "0")

                .style('padding-left', '5px')
                .style('font-size', this.labelFontSize)
                .text(cat[1])
        }
    }
}
