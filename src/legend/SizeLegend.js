//@ts-check

import { Legend } from "../Legend";
import { format } from "d3-format";
import { ShapeColorSizeStyle } from "../style/ShapeColorSizeStyle"

/**
 * A legend element for proportional symbols.
 * 
 * @author Joseph Davies, Julien Gaffuri
 */
export class SizeLegend extends Legend {

    /** @param {Object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {};

        //exageration
        this.exaggerationFactor = opts.exaggerationFactor || 0.8

        //symbol
        /** 
         * @private
         * @type {import("../Style").Shape} */
        this.shape = opts.shape || "circle"
        this.fillColor = opts.fillColor || "none"
        this.strokeColor = opts.strokeColor || "gray"
        this.strokeWidth = opts.strokeWidth || 1

        //label
        this.labelFontSize = opts.labelFontSize || "0.8em"
        this.labelUnitText = opts.labelUnitText || ""
        this.labelFormat = opts.labelFormat || ",.2r"

        //
        //this.div.style("text-align", "center")
    }

    /**
     * @param {{ style: ShapeColorSizeStyle, r: number, zf: number, sSize: import("../Style").Stat, sColor: import("../Style").Stat }} opts 
     */
    update(opts) {

        //could happen when data is still loading
        if (!opts.sSize) return

        //clear
        this.div.selectAll("*").remove();

        //get max value
        const value_ = opts.sSize.max * this.exaggerationFactor

        //take 'nice' value (power of ten, or multiple)
        let pow10 = Math.log10(value_)
        pow10 = Math.floor(pow10)
        let value = Math.pow(10, pow10)
        if (value * 8 <= value_) value *= 8
        else if (value * 6 <= value_) value *= 6
        else if (value * 5 <= value_) value *= 5
        else if (value * 4 <= value_) value *= 4
        else if (value * 2.5 <= value_) value *= 2.5
        else if (value * 2 <= value_) value *= 2

        const d = this.div.append("div")
            //to enable vertical centering
            //.style("position", "relative")

        //compute size of symbol, in pix
        const size = opts.style.size(value, opts.r, opts.sSize, opts.zf) / opts.zf;

        const svg = d.append("svg").attr("width", size + this.strokeWidth + 2).attr("height", size + this.strokeWidth + 2)
            .style("", "inline-block")

        if (this.shape === "square") {
            svg.append("rect")
                .attr("x", 0).attr("y", 0).attr("width", size).attr("height", size)
                .style("fill", this.fillColor)
                .style("stroke", this.strokeColor)
                .style("stroke-width", this.strokeWidth)
            //TODO test
        } else if (this.shape === "circle") {
            // <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
            const r = (size + this.strokeWidth) * 0.5
            svg.append("circle")
                .attr("cx", r + 1).attr("cy", r + 1).attr("r", r)
                .style("fill", this.fillColor)
                .style("stroke", this.strokeColor)
                .style("stroke-width", this.strokeWidth)
        } else if (this.shape === "donut") {
            //TODO
        } else if (this.shape === "diamond") {
            //TODO
        } else {
            throw new Error('Unexpected shape:' + this.shape);
        }

        const valueT = format(this.labelFormat)(value);
        d.append("div")
            //show on right of graphic
            .style("display", "inline")

            //center vertically
            //.style("position", "absolute").style("top", "0").style("bottom", "0")

            .style("padding-left", "5px")
            .style("font-size", this.labelFontSize)
            .text(valueT + (this.labelUnitText ? " " : "") + this.labelUnitText)
    }
}
