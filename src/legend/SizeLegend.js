//@ts-check
'use strict'

import { Legend } from '../core/Legend.js'
import { nice } from '../utils/utils.js'
import { max } from 'd3-array'

/**
 * A legend element for proportional symbols.
 *
 * @module legend
 * @author Joseph Davies, Julien Gaffuri
 */
export class SizeLegend extends Legend {
    /** @param {Object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}

        /** A function returning the text label
         *  @type { function(object, Array.<import('../core/Dataset.js').Cell>):(number|string) } */
        this.label = opts.label || undefined

        /** A function returning the size of the legend symbol
         *  @type { function(object):number } */
        this.size = opts.size || undefined

        //symbol
        /**  @type {(import("../core/Style").Shape)|"line"} */
        this.shape = opts.shape || 'circle'

        //general case
        this.fillColor = opts.fillColor || 'none'
        this.strokeColor = opts.strokeColor || 'gray'
        this.strokeWidth = opts.strokeWidth || 1

        //for line shape
        //TODO this.orientation = opts.orientation || 0
        this.color = opts.color || 'gray'
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
        let sizePix
        if (this.size)
            sizePix = this.size(opts.viewScale) / opts.z
        else
            sizePix = opts.viewScale(+label) / opts.z
        if (!sizePix) return

        //format label, if specified and possible
        if (this.labelFormat && !isNaN(+label)) label = this.labelFormat(label)

        const d = this.div.append('div')
        //to enable vertical centering
        //.style("position", "relative")

        //default svg construction, for square and circle
        const svg = () => d
            .append('svg')
            .attr('width', sizePix + this.strokeWidth + 2)
            .attr('height', sizePix + this.strokeWidth + 2)
            .style('', 'inline-block')

        if (this.shape === 'square') {
            svg().append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', sizePix)
                .attr('height', sizePix)
                .style('fill', this.fillColor)
                .style('stroke', this.strokeColor)
                .style('stroke-width', this.strokeWidth)
        } else if (this.shape === 'circle') {
            // <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
            const r = (sizePix + this.strokeWidth) * 0.5
            svg().append('circle')
                .attr('cx', r + 1)
                .attr('cy', r + 1)
                .attr('r', r)
                .style('fill', this.fillColor)
                .style('stroke', this.strokeColor)
                .style('stroke-width', this.strokeWidth)
        } else if (this.shape === 'donut') {
            //TODO
        } else if (this.shape === 'diamond') {
            //TODO
        } else if (this.shape === 'line') {

            //get segment length
            let lengthPix = this.length ? this.length(opts.resolution, opts.z, opts.viewScale) : opts.resolution
            lengthPix /= opts.z

            const svg = d.append('svg').attr('width', lengthPix).attr('height', sizePix).style('', 'inline-block')

            //TODO orientation
            //<line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" />
            svg.append('line')
                .attr('x1', 0)
                .attr('y1', sizePix / 2)
                .attr('x2', lengthPix)
                .attr('y2', sizePix / 2)
                .style('stroke', this.color)
                .style('stroke-width', sizePix)
        } else {
            throw new Error('Unexpected shape:' + this.shape)
        }

        //label
        d.append('div')
            .style('display', 'inline')
            .style('padding-left', '5px')
            .style('font-size', this.labelFontSize)
            .text(label + (this.labelUnitText ? ' ' : '') + this.labelUnitText)
    }
}







/**
 * @param {Array.<number>} values 
 * @param {function(number):number} size 
 * @param { object } opts 
 * @returns {Array.<SizeLegend>}
 */
export function sizeLegend(values, size, opts = {}) {
    const legends = []
    for (let value of values) {
        opts.title = value == values[0] ? opts.title : undefined;
        opts.size = () => size(value)
        opts.label = () => value
        legends.push(new SizeLegend(opts))
    }
    return legends
}

/**
 * @param { function(import('../core/Dataset.js').Cell):number } value 
 * @param {*} opts 
 * @returns {Array.<SizeLegend>}
 */
export function sizeLegendViewScale(value, opts = {}) {
    const k = opts.k || [0.9, 0.5, 0.2, 0.05]
    const legends = []
    for (let k_ of k) {
        opts.title = k_ == k[0] ? opts.title : undefined
        opts.label = (viewScale, cells) => nice(k_ * max(cells, value))
        legends.push(new SizeLegend(opts))
    }
    return legends
}

/**
 * A function which return a stack of size legends for a discrete classification.
 * 
 * @param { Array.<number> } breaks 
 * @param { Array.<number> } sizes 
 * @param { object } opts 
 * @returns {Array.<SizeLegend>}
 */
export function sizeDiscreteLegend(breaks, sizes, opts = {}) {
    const f = opts.labelFormat || (x => x)
    const labelText = opts.labelText || defaultLabelText(f)
    const legends = []
    for (let i = sizes.length - 1; i >= 0; i--) {
        opts.title = i == sizes.length - 1 ? opts.title : undefined
        opts.size = () => sizes[i]
        opts.label = () => labelText(breaks[i - 1], breaks[i])
        legends.push(new SizeLegend(opts))
    }
    return legends
}

/**
 * A function which return a stack of size legends for a discrete classification using a viewscale.
 * @param { number } classNumber 
 * @param { object } opts 
 * @returns {Array.<SizeLegend>}
 */
export function sizeDiscreteViewScaleLegend(classNumber, opts = {}) {
    const f = opts.labelFormat || (x => x)
    const labelText = opts.labelText || defaultLabelText(f)
    const legends = []
    const viewScaleFun = opts.viewScaleFun || (t => t) //TODO do it differently? At sizelegend level !
    for (let i = classNumber - 1; i >= 0; i--) {
        opts.title = i == classNumber - 1 ? opts.title : undefined
        opts.size = (viewScale) => viewScaleFun(viewScale).values[i]
        opts.label = (viewScale) => labelText(viewScaleFun(viewScale).breaks[i - 1], viewScaleFun(viewScale).breaks[i])
        legends.push(new SizeLegend(opts))
    }
    return legends
}

/**
 * A function that returns a function to format laberls for discrete scale legends.
 * @param { function(number):string } format 
 * @returns { function(number|undefined, number|undefined): string }
 */
function defaultLabelText(format) {
    return (v0, v1) => {
        if (v0 == undefined && v1 == undefined) return ""
        if (v1 == undefined) return "> " + format(v0)
        if (v0 == undefined) return "< " + format(v1)
        return format(v0) + " - " + format(v1)
    }
}
