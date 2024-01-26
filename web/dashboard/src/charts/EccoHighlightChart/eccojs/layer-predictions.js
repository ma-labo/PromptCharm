import * as d3 from "d3";

export class LayerPredictions {
    constructor(_config = {}) {

        this.config = {
            margin: _config.margin ||
                {top: 50, right: 20, bottom: 40, left: 40},
            height: 8,
            innerHeight: _config.innerHeight || 400,
            width: _config.width || 800
        }

        this.parentDivId = _config.parentDiv
        this.data = _config.data
    }

    init() {
        const self = this,
            logitsPerLayer = this.data[0].length,
            logitComponent = new LogitBox(),
            n_columns = 10,
            n_rows = Math.ceil(self.data[0].length / n_columns),
            n_layers = this.data.length

        const logitGroupComponent = new LogitGroup({
            n_columns: n_columns,
            logitsPerLayer: logitsPerLayer
        })
        this.div = d3.select('#' + self.parentDivId)
        this.innerDiv = this.div.append('div')

        // Calculate width and height
        // Width: tokensPerRow X width of a token
        // let width = self.config.width
        let width = logitGroupComponent.width
        // let height = self.config.innerHeight + self.config.margin.top
        //     + self.config.margin.bottom
        let height = logitGroupComponent.height * n_layers


        const svg = this.innerDiv
            .append("svg")
            .attr('class', 'scrollable')
            .attr("viewBox", [0, 0, width,
                height])
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("overflow", 'scroll')
            .style('overflow', 'scroll')
            .style("overflow-y", "scroll !important")
            // .style('border', '1px solid #ddd')

        // A group for each layer
        var model_layers_predictions = svg.selectAll('g')
            .data(self.data)
            .join('g')
            .attr('class', 'layer_predictions_group')
            .attr('transform', (d, i) =>
                `translate(0, ${i * logitGroupComponent.height})`)
            .call(logitGroupComponent.draw.bind(logitGroupComponent))
    }
}


// Creates and styles a group of logits
export class LogitGroup {
    constructor(_config = {}) {
        this.config = {
            n_columns: _config.n_columns || 10,
            logitsPerLayer: _config.logitsPerLayer || 10,
            margin: _config.margin ||
                {top: 25, // Room for the title of the layer
                    right: 0, bottom: 5, left: 0}
        }
        this.logitComponent = new LogitBox(_config['logitBoxConfig'])
        this.config.n_rows = Math.ceil(
            this.config.logitsPerLayer / this.config.n_columns)

        this._height = this.config.margin.top+
            this.config.n_rows * this.logitComponent.height +
            this.config.margin.bottom

        this._width = this.config.margin.left +
            this.config.n_columns * this.logitComponent.width +
                this.config.margin.right

    }

    draw(selection){
        const self = this

        selection.each(function (d, i) {
            // Token text
            const sel = d3.select(this)
            sel.append('text')
                .attr("x", 10)
                .attr("y", self.config.margin.top/2 + 10)
                .text((d,i)=>{
                    if (typeof d[0]['layer'] !== "undefined")
                        return "Layer " + d[0]['layer']
                    else
                        return "Layer " + i
                })
                .attr("fill", "#333")
                .attr("font-family", "monospace")
                .attr("font-size", "14px")
                .attr("alignment-baseline", "middle")

            sel
                .append('g') // A group holding all the tokens inside a prediction
                .attr('class', 'logit-group')
                // Make space for the title "layer 0"
                .attr('transform', `translate(0,${
                    self.config.margin.top})`)
                .selectAll('g')
                .data(d => d)
                .join('g')
                .attr('class', 'logit-box')
                .call(self.logitComponent.draw.bind(self.logitComponent))
                // Placement of logit boxes
                .attr('transform', (d, i) => {
                        let column = i % self.config.n_columns
                        let row = Math.floor(i / self.config.n_columns)
                        return `translate(${ // Column
                            column * self.logitComponent.width}, ${ // Row
                            5 + row * self.logitComponent.height})`
                    }
                )
        })
    }

    set height(h){
        this._height = h
    }
    get height(){
        return this._height
    }

    get width() {
        return this._width;
    }

    set width(value) {
        this._width = value;
    }
}





// LogitBox creates and styles a single logit box
export class LogitBox {
    constructor(_config = {}) {
        this.config = {
            innerWidth: _config.innerWidth || 70,
            innerHeight: _config.innerHeight || 25,
            margin: _config.margin ||
                {top: 5, right: 2, bottom: 15, left: 8}
        }
        this._width = this.config.innerWidth + this.config.margin.left
            + this.config.margin.right
        this._height = this.config.innerHeight + this.config.margin.top
            + this.config.margin.bottom;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }
    set height(h){
        this._height = h
    }


    draw(selection) {
        const self = this
        // console.log("FF", selection, self)
        selection.each(function (d, i) {
            // d is expected to have:
            // d.prob: probability score [0-1]
            // d.ranking: int
            // d.token: str
            // generate chart here; `d` is the data and `this` is the element
            const pred_layer = d3.select(this)

            // Token Box
            pred_layer.append("rect")
                .attr("x", self.config.margin.left)
                .attr("y", self.config.margin.top)
                .attr("width", self.config.innerWidth)
                .attr("height", self.config.innerHeight)
                .attr('probability', d.prob)
                .attr('ranking', d.ranking)
                .attr('class', 'logit')
                .attr("stroke-width", 0.5)
                .attr("stroke", '#ec008c33')
                .attr("fill", '#fafafa')
                .attr('rx', 3)

            // Token text
            pred_layer.append('text')
                .attr("x", self.config.margin.left +
                    self.config.innerWidth / 2)
                .attr("y", self.config.margin.top +
                    // Make space at the top for the ranking
                    self.config.innerHeight / 2 + 5)
                // .text("'" + d.token + "'")
                .text((d)=>{
                    if ((d.token.length > 1) && (d.token[0] != ' ')){
                        return "…"+ d.token
                    }
                    return d.token
                })
                .attr("fill", "#333")
                .attr("font-family", "monospace")
                .attr("font-size", d => {
                    // console.log("DDD", d, d.token.length)
                    if (d.token.length < 8) {
                        return "14px"
                    }
                    else if (d.token.length < 14) {
                        return "10px"
                    }else {
                        return "6px"
                    }
                })
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")

            // Probability bar
            // console.log('prob', d.prob, 'log ', Math.log10(d.prob))
            const prob_height = d.prob * self.config.innerHeight,
                prob_width = 3
            pred_layer.append("rect")
                .attr("x", self.config.margin.left / 2)
                .attr("y", self.config.margin.top +
                    self.config.innerHeight - prob_height - 1)
                .attr("fill", '#ec008cbb')
                .attr("width", prob_width)
                .attr("height", prob_height)
                .attr("stroke-width", 0)
                .attr("stroke", '#333')
                .attr("alignment-baseline", "top")

            // Probability score text
            let prob_percent = d.prob * 100
            let format_prob
            if (prob_percent > 99.99){
                format_prob = (99.99).toFixed(2) + '%'
            }
            else if (prob_percent < 0.01){
                format_prob = '<0.01%'
            }
            else{
                format_prob = (prob_percent).toFixed(2) + '%'
            }

            pred_layer.append('text')
                .attr("class", 'token-text')
                .attr("x", self.config.margin.left / 2)
                .attr("y", self.config.margin.top +
                    self.config.innerHeight + 10)
                .text(format_prob)
                .attr("fill", "#EC008Cbb")
                .attr("font-family", "sans-serif")
                .attr("font-size", "10px")
                .attr("text-anchor", "left")
                .attr("alignment-baseline", "top")
                .attr('probability', d.prob)

            // Token ranking
            pred_layer.append('text')
                .attr("x", self.config.margin.left + 2)
                .attr("y", self.config.margin.top + 10)
                .text(d.ranking)
                .attr("fill", "#999")
                .attr("font-family", "sans-serif")
                .attr("font-size", "8px")
                .attr("text-anchor", "left")
                .attr("alignment-baseline", "top")
        });
    }
}
