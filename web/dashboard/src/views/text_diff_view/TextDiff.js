import React from "react";
import Button, { ButtonProps } from '@mui/material/Button';
import {styled} from "@mui/material/styles";

export default function TextDiff(props) {

    const data = props.data;

    let tokens = [];

    for (let i=0; i < data.length; i++) {
        const substring = data[i][1].trim().split(' ');
        for (let j=0; j < substring.length; j++) {
            if (j === 0) {
                tokens.push([data[i][0], substring[j]])
            }
            else {
                tokens.push([data[i][0] * 2, substring[j]])
            }
        }
    }

    console.log(tokens)

    const ColorButton = styled(Button)(({ theme }) => ({
        textTransform: 'none',
        paddingLeft: 2,
        paddingRight: 2,
        paddingTop: 0.25,
        paddingBottom: 0.25,
        marginTop: 0.75,
        marginBottom: 0.75,
        marginLeft: 0.5,
        marginRight: 0.5,
        minWidth: 0,
        color: '#00000099',
    }));

    return (
        <div>
            {tokens.map((changes) => {
                return (
                    <ColorButton disableElevation={true} disableRipple={true} sx={(changes[0] < 0) ?
                        {backgroundColor: '#FCECEA', ":hover": {backgroundColor: '#FCECEA'}} :
                        ((changes[0] > 0) ? {backgroundColor: '#EBFEED', ":hover": {backgroundColor: '#EBFEED'}} :
                            {":hover": {backgroundColor: '#FFFFFF'}})}>
                        {changes[0] === 1 ? '+ ' + changes[1] : (changes[0] === -1 ? '- ' + changes[1] : changes[1])}
                    </ColorButton>
                )
            })}
        </div>
    )
}