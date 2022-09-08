//@ts-check

import { select } from "d3-selection";
import { Legend } from "../Legend";
import { format } from "d3-format";
import { Style, Stat } from "../Style"

/**
 * A legend element for continuous color style.
 * Inspiration: https://observablehq.com/@d3/color-legend
 * 
 * @author Joseph Davies, Julien Gaffuri
 */
export class ColorLegend extends Legend {

    /** @param {Object} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {};

        this.colorRamp = opts.colorRamp

        //function (t[0,1], r, s) -> v (for label text)
        this.fun = opts.fun

        this.title = opts.title;
        this.tickSize = opts.tickSize || 6
        this.width = opts.width || 300
        this.height = opts.height || 15
        this.margin = opts.margin || 5
        this.ticks = opts.ticks || Math.floor(this.width / 50)
        this.tickFormat = opts.tickFormat || ".0f"
        this.tickUnit = opts.tickUnit

        this.fontSize = opts.fontSize || "0.8em"
        this.invert = opts.invert

    }

    /**
     * @param {{ style: Style, r: number, zf: number, sSize: Stat, sColor: Stat }} opts 
     */
    update(opts) {

        //could happen when data is still loading
        if (!opts.sColor) return


        //clear
        this.div.selectAll("*").remove();




        const titleHeight = 12

        const svgW = this.width + 2 * this.margin
        const svgH = this.height + 3 * this.margin + titleHeight + this.tickSize + 10
        const svg = this.div.append("svg").attr("width", svgW).attr("height", svgH)
        //  <rect width="300" height="100" style="fill:rgb(0,0,255);stroke-width:3;stroke:rgb(0,0,0)" />

        //title
        svg.append("text").attr("x", this.margin).attr("y", this.margin)
            .style("font-size", "0.8em")
            .style("font-weight", "bold")
            .style("alignment-baseline", "top")
            .style("dominant-baseline", "hanging")
            .style("pointer-events", "none")
            .text(this.title)

        const g = svg.append("g").attr("transform", "translate(" + this.margin + " " + (2 * this.margin + titleHeight) + ")")

        //draw color bar
        const w = this.width, h = this.height
        const step = 5
        for (let i = 0; i < w; i += step) {
            let t = i / (w - 1)
            if (this.invert) t = 1 - t
            g.append("rect").attr("x", i).attr("y", 0).attr("width", step).attr("height", h).style("fill", this.colorRamp(t))
        }


        for (let i = 0; i < this.ticks; i++) {
            let t = i / (this.ticks - 1)

            //tick line
            g.append("line").attr("x1", w * t).attr("y1", 0).attr("x2", w * t).attr("y2", h + this.tickSize).style("stroke", "black")

            //prepare tick label
            g.append("text")
                .attr("id", "ticklabel_" + i)
                .attr("x", w * t)
                .attr("y", h + this.tickSize + 2)
                .style("font-size", this.fontSize)
                //.style("font-weight", "bold")
                //.style("font-family", "Arial")
                .style("text-anchor", i == 0 ? "start" : i == (this.ticks - 1) ? "end" : "middle")
                .style("alignment-baseline", "top")
                .style("dominant-baseline", "hanging")
                .style("pointer-events", "none")
            //.text("-")
        }





        //update tick labels

        //label text format
        const f = this.tickFormat && this.tickFormat != "text" ? format(this.tickFormat) : (v) => v;
        for (let i = 0; i < this.ticks; i++) {
            let t = i / (this.ticks - 1)

            const v = this.fun(t, opts.r, opts.sColor)
            const text = (v ? f(v) : "0") + (this.tickUnit ? this.tickUnit : "")

            //tick label
            this.div.select("#" + "ticklabel_" + i).text(text)
        }
    }

}
