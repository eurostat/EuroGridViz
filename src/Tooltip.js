//@ts-check
'use strict'

import { select } from 'd3-selection'
//import { transition } from "d3-transition";

/**
 * A generic class to make a tooltip.
 * It is a div element, which can be moved under the mouse pointer and filled with some information in html.
 */
export class Tooltip {
    /**
     * @param {object} opts
     */
    constructor(opts) {
        opts = opts || {}

        /** @type {string} */
        this.div = opts.div || 'tooltip_eurostat'
        /** @type {string} */
        this.maxWidth = opts.maxWidth || '20em'
        /** @type {string} */
        this.fontSize = opts.fontSize || '1.2em'
        /** @type {string} */
        this.background = opts.background || 'white'
        /** @type {string} */
        this.padding = opts.padding || '5px'
        /** @type {string} */
        this.border = opts.border || '0px'
        /** @type {string} */
        this['border-radius'] = opts['border-radius'] || '0px'
        /** @type {string} */
        this['box-shadow'] = opts['box-shadow'] || '5px 5px 5px grey'
        /** @type {string} */
        this['font-family'] = opts['font-family'] || 'Helvetica, Arial, sans-serif'

        /** @type {number} */
        this.transitionDuration = opts.transitionDuration || 100
        /** @type {number} */
        this.xOffset = opts.xOffset || 30
        /** @type {number} */
        this.yOffset = opts.yOffset || 20
        /** @type {number} */ // e.g. to prevent mouse cursor covering cell being highlighted
        this.yMouseOffset = opts.yMouseOffset || 0
        /** @type {number} */
        this.xMouseOffset = opts.xMouseOffset || 0
        /** @type {HTMLElement} */
        this.parentElement = opts.parentElement || document.body

        /**
         * @public
         * @type {import("d3-selection").Selection} */
        this.tooltip = select('#' + this.div)

        if (this.tooltip.empty()) {
            //create tooltip DOM node
            // this.tooltip = select(
            //     '#' + this.parentElement.id && this.parentElement.id != ''
            //         ? '#' + this.parentElement.id
            //         : 'body'
            // )
            this.tooltip = select('body').append('div').attr('id', this.div)
        }

        //initialise
        this.tooltip.style('max-width', this.maxWidth)
        this.tooltip.style('overflow', 'hidden')
        this.tooltip.style('font-size', this.fontSize)
        this.tooltip.style('background', this.background)
        this.tooltip.style('padding', this.padding)
        this.tooltip.style('border', this.border)
        this.tooltip.style('border-radius', this['border-radius'])
        this.tooltip.style('box-shadow', this['box-shadow'])
        this.tooltip.style('font-family', this['font-family'])
        this.tooltip.style('position', 'absolute')
        this.tooltip.style('pointer-events', 'none')
        this.tooltip.style('opacity', '0')
        this.tooltip.style('text-wrap', 'nowrap')

        // aria-labels (thanks to wahlatlas)
        this.tooltip.attr('role', 'tooltip').attr('aria-live', 'polite')
    }

    /** Show the tooltip */
    show() {
        // @ts-ignore
        this.tooltip.transition().duration(this.transitionDuration).style('opacity', 1)
    }

    /** Hide the tooltip */
    hide() {
        // @ts-ignore
        this.tooltip.transition().duration(this.transitionDuration).style('opacity', 0)
    }

    /**
     * Set the content of the tooltip.
     * @param {string} html
     */
    html(html) {
        this.tooltip.html(html)
    }

    /**
     * Set the position of the tooltip at the mouse event position.
     * @param {MouseEvent} event
     */
    setPosition(event) {
        let parentRect = this.parentElement.getBoundingClientRect()

        let x = event.pageX + this.xOffset
        let y = event.pageY - this.yOffset

        this.tooltip.style('left', x + 'px').style('top', y + 'px')

        this.ensureTooltipInsideContainer(event, parentRect)
    }

    /*
	my.mouseover = function (event, html) {
		if (html) my.html(html);
		my.setPosition(event);
		my.show()
		//this.ensureTooltipInsideContainer();
	};
	
	my.mousemove = function (event) {
		my.setPosition(event);
		//this.ensureTooltipInsideContainer();
	};
	
	my.mouseout = function () {
		my.hide();
	};*/

    style(k, v) {
        if (arguments.length == 1) return this.tooltip.style(k)
        this.tooltip.style(k, v)
        return this
    }

    attr(k, v) {
        if (arguments.length == 1) return this.tooltip.attr(k)
        this.tooltip.attr(k, v)
        return this
    }

    /**
     * @function ensureTooltipInsideContainer
     * @description Prevents the tooltip from overflowing out of the App container (ensures that the tooltip is inside the gridviz container)
     * @param {MouseEvent} event
     * @param {DOMRect} parentRect
     */
    ensureTooltipInsideContainer = function (event, parentRect) {
        let node = this.tooltip.node()
        let parentWidth = parentRect.width
        let parentHeight = parentRect.height

        //too far right
        if (node.offsetLeft > parentRect.left + parentWidth - node.clientWidth) {
            let left = event.x - node.clientWidth - this.xOffset
            node.style.left = left + 'px'
            // check if mouse covers tooltip
            if (node.offsetLeft + node.clientWidth > event.x) {
                //move tooltip left so it doesnt cover mouse
                let left2 = event.x - node.clientWidth - this.xOffset
                node.style.left = left2 + 'px'
            }
            // node.style.top = node.offsetTop + config.yOffset + "px";
        }

        //too far down
        if (node.offsetTop + node.clientHeight > parentRect.top + parentHeight) {
            node.style.top = node.offsetTop - node.clientHeight + 'px'
        }

        //too far up
        if (node.offsetTop < parentRect.top) {
            node.style.top = parentRect.top + this.yOffset + 'px'
        }
    }
}
