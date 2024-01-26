import * as d3 from "d3";

export class TinyChart {
    constructor(_config) {
        this.width = 20
        this.height = 28

        this.margin = {top: 0}
        this.numericLabelHeight = 8
        this.barWidth = 4
        this.barMaxHeight = this.height - this.numericLabelHeight
        this.color = d3.interpolateViridis

        this._scale = d3.scaleLinear()
            .domain([0, 0.4]) //TODO: This should be adjusted as a config. The whole scale

            .range([0.85, 0]) // Reversed to make low values bright
                                 // 0.2 because lower values are too bright
                                // to be read against a white background

    }

    tinyChart(selection) {
        const self = this // Propegate the reference to the object
                         // each will overwrite 'this'

        selection.each(function (d, i) {

                let value = parseFloat(d.value)
                let svg = d3.select(this)
                    .insert('svg', ':first-child')
                    .style("pointer-events", "none")
                    .attr("width", self.width)
                    .attr("height", self.height)
                    .style('margin-left','1px')
                    .style('float', 'left')
                    .append('g')

                  let normalizeHeightScale  = d3.scaleLinear()
                    .domain([0, 0.3])
                    .range([0, 1])

                // Probability bar
                // console.log('prob', d.prob, 'log ', Math.log10(d.prob))
                const prob_height = normalizeHeightScale(value * self.barMaxHeight)
                svg.append("rect")
                    .style("pointer-events", "none")
                    .attr("y",
                        self.height - self.numericLabelHeight
                        - prob_height)
                    .attr("fill", self.color(self.scale(value)))
                    // .attr("fill", '#ec008cbb')
                    .attr("width", self.barWidth)
                    .attr("height", (d, i) => {
                        if (parseFloat(d.value) === -1)
                            return 0
                        else
                            return prob_height
                    })
                    .attr("stroke-width", 0)
                    .attr("stroke", '#333')
                    .attr("alignment-baseline", "top")

                // Probability score text
                const format_prob = (value * 100)
                    .toFixed(2) + '%'

                svg.append('text')
                    .attr("x", 0)
                    .attr("y", self.barMaxHeight +
                        self.numericLabelHeight - 1)
                    .text(format_prob)
                    // .attr("fill", "#EC008Cbb")
                    .attr("fill", (d, i) => {
                        if (parseFloat(d.value) === -1)
                            return "white"
                        else
                            return self.color(self.scale(value))
                    })
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "6px")
                    .attr("text-anchor", "left")
                    .attr("alignment-baseline", "top")
                    .attr('probability', value)
                    .style("pointer-events", "none")
            }
        )
    }

    scale(v){
        return this._scale(v)
    }

}