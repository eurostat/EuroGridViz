//@ts-check

import { Legend } from "../Legend";
import { Style } from "../Style"

/**
 * A legend element for color categrories.
 * 
 * @author Joseph Davies, Julien Gaffuri
 */
export class ColorCategoryLegend extends Legend {

    /** @param {Object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {};

        //col/categories array, in display order
        /** 
         * @private
         * @type {Array.<Array.<string>>} */
        this.colCat = opts.colCat || [["gray", "-"]]

        /** 
         * @private
         * @type {import("../Style").Shape} */
        this.shape = opts.shape || "circle"
        this.dimension = opts.dimension || { r: 8 }
        this.strokeColor = opts.strokeColor || "gray"
        this.strokeWidth = opts.strokeWidth || 1

        this.title = opts.title;
        this.titleFontSize = opts.titleFontSize || "0.8em";
        this.titleFontWeight = opts.titleFontWeight || "bold";

        //label
        this.labelFontSize = opts.labelFontSize || "0.8em"

        this.width = opts.width
    }

    /**
     * @param {{ style: Style, r: number, zf: number, sSize: import("../Style").Stat, sColor: import("../Style").Stat }} opts 
     */
    update(opts) {

        //clear
        this.div.selectAll("*").remove();


        //build

        //title
        if (this.title) {
            const d = this.div.append("div")
                .style("font-size", this.titleFontSize)
                .style("font-weight", this.titleFontWeight)
                .style("margin-bottom", "7px")
            if (this.width) d.style("width", this.width)
            d.text(this.title)
        }

        //cztegories
        const nb = this.colCat.length
        if (nb == 0) return

        for (let i = 0; i < nb; i++) {
            const cat = this.colCat[i]

            //make div for category
            const d = this.div.append("div")
                //to enable vertical centering
                .style("position", "relative")

            const sw = this.strokeWidth

            //draw graphic element: box / circle
            if (this.shape === "square") {
                const h = (this.dimension.h || 15)
                const w = (this.dimension.w || 20)
                d
                    .append("div").style("display", "inline")

                    .append("svg")
                    .attr("width", w + 2 * sw).attr("height", h + 2 * sw)

                    .append("rect")
                    .attr("x", sw).attr("y", sw).attr("width", w).attr("height", h)
                    .style("fill", cat[0])
                    .style("stroke", this.strokeColor)
                    .style("stroke-width", this.strokeWidth)
            } else if (this.shape === "circle") {
                const r = this.dimension.r || 8
                const h = 2 * r + 2 * sw
                d
                    .append("div").style("display", "inline")

                    .append("svg")
                    .attr("width", h).attr("height", h)

                    .append("circle")
                    .attr("cx", r + sw).attr("cy", r + sw).attr("r", r)
                    .style("fill", cat[0])
                    .style("stroke", this.strokeColor)
                    .style("stroke-width", this.strokeWidth)
            } else {
                throw new Error('Unexpected shape:' + this.shape);
            }

            //write label text
            d.append("div")
                //show on right of graphic
                .style("display", "inline")

                //center vertically
                .style("position", "absolute").style("top", "0").style("bottom", "0")

                .style("padding-left", "5px")
                .style("font-size", this.labelFontSize)
                .text(cat[1])
        }

    }

}
