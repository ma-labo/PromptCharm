import * as d3 from "d3";

export class TokenSparkbarBase {
    constructor(_config = {}) {
        this.config = {
            width: _config.width || 30,
            height: _config.height || 30,
            margin: {top: 0, bottom: 0, right: 0, left: 0},
            numericLabelHeight: _config.numericLabelHeight || 10,
            barWidth: _config.barWidth || 4,
            colorInterpolator: _config.colorInterpolator || d3.interpolateViridis,
            colorScaler: _config.colorScaler ||
                d3.scaleLinear()
                    .domain([0, 0.4])
                    .range([0.85, 0]), // Reversed to make low values bright
            display_prob_score: _config.display_prob_score || true
        }

        this.config.barMaxHeight = _config.barMaxHeight ||
            this.config.height - this.config.numericLabelHeight
    }

    draw(selection) {
        const self=this
        selection.each(function (d, i) {
            let value = parseFloat(d.value)
            let svg = d3.select(this)
                .insert('svg', ':first-child')
                // .style("pointer-events", "none")
                .attr("width", self.config.width)
                .attr("height", self.config.height)
                .style('margin-left', '1px')
                .style('float', 'left')
                .append('g')
        })
    }

    update() {
    }
}

export class TokenSparkbar extends TokenSparkbarBase {
    constructor(_config={}) {
        super(_config)
        this.config.normalizeHeightScale =
            _config.normalizeHeightScale ||
            d3.scaleLinear()
                .domain([0, 0.3])
                .range([0, 1])
    }

    draw(selection) {
        const self = this // Propegate the reference to the object
        // each will overwrite 'this'

        selection.each(function (d, i) {
            // console.log('sparkbar', d)
                let value = parseFloat(d.value)
                let svg = d3.select(this)
                    .insert('svg', ':first-child')
                    // .style("pointer-events", "none")
                    .attr("width", self.config.width)
                    .attr("height", self.config.height)
                    .style('margin-left', '1px')
                    .style('float', 'left')
                    .append('g')

                // Probability bar
                // console.log('prob', d.prob, 'log ', Math.log10(d.prob))
                const prob_height = self.config.normalizeHeightScale(value * self.config.barMaxHeight)
                svg.append("rect")
                    .style("pointer-events", "none")
                    .attr("y",
                        self.config.height - self.config.numericLabelHeight
                        - prob_height)
                    .attr("fill", self.config.colorInterpolator(
                        self.config.colorScaler(value)))
                    .attr("width", self.config.barWidth)
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
            if (self.config.display_prob_score){
                const format_prob = (value * 100)
                    .toFixed(2) + '%'
                svg.append('text')
                    .attr("x", 0)
                    .attr("y", self.config.barMaxHeight +
                        self.config.numericLabelHeight - 1)
                    .text(value == 0? '': format_prob)
                    // .attr("fill", "#EC008Cbb")
                    .attr("fill", (d, i) => {
                        if (parseFloat(d.value) === -1)
                            return "white"
                        else
                            return self.config.colorInterpolator(
                                self.config.colorScaler(value))
                    })
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "10px")
                    .attr("text-anchor", "left")
                    .attr("alignment-baseline", "top")
                    .attr('probability', value)
            }
                //     // .style("pointer-events", "none")
            }
        )
    }

    update(selection) {
        const self = this

        selection.each(function (d, i) {
            let value = parseFloat(d.value)
            const prob_height = self.config.normalizeHeightScale(
                value * self.config.barMaxHeight)
            var t = d3.transition()
                .duration(100)
                .ease(d3.easeLinear);

            // Update bar chart
            let rect = d3.select(this).select('rect')
            rect.transition(t)
                .attr("fill", self.config.colorInterpolator(self.config.colorScaler(value)))
                .attr("y",
                    self.config.height - self.config.numericLabelHeight
                    - prob_height)
                .attr("height", (d, i) => {
                    if (parseFloat(d.value) === -1)
                        return 0
                    else
                        return prob_height
                })

            // Update score text
            const format_prob = (value * 100)
                .toFixed(2) + '%'
            let text = d3.select(this).select('text')
            text.text(value === 0? '': format_prob)
                .attr("fill", (d, i) => {
                    if (parseFloat(d.value) === -1)
                        return "white"
                    else
                        return self.config.colorInterpolator(
                            self.config.colorScaler(value))
                })
        })
    }

    scale(v) {
        return this._scale(v)
    }

}