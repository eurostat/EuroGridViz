//@ts-check
'use strict'

/** @typedef { {xMin: number, xMax: number, yMin: number, yMax: number} } Envelope */

/**
 * A viewshed.
 * @typedef {{x: number, y: number, z: number}} View */

import { select } from 'd3-selection'
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom'

/**
 * A HTML canvas for geo data display, enhanced with zoom and pan capabilities.
 *
 * @module core
 * @author Joseph Davies, Julien Gaffuri
 */
export class GeoCanvas {
    /**
     * @constructor
     * @param {HTMLCanvasElement} canvas
     * @param {number} x The x coordinate of the view
     * @param {number} y The y coordinate of the view
     * @param {number} z The zoom level of the view (pixel size, in ground m)
     * @param {object} opts
     */
    constructor(canvas, x = 0, y = 0, z = 0, opts = undefined) {
        this.opts = opts || {}

        /** @type {HTMLCanvasElement} */
        this.canvas = canvas

        /** @type {number} */
        this.w = this.canvas.offsetWidth
        /** @type {number} */
        this.h = this.canvas.offsetHeight

        this.canvas.width = this.w
        this.canvas.height = this.h

        const ctx = this.canvas.getContext('2d')
        if (!ctx) throw 'Impossible to create canvas 2D context'
        /**@type {CanvasRenderingContext2D} */
        this.ctx = ctx

        /** 
         * z: pixel size, in m/pix
         * @type {View}  */
        this.view = { x: x, y: y, z: z }

        /** Background color.
         * @type {string} */
        this.backgroundColor = opts.backgroundColor || 'white'

        /** @type {function(object|undefined):void} */
        this.onZoomStartFun = opts.onZoomStartFun

        /** @type {function(object|undefined):void} */
        this.onZoomEndFun = opts.onZoomEndFun

        /** @type {function(object|undefined):void} */
        this.onZoomFun = opts.onZoomFun

        //current extent
        /** @type {Envelope} */
        this.extGeo = { xMin: NaN, xMax: NaN, yMin: NaN, yMax: NaN }
        this.updateExtentGeo()

        //rely on d3 zoom for pan/zoom
        if (!opts.disableZoom) {
            let tP = zoomIdentity
            const z = d3zoom()
                //to make the zooming a bit faster
                .wheelDelta((e) => -e.deltaY * (e.deltaMode === 1 ? 0.07 : e.deltaMode ? 1 : 0.004))
                .on('zoom', (e) => {
                    const t = e.transform
                    const f = tP.k / t.k
                    if (f == 1) {
                        //pan
                        const dx = tP.x - t.x
                        const dy = tP.y - t.y
                        this.pan(dx * this.view.z, -dy * this.view.z)
                    } else {
                        const se = e.sourceEvent
                        if (se instanceof WheelEvent) {
                            //zoom at the mouse position
                            this.zoom(
                                f,
                                this.pixToGeoX(e.sourceEvent.offsetX),
                                this.pixToGeoY(e.sourceEvent.offsetY)
                            )
                        } else if (se instanceof TouchEvent) {
                            //compute average position of the touches
                            let tx = 0,
                                ty = 0
                            for (let tt of se.targetTouches) {
                                tx += tt.clientX
                                ty += tt.clientY
                            }
                            tx /= se.targetTouches.length
                            ty /= se.targetTouches.length
                            //zoom at this average position
                            this.zoom(f, this.pixToGeoX(tx), this.pixToGeoY(ty))
                        }
                    }
                    tP = t

                    if (this.onZoomFun) this.onZoomFun(e)
                })
                .on('start', (e) => {
                    this.canvasSave.c = document.createElement('canvas')
                    this.canvasSave.c.setAttribute('width', '' + this.w);
                    this.canvasSave.c.setAttribute('height', '' + this.h);
                    this.canvasSave.c.getContext('2d')?.drawImage(this.canvas, 0, 0);
                    this.canvasSave.dx = 0;
                    this.canvasSave.dy = 0;
                    this.canvasSave.f = 1;

                    if (this.onZoomStartFun) this.onZoomStartFun(e)
                })
                .on('end', (e) => {
                    this.redraw()
                    this.canvasSave = { c: null, dx: 0, dy: 0, f: 1 }

                    if (this.onZoomEndFun) this.onZoomEndFun(e)
                })
            z(select(this.canvas))
        }
        //select(this.canvas).call(z);

        /** Zoom extent, to limit zoom in and out
         *  @type {Array.<number>} */
        this.zoomExtent = opts.zoomExtent || [0, Infinity]

        /** Canvas state, to be used to avoid unnecessary redraws on zoom/pan
         *  @type {{c:HTMLCanvasElement|null,dx:number,dy:number,f:number}} */
        this.canvasSave = { c: null, dx: 0, dy: 0, f: 1 }
    }

    /** @returns {View} */
    getView() { return this.view }


    /** @param {Array.<number>} v */
    setZoomExtent(v) {
        this.zoomExtent = v
    }
    /** @returns {Array.<number>} */
    getZoomExtent() {
        return this.zoomExtent
    }

    /** Initialise canvas transform with identity transformation. */
    initCanvasTransform() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

    /** Initialise canvas transform with geo to screen transformation, so that geo objects can be drawn directly in geo coordinates. */
    setCanvasTransform() {
        const k = 1 / this.view.z
        const tx = -this.view.x / this.view.z + this.w * 0.5
        const ty = this.view.y / this.view.z + this.h * 0.5
        this.ctx.setTransform(k, 0, 0, -k, tx, ty)
    }

    /** Get the transformation matrix to webGL screen coordinates, within [-1,1]*[-1,1] */
    getWebGLTransform() {
        const kx = 2.0 / (this.w * this.view.z)
        const ky = 2.0 / (this.h * this.view.z)
        return [kx, 0.0, 0.0, 0.0, ky, 0.0, -kx * this.view.x, -ky * this.view.y, 1.0]
    }

    /** The function specifying how to draw the map. */
    redraw() {
        throw new Error('Method redraw not implemented.')
    }

    /**
     * Clear. To be used before a redraw for example.
     * @param {string} color
     */
    clear(color = 'white') {
        if (this.opts.transparentBackground) {
            this.ctx.clearRect(0, 0, this.w, this.h)
        } else {
            if (this.ctx) this.ctx.fillStyle = color
            this.ctx.fillRect(0, 0, this.w, this.h)
        }
    }

    /**
     * @param {number} dxGeo
     * @param {number} dyGeo
     */
    pan(dxGeo = 0, dyGeo = 0) {
        //TODO force extend to remain
        this.view.x += dxGeo
        this.view.y += dyGeo
        this.updateExtentGeo()

        if (this.canvasSave.c) {
            this.canvasSave.dx -= dxGeo / this.view.z
            this.canvasSave.dy += dyGeo / this.view.z
            this.clear(this.backgroundColor)
            // this doesnt work on mobile https://github.com/eurostat/gridviz/issues/98
            this.ctx.drawImage(this.canvasSave.c, this.canvasSave.dx, this.canvasSave.dy)
        }
    }

    /**
     * Zoom.
     * @param {number} f The , within ]0, Infinity]. 1 is for no change. <1 to zoom-in, >1 to zoom-out.
     * @param {number} xGeo The x geo position fixed in the screen.
     * @param {number} yGeo The y geo position fixed in the screen.
     */
    zoom(f = 1, xGeo = this.view.x, yGeo = this.view.y) {
        //TODO force geo extend to remain

        //trying to zoom in/out beyond limit
        if (this.zoomExtent[0] == this.view.z && f <= 1) return
        if (this.zoomExtent[1] == this.view.z && f >= 1) return

        //ensure zoom extent preserved
        const newZf = f * this.view.z
        if (newZf < this.zoomExtent[0]) f = this.zoomExtent[0] / this.view.z
        if (newZf > this.zoomExtent[1]) f = this.zoomExtent[1] / this.view.z

        this.view.z *= f
        const dxGeo = (xGeo - this.view.x) * (1 - f)
        this.view.x += dxGeo
        const dyGeo = (yGeo - this.view.y) * (1 - f)
        this.view.y += dyGeo
        this.updateExtentGeo()

        if (this.canvasSave.c) {
            this.clear(this.backgroundColor)
            this.canvasSave.f /= f
            this.canvasSave.dx = this.geoToPixX(xGeo) * (1 - this.canvasSave.f)
            this.canvasSave.dy = this.geoToPixY(yGeo) * (1 - this.canvasSave.f)
            this.clear(this.backgroundColor)
            this.ctx.drawImage(
                this.canvasSave.c,
                this.canvasSave.dx,
                this.canvasSave.dy,
                this.canvasSave.f * this.canvasSave.c.width,
                this.canvasSave.f * this.canvasSave.c.height
            )
        }
    }

    /**
     * @param {number} marginPx
     * @returns {Envelope} The envelope of the view, in geo coordinates.
     */
    updateExtentGeo(marginPx = 20) {
        this.extGeo = {
            xMin: this.pixToGeoX(-marginPx),
            xMax: this.pixToGeoX(this.w + marginPx),
            yMin: this.pixToGeoY(this.h + marginPx),
            yMax: this.pixToGeoY(-marginPx),
        }
        return this.extGeo
    }

    /**
     * Check if the object has to be drawn
     *
     * @param {{x:number,y:number}} obj
     */
    toDraw(obj) {
        if (obj.x < this.extGeo.xMin) return false
        if (obj.x > this.extGeo.xMax) return false
        if (obj.y < this.extGeo.yMin) return false
        if (obj.y > this.extGeo.yMax) return false
        return true
    }

    //conversion functions
    /**
     * @param {number} xGeo Geo x coordinate, in m.
     * @returns {number} Screen x coordinate, in pix.
     */
    geoToPixX(xGeo) {
        return (xGeo - this.view.x) / this.view.z + this.w * 0.5
    }
    /**
     * @param {number} yGeo Geo y coordinate, in m.
     * @returns {number} Screen y coordinate, in pix.
     */
    geoToPixY(yGeo) {
        return -(yGeo - this.view.y) / this.view.z + this.h * 0.5
    }
    /**
     * @param {number} x Screen x coordinate, in pix.
     * @returns {number} Geo x coordinate, in m.
     */
    pixToGeoX(x) {
        return (x - this.w * 0.5) * this.view.z + this.view.x
    }
    /**
     * @param {number} y Screen y coordinate, in pix.
     * @returns {number} Geo y coordinate, in m.
     */
    pixToGeoY(y) {
        return -(y - this.h * 0.5) * this.view.z + this.view.y
    }

    /** Get x,y,z elements from URL and assign them to the view. */
    setViewFromURL() {
        const x = GeoCanvas.getParameterByName('x'),
            y = GeoCanvas.getParameterByName('y'),
            z = GeoCanvas.getParameterByName('z')
        if (x != null && x != undefined && !isNaN(+x)) this.view.x = +x
        if (y != null && y != undefined && !isNaN(+y)) this.view.y = +y
        if (z != null && z != undefined && !isNaN(+z)) this.view.z = +z
    }

    /**
     * Get a URL parameter by name.
     *
     * @param {string} name
     * @returns {string | null}
     */
    static getParameterByName(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
            results = regex.exec(location.search)
        return !results ? null : decodeURIComponent(results[1].replace(/\+/g, ' '))
    }
}
