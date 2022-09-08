//@ts-check

import { DatasetComponent } from "../DatasetComponent"
import { Cell, Envelope } from "../Dataset"
import { fromUrl } from "geotiff"

/**
 * A dataset composed of a single GeoTiff file.
 * 
 * @author Joseph Davies, Julien Gaffuri
 */
export class GeoTIFF extends DatasetComponent {

    /**
     * @param {string} url The URL of the dataset.
     * @param {number} resolution The dataset resolution in geographical unit.
     * @param {{preprocess?:(function(Cell):void)}} opts 
     */
    constructor(url, resolution, opts = {}) {
        super(url, resolution, opts)

        /**
         * @private
         * @type {Array.<Cell>} */
        this.cells = [];

        /**  @type {string} @private  */
        this.infoLoadingStatus = "notLoaded";
    }


    /**
     * Request data within a geographic envelope.
     * 
     * @param {Envelope|undefined} e 
     * @param {function():void} redraw 
     */
    getData(e, redraw) {

        //check if data already loaded
        if (this.infoLoadingStatus != "notLoaded") return this;

        //load data
        this.infoLoadingStatus = "loading";


        fromUrl(this.url)
            .then(tiff => {
                console.log(tiff);

                (async function () {
                    const image = await tiff.getImage();
                    const width = image.getWidth();
                    const height = image.getHeight();
                    const tileWidth = image.getTileWidth();
                    const tileHeight = image.getTileHeight();
                    const samplesPerPixel = image.getSamplesPerPixel();

                    //for geotiff
                    const origin = image.getOrigin();
                    const resolution = image.getResolution();
                    const bbox = image.getBoundingBox();

                    console.log(image)
                    console.log(width, height)
                    console.log(tileWidth, tileHeight)
                    console.log(samplesPerPixel)
                    console.log(origin)
                    console.log(resolution)
                    console.log(bbox)

                    console.log("-------")

                    const data = await image.readRasters();
                    console.log(data)

                })()

                //convert coordinates in numbers
                //for (const c of data) { c.x = +c.x; c.y = +c.y; }

                //this.cells = data;

                //execute preprocess, if any
                if (this.preprocess) for (const c of this.cells) this.preprocess(c);

                //TODO check if redraw is necessary
                //that is if the dataset belongs to a layer which is visible at the current zoom level

                //execute the callback, usually a draw function
                if (redraw) redraw()

                this.infoLoadingStatus = "loaded";


            })
            .catch(() => {
                //mark as failed
                this.infoLoadingStatus = "failed";
                this.cells = []
            });

        return this;
    }


    /**
     * Fill the view cache with all cells which are within a geographical envelope.
     * 
     * @param {Envelope} extGeo 
     * @returns {void}
     */
    updateViewCache(extGeo) {

        //data not loaded yet
        if (!this.cells) return;

        this.cellsViewCache = []
        for (const cell of this.cells) {
            if (+cell.x + this.resolution < extGeo.xMin) continue;
            if (+cell.x - this.resolution > extGeo.xMax) continue;
            if (+cell.y + this.resolution < extGeo.yMin) continue;
            if (+cell.y - this.resolution > extGeo.yMax) continue;
            this.cellsViewCache.push(cell)
        }
    }

}
