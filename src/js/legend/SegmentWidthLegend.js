//@ts-check

import { Legend } from "../Legend";
import { format } from "d3-format";
import { Stat } from "../Style"
import { SegmentStyle } from "../style/SegmentStyle"

/**
 * A legend element for segment width.
 * 
 * @author Joseph Davies, Julien Gaffuri
 */
export class SegmentWidthLegend extends Legend {

    /** @param {Object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {};

        //exageration
        this.exaggerationFactor = opts.exaggerationFactor || 0.5

        //color
        this.color = opts.color || "gray"
        //orienation
        this.orientation = opts.orientation || 0

        //label
        this.labelFontSize = opts.labelFontSize || "0.8em"
        this.labelUnitText = opts.labelUnitText || ""

        //
        this.div.style("text-align", "center")
    }


    /**
     * @param {{ style: SegmentStyle, r: number, zf: number, sColor: Stat, sLength: Stat, sWidth: Stat }} opts 
     */
    update(opts) {

        //could happen when data is still loading
        if (!opts.sWidth) return

        //clear
        this.div.selectAll("*").remove();

        //get max value
        const value_ = opts.sWidth.max * this.exaggerationFactor

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

        //compute segment width and length, in pix
        const sWidth = opts.style.getWidth()(value, opts.r, opts.sWidth, opts.zf) / opts.zf;
        const sLength = 1 * opts.r / opts.zf

        //TODO use orientation

        const svg = this.div.append("svg").attr("width", sLength).attr("height", sWidth)
            .style("", "inline-block")

        //<line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" />
        svg.append("line")
            .attr("x1", 0).attr("y1", sWidth / 2)
            .attr("x2", sLength).attr("y2", sWidth / 2)
            .style("stroke", this.color)
            .style("stroke-width", sWidth)

        const valueT = format(",.2r")(value);
        this.div.append("div")
            .style("font-size", this.labelFontSize)
            //.style("font-weight", "bold")
            .style("", "inline-block")
            .text(valueT + (this.labelUnitText ? " " : "") + this.labelUnitText)
    }
}
