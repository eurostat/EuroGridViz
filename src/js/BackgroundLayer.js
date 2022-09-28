//@ts-check

import { GeoCanvas } from "./GeoCanvas";

/**
 * 
 * @author Julien Gaffuri
 */
export class BackgroundLayer {

    /**
     * @param {object} opts 
     */
    constructor(opts) {
        opts = opts || {};

        /** An attribute to specify if a layer should be drawn or not
         * @type {boolean} */
        this.visible = opts.visible == false ? false : true;

        /** The minimum zoom factor: Below this level, the layer is not shown.
         * @type {number} */
        this.minZoom = opts.minZoom || 0;

        /** The maximum zoom factor: Above this level, the layer is not shown.
         * @type {number} */
        this.maxZoom = opts.maxZoom || Infinity;

        //ensure acceptable values for the zoom limits.
        if (this.minZoom >= this.maxZoom)
            throw new Error("Unexpected zoom limits for layer. Zoom min should be smaller than zoom max.")

        /** The image cache, indexed by z/y/x */
        this.cache = {}



        /**
         * @type {string} */
        this.url = opts.url
        /** @type {function(number,number,number):string} */
        this.urlFun = opts.urlFun || ((x, y, z) => this.url + z + "/" + x + "/" + y + ".png")

        /** @type {Array.<number>} */
        this.resolutions = opts.resolutions
        if (!this.resolutions || this.resolutions.length == 0)
            throw new Error("No resolutions provided for background layer")

        /** @type {number} */
        this.nbPix = opts.nbPix || 256
        /** CRS coordinates of top left corner
         * @type {Array.<number>} */
        this.origin = opts.origin || [0, 0]
        /** @type {number} */
        this.z0 = opts.z0 || 0

        /** @type {function(number):string} */
        this.filterColor = opts.filterColor
    }

    /**
     * Get z/x/y cache data.
     * @param {number} z 
     * @param {number} x 
     * @param {number} y 
     * @returns {HTMLImageElement|string|undefined}
     * @private
     */
    get(z, x, y) {
        let d = this.cache[z];
        if (!d) return;
        d = d[x];
        if (!d) return;
        return d[y];
    }

    /**
     * Get z/x/y cache data.
     * @param {HTMLImageElement|string} img
     * @param {number} z 
     * @param {number} x 
     * @param {number} y 
     * @returns
     * @private
     */
    put(img, z, x, y) {
        if (!this.cache[z]) this.cache[z] = {}
        if (!this.cache[z][x]) this.cache[z][x] = {}
        this.cache[z][x][y] = img
    }

    /**
     * @param {GeoCanvas} cg The canvas where to draw the layer.
     * @returns {void}
     */
    draw(cg) {

        if (!this.resolutions || this.resolutions.length == 0) {
            console.error("No resolutions provided for background layer")
            return
        }

        //
        const zf = cg.getZf()
        const x0 = this.origin[0], y0 = this.origin[1]

        //get zoom level and resolution
        let z = 0
        for (z = 0; z < this.resolutions.length; z++)
            if (this.resolutions[z] < zf) break
        z -= 1
        z = Math.max(0, z)
        z = Math.min(z, this.resolutions.length - 1)
        //console.log(this.resolutions.length, z)
        const res = this.resolutions[z]

        z += this.z0

        const sizeG = this.nbPix * res
        const size = sizeG / zf

        //get tile numbers
        const xGeoToTMS = (x) => Math.ceil((x - x0) / sizeG)
        const yGeoToTMS = (y) => Math.ceil(-(y - y0) / sizeG)
        const xMin = xGeoToTMS(cg.extGeo.xMin) - 1
        const xMax = xGeoToTMS(cg.extGeo.xMax)
        const yMax = yGeoToTMS(cg.extGeo.yMin)
        const yMin = yGeoToTMS(cg.extGeo.yMax) - 1

        //TODO ?
        //cg.setCanvasTransform()

        //handle images
        for (let x = xMin; x < xMax; x++) {
            for (let y = yMin; y < yMax; y++) {

                //get image
                let img = this.get(z, x, y)

                //load image
                if (!img) {
                    const img = new Image()
                    this.put(img, z, x, y)
                    img.onload = () => { cg.redraw(); }
                    img.onerror = () => {
                        //case when no image
                        this.put("failed", z, x, y)
                    }
                    img.src = this.urlFun(x, y, z)
                    continue;
                }

                //case when no image
                if (img === "failed") continue;
                if (!(img instanceof HTMLImageElement)) {
                    console.log(img)
                    continue;
                }

                //draw image
                const xGeo = x0 + x * sizeG
                const yGeo = y0 - y * sizeG
                cg.ctx.drawImage(img, cg.geoToPixX(xGeo), cg.geoToPixY(yGeo), size, size)
                //cg.ctx.drawImage(img, xGeo, yGeo, sizeG, -sizeG)
            }
        }

        //apply filter
        if (this.filterColor) {
            const fc = this.filterColor(zf)
            if (fc && fc != "none") {
                cg.ctx.fillStyle = fc
                cg.ctx.fillRect(0, 0, cg.w, cg.h)
            }
        }

    }

}
