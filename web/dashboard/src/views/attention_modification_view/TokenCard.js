import React from "react";
import Button from '@mui/material/Button';
import {styled} from "@mui/material/styles";
import {
    Box,
    ClickAwayListener,
    Fade, FormControl,
    Grow, InputLabel,
    ListItemIcon,
    ListItemText, ListSubheader,
    MenuItem,
    MenuList,
    Paper,
    Popper
} from "@mui/material";
import {Slider} from "@mui/material";
import TuneIcon from '@mui/icons-material/Tune';
import FindReplaceIcon from '@mui/icons-material/FindReplace';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Select from '@mui/material/Select';

const similarStyleWords = require('../../data/similar_style_words.json')

export default function TokenCard(props) {

    const anchorRef = React.useRef(null);
    const anchorReplaceRef = React.useRef(null);

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

    const [open, setOpen] = React.useState(false);
    const [replaceOpen, setReplaceOpen] = React.useState(false);

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }

        if (replaceOpen) {
            return;
        }

        setOpen(false);
    };

    const handleReplaceClick = (event) => {
        setReplaceOpen((prevOpen) => !prevOpen)
    }

    const handleReplaceClickAway = (event) => {
        if (event.target.localName === 'body') {
            return;
        }
        setReplaceOpen(false); setOpen(false);
    }

    return (
        <div ref={anchorRef}>
            <ColorButton onClick={handleToggle}
                // sx={attentionValue[index] > 20 ? {backgroundColor: '#ffcdd2',  '&:hover': {backgroundColor: '#ffcdd2'}} :
                //     (attentionValue[index] < 20 ? {backgroundColor: '#d7ccc8',  '&:hover': {backgroundColor: '#d7ccc8'}} : null)}
                         sx={props.sx}
                         size="large"
            >
                {props.text}
            </ColorButton>
            <Popper
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                placement="top-start"
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom-start' ? 'left top' : 'left bottom',
                        }}
                    >
                        <Paper sx={{backgroundColor: "#f7f8fc"}}>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList
                                    autoFocusItem={open}
                                    id="composition-menu"
                                    aria-labelledby="composition-button"
                                    dense
                                >
                                    <MenuItem onClick={(e => {props.onDeleteClick(e); setOpen(false)})}>
                                        <ListItemIcon>
                                            <HighlightOffIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Delete</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={(e => {props.onExploreClick(e); setOpen(false)})}>
                                        <ListItemIcon>
                                            <HelpOutlineIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Explore</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={(e => {handleReplaceClick(e)})} ref={anchorReplaceRef}>
                                        <ListItemIcon>
                                            <FindReplaceIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Replace</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={(e => {props.onAttentionClick(e); setOpen(false)})}>
                                        <ListItemIcon>
                                            <TuneIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Attention</ListItemText>
                                    </MenuItem>
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
            <Popper open={replaceOpen} anchorEl={anchorReplaceRef.current} placement={'bottom-end'} transition>
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={350}>
                        <Paper>
                            <ClickAwayListener onClickAway={handleReplaceClickAway}>
                                <FormControl sx={{ m: 1, maxWidth: 100}} size="small">
                                    <Select defaultValue={0} id="grouped-native-select" style={{fontSize: "12px"}}
                                            onChange={(e => {props.onReplaceClick(e); setReplaceOpen(false); setOpen(false);})}>
                                        <MenuItem value={0} style={{fontSize: "12px"}}>
                                            <em>{props.text}</em>
                                        </MenuItem>
                                        {similarStyleWords[props.text] === undefined ? null : <ListSubheader>Similar</ListSubheader>}
                                        <MenuItem value={1} style={{fontSize: "12px"}}>
                                            {
                                                similarStyleWords[props.text] === undefined ?
                                                similarStyleWords['default'][0] :
                                                similarStyleWords[props.text]['similar'][0]
                                            }
                                        </MenuItem>
                                        <MenuItem value={2} style={{fontSize: "12px"}}>
                                            {
                                                similarStyleWords[props.text] === undefined ?
                                                    similarStyleWords['default'][1] :
                                                    similarStyleWords[props.text]['similar'][1]
                                            }
                                        </MenuItem>
                                        <MenuItem value={3} style={{fontSize: "12px"}}>
                                            {
                                                similarStyleWords[props.text] === undefined ?
                                                    similarStyleWords['default'][2] :
                                                    similarStyleWords[props.text]['similar'][2]
                                            }
                                        </MenuItem>
                                        {similarStyleWords[props.text] === undefined ? null : <ListSubheader>Unsimilar</ListSubheader>}
                                        <MenuItem value={4} style={{fontSize: "12px"}}>
                                            {
                                                similarStyleWords[props.text] === undefined ?
                                                    similarStyleWords['default'][3] :
                                                    similarStyleWords[props.text]['unsimilar'][0]
                                            }
                                        </MenuItem>
                                        <MenuItem value={5} style={{fontSize: "12px"}}>
                                            {
                                                similarStyleWords[props.text] === undefined ?
                                                    similarStyleWords['default'][4] :
                                                    similarStyleWords[props.text]['unsimilar'][1]
                                            }
                                        </MenuItem>
                                        <MenuItem value={6} style={{fontSize: "12px"}}>
                                            {
                                                similarStyleWords[props.text] === undefined ?
                                                    similarStyleWords['default'][5] :
                                                    similarStyleWords[props.text]['unsimilar'][2]
                                            }
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </ClickAwayListener>
                        </Paper>
                    </Fade>
                )}
            </Popper>
        </div>
    )
}
