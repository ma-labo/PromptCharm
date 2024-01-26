import React from "react";
import Button from '@mui/material/Button';
import {styled} from "@mui/material/styles";
import {Box, Fade} from "@mui/material";
import {Slider} from "@mui/material";
import TokenCard from "./TokenCard";

const multiWordStyle = require('../../data/multi_words_styles.json')
const similarStyleWords = require('../../data/similar_style_words.json')

const hexToRgb = hex =>
    hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
        ,(m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1).match(/.{2}/g)
        .map(x => parseInt(x, 16))

const rgbToHex = (r, g, b) => '#' + [r, g, b]
    .map(x => Math.floor(x).toString(16).padStart(2, '0')).join('')

const marks = [
    {
        value: 0,
        label: '0.5x',
    },
    {
        value: 10,
        label: '0.8x',
    },
    {
        value: 20,
        label: '1.0x',
    },
    {
        value: 30,
        label: '1.5x',
    },
    {
        value: 40,
        label: '2x',
    },
];

function valueLabelFormat(value) {
    return marks[marks.findIndex((mark) => mark.value === value)].label;
}

export default function AttentionModifier(props) {
    const prompt = props.prompt.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");

    const word_based_tokens = prompt.split(' ');

    let word_based_tokenIndexes = [];
    let promptIndex = 0;
    if (prompt !== '') {
        for (let i = 0; i < word_based_tokens.length; i ++) {
            while ((promptIndex < props.prompt.length) && (props.prompt[promptIndex] !== word_based_tokens[i][0])) {
                promptIndex += 1;
            }
            let end = promptIndex + 1;
            while ((end < props.prompt.length) && (props.prompt[end] === word_based_tokens[i][end - promptIndex])) {
                end += 1;
            }
            word_based_tokenIndexes.push([promptIndex, end])
            promptIndex = end + 1;
        }
    }

    let tokens = []
    let tokenIndexes = []
    let i = 0
    while (i < word_based_tokens.length) {
        if (word_based_tokens.length - i > 2 && multiWordStyle.includes(word_based_tokens.slice(i, i+3).join(' '))) {
            tokens.push(word_based_tokens.slice(i, i+3).join(' '))
            let start = word_based_tokenIndexes[i]
            let end = word_based_tokenIndexes[i+2]
            tokenIndexes.push([start[0], end[1]])
            i += 3
        }
        else if (word_based_tokens.length - i > 1 && multiWordStyle.includes(word_based_tokens.slice(i, i+2).join(' '))) {
            tokens.push(word_based_tokens.slice(i, i+2).join(' '))
            let start = word_based_tokenIndexes[i]
            let end = word_based_tokenIndexes[i+1]
            tokenIndexes.push([start[0], end[1]])
            i += 2
        }
        else {
            tokens.push(word_based_tokens[i])
            tokenIndexes.push(word_based_tokenIndexes[i])
            i += 1
        }
    }

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
    }));

    const [focusedTokens, setFocusedTokens] = React.useState({});

    // Reset focused tokens when the text were edited.
    const [prevPrompt, setPrevPrompt] = React.useState(null);

    // for (let i = 0; i < Object.keys(focusedTokens).length; i ++) {
    //     let key = Object.keys(focusedTokens)[i]
    //     if (key >= tokens.length) {
    //         setFocusedTokens({})
    //         break;
    //     }
    // }

    const [attentionValue, setAttentionValue] = React.useState({});
    const [attentionIndex, setAttentionIndex] = React.useState(null);
    const [sliderValue, setSliderValue] = React.useState(20);

    if (prevPrompt === null) {
        setPrevPrompt(prompt);
    }
    else if (prevPrompt !== prompt) {
        setFocusedTokens({})
        setPrevPrompt(prompt)
        props.setFocusedTokensIndexes([])
        setAttentionValue({})
        setAttentionIndex(null)
        setSliderValue(20)
    }


    const handleAttentionChange = (event, value) => {
        setSliderValue(value)
        let tmp = {...attentionValue}
        tmp[attentionIndex] = value
        setAttentionValue(tmp)

        tmp = {...focusedTokens};
        if (attentionIndex) {
            tmp[attentionIndex] = (value - 20) / 10
            setFocusedTokens(tmp)
        }

        let focusedTokensIndexes = []
        for (let i = 0; i < Object.keys(tmp).length; i ++) {
            let key = Object.keys(tmp)[i]
            if (tmp[key] && (tmp[key] !== 0)) {
                let tmpIndex = tokenIndexes[key]
                tmpIndex.push(tmp[key])
                focusedTokensIndexes.push(tmpIndex)
                focusedTokensIndexes.sort((a, b) => a[0] - b[0])
            }
        }
        props.setFocusedTokensIndexes(focusedTokensIndexes)
    }

    const handleClick = (event, index) => {
        if (attentionIndex === index) {
            setAttentionIndex(null)
        }
        else {
            setAttentionIndex(index)
            setSliderValue(attentionValue[index] ? attentionValue[index] : 20)
        }
        // setAttentionIndex(attentionIndex === index ? null : index)
    }

    const handleDeleteClick = (event, index) => {
        props.deletePromptStyle(tokenIndexes[index])
    }

    const handleReplaceClick = (event, token, index) => {
        let replacedToken = ""
        if (similarStyleWords[token] === undefined) {
            replacedToken = similarStyleWords['default'][event.target.value]
        }
        else {
            replacedToken = event.target.value > 3 ?
                similarStyleWords[token]['unsimilar'][event.target.value - 4] :
                similarStyleWords[token]['similar'][event.target.value - 1]
        }
        props.replacePromptStyle(replacedToken, tokenIndexes[index])
    }

    const borderStyle = (index) => {
        switch (attentionValue[index]) {
            case 0:
                if (attentionIndex === index) {
                    return {backgroundColor: '#d7ccc8', border: '1px solid', '&:hover': {backgroundColor: '#d7ccc8'}}
                }
                else {
                    return {backgroundColor: '#d7ccc8', '&:hover': {backgroundColor: '#d7ccc8'}}
                }
            case 10:
                if (attentionIndex === index) {
                    return {backgroundColor: '#EFEBE9', border: '1px solid', '&:hover': {backgroundColor: '#EFEBE9'}}
                }
                else {
                    return {backgroundColor: '#EFEBE9', '&:hover': {backgroundColor: '#EFEBE9'}}
                }
            default:
                if (attentionIndex === index) {
                    return {border: '1px solid'}
                }
                else {
                    return {}
                }
            case 30:
                if (attentionIndex === index) {
                    return {backgroundColor: '#FFEBEE', border: '1px solid', '&:hover': {backgroundColor: '#FFEBEE'}}
                }
                else {
                    return {backgroundColor: '#FFEBEE', '&:hover': {backgroundColor: '#FFEBEE'}}
                }
            case 40:
                if (attentionIndex === index) {
                    return {backgroundColor: '#ffcdd2', border: '1px solid', '&:hover': {backgroundColor: '#ffcdd2'}}
                }
                else {
                    return {backgroundColor: '#ffcdd2', '&:hover': {backgroundColor: '#ffcdd2'}}
                }
        }
    }

    return (
        <div>
        <div style={{display: 'flex', flexFlow: 'wrap'}}>
            {tokens.map((token, index) => {
                return (
                    <TokenCard onAttentionClick={e => handleClick(e, index)}
                               onDeleteClick={e => handleDeleteClick(e, index)}
                               onExploreClick={e => props.explorePromptStyle(token)}
                               onReplaceClick={e => handleReplaceClick(e, token, index)}
                                 // sx={attentionValue[index] > 20 ? {backgroundColor: '#ffcdd2',  '&:hover': {backgroundColor: '#ffcdd2'}} :
                                 //     (attentionValue[index] < 20 ? {backgroundColor: '#d7ccc8',  '&:hover': {backgroundColor: '#d7ccc8'}} : null)}
                                 sx={borderStyle(index)}
                                 text={token}
                                 >

                    </TokenCard>
                )
            })}
        </div>
        <Box ml={2} sx={{
            display: "flex",
        }}>
            {
                attentionIndex !== null &&
                <div align={'center'}>
                    <Fade in={true}>
                        <Box sx={{ width: 350 }} mt={2}>
                            <Slider
                                aria-label="attention"
                                value={sliderValue}
                                valueLabelFormat={valueLabelFormat}
                                step={null}
                                valueLabelDisplay="auto"
                                marks={marks}
                                min={0}
                                max={40}
                                onChange={handleAttentionChange}
                            />
                        </Box>
                    </Fade>
                </div>
            }
        </Box>
        </div>
    )
}
