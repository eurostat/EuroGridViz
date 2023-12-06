//@ts-check
'use strict'

// internal imports
import { GeoCanvas } from './GeoCanvas.js'
import { Layer } from './Layer.js'
import { Dataset } from './Dataset.js'
import { Tooltip } from './Tooltip.js'
import { CSVGrid } from './dataset/CSVGrid.js'
import { LGrid } from './dataset/LGrid.js'
import { TiledGrid } from './dataset/TiledGrid.js'
import { BackgroundLayer } from './BackgroundLayer.js'
import { BackgroundLayerWMS } from './BackgroundLayerWMS.js'
import { LabelLayer } from './LabelLayer.js'
import { LineLayer } from './LineLayer.js'
import { monitor, monitorDuration } from './utils/Utils.js'
import { ZoomButtons } from './button/ZoomButtons.js'
import { FullscreenButton } from './button/FullscreenButton.js'

// external imports
import { select } from 'd3-selection'

/**
 * A gridviz application.
 *
 * @author Joseph Davies, Julien Gaffuri
 */
export class App {
    /**
     * @param {HTMLDivElement} container
     * @param {object} opts
     */
    constructor(container, opts) {
        opts = opts || {}

        /**
         * The layers.
         * @type {Array.<Layer>}
         * */
        this.layers = []

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

        //create canvas element if user doesnt specify one
        /** @type {HTMLCanvasElement} */
        let canvas = opts.canvas || null
        if (!canvas) {
            canvas = document.createElement('canvas')
            canvas.setAttribute('width', '' + this.w)
            canvas.setAttribute('height', '' + this.h)
            this.container.appendChild(canvas)
        }

        /** Make geo canvas
         * @type {GeoCanvas}
         * @private */
        this.cg = new GeoCanvas(canvas, undefined, 1, opts)
        this.cg.redraw = (strong = true) => {
            if (monitor) monitorDuration('Start redraw')
            //console.log("?x=" + this.cg.getCenter().x + "&y=" + this.cg.getCenter().y + "&z=" + this.cg.getZf())

            //remove legend elements
            if (this.legend && strong) this.legend.selectAll('*').remove()

            //clear
            this.cg.initCanvasTransform()
            this.cg.clear(this.cg.backgroundColor)

            const zf = this.getZoomFactor()
            this.updateExtentGeo()

            //go through the background layers
            if (this.showBgLayers)
                for (const layer of this.bgLayers) {
                    //check if layer is visible
                    if (!layer.visible) continue
                    if (zf > layer.maxZoom) continue
                    if (zf < layer.minZoom) continue

                    //draw layer
                    layer.draw(this.cg)
                }

            //go through the layers
            for (const layer of this.layers) {
                //check if layer is visible
                if (!layer.visible) continue
                if (zf > layer.maxZoom) continue
                if (zf < layer.minZoom) continue

                //get layer dataset component
                /** @type {import('./DatasetComponent').DatasetComponent|undefined} */
                const dsc = layer.getDatasetComponent(zf)
                if (!dsc) continue

                //launch data download, if necessary
                if (strong)
                    dsc.getData(this.cg.extGeo, () => {
                        this.cg.redraw()
                    })

                //update dataset view cache
                if (strong) dsc.updateViewCache(this.cg.extGeo)

                //set layer alpha and blend mode
                this.cg.ctx.globalAlpha = layer.alpha ? layer.alpha(zf) : 1.0
                this.cg.ctx.globalCompositeOperation = layer.blendOperation(zf)

                //draw cells, style by style
                if (strong)
                    for (const s of layer.styles) {
                        //check if style is visible
                        if (!s.visible) continue
                        if (zf > s.maxZoom) continue
                        if (zf < s.minZoom) continue

                        //set style alpha and blend mode
                        //TODO: multiply by layer alpha ?
                        this.cg.ctx.globalAlpha = s.alpha ? s.alpha(zf) : 1.0
                        this.cg.ctx.globalCompositeOperation = s.blendOperation(zf)

                        s.draw(dsc.getViewCache(), dsc.getResolution(), this.cg)
                    }

                //add legend element
                if (this.legend && strong) {
                    for (const s of layer.styles) {
                        if (zf > s.maxZoom) continue
                        if (zf < s.minZoom) continue
                        for (const lg of s.legends) {
                            //console.log(s, lg)
                            //this.legend.append(lg.div)
                            //s1.node().appendChild(s2.node())
                            this.legend.node().append(lg.div.node())
                        }

                        //case for styles of styles, like kernel smoothing
                        //TODO do better
                        if (s['styles']) {
                            for (const s2 of s.styles) {
                                if (zf > s2.maxZoom) continue
                                if (zf < s2.minZoom) continue
                                for (const lg of s2.legends) {
                                    //console.log(s, lg)
                                    //this.legend.append(lg.div)
                                    //s1.node().appendChild(s2.node())
                                    this.legend.node().append(lg.div.node())
                                }
                            }
                        }
                    }
                }

                //restore default alpha and blend operation
                this.cg.ctx.globalAlpha = 1.0
                this.cg.ctx.globalCompositeOperation = this.defaultGlobalCompositeOperation
            }

            //draw boundary layer
            //if (strong)
            if (this.showBoundaries && this.boundaryLayer) this.boundaryLayer.draw(this.cg)

            //draw label layer
            //if (strong)
            if (this.showLabels && this.labelLayer) this.labelLayer.draw(this.cg)

            //
            this.canvasSave = null

            if (monitor) monitorDuration('End redraw')

            // listen for resize events on the App's container and handle them
            this.defineResizeObserver(this.container, canvas)

            return this
        }

        /** @type {Array.<BackgroundLayer|BackgroundLayerWMS>} */
        this.bgLayers = []
        /** @type {boolean} */
        this.showBgLayers = true

        /** @type {LabelLayer | undefined} */
        this.labelLayer = undefined
        /** @type {boolean} */
        this.showLabels = true

        /** @type {LineLayer | undefined} */
        this.boundaryLayer = undefined
        /** @type {boolean} */
        this.showBoundaries = true

        // legend div
        this.legendDivId = opts.legendDivId || 'gvizLegend'
        this.legend = select('#' + this.legendDivId)
        if (this.legend.empty()) {
            this.legend = select(
                this.container.id && this.container.id != '' ? '#' + this.container.id : 'body'
            )
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

        //tooltip

        // set App container as default parent element for tooltip
        if (!opts.tooltip) opts.tooltip = {}
        if (!opts.tooltip.parentElement) opts.tooltip.parentElement = this.container

        /**
         * @private
         * @type {Tooltip} */
        this.tooltip = new Tooltip(opts.tooltip)

        /** @param {MouseEvent} e */
        const focusCell = (e) => {
            //compute mouse geo position
            const mousePositionGeo = {
                x: this.cg.pixToGeoX(e.offsetX + this.tooltip.xMouseOffset),
                y: this.cg.pixToGeoY(e.offsetY + this.tooltip.yMouseOffset),
            }
            /** @type {{cell:import('./Dataset').Cell,html:string,resolution:number} | undefined} */
            const focus = this.getCellFocusInfo(mousePositionGeo)

            // transparent background (e.g. leaflet) 'red painting' fix
            if (opts.transparentBackground) {
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
                this.canvasSave.getContext('2d').drawImage(this.cg.canvas, 0, 0)
                this.cg.initCanvasTransform()
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
                    this.canvasSave.getContext('2d').drawImage(this.cg.canvas, 0, 0)
                } else {
                    this.cg.ctx.drawImage(this.canvasSave, 0, 0)
                }

                //draw image saved + draw rectangle
                const rectWPix = this.selectionRectangleWidthPix
                    ? this.selectionRectangleWidthPix(focus.resolution, this.getZoomFactor())
                    : 4
                this.cg.initCanvasTransform()
                this.cg.ctx.strokeStyle = this.selectionRectangleColor
                this.cg.ctx.lineWidth = rectWPix
                this.cg.ctx.beginPath()

                this.cg.ctx.rect(
                    this.cg.geoToPixX(focus.cell.x) - rectWPix / 2,
                    this.cg.geoToPixY(focus.cell.y) + rectWPix / 2,
                    focus.resolution / this.getZoomFactor() + rectWPix,
                    -focus.resolution / this.getZoomFactor() - rectWPix
                )
                this.cg.ctx.stroke()
            } else {
                this.tooltip.hide()
                if (this.canvasSave) this.cg.ctx.drawImage(this.canvasSave, 0, 0)
            }
        }

        // add event listeners to container
        this.mouseOverHandler = (e) => focusCell(e)
        this.mouseMoveHandler = (e) => focusCell(e)
        this.mouseOutHandler = (e) => this.tooltip.hide()
        this.cg.canvas.addEventListener('mouseover', this.mouseOverHandler)
        this.cg.canvas.addEventListener('mousemove', this.mouseMoveHandler)
        this.cg.canvas.addEventListener('mouseout', this.mouseOutHandler)

        // add extra logic to onZoomStartFun
        this.cg.onZoomStartFun = (e) => {
            if (opts.onZoomStartFun) opts.onZoomStartFun(e)
            this.tooltip.hide()
        }

        //for mouse over
        /**
         * @private
         * @type {HTMLCanvasElement|null} */
        this.canvasSave = null

        this.selectionRectangleColor = opts.selectionRectangleColor || 'red'
        this.selectionRectangleWidthPix = opts.selectionRectangleWidthPix || (() => 4) //(r,zf) => {}

        //
        //canvas.addEventListener("keydown", e => { console.log(arguments) });

        //set default globalCompositeOperation
        this.defaultGlobalCompositeOperation =
            opts.defaultGlobalCompositeOperation || this.cg.ctx.globalCompositeOperation
    }

    /**
     * @param {number} marginPx
     * @returns {import('./Dataset').Envelope}
     * @public
     */
    updateExtentGeo(marginPx = 20) {
        return this.cg.updateExtentGeo(marginPx)
    }

    /**
     * Return the cell HTML info at a given geo position.
     * This is usefull for user interactions, to show this info where the user clicks for example.
     *
     * @param {{x:number,y:number}} posGeo
     * @returns {{cell:import('./Dataset').Cell,html:string,resolution:number} | undefined}
     * @protected
     */
    getCellFocusInfo(posGeo) {
        //go through the layers, starting from top
        const zf = this.getZoomFactor()
        for (let i = this.layers.length - 1; i >= 0; i--) {
            /** @type {Layer} */
            const layer = this.layers[i]
            if (!layer.visible) continue
            if (!layer.cellInfoHTML) continue
            //if (layer.cellInfoHTML === 'none') continue
            const dsc = layer.getDatasetComponent(zf)
            if (!dsc) continue

            //get cell at mouse position
            /** @type {import('./Dataset').Cell|undefined} */
            const cell = dsc.getCellFromPosition(posGeo, dsc.getViewCache())
            //console.log(cell, dsc.resolution)
            if (!cell) return undefined
            const html = layer.cellInfoHTML(cell, dsc.getResolution())
            if (!html) return undefined
            return { cell: cell, html: html, resolution: dsc.getResolution() }
        }
    }

    //getters and setters

    /** @returns {{x:number,y:number}} */
    getGeoCenter() {
        return this.cg.getCenter()
    }
    /** @param {{x:number,y:number}} val @returns {this} */
    setGeoCenter(val) {
        this.cg.setCenter(val)
        return this
    }

    /** @returns {number} */
    getZoomFactor() {
        return this.cg.getZf()
    }
    /** @param {number} val @returns {this} */
    setZoomFactor(val) {
        this.cg.setZf(val)
        return this
    }

    /** @returns {Array.<number>} */
    getZoomFactorExtent() {
        return this.cg.getZfExtent()
    }
    /** @param {Array.<number>} val @returns {this} */
    setZoomFactorExtent(val) {
        this.cg.setZfExtent(val)
        return this
    }

    /** @returns {string} */
    getBackgroundColor() {
        return this.cg.backgroundColor
    }
    /** @param {string} val @returns {this} */
    setBackgroundColor(val) {
        this.cg.backgroundColor = val
        return this
    }

    /** @returns {LineLayer | undefined} */
    getBoundaryLayer() {
        return this.boundaryLayer
    }
    /** @param {object} opts @returns {this} */
    setBoundaryLayer(opts) {
        this.boundaryLayer = new LineLayer(opts)
        return this
    }

    /** @returns {LabelLayer | undefined} */
    getLabelLayer() {
        return this.labelLayer
    }
    /** @param {object} opts @returns {this} */
    setLabelLayer(opts) {
        this.labelLayer = new LabelLayer(opts)
        return this
    }

    /** @returns {this} */
    redraw() {
        this.cg.redraw()
        return this
    }

    /**
     * Add a layer to the app.
     *
     * @param {Dataset} dataset The dataset of the layer
     * @param {Array.<import('./Style').Style>} styles The styles of the layer
     * @param {{visible?:boolean,minZoom?:number,maxZoom?:number,pixNb?:number,cellInfoHTML?:function(import('./Dataset').Cell):string}} opts The layer options.
     * @returns {this}
     */
    addLayerFromDataset(dataset, styles, opts) {
        const lay = new Layer(dataset, styles, opts)
        this.layers.push(lay)
        return this
    }

    //dataset creation

    /**
     * Make a local grid dataset.
     *
     * @param {number} resolution The dataset resolution in geographical unit.
     * @param {Array} cells The cells.
     * @param {object=} opts The parameters of the dataset.
     * @returns {Dataset}
     */
    makeLGridDataset(resolution, cells, opts) {
        return new Dataset([new LGrid(resolution, cells)], [], opts)
    }

    /**
     * Make a CSV grid dataset.
     *
     * @param {string} url The URL of the dataset.
     * @param {number} resolution The dataset resolution in geographical unit.
     * @param {object=} opts The parameters of the dataset.
     * @returns {Dataset}
     */
    makeCSVGridDataset(url, resolution, opts) {
        return new Dataset(
            [
                new CSVGrid(url, resolution, opts).getData(undefined, () => {
                    this.cg.redraw()
                }),
            ],
            [],
            opts
        )
    }

    /**
     * Make a tiled grid dataset.
     *
     * @param {string} url
     * @param {{preprocess?:function(import('./Dataset').Cell):boolean}} opts
     * @returns {Dataset}
     */
    makeTiledGridDataset(url, opts) {
        return new Dataset(
            [
                new TiledGrid(url, this, opts).loadInfo(() => {
                    this.cg.redraw()
                }),
            ],
            [],
            opts
        )
    }

    //multi scale dataset creation

    /**
     * Make a multi scale CSV grid dataset.
     *
     * @param {Array.<number>} resolutions
     * @param {function(number):string} resToURL
     * @param {{preprocess?:function(import('./Dataset').Cell):boolean}} opts
     * @returns {Dataset}
     */
    makeMultiScaleCSVGridDataset(resolutions, resToURL, opts) {
        return Dataset.make(
            resolutions,
            (res) =>
                new CSVGrid(resToURL(res), res, opts).getData(undefined, () => {
                    this.cg.redraw()
                }),
            opts
        )
    }

    //tiled multiscale

    /**
     * Make a multi scale tiled grid dataset.
     *
     * @param {Array.<number>} resolutions
     * @param {function(number):string} resToURL
     * @param {{preprocess?:function(import('./Dataset').Cell):boolean}} opts
     * @returns {Dataset}
     */
    makeMultiScaleTiledGridDataset(resolutions, resToURL, opts) {
        return Dataset.make(
            resolutions,
            (res) =>
                new TiledGrid(resToURL(res), this, opts).loadInfo(() => {
                    this.cg.redraw()
                }),
            opts
        )
    }

    // direct layer creation

    /**
     * Add a layer from a CSV grid dataset.
     *
     * @param {string} url The URL of the dataset.
     * @param {number} resolution The dataset resolution in geographical unit.
     * @param {Array.<import('./Style').Style>} styles The styles, ordered in drawing order.
     * @param {object=} opts The parameters of the dataset and layer.
     * @returns {this}
     */
    addCSVGridLayer(url, resolution, styles, opts) {
        const ds = this.makeCSVGridDataset(url, resolution, opts)
        return this.addLayerFromDataset(ds, styles, opts)
    }

    /**
     *
     * @param {string} url
     * @param {Array.<import('./Style').Style>} styles
     * @param {{visible?:boolean,minZoom?:number,maxZoom?:number,pixNb?:number,cellInfoHTML?:function(import('./Dataset').Cell):string, preprocess?:function(import('./Dataset').Cell):boolean}} opts
     * @returns {this}
     */
    addTiledGridLayer(url, styles, opts) {
        const ds = this.makeTiledGridDataset(url, opts)
        return this.addLayerFromDataset(ds, styles, opts)
    }

    /**
     * Add a layer from a CSV grid dataset.
     *
     * @param {Array.<number>} resolutions
     * @param {function(number):string} resToURL
     * @param {Array.<import('./Style').Style>} styles The styles, ordered in drawing order.
     * @param {object=} opts The parameters of the dataset and layer.
     * @returns {this}
     */
    addMultiScaleCSVGridLayer(resolutions, resToURL, styles, opts) {
        const ds = this.makeMultiScaleCSVGridDataset(resolutions, resToURL, opts)
        return this.addLayerFromDataset(ds, styles, opts)
    }

    /**
     * @param {Array.<number>} resolutions
     * @param {function(number):string} resToURL
     * @param {Array.<import('./Style').Style>} styles
     * @param {{visible?:boolean,minZoom?:number,maxZoom?:number,pixNb?:number,cellInfoHTML?:function(import('./Dataset').Cell):string, preprocess?:function(import('./Dataset').Cell):boolean}} opts
     * @returns {this}
     */
    addMultiScaleTiledGridLayer(resolutions, resToURL, styles, opts) {
        const ds = this.makeMultiScaleTiledGridDataset(resolutions, resToURL, opts)
        return this.addLayerFromDataset(ds, styles, opts)
    }

    /**
     * Add a background layer to the app.
     *
     * @param {object} opts
     * @returns {this}
     */
    addBackgroundLayer(opts) {
        this.bgLayers.push(new BackgroundLayer(opts))
        this.redraw()
        return this
    }

    /**
     * Add a WMS background layer to the app.
     *
     * @param {object} opts
     * @returns {this}
     */
    addBackgroundLayerWMS(opts) {
        this.bgLayers.push(new BackgroundLayerWMS(opts))
        this.redraw()
        return this
    }

    /**
     *
     * @param {string} id
     * @param {object} opts
     * @returns {this}
     */
    addZoomSlider(id, opts) {
        this.cg.addZoomSlider(id, opts)
        return this
    }

    /**
     * Adds a set of zoom buttons to the app
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
            app: this,
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
        // * opts.app - the gridviz app
        // * opts.id
        // * opts.x
        // * opts.y

        this.fullscreenButton = new FullscreenButton({
            app: this,
            id: opts?.id || 'gridviz-fullscreen-button',
            class: opts?.class,
            x: opts?.x,
            y: opts?.y
        })

        return this
    }

    /** @returns {this} */
    setViewFromURL() {
        this.cg.setViewFromURL()
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
                    // update the app and canvas size
                    if (this.h !== container.clientHeight || this.w !== container.clientWidth) {
                        this.h = container.clientHeight
                        this.w = container.clientWidth
                        this.cg.h = container.clientHeight
                        this.cg.w = container.clientWidth
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
     * @description Destroy the app and it's event listeners
     * This should significantly reduce the memory used when creating and destroying gridviz app instances (for example in leaflet-gridviz)
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
        this.cg.canvas.remove()

        // remove legend
        this.legend?.remove()

        // remove tooltip
        this.tooltip.tooltip?.remove()
    }
}
