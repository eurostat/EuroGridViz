//@ts-check
'use strict'

// internal imports
import { GeoCanvas } from './GeoCanvas.js'
import { Tooltip } from './Tooltip.js'
import { ZoomButtons } from '../button/ZoomButtons.js'
import { FullscreenButton } from '../button/FullscreenButton.js'

// external imports
import { select } from 'd3-selection'

/**
 * A gridviz application.
 *
 * @module core
 * @author Joseph Davies, Julien Gaffuri
 */
export class Map {
    /**
     * @param {HTMLDivElement} container
     * @param {object} opts
     */
    constructor(container, opts) {
        opts = opts || {}

        /**
         * The layers.
         * @type {Array.<import("./Layer.js").Layer>}
         * */
        this.layers = opts.layers || []

        //get container element
        this.container = container || document.getElementById('gridviz')
        if (!this.container) {
            console.error('Cannot find gridviz container element.')
            return
        }

        //https://css-tricks.com/absolute-positioning-inside-relative-positioning/
        this.container.style.position = "relative"; // container element must have relative positioning

        //set dimensions
        /** @type {number} */
        this.w = opts.w || this.container.offsetWidth
        /** @type {number} */
        this.h = opts.h || this.container.offsetHeight

        //create canvas element if not specified
        /** @type {HTMLCanvasElement} */
        this._canvas = opts.canvas || this.initialiseCanvas()

        /** Make geo canvas
         * @type {GeoCanvas}
         * @private */
        this.geoCanvas = new GeoCanvas(this._canvas, opts.x, opts.y, opts.z, opts)
        this.geoCanvas.redraw = () => { this.redraw() }

        // legend div
        this.legendDivId = opts.legendDivId || 'gvizLegend'
        this.legend = select('#' + this.legendDivId)
        if (this.legend.empty()) this.initialiseLegend()


        //tooltip

        // set App container as default parent element for tooltip
        if (!opts.tooltip) opts.tooltip = {}
        if (!opts.tooltip.parentElement) opts.tooltip.parentElement = this.container

        /**
         * @private
         * @type {Tooltip} */
        this.tooltip = new Tooltip(opts.tooltip)

        // add event listeners to container
        this.mouseOverHandler = (e) => this.focusCell(e)
        this.mouseMoveHandler = (e) => this.focusCell(e)
        this.mouseOutHandler = (e) => this.tooltip.hide()
        this.geoCanvas.canvas.addEventListener('mouseover', this.mouseOverHandler)
        this.geoCanvas.canvas.addEventListener('mousemove', this.mouseMoveHandler)
        this.geoCanvas.canvas.addEventListener('mouseout', this.mouseOutHandler)

        // add extra logic to onZoomStartFun
        this.geoCanvas.onZoomStartFun = (e) => {
            if (opts.onZoomStartFun) opts.onZoomStartFun(e)
            this.tooltip.hide()
        }

        //for mouse over
        /**
         * @private
         * @type {HTMLCanvasElement|null} */
        this.canvasSave = null

        this.selectionRectangleColor = opts.selectionRectangleColor || 'red'
        this.selectionRectangleWidthPix = opts.selectionRectangleWidthPix || (() => 4) //(r,z) => {}

        // transparent background (e.g. leaflet) 'red painting' fix
        this.transparentBackground = opts.transparentBackground

        //set default globalCompositeOperation
        this.defaultGlobalCompositeOperation =
            opts.defaultGlobalCompositeOperation || this.geoCanvas.ctx.globalCompositeOperation
    }

    /** 
     * @protected 
     * @returns {HTMLCanvasElement}
    */
    initialiseCanvas() {
        const canvas = document.createElement('canvas')
        canvas.setAttribute('width', '' + this.w)
        canvas.setAttribute('height', '' + this.h)
        this.container.appendChild(canvas)
        return canvas
    }


    initialiseLegend() {
        this.legend = select(this.container.id && this.container.id != '' ? '#' + this.container.id : 'body')
            .append('div')
            .attr('id', this.legendDivId)
            .style('position', 'absolute')
            .style('width', 'auto')
            .style('height', 'auto')
            .style('background', '#FFFFFF')
            //.style("padding", this.padding)
            .style('border', '0px')
            //.style('border-radius', '5px')
            .style('box-shadow', '3px 3px 3px grey, -3px -3px 3px #ddd')
            .style('font-family', 'Helvetica, Arial, sans-serif')
            .style('bottom', '15px')
            .style('right', '15px')
        //hide
        //.style("visibility", "hidden")
    }

    /**
     * Set/get layer stack.
     * 
     * @param {undefined|import("./Layer.js").Layer|import("./Layer.js").Layer[]} layers 
     * @returns { this | import("./Layer.js").Layer[] }
     */
    layers_(layers) {
        if (arguments.length === 0) return this.layers
        if (arguments.length === 1)
            if (Array.isArray(layers)) this.layers = layers
            else this.layers = [layers]
        else this.layers = arguments
        return this
    }

    /** @returns {this} */
    redraw() {
        //remove legend elements
        if (this.legend) this.legend.selectAll('*').remove()

        //clear
        this.geoCanvas.initCanvasTransform()
        this.geoCanvas.clear(this.geoCanvas.backgroundColor)

        const z = this.geoCanvas.view.z
        this.updateExtentGeo()

        //go through the layers
        for (const layer of this.layers) {

            //check if layer is visible
            if (layer.visible && !layer.visible(z)) continue

            //set layer alpha and blend mode
            this.geoCanvas.ctx.globalAlpha = layer.alpha ? layer.alpha(z) : 1.0
            this.geoCanvas.ctx.globalCompositeOperation = layer.blendOperation(z)

            //set affin transform to draw with geographical coordinates
            this.geoCanvas.setCanvasTransform()

            //draw layer
            layer.draw(this.geoCanvas, this.legend)

            //draw layer filter
            if (layer.filterColor)
                layer.drawFilter(this.geoCanvas)

            //restore default alpha and blend operation
            this.geoCanvas.ctx.globalAlpha = 1.0
            this.geoCanvas.ctx.globalCompositeOperation = this.defaultGlobalCompositeOperation
        }

        //
        this.canvasSave = null

        // listen for resize events on the App's container and handle them
        this.defineResizeObserver(this.container, this._canvas)

        return this
    }


    /**
     * @param {number} marginPx
     * @returns {import('./GeoCanvas.js').Envelope}
     * @public
     */
    updateExtentGeo(marginPx = 20) {
        return this.geoCanvas.updateExtentGeo(marginPx)
    }



    /** @param {MouseEvent} e */
    focusCell(e) {
        //compute mouse geo position
        const mousePositionGeo = {
            x: this.geoCanvas.pixToGeoX(e.offsetX + this.tooltip.xMouseOffset),
            y: this.geoCanvas.pixToGeoY(e.offsetY + this.tooltip.yMouseOffset),
        }
        /** @type {{cell:import('./Dataset.js').Cell,html:string,resolution:number} | undefined} */
        const focus = this.getCellFocusInfo(mousePositionGeo)

        // transparent background (e.g. leaflet) 'red painting' fix
        if (this.transparentBackground) {
            if (focus) {
                this.tooltip.html(focus.html)
                this.tooltip.setPosition(e)
                this.tooltip.show()
            } else {
                this.tooltip.hide()
            }
            this.canvasSave = document.createElement('canvas')
            this.canvasSave.setAttribute('width', '' + this.w)
            this.canvasSave.setAttribute('height', '' + this.h)
            this.canvasSave.getContext('2d')?.drawImage(this.geoCanvas.canvas, 0, 0)
            this.geoCanvas.initCanvasTransform()
            return
        }

        if (focus) {
            this.tooltip.html(focus.html)
            this.tooltip.setPosition(e)
            this.tooltip.show()

            //show cell position as a rectangle
            if (!this.canvasSave) {
                this.canvasSave = document.createElement('canvas')
                this.canvasSave.setAttribute('width', '' + this.w)
                this.canvasSave.setAttribute('height', '' + this.h)
                this.canvasSave.getContext('2d')?.drawImage(this.geoCanvas.canvas, 0, 0)
            } else {
                this.geoCanvas.ctx.drawImage(this.canvasSave, 0, 0)
            }

            //draw image saved + draw rectangle
            const rectWPix = this.selectionRectangleWidthPix
                ? this.selectionRectangleWidthPix(focus.resolution, this.geoCanvas.view.z)
                : 4
            this.geoCanvas.initCanvasTransform()
            this.geoCanvas.ctx.strokeStyle = this.selectionRectangleColor
            this.geoCanvas.ctx.lineWidth = rectWPix
            this.geoCanvas.ctx.beginPath()

            this.geoCanvas.ctx.rect(
                this.geoCanvas.geoToPixX(focus.cell.x) - rectWPix / 2,
                this.geoCanvas.geoToPixY(focus.cell.y) + rectWPix / 2,
                focus.resolution / this.geoCanvas.view.z + rectWPix,
                -focus.resolution / this.geoCanvas.view.z - rectWPix
            )
            this.geoCanvas.ctx.stroke()
        } else {
            this.tooltip.hide()
            if (this.canvasSave) this.geoCanvas.ctx.drawImage(this.canvasSave, 0, 0)
        }
    }


    /**
     * Return the cell HTML info at a given geo position.
     * This is usefull for user interactions, to show this info where the user clicks for example.
     *
     * @param {{x:number,y:number}} posGeo
     * @returns {{cell:import('./Dataset.js').Cell,html:string,resolution:number} | undefined}
     * @protected
     */
    getCellFocusInfo(posGeo) {
        //go through the layers, starting from top
        const z = this.geoCanvas.view.z
        for (let i = this.layers.length - 1; i >= 0; i--) {
            /** @type {import("./Layer.js").Layer} */
            const layer = this.layers[i]
            if (layer.visible && !layer.visible(z)) continue
            if (!layer.cellInfoHTML) continue
            //if (layer.cellInfoHTML === 'none') continue
            if (!layer.getDataset) continue
            const dsc = layer.getDataset(z)
            if (!dsc) continue

            //get cell at mouse position
            /** @type {import('./Dataset.js').Cell|undefined} */
            const cell = dsc.getCellFromPosition(posGeo, dsc.getViewCache())
            //console.log(cell, dsc.resolution)
            if (!cell) return undefined
            const html = layer.cellInfoHTML(cell, dsc.getResolution())
            if (!html) return undefined
            return { cell: cell, html: html, resolution: dsc.getResolution() }
        }
    }


    /** 
     * @param {number} x
     * @param {number} y
     * @param {number|undefined} z
     */
    setView(x, y, z = undefined) {
        this.geoCanvas.view.x = x
        this.geoCanvas.view.y = y
        if (z != undefined) this.geoCanvas.view.z = z
        return this
    }

    /** @returns {import('./GeoCanvas.js').View} */
    getView() { return this.geoCanvas.view }

    /** @returns {number} */
    getZoom() {
        return this.geoCanvas.view.z
    }
    /** @param {number} z @returns {this} */
    setZoom(z) {
        this.geoCanvas.view.z = z
        return this
    }


    /** @returns {Array.<number>} */
    getZoomExtent() {
        return this.geoCanvas.getZoomExtent()
    }
    /** @param {Array.<number>} val @returns {this} */
    setZoomExtent(val) {
        this.geoCanvas.setZoomExtent(val)
        return this
    }



    /** @returns {string} */
    getBackgroundColor() {
        return this.geoCanvas.backgroundColor
    }
    /** @param {string} val @returns {this} */
    setBackgroundColor(val) {
        this.geoCanvas.backgroundColor = val
        return this
    }

    /**
     * Adds a set of zoom buttons to the map
     *
     * @param {object} opts
     * @returns {this}
     */
    addZoomButtons(opts) {
        // * opts.id
        // * opts.onZoom - custom event handler function
        // * opts.x
        // * opts.y
        // * opts.delta - zoom delta applied on each click

        this.zoomButtons = new ZoomButtons({
            map: this,
            id: opts?.id || 'gridviz-zoom-buttons',
            class: opts?.class,
            x: opts?.x,
            y: opts?.y,
            onZoom: opts?.onZoom,
            delta: opts?.delta || 0.2
        })

        return this
    }

    /**
     * Adds a fullscreen toggle button to the app
     *
     * @param {object} opts
     * @returns {this}
     */
    addFullscreenButton(opts) {
        // * opts.map - the gridviz map
        // * opts.id
        // * opts.x
        // * opts.y

        this.fullscreenButton = new FullscreenButton({
            map: this,
            id: opts?.id || 'gridviz-fullscreen-button',
            class: opts?.class,
            x: opts?.x,
            y: opts?.y
        })

        return this
    }

    /** @returns {this} */
    setViewFromURL() {
        this.geoCanvas.setViewFromURL()
        return this
    }

    /**
     * @description Add a resize event observer to the Apps container and update the canvas accordingly
     * @param {HTMLDivElement} container The App's container element
     * @param {HTMLCanvasElement} canvas The App canvas element
     * @memberof App
     */
    defineResizeObserver(container, canvas) {
        // listen to resize events
        const resizeObserver = new ResizeObserver((entries) => {
            // make sure canvas has been built
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                // make sure we dont exceed loop limit first
                // see: https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
                window.requestAnimationFrame(() => {
                    if (!Array.isArray(entries) || !entries.length) {
                        return
                    }
                    // update the map and canvas size
                    if (this.h !== container.clientHeight || this.w !== container.clientWidth) {
                        this.h = container.clientHeight
                        this.w = container.clientWidth
                        this.geoCanvas.h = container.clientHeight
                        this.geoCanvas.w = container.clientWidth
                        canvas.setAttribute('width', '' + this.w)
                        canvas.setAttribute('height', '' + this.h)
                        this.redraw()

                        //update button positions
                        // if (this.zoomButtons) this.zoomButtons.node.style.left = this.w - 50 + 'px'
                        // if (this.fullscreenButton) this.fullscreenButton.node.style.left = this.w - 50 + 'px'
                    }
                })
            }
        })

        resizeObserver.observe(container)
    }

    /**
     * @description Destroy the map and it's event listeners
     * This should significantly reduce the memory used when creating and destroying gridviz map instances (for example in leaflet-gridviz)
     * @memberof App
     */
    destroy() {
        // clear layers
        this.layers = []
        this.bgLayers = []

        // remove event listeners from container
        this.container.removeEventListener('mouseover', this.mouseOverHandler)
        this.container.removeEventListener('mousemove', this.mouseMoveHandler)
        this.container.removeEventListener('mouseout', this.mouseOutHandler)

        // remove canvas
        this.geoCanvas.canvas.remove()

        // remove legend
        this.legend?.remove()

        // remove tooltip
        this.tooltip.tooltip?.remove()
    }
}
