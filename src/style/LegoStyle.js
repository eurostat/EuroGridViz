//@ts-check
'use strict'

import { TanakaStyle } from './TanakaStyle.js'
import { StrokeStyle } from './StrokeStyle.js'
import { SquareColorCategoryWebGLStyle } from './SquareColorCategoryWebGLStyle.js'
import { Style } from '../core/Style.js'

/**
 * @module style
 * @author Julien Gaffuri
 */
export class LegoStyle {
    /**
     * @param {string} col
     * @param {object} opts
     * @returns {Array.<Style>}
     */
    static get(col, opts) {
        opts = opts || {}

        //the colors
        //http://www.jennyscrayoncollection.com/2021/06/all-current-lego-colors.html
        //https://leonawicz.github.io/legocolors/reference/figures/README-plot-1.png
        opts.colors = opts.colors || [
            '#00852b', //darker green
            '#afd246', //light green
            '#fac80a', //dark yellow
            '#bb805a', //brown
            '#d67923', //mostard
            '#cb4e29', //redish
            '#b40000', //red
            '#720012', //dark red
            //"purple",
            //"#eee" //whithe
        ]

        opts.colDark = opts.colDark || '#333'
        opts.colBright = opts.colBright || '#aaa'
        opts.widthFactor = opts.widthFactor || 0.12

        //reuse tanaka as basis
        const ts = TanakaStyle.get(col, opts)
        //style to show limits between pieces
        const sst = new StrokeStyle({
            strokeColor: () => '#666',
            strokeWidth: (v, r, s, z) => 0.2 * z,
            filter: opts.filter,
        })

        return [
            ts[0],
            sst,
            ts[1],
            new LegoTopStyle({ colDark: opts.colDark, colBright: opts.colBright, filter: opts.filter }),
        ]
    }

    /**
     * @param {function(string):string} col
     * @param {object} opts
     * @returns {Array.<Style>}
     */
    static getCat(col, opts) {
        opts = opts || {}

        opts.colDark = opts.colDark || '#333'
        opts.colBright = opts.colBright || '#aaa'

        //
        const s = new SquareColorCategoryWebGLStyle({ colorCol: col, color: opts.color })
        //style to show limits between pieces
        const sst = new StrokeStyle({ strokeColor: () => '#666', strokeWidth: (v, r, s, z) => 0.2 * z })

        return [s, sst, new LegoTopStyle({ colDark: opts.colDark, colBright: opts.colBright })]
    }
}

/**
 * A style to draw top circle of lego bricks.
 */
class LegoTopStyle extends Style {
    /** @param {object|undefined} opts */
    constructor(opts) {
        super(opts)
        opts = opts || {}
        this.colDark = opts.colDark || '#333'
        this.colBright = opts.colBright || '#aaa'
    }

    draw(cells, r, cg) {
        //filter
        if (this.filter) cells = cells.filter(this.filter)

        cg.ctx.lineWidth = 0.6 * cg.view.z

        //dark part
        cg.ctx.strokeStyle = this.colDark
        for (let c of cells) {
            cg.ctx.beginPath()
            cg.ctx.arc(c.x + r * 0.5, c.y + r * 0.5, r * 0.55 * 0.5, Math.PI / 4, -Math.PI * (3 / 4), true)
            cg.ctx.stroke()
        }

        //bright part
        cg.ctx.strokeStyle = this.colBright
        for (let c of cells) {
            cg.ctx.beginPath()
            cg.ctx.arc(c.x + r * 0.5, c.y + r * 0.5, r * 0.55 * 0.5, Math.PI / 4, -Math.PI * (3 / 4), false)
            cg.ctx.stroke()
        }
    }
}
