//@ts-check
'use strict'

import { select } from 'd3-selection'

/**
 * A legend container.
 *
 * @module core
 * @author Joseph Davies, Julien Gaffuri
 */
export class Legend {
    /**
     * @param {Object} opts
     */
    constructor(opts) {
        opts = opts || {}

        /** @type {string} */
        this.id = opts.id

        //TODO stop using it. Use style method below instead.

        /** @type {number} @deprecated */
        this.top = opts.top
        /** @type {number} @deprecated */
        this.bottom = opts.bottom
        /** @type {number} @deprecated */
        this.left = opts.left
        /** @type {number} @deprecated */
        this.right = opts.right
        /** @type {string} @deprecated */
        this.background = opts.background || 'none'
        /** @type {string} @deprecated */
        this.padding = opts.padding || '5px'
        /** @type {string} @deprecated */
        this.border = opts.border || '0px'
        /** @type {string} @deprecated */
        this['border-radius'] = opts['border-radius'] || 'none'
        /** @type {string} @deprecated */
        this['box-shadow'] = opts['box-shadow'] || 'none'
        /** @type {string} @deprecated */
        this['font-family'] = opts['font-family'] || 'Helvetica, Arial, sans-serif'
        /** @type {string} @deprecated */
        this.width = opts.width
        /** @type {string} @deprecated */
        this.height = opts.height

        //the div element
        if (this.id) this.div = select('#' + this.id)

        if (!this.div || this.div.empty()) {
            this.div = select(document.createElement('div'))
            if (this.id) this.div.attr('id', this.id)
        }

        //set style
        this.div.style('background', this.background)
        this.div.style('padding', this.padding)
        this.div.style('border', this.border)
        this.div.style('border-radius', this['border-radius'])
        this.div.style('box-shadow', this['box-shadow'])
        this.div.style('font-family', this['font-family'])

        if (this.width) this.div.style('width', this.width)
        if (this.height) this.div.style('height', this.height)


        //title
        this.title = opts.title
        this.titleFontSize = opts.titleFontSize || '0.8em'
        this.titleFontWeight = opts.titleFontWeight || 'bold'

        //label
        this.labelFontSize = opts.labelFontSize || '0.8em'
        this.labelUnitText = opts.labelUnitText || ''
        this.labelFormat = opts.labelFormat
    }


    makeTitle() {
        if (!this.title) return
        this.div
            .append('div')
            .style('font-size', this.titleFontSize)
            .style('font-weight', this.titleFontWeight)
            .style('margin-bottom', '7px')
            .text(this.title)
    }


    /**
     * Apply a style to the legend div.
     * @param {string} k
     * @param {string} v
     * @returns {this}
     */
    style(k, v) {
        this.div.style(k, v)
        return this
    }

    /**
     * @param {Object} opts
     * @abstract
     */
    update(opts = {}) {
        console.error('Legend update not implemented yet.')
    }
}
