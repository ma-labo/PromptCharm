import XRegExp from "xregexp";
import * as d3 from "d3";

export function token_styler(selection) {
    // console.log('styler:', selection, typeof (selection), typeof ('hi'))
    selection
        .classed('token', function (d, i) {
            return true
        })
        .classed('new-line', function (d, i) {
            // console.log('nl', d, d == '\n')
            return d.token === '\n' || d.token === '\n\n' ; // True if new line
        })
        .classed('token-part', function (d, i) {
            // If the first character is a space, then this is a partial token
            // Except if the token only has one character
            if (d.token.length > 1 && d.token[0] !== ' ')
                return true
                // If a single letter, then it's part of the preceeding word
                // This is especially the case with WordPiece, where "It" is
            // broken into the tokens "_T" and "t"
            else if ((d.token.length === 1) && XRegExp("^\\pL+$").test(d.token)) {
                return true
            } else
                return false

        })
        .classed('input-token', function (d, i) {
            return d.type === 'input';
        })
        .classed('output-token', function (d, i) {
            return d.type === 'output';
        })
}

export function display_token(token) {
    if (token === ' ') {
        return '\xa0'
    }
    if (token === '\n') { // Was: '\n'
        // console.log('new line')
        return '\\n'
    }

    if (token === '\n\n') { // Was: '\n'
        // console.log('new line')
        return '\\n\\n'
    }
    return token
}

// From https://github.com/d3/d3-scale-chromatic/blob/master/src/colors.js
export function colors(specifier) {
    var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
    while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
    return colors;
}


export function ramp(range) {
    var n = range.length;
    return function(t) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
    };
}

export function viridisToWhite(){

    let hex = colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725")
    // console.log('last hex:', hex[hex.length-1]) //fde725
    let lastColor = hex[hex.length-1]
    // Make the last ~10% percent fade to white
    let whiteGradientLength = hex.length * 0.2
    // console.log('ticks', d3.ticks(0,1,whiteGradientLength-1))
    // let scale = d3.scaleLinear()
    //     .domain(d3.ticks(0,1,whiteGradientLength))
    //         .range([lastColor, "#ffffff"])

    let scale =d3.interpolateRgb(lastColor,"white")

    // hex.push(d3.range(whiteGradientLength).each())
    let whiteGradientColors =  d3.range(whiteGradientLength).map((i)=>{
        // console.log('inside', i/whiteGradientLength, scale(i/whiteGradientLength));
        return scale(i/whiteGradientLength)
    })
    // console.log('arr',whiteGradientColors)
    // console.log('scales', scale(0), scale(0.5), scale(1), d3.range(10), d3.ticks(0,1,10))


    return  ramp(hex.concat(whiteGradientColors));

}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ]
     : null;
}

export function toRGB(rgbString){

    let rgb
    if (rgbString[0] === "#"){ // rgbString is hex
        rgb = hexToRgb(rgbString)
    }
    else{ //rgbString looks like rgb(255, 255, 255)
        rgb = rgbString.substring(4, rgbString.length-1)
            .replace(/ /g, '')
            .split(',');
    }

    let r = rgb[0], g = rgb[1], b = rgb[2];

    return [r,g,b]
}

function luma(r, g, b){

    return ((0.299 * r) + (0.587 * g) + (0.114 * b)) / 255;
}
export function rgbToLuma(rgbString){
    let rgb = toRGB(rgbString)
    return luma(rgb[0], rgb[1], rgb[2])
}
