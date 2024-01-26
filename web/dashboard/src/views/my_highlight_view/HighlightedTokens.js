import React from "react";
import Button, { ButtonProps } from '@mui/material/Button';
import {styled} from "@mui/material/styles";

const hexToRgb = hex =>
    hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
        ,(m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1).match(/.{2}/g)
        .map(x => parseInt(x, 16))

const rgbToHex = (r, g, b) => '#' + [r, g, b]
    .map(x => Math.floor(x).toString(16).padStart(2, '0')).join('')

export default function HighlightedTokens(props) {
    // const data = props.neuron_activation;

    const moreFocusedTokens = props.focusedTokens[0]
    const lessFocusedTokens = props.focusedTokens[1]

    const data = props.data;

    const tokens = data['tokens']

    const tokenImportance = props.tokenImportance
    // console.log(tokenImportance)

    const ColorButton = styled(Button)(({ theme }) => ({
        textTransform: 'none',
        paddingLeft: 2,
        paddingRight: 2,
        paddingTop: 0.25,
        paddingBottom: 0.25,
        marginTop: 0.75,
        marginBottom: 0.75,
        marginLeft: 2,
        marginRight: 2,
        minWidth: 0,
        color: '#00000099',
        '&:hover': {
            backgroundColor: '#c8e6c9',
        },
    }));

    const tokenImportanceColor = (tokenID, tokenImportance) => {
        const importance = tokenImportance[tokenID]
        const dark = hexToRgb('#EF9A9A')
        const light = hexToRgb('#ffffff')
        const perc = (importance - tokenImportance[-2]) / (tokenImportance[-3] - tokenImportance[-2])
        return rgbToHex((dark[0] - light[0]) * perc + light[0],
            (dark[1] - light[1]) * perc + light[1],
            (dark[2] - light[2]) * perc + light[2])
    }

    // console.log(tokenImportanceColor(2, tokenImportance));

    const tokenBorderStyle = (tokenID, moreFocusedTokens, lessFocusedTokens) => {
        // console.log(tokenID)
        // console.log(moreFocusedTokens)
        // console.log(lessFocusedTokens)
        if (moreFocusedTokens !== null) {
            if (moreFocusedTokens.includes(tokenID)) {
                return '2px solid';
            }
        }
        if (lessFocusedTokens !== null) {
            if (lessFocusedTokens.includes(tokenID)) {
                return '2px solid';
            }
        }
        return '';
    }

    const tokenBorderColor = (tokenID, moreFocusedTokens, lessFocusedTokens) => {
        // console.log(tokenID)
        // console.log(moreFocusedTokens)
        // console.log(lessFocusedTokens)
        if (moreFocusedTokens !== null) {
            if (moreFocusedTokens.includes(tokenID)) {
                return '#E65100';
            }
        }
        if (lessFocusedTokens !== null) {
            if (lessFocusedTokens.includes(tokenID)) {
                return '#009688';
            }
        }
        return '';
    }

    const [highlightedTokens, setHighlightedTokens] = React.useState([]);

    const handleHover = (event) => {
        const target = event.currentTarget.getAttribute("label");
        const tokens_to_highlight = checkIfHighlight(parseInt(target));
        props.setHoveredToken([props.version, parseInt(target)]);
        tokens_to_highlight.push(parseInt(target));
        setHighlightedTokens(tokens_to_highlight);
    }

    const handleHoverOut = (event) => {
        props.setHoveredToken([props.version, -1]);
        setHighlightedTokens([]);
    }

    const checkIfHighlight = (id) => {
        let factor = []
        for (let i = 0; i < data['factors'][0].length; i++) {
            factor.push(data['factors'][0][i][id])
        }
        let max_ind = factor.indexOf(Math.max(...factor));
        let selected_factors = data['factors'][0][max_ind]
        let selected_tokens = []
        for (let i = 0; i < 5; i++) {
            let max_factor = Math.max(...selected_factors)
            if (max_factor > 0) {
                let token_id = selected_factors.indexOf(max_factor)
                selected_tokens.push(token_id)
                selected_factors = selected_factors.slice(0, token_id).concat(selected_factors.slice(token_id+1, selected_factors.length))
            }
            else {
                break;
            }
        }
        return selected_tokens
    }

    return (
        <div>
            {tokens.map(token => {
                return (
                    token["token_id"] === 49406 ? null :
                        (
                            token["token_id"] === 49407 ? null :
                                ((token["token_id"] >= 287) || ((token["token_id"] >= 271) && (token["token_id"] <=280)) ?
                                    <ColorButton sx={highlightedTokens.includes(token['position']) ?
                                        {backgroundColor: '#c8e6c9',
                                            border: tokenBorderStyle(token['position'], moreFocusedTokens, lessFocusedTokens),
                                            borderColor: tokenBorderColor(token['position'], moreFocusedTokens, lessFocusedTokens)} :
                                        {backgroundColor: tokenImportanceColor(token['position'], tokenImportance),
                                            border: tokenBorderStyle(token['position'], moreFocusedTokens, lessFocusedTokens),
                                            borderColor: tokenBorderColor(token['position'], moreFocusedTokens, lessFocusedTokens)}}
                                                 onMouseEnter={handleHover} onMouseOut={handleHoverOut} label={token["position"]} aria-label={token["token_id"]}>
                                        {token["token"]}
                                    </ColorButton> : token["token_id"] >= 257 ?
                                        <ColorButton sx={{marginLeft: -0.75, paddingLeft: -0.5}} disabled={true} label={token["position"]} aria-label={token["token_id"]}>
                                            {token["token"]}
                                        </ColorButton> :
                                        <ColorButton sx={highlightedTokens.includes(token['position']) ?
                                            {backgroundColor: '#c8e6c9', border: tokenBorderStyle(token['position'], moreFocusedTokens, lessFocusedTokens),
                                                borderColor: tokenBorderColor(token['position'], moreFocusedTokens, lessFocusedTokens)} :
                                            {backgroundColor: tokenImportanceColor(token['position'], tokenImportance),
                                                border: tokenBorderStyle(token['position'], moreFocusedTokens, lessFocusedTokens),
                                                borderColor: tokenBorderColor(token['position'], moreFocusedTokens, lessFocusedTokens)}}
                                                     onMouseEnter={handleHover} onMouseOut={handleHoverOut} label={token["position"]} aria-label={token["token_id"]}>
                                            {token["token"]}
                                        </ColorButton>)
                        )
                )
            })}
        </div>
    )
}