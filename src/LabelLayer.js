//@ts-check

import { csv } from "d3-fetch";

/** A label. The name is the text to show. (x,y) are the coordinates in the same CRS as the grid.
 * @typedef {{name: string, x:number, y:number }} Label */

/**
 * A (generic) layer for placename labels, to be shown on top of the grid layers.
 * The input is a CSV file with the position (x, y) of the labels and name + some other info on the label importance.
 * If the label data is not in the expected format or in the same CRS as the grid, it can be corrected with the "preprocess" function.
 * The selection of the label, their style (font, weight, etc.) and color can be specified depending on their importance and the zoom level.
 * 
 * @author Joseph Davies, Julien Gaffuri
 */
export class LabelLayer {

    /**
     * @param {object} opts 
     */
    constructor(opts) {
        opts = opts || {};

        /** 
         * The URL of the label data, as CSV file.
         * The file should contain the information for each label such as the text, the position and other information for the display of the label according to the zoom level.
         * If necessary, this data can be reformated with the 'preprocess' parameter.
         * @private
         * @type {string} */
        this.url = opts.url

        /** Specify if and how a label should be drawn, depending on its importance and the zoom level.
         * @private
         * @type {function(Label,number):string} */
        this.style = opts.style || (() => "bold 1em Arial")

        /** Specify the label color, depending on its importance and the zoom level.
         * @private
         * @type {function(Label,number):string} */
        this.color = opts.color || (opts.dark ? () => "#ddd" : () => "#222")

        /** Specify the label halo color, depending on its importance and the zoom level.
         * @private
         * @type {function(Label,number):string} */
        this.haloColor = opts.haloColor || (opts.dark ? () => "#000000BB" : () => "#FFFFFFBB")

        /** Specify the label halo width, depending on its importance and the zoom level.
        * @private
        * @type {function(Label,number):number} */
        this.haloWidth = opts.haloWidth || (() => 4)

        /** The anchor where to draw the text, from label position. See HTML-canvas textAlign property.
         * "left" || "right" || "center" || "start" || "end"
         * @private
         * @type {CanvasTextAlign} */
        this.textAlign = opts.textAlign || "start"

        /**
        * @private
        * @type {Array.<number>} */
        this.offsetPix = opts.offsetPix || [5, 5]

        /** 
         * A preprocess to run on each label after loading.
         * It can be used to apply some specific treatment before, format the label data, project coordinates, etc.
         * Return false if the label should not be kept.
         * @private
         * @type {function(Label):boolean} */
        this.preprocess = opts.preprocess

        /** 
         * @private
         * @type {Array.<Label> | undefined} */
        this.labels

        /** 
         * @private
         * @type {string} */
        this.loadingStatus = "notLoaded"
    }


    /**
     * Draw the label layer.
     * 
     * @param {import("./GeoCanvas").GeoCanvas} cg The canvas where to draw the layer.
     * @returns {void}
     */
    draw(cg) {

        //load labels, if not done yet.
        if (!this.labels) {
            this.load(cg.redraw);
            return;
        }

        //zoom factor
        const zf = cg.getZf()

        //text align
        cg.ctx.textAlign = this.textAlign || "start";

        //line join and cap
        cg.ctx.lineJoin = "bevel" //|| "round" || "miter";
        cg.ctx.lineCap = "butt" //|| "round" || "square";

        //draw in pix coordinates
        cg.initCanvasTransform()

        //draw labels, one by one
        for (const lb of this.labels) {

            //get label style
            const st = this.style(lb, zf);
            if (!st) continue;
            cg.ctx.font = st;

            //check label within the view, to be drawn
            if (!cg.toDraw(lb)) continue;

            //position
            const xP = cg.geoToPixX(lb.x) + this.offsetPix[0]
            const yP = cg.geoToPixY(lb.y) - this.offsetPix[1]

            //label stroke, for the halo
            if (this.haloColor && this.haloWidth) {
                const hc = this.haloColor(lb, zf);
                const hw = this.haloWidth(lb, zf);
                if (hc && hw && hw > 0) {
                    cg.ctx.strokeStyle = hc;
                    cg.ctx.lineWidth = hw;
                    cg.ctx.strokeText(lb.name, xP, yP);
                }
            }

            //label fill
            if (this.color) {
                const col = this.color(lb, zf);
                if (col) {
                    cg.ctx.fillStyle = col;
                    cg.ctx.fillText(lb.name, xP, yP);
                }

            }
        }
    }

    /**
     * Load data for labels, from URL this.url
     * @param {function():void} callback
     * @private
     */
    load(callback) {

        if (!this.url) {
            console.log("Failed loading labels: No URL specified. " + this.url)
            this.loadingStatus = "failed"
            this.labels = []
            return;
        }

        if (this.loadingStatus === "notLoaded") {
            this.loadingStatus = "loading"
            csv(this.url)
                .then(
                    /** @param {Array.<object>} data */
                    (data) => {

                        //preprocess/filter
                        if (this.preprocess) {
                            this.labels = [];
                            for (const c of data) {
                                const b = this.preprocess(c)
                                if (b == false) continue;
                                this.labels.push(c)
                            }
                        } else {
                            //store labels
                            this.labels = data;
                        }

                        this.loadingStatus = "loaded"

                        //redraw
                        if (callback) callback()
                    })
                .catch(() => {
                    console.log("Failed loading labels from " + this.url)
                    this.labels = []
                    this.loadingStatus = "failed"
                });
        }
    }

}
