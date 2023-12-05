//@ts-check
'use strict'

import { Legend } from '../core/Legend.js'

/**
 * A legend element for segment width.
 *
 * @author Joseph Davies, Julien Gaffuri
 */
export class WidthLegend extends Legend {
    /** @param {Object} opts */
    constructor(opts = {}) {
        super(opts)

        /** A function returning the text label
         *  @type { function(object, Array.<import('../core/Dataset.js').Cell>):(number|string) } */
        this.label = opts.label || undefined

        /** A function returning the legend segment width
          *  @type { function(object):number } */
        this.segmentWidth = opts.segmentWidth || undefined

        //orientation TODO
        //this.orientation = opts.orientation || 0
        //color
        this.color = opts.color || 'gray'
        //length
        this.length = opts.length || ((resolution, z, viewScale) => resolution)
    }

    /**
     * @param {{ viewScale:object, resolution: number, z:number, cells:Array.<import('../core/Dataset.js').Cell> }} opts
     */
    update(opts) {

        //clear
        this.div.selectAll('*').remove()

        //title
        this.makeTitle()

        //get label. May not be a number (!)
        let label = this.label(opts.viewScale, opts.cells)

        //compute size of symbol, in pix
        let widthPix
        if (this.segmentWidth)
            widthPix = this.segmentWidth(opts.viewScale) / opts.z
        else
            widthPix = opts.viewScale(+label) / opts.z
        if (!widthPix) return

        //format label, if specified and possible
        if (this.labelFormat && !isNaN(+label)) label = this.labelFormat(label)

        //get segment length
        let lengthPix = this.length ? this.length(opts.resolution, opts.z, opts.viewScale) : opts.resolution
        lengthPix /= opts.z

        const d = this.div.append('div')

        const svg = d.append('svg').attr('width', lengthPix).attr('height', widthPix).style('', 'inline-block')

        //<line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" />
        svg.append('line')
            .attr('x1', 0)
            .attr('y1', widthPix / 2)
            .attr('x2', lengthPix)
            .attr('y2', widthPix / 2)
            .style('stroke', this.color)
            .style('stroke-width', widthPix)

        d.append('div')
            //show on right of graphic
            .style('display', 'inline')
            .style('padding-left', '5px')
            .style('font-size', this.labelFontSize)
            //.style("font-weight", "bold")
            .text(label + (this.labelUnitText ? ' ' : '') + this.labelUnitText)
    }
}

