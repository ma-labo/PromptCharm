import React, {Component} from 'react';
// import data from './data';
import {Layout} from 'antd';
import Button from '@mui/material/Button';
import './dashboard.css';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CopyrightIcon from '@mui/icons-material/Copyright';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import {createTheme, styled} from '@mui/material/styles';
import {
    Autocomplete,
    Box,
    Chip, ClickAwayListener, Fade,
    IconButton, ImageList, ImageListItem, ImageListItemBar,
    InputBase,
    Paper, Popper,
    TextField,
    ThemeProvider, Tooltip
} from "@mui/material";

import SearchIcon from '@mui/icons-material/Search';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import Grid from '@mui/material/Grid'
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from "@mui/material/CircularProgress";

import DiffMatchPatch from 'diff-match-patch';
import Fuse from 'fuse.js'

import InfoIcon from '@mui/icons-material/Info';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import ImageCard from "./views/image_card_view/ImageCard";
import AttentionModifier from "./views/attention_modification_view/AttentionModifier";

const dmp = new DiffMatchPatch();

const fetch = require('node-fetch');

const styleWords = require('./data/new_style_words_new_filtering.json')
const promptsDB = require('./data/prompts_db.json')
const fuse = new Fuse(promptsDB, {
    keys: ['prompts'],
    distance: 1000
})

const theme = createTheme({
    palette: {
        primary: {
            light: '#757ce8',
            main: '#3f50b5',
            dark: '#002884',
            contrastText: '#fff',
        },
        secondary: {
            light: '#ff7961',
            main: '#f44336',
            dark: '#ba000d',
            contrastText: '#000',
        },
    },
});

const ColorButton = styled(Button)(({ theme }) => ({
    textTransform: 'none',
    paddingLeft: 3,
    paddingRight: 3,
    paddingTop: 0.25,
    paddingBottom: 0.25,
    marginTop: 0.75,
    marginBottom: 0.75,
    marginLeft: 10,
    marginRight: 10,
    minWidth: 0,
    color: '#00000099',
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    '& .MuiToggleButtonGroup-grouped': {
        margin: theme.spacing(0.5),
        marginRight: theme.spacing(1.5),
        border: 0,
        '&.Mui-disabled': {
            border: 0,
        },
        '&:not(:first-of-type)': {
            borderRadius: theme.shape.borderRadius,
        },
        '&:first-of-type': {
            borderRadius: theme.shape.borderRadius,
        },
    },
}));

const { Sider, Content, Footer } = Layout;

const promptAttentionModification = (prompt, indexes) => {
    // let shift = 0;
    // let newPrompt = prompt;
    // for (let i = 0; i < indexes.length; i ++) {
    //     let tokenIndex = indexes[i];
    //     let start = tokenIndex[0] + shift;
    //     let end = tokenIndex[1] + shift;
    //     let modifier = tokenIndex[2] === 1 ? ['[', ']'] : ['<', '>'];
    //     newPrompt = (newPrompt.slice(0, start) + modifier[0] + newPrompt.slice(start, end) + modifier[1] + newPrompt.slice(end));
    //     shift += 2
    // }
    // return newPrompt;
    let focusMore = [[], []]
    let focusLess = [[], []]
    for (let i = 0; i < indexes.length; i ++) {
        let tokenIndex = indexes[i];
        let start = tokenIndex[0];
        let end = tokenIndex[1];
        if (tokenIndex[2] > 0) {
            focusMore[0].push(prompt.slice(start, end))
            focusMore[1].push(tokenIndex[2])
        }
        else if (tokenIndex[2] < 0) {
            focusLess[0].push(prompt.slice(start, end))
            focusLess[1].push(tokenIndex[2])
        }
    }
    return [focusMore, focusLess]
}

export default class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedVersions: [],
            textInput: '',
            keywords: 'a beautiful unfinished building',
            versions: [],
            prompts: [],
            hoveredToken: {},
            loading: false,
            success: false,
            serverResponse: [],
            generatedImages: [],
            promptMedium: '',
            promptSubject: '',
            promptStyle: [],
            popperOpen: false,
            popperAnchorEL: null,
            popperPlacement: null,
            promptStyleImages: [],
            inpaintImage: null,
            inpaintLoading: false,
            inpaintSuccess: false,
            inpaintCanvasExpanded: [],
            focusedTokensIndexes: [],
            prompterLoading: false,
            prompterSuccess: true,
        }
    }

    handleFocusedTokensIndexes = (value) => {
        let tmp = []
        if (value.length > 1) {
            let i = 0;
            while (i < value.length) {
                let j = 0;
                while ((i + j + 1) < value.length) {
                    let curr = value[i+j];
                    let next = value[i+j+1];
                    if ((curr[1] + 1 === next[0]) && (curr[2] === next[2])) {
                        j += 1;
                    }
                    else {
                        break;
                    }
                }
                tmp.push([value[i][0], value[i+j][1], value[i][2]])
                i = i + j + 1;
            }
        }
        else {
            tmp = value
        }
        this.setState({
            focusedTokensIndexes: tmp
        })
    }

    handleExpandClick = (event: React.MouseEvent<HTMLButtonElement>, value: number) => {
        let tmp = this.state.inpaintCanvasExpanded
        tmp[value] = !this.state.inpaintCanvasExpanded[value]
        this.setState({
            inpaintCanvasExpanded: tmp
        })
    }

    handlePopperClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        this.setState({
            popperAnchorEL: event.currentTarget,
            popperPlacement: 'bottom-end',
            popperOpen: !this.state.popperOpen
        });
        const searchPattern ='\'\"' + this.state.promptStyle.join('\" \'\"') + '\"'
        const searchResults = fuse.search(searchPattern)
        if (searchResults.length > 9) {
            this.setState({
                promptStyleImages: searchResults.slice(0, 9)
            })
        }
        else {
            this.setState({
                promptStyleImages: searchResults
            })
        }
    };

    handleSelectVersions = (event: React.MouseEvent<HTMLElement>, value: string) => {
        if (value.length <= 2) {
            this.setState({
                selectedVersions: value
            })
        }
        else {
            let tmp = value
            tmp.shift()
            console.log(tmp)
            this.setState({
                selectedVersions: tmp
            })
        }
    }

    handleKeywords = (event) => {
        this.setState({
            keywords: event.target.value
        })
    }

    handlePromptMedium = (event, value) => {
        this.setState({
            promptMedium: value
        })
    }

    handleAddModifiers = () => {
        const prompt = this.state.textInput.trimEnd();
        let style_words = '';
        if (this.state.promptStyle !== []) {
            style_words = this.state.promptStyle.join(', ')
        }
        let new_prompt = '';
        if ([',', '.', ';', '!', '?'].includes(prompt.slice(-1))) {
            new_prompt = prompt + ' ' + style_words
        }
        else {
            new_prompt = prompt + ', ' + style_words
        }
        this.setState({
            textInput: new_prompt,
            promptStyle: []
        })
    }

    handleDeletePrompt = (index) => {
        let tmp = this.state.textInput
        let newPrompt = tmp.slice(0, index[0]) + tmp.slice(index[1])
        this.setState( {
            textInput: newPrompt
        })
    }

    handleReplacePrompt = (value, index) => {
        let tmp = this.state.textInput
        let newPrompt = tmp.slice(0, index[0]) + value + tmp.slice(index[1])
        console.log(newPrompt)
        this.setState( {
            textInput: newPrompt
        })
    }

    handlePromptSubject = (event) => {
        this.setState({
            promptSubject: event.target.value
        })
    }

    handleCopyPrompt = (version) => {
        let prompt = this.state.prompts[version]
        this.setState({
            textInput: prompt
        })
    }

    handlePromptStyle = (event, value) => {
        this.setState({
            promptStyle: value,
            popperOpen: this.state.promptStyle.length > 0 ? this.state.popperOpen : false
        })
    }

    handlePromptStyleExplore = (value) => {
        let newStyle = this.state.promptStyle.length === 0 ? [] : this.state.promptStyle
        newStyle.push(value)
        this.setState({
            promptStyle: newStyle
        })
    }

    handleTextInput = (event) => {
        this.setState({
            textInput: event.target.value
        })
    }

    handleGeneratePrompts = () => {
        // const prompt = this.state.promptSubject;
        // let style_words = '';
        // if (this.state.promptStyle !== []) {
        //     style_words = ', ' + this.state.promptStyle.join(', ')
        // }
        // const init_prompt = prompt + style_words
        const init_prompt = this.state.promptSubject;
        if (!this.state.prompterLoading) {
            this.setState({
                prompterSuccess: false
            });
            this.setState({
                prompterLoading: true
            });
            fetch('http://127.0.0.1:5000/api/v1/prompter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({'prompt': init_prompt}),
            })
                .then(res => {
                    if (!res.ok) {
                        throw new Error("Network response was not OK.")
                    }
                    return res.json()
                })
                .then(buffer => {
                    console.log(buffer)
                    this.setState({
                        textInput: buffer['new_prompt'].toLowerCase()
                    })
                    this.setState({
                        prompterSuccess: true
                    });
                    this.setState({
                        prompterLoading: false
                    });
                })
                .catch(err => {
                    console.log('Error:', err);
                })
        }
    }

    handleSetInpaintImage = (value) => {
        console.log(value)
        if (!value) {
            return;
        }
        this.setState({
            inpaintImage: value[0]
        })
        if (!this.state.inpaintLoading) {
            this.setState({
                inpaintSuccess: false
            });
            const versionToInpaint = value[1]
            this.setState({
                inpaintLoading: versionToInpaint
            });
            const inpaintMask = value[0]
            const inpaintPrompt = value[2]
            const dataToSend = {
                'version_old': versionToInpaint,
                'version_new': this.state.versions.slice(-1)[0] + 1,
                'image': inpaintMask,
                'prompt': inpaintPrompt
            }
            let tmp = this.state.inpaintCanvasExpanded
            tmp[versionToInpaint] = !this.state.inpaintCanvasExpanded[versionToInpaint]
            this.setState({
                inpaintCanvasExpanded: tmp
            })
            fetch('http://127.0.0.1:5000/api/v1/inpaint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            })
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return res.blob();
                })
                .then(blob => {
                    let tmp = this.state.versions
                    tmp.push(tmp.slice(-1)[0] + 1)
                    this.setState({
                        versions: tmp
                    })
                    this.setState({
                        selectedVersions: [tmp.slice(-2)[0], tmp.slice(-1)[0]]
                    })
                    tmp = this.state.prompts
                    tmp.push(this.state.textInput)
                    this.setState({
                        prompts: tmp
                    })
                    tmp = this.state.serverResponse
                    let tmpResponse = {...this.state.serverResponse[parseInt(versionToInpaint)]}
                    tmpResponse['unhoverable'] = true
                    tmp.push(tmpResponse)
                    this.setState({
                        serverResponse: tmp
                    })
                    tmp = this.state.inpaintCanvasExpanded
                    tmp.push(false)
                    this.setState({
                        inpaintCanvasExpanded: tmp
                    })
                    tmp = this.state.generatedImages
                    tmp.push(["", {}])
                    this.setState({
                        generatedImages: tmp
                    })
                    const url = URL.createObjectURL(blob); // create object URL from blob
                    tmp = this.state.generatedImages
                    tmp[this.state.generatedImages.length - 1][0] = url;
                    this.setState({
                        generatedImages: tmp
                    })
                    this.setState({
                        inpaintSuccess: true
                    });
                    this.setState({
                        inpaintLoading: false
                    });
                })
                .catch(err => {
                    console.log('Error:', err);
                })
        }
    }

    handleSendingText = () => {
        if (!this.state.textInput) {
            return;
        }
        const textInput = this.state.textInput;
        const attention = promptAttentionModification(this.state.textInput, this.state.focusedTokensIndexes)
        if (!this.state.loading) {
            this.setState({
                loading: true
            });
            this.setState({
                success: false
            });
            const thisVersion = this.state.versions.length === 0 ? 0 : this.state.versions.slice(-1)[0] + 1
            fetch('http://127.0.0.1:5000/api/v1/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({'version': thisVersion.toString(), 'input': textInput, 'attention': attention}),
            })
                .then(res => {
                    if (!res.ok) {
                        throw new Error("Network response was not OK.")
                    }
                    return res.json();
                })
                .then(buffer => {
                    if (this.state.versions.length === 0) {
                        this.setState({
                            versions: [0]
                        })
                        this.setState({
                            selectedVersions: [0]
                        })
                        this.setState({
                            prompts: [textInput]
                        })
                        this.setState({
                            serverResponse: [buffer]
                        })
                        this.setState({
                            generatedImages: [['', {}]]
                        })
                        this.setState({
                            inpaintCanvasExpanded: [false]
                        })
                    }
                    else {
                        let tmp = this.state.versions
                        tmp.push(tmp.slice(-1)[0] + 1)
                        this.setState({
                            versions: tmp
                        })
                        this.setState({
                            selectedVersions: [tmp.slice(-2)[0], tmp.slice(-1)[0]]
                        })
                        tmp = this.state.prompts
                        tmp.push(textInput)
                        this.setState({
                            prompts: tmp
                        })
                        tmp = this.state.serverResponse
                        tmp.push(buffer)
                        this.setState({
                            serverResponse: tmp
                        })
                        tmp = this.state.inpaintCanvasExpanded
                        tmp.push(false)
                        this.setState({
                            inpaintCanvasExpanded: tmp
                        })
                        tmp = this.state.generatedImages
                        tmp.push(["", {}])
                        this.setState({
                            generatedImages: tmp
                        })
                    }
                    const image_paths = this.state.serverResponse[this.state.serverResponse.length - 1]['token_image_highlight']
                    const image_folder = './data/imgv' + String(this.state.versions[this.state.versions.length - 1]);
                    fetch("http://127.0.0.1:5000/api/v1/images?file=./tmp/img.png")
                        .then(res => {
                            if (!res.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return res.blob(); // get file as blob
                        })
                        .then(blob => {
                            const url = URL.createObjectURL(blob); // create object URL from blob
                            let tmp = this.state.generatedImages
                            tmp[this.state.generatedImages.length - 1][0] = url;
                            this.setState({
                                generatedImages: tmp
                            })
                        })
                        .catch(err => {
                            console.error('Error:', err);
                        });
                    for (let i = 0; i < image_paths.length; i++) {
                        fetch("http://127.0.0.1:5000/api/v1/images?file=" + image_paths[i])
                            .then(res => {
                                if (!res.ok) {
                                    throw new Error('Network response was not ok');
                                }
                                return res.blob(); // get file as buffer
                            })
                            .then(blob => {
                                const url = URL.createObjectURL(blob); // create object URL from blob
                                let tmp = this.state.generatedImages
                                const img_name = 'v' + String(this.state.versions.length - 1) + '_' + image_paths[i].slice(6, image_paths[i].length)
                                tmp[this.state.generatedImages.length - 1][1][img_name] = url;
                                this.setState({
                                    generatedImages: tmp
                                })
                            })
                            .catch(err => {
                                console.error('Error:', err);
                            });
                    }
                    this.setState({
                        success: true
                    });
                    this.setState({
                        loading: false
                    });
                })
                .catch(err => {
                    console.log('Error:', err);
                })
        }
    }

    handleHover = (value) => {
        let ver = value[0];
        let new_hovered_token = value[1];
        let new_dict = this.state.hoveredToken;
        new_dict[ver] = new_hovered_token;
        this.setState({
            hoveredToken: new_dict
        })
    }

    calculateDiff = (versions) => {
        if (versions.length === 2) {
            if (this.state.prompts[versions[0]] !== undefined && this.state.prompts[versions[1]] !== undefined) {
                const regex = /[\[\]<>()]/g;
                const prompt1 = this.state.prompts[versions[0]]
                const prompt2 = this.state.prompts[versions[1]]
                var diff = dmp.diff_main(prompt1.replace(regex, ''), prompt2.replace(regex, ''));
                dmp.diff_cleanupSemantic(diff);
                return diff;
            }
        }
        else {
            return null;
        }
    }

    render() {
        // console.log(this.state.selectedVersions)
        // console.log(this.state.versions)
        // console.log(this.state.prompts)
        // console.log(this.state.hoveredToken)
        // console.log(this.state.generatedImages)
        // console.log(this.state.promptMedium)
        // console.log(this.state.promptSubject)
        // console.log(this.state.inpaintImage)
        // console.log(this.state.promptStyleImages)
        // console.log(this.state.prompts)
        // console.log(this.state.serverResponse)
        // console.log(this.state.focusedTokensIndexes)
        const generatedImages = this.state.selectedVersions
        generatedImages.sort((a, b) => {return (parseInt(a) < parseInt(b) ? -1 : ((parseInt(a) > parseInt(b)) ? 1 : 0))})
        const clean_diff = this.calculateDiff(generatedImages);
        // console.log(clean_diff);
        return (
            <ThemeProvider theme={theme}>
            <div>
                <AppBar position="static" color="primary">
                    <Toolbar>
                        <Typography variant="h4" color="inherit">
                            PromptCharm
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Layout style={{ minHeight: 880, backgroundColor: '#f9f9f9', display: "flex" }}>
                    <Grid container spacing={0}>
                        <Grid item xs={4}>
                            <Box p={1} ml={3}>
                                <Typography variant="h5" color="primary">
                                    Prompt Editor
                                </Typography>
                            </Box>
                            <Box ml={1} pl={2} pr={2} pb={2}>
                                <Box mb={6}>
                                    <Box ml={1} mb={2} pb={1.5} pt={0.5} display="flex">
                                        <Typography variant="h6" color="primary">
                                            Tell us what you want in your image
                                        </Typography>
                                    </Box>
                                    <Paper component="form" elevation={2}>
                                        <Box ml={1} mr={1} display="flex">
                                            <Box ml={1} mt={1} mr={1} mb={2} sx={{width: 500}}>
                                                <InputBase
                                                    placeholder="Type a few words to start"
                                                    inputProps={{ 'aria-label': 'input user prompt' }}
                                                    fullWidth={true}
                                                    multiline={true}
                                                    minRows={6}
                                                    maxRows={10}
                                                    onChange={this.handlePromptSubject}
                                                />
                                            </Box>
                                            <Box mt={8} mb={2}>
                                                <Button startIcon={this.state.prompterLoading ? <CircularProgress size={24}/> : <SearchIcon />}
                                                        onClick={this.handleGeneratePrompts}
                                                        disabled={this.state.promptSubject === ''}
                                                        size="large">
                                                    Prompt
                                                    {/*{this.state.prompterLoading && (*/}
                                                    {/*    <CircularProgress*/}
                                                    {/*        size={36}*/}
                                                    {/*        sx={{*/}
                                                    {/*            color: 'primary',*/}
                                                    {/*            position: 'absolute',*/}
                                                    {/*            top: '50%',*/}
                                                    {/*            left: '50%',*/}
                                                    {/*            marginTop: '-18px',*/}
                                                    {/*            marginLeft: '-58px',*/}
                                                    {/*        }}*/}
                                                    {/*    />*/}
                                                    {/*)}*/}
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Box>
                                <Box ml={1} mt={2} mb={1} display="flex">
                                    <Typography variant="h6" color="primary">
                                        Your generated prompts:
                                    </Typography>
                                </Box>
                                {/*<Box ml={1} mt={1} mb={2} display="flex">*/}
                                {/*    <Typography variant="h7" color="secondary">*/}
                                {/*        [Word] / &lt;Word&gt; to strength/weaken its effect on generation*/}
                                {/*    </Typography>*/}
                                {/*</Box>*/}
                                <Paper component="form" elevation={2}>
                                    <Box ml={1} mr={1} display="flex">
                                        <Box ml={1} mt={1} mr={1} mb={2} sx={{width: 500}}>
                                            <InputBase
                                                placeholder="Generated prompts will be here..."
                                                inputProps={{ 'aria-label': 'search new sentence' }}
                                                fullWidth={true}
                                                multiline={true}
                                                minRows={6}
                                                maxRows={10}
                                                value={this.state.textInput}
                                                onChange={this.handleTextInput}
                                            />
                                        </Box>
                                        <Box mt={10} mb={2}>
                                            <Button startIcon={this.state.loading ? <CircularProgress size={24} /> : <SendIcon /> }
                                                    onClick={this.handleSendingText}
                                                    disabled={this.state.textInput === ''}
                                                    size="large">
                                                Diffuse
                                            </Button>
                                        </Box>
                                    </Box>
                                    <Box ml={1.5} mt={1} mb={1} display="flex">
                                        {this.state.textInput === '' ? null :
                                            <Box display="flex">
                                            <Typography variant="h7" color="secondary">
                                                {/*[Word] / &lt;Word&gt; to strength/weaken its effect on generation*/}
                                                Click to adjust its attention.
                                            </Typography>
                                                <ColorButton sx={{backgroundColor: '#ffcdd2', '&:hover': {backgroundColor: '#ffcdd2'}}} disableElevation disableRipple>
                                                    &uarr; increase
                                                </ColorButton>
                                                <ColorButton sx={{backgroundColor: '#d7ccc8', '&:hover': {backgroundColor: '#d7ccc8'}}} disableElevation disableRipple>
                                                    &darr; decrease
                                                </ColorButton>
                                            </Box>
                                        }
                                    </Box>
                                    <Box m={1} pb={1} display="flex">
                                        <AttentionModifier prompt={this.state.textInput} setFocusedTokensIndexes={this.handleFocusedTokensIndexes}
                                                           deletePromptStyle={this.handleDeletePrompt} explorePromptStyle={this.handlePromptStyleExplore}
                                                           replacePromptStyle={this.handleReplacePrompt}
                                        />
                                    </Box>
                                </Paper>
                                <Box ml={1} mt={4} mb={1} display="flex">
                                    <Typography variant="h6" color="primary">
                                        Explore different image styles
                                    </Typography>
                                </Box>
                                <Paper component="form" elevation={2}>
                                    <Box pt={2} ml={1} mr={1} pb={2}>
                                        <div style={{
                                            alignItems: 'center',
                                            display: 'flex'
                                        }}>
                                            <Autocomplete
                                                multiple
                                                id="tags-filled"
                                                // options={['cartoon', 'anime', 'photorealistic', 'detailed', 'digital', 'beautiful']}
                                                options={styleWords.map((option) => option.word)}
                                                sx={{ width:600 }}
                                                freeSolo
                                                renderTags={(value: string[], getTagProps) =>
                                                    value.map((option: string, index: number) => (
                                                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                                                    ))
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Image Styles"
                                                        placeholder="Feel free to type your own(s)"
                                                    />
                                                )}
                                                onChange={this.handlePromptStyle}
                                                value={this.state.promptStyle}
                                            />
                                            <ClickAwayListener onClickAway={ e => {this.setState({popperOpen: this.state.popperOpen ? false : this.state.popperOpen})}}>
                                                <Box ml={1} display="flex">
                                                    <Tooltip title="Search in Database">
                                                        <IconButton disabled={this.state.promptStyle.length === 0} onClick={this.handlePopperClick}>
                                                            <TipsAndUpdatesIcon/>
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Popper open={this.state.popperOpen && this.state.promptStyle.length !== 0} transition anchorEl={this.state.popperAnchorEL} placement={this.state.popperPlacement}>
                                                        {({ TransitionProps }) => (
                                                            <Fade {...TransitionProps} timeout={350}>
                                                                <Paper component="form" elevation={2}>
                                                                    <Box m={1} pt={1}>
                                                                        <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={164}>
                                                                            {this.state.promptStyleImages.map((item) => (
                                                                                <ImageListItem key={item.item['file:']}>
                                                                                    <img
                                                                                        src={require("./data/diffusion_db/" + item.item['file:'].replace("png", "jpg"))}
                                                                                        alt={item.item['prompts']}
                                                                                        loading="lazy"
                                                                                    />
                                                                                    <Tooltip title={item.item['prompts']}>
                                                                                        <ImageListItemBar
                                                                                            subtitle={item.item['prompts']}
                                                                                            actionIcon={
                                                                                                <Tooltip title="Copy this prompt">
                                                                                                    <IconButton
                                                                                                        sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                                                                                        aria-label={`info about ${item.item['file:']}`}
                                                                                                        onClick={e => {navigator.clipboard.writeText(item.item['prompts'])}}
                                                                                                    >
                                                                                                        <InfoIcon />
                                                                                                    </IconButton>
                                                                                                </Tooltip>
                                                                                            }
                                                                                        />
                                                                                    </Tooltip>
                                                                                </ImageListItem>
                                                                            ))}
                                                                        </ImageList>
                                                                    </Box>
                                                                </Paper>
                                                            </Fade>
                                                        )}
                                                    </Popper>
                                                    <Tooltip title="Add to your prompt">
                                                        <IconButton disabled={this.state.promptStyle.length === 0} onClick={this.handleAddModifiers}>
                                                            <AddCircleIcon/>
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </ClickAwayListener>
                                        </div>
                                    </Box>
                                </Paper>
                            </Box>
                        </Grid>
                        <Grid item xs={8}>
                            <Layout style={{ height: 95, backgroundColor: '#f9f9f9'}}>
                                <Box p={1} ml={3}>
                                    <Typography variant="h5" color="primary">
                                        Version History
                                    </Typography>
                                    <StyledToggleButtonGroup
                                        value={this.state.selectedVersions}
                                        onChange={this.handleSelectVersions}
                                        aria-label="select prompt versions"
                                    >
                                        {this.state.versions.length !== 0 ? this.state.versions.map((version) => {
                                            return (
                                                <ToggleButton value={version} aria-label={'Ver.' + version} color={this.state.selectedVersions.length < 2 ? "primary" : (this.state.selectedVersions[0] < this.state.selectedVersions[1] ? (this.state.selectedVersions[0] === version ? "secondary" : "primary") : (this.state.selectedVersions[1] === version ? "secondary" : "primary"))}>
                                                    {'Ver.' + version}
                                                </ToggleButton>
                                            )
                                        }) : null}
                                    </StyledToggleButtonGroup>
                                </Box>
                            </Layout>
                            <Grid container spacing={0}>
                                {(generatedImages !== 0) && (this.state.serverResponse.length !== 0) ? generatedImages.map((version) => {
                                    return (
                                        <Grid item xs={6}>
                                            <Box p={2}>
                                                <ImageCard version={version} generatedImages={this.state.generatedImages} hoveredToken={this.state.hoveredToken}
                                                           serverResponse={this.state.serverResponse} inpaintCanvasExpanded={this.state.inpaintCanvasExpanded}
                                                           inpaintLoading={this.state.inpaintLoading} handleHover={this.handleHover}
                                                           handleExpandClick={this.handleExpandClick} handleSetInpaintImage={this.handleSetInpaintImage}
                                                           handlePromptCopy={this.handleCopyPrompt}
                                                />
                                            </Box>
                                        </Grid>
                                    )
                                }) : null}
                            </Grid>
                        </Grid>
                    </Grid>
                    {/*<Grid container spacing={0}>*/}
                    {/*    <Grid item xs={4}>*/}
                    {/*    </Grid>*/}
                    {/*    <Grid item xs={4}>*/}
                    {/*    </Grid>*/}
                    {/*    <Grid item xs={4}>*/}
                    {/*        {*/}
                    {/*            (clean_diff === null || clean_diff === undefined || (clean_diff.length === 1)) ? null :*/}
                    {/*                <Box p={2}>*/}
                    {/*                    <div align={"center"}>*/}
                    {/*                        <Card elevation={2} style={{width: "440px"}}>*/}
                    {/*                            <Box m={2}>*/}
                    {/*                                <div align={"left"}>*/}
                    {/*                                    <Typography variant="h6" color="primary">*/}
                    {/*                                        Text differences*/}
                    {/*                                    </Typography>*/}
                    {/*                                    /!*<ColorButton sx={{backgroundColor: '#EBFEED', ":hover": {backgroundColor: '#EBFEED'}, color: '#00000099'}}*!/*/}
                    {/*                                    /!*             disableElevation={true} disableRipple={true}>*!/*/}
                    {/*                                    /!*    Added*!/*/}
                    {/*                                    /!*</ColorButton>*!/*/}
                    {/*                                    /!*<ColorButton sx={{backgroundColor: '#FCECEA', ":hover": {backgroundColor: '#FCECEA'}, color: '#00000099'}}*!/*/}
                    {/*                                    /!*             disableElevation={true} disableRipple={true}>*!/*/}
                    {/*                                    /!*    Deleted*!/*/}
                    {/*                                    /!*</ColorButton>*!/*/}
                    {/*                                    <TextDiff data={clean_diff}/>*/}
                    {/*                                </div>*/}
                    {/*                            </Box>*/}
                    {/*                        </Card>*/}
                    {/*                    </div>*/}
                    {/*                </Box>*/}
                    {/*        }*/}
                    {/*    </Grid>*/}
                    {/*</Grid>*/}
                </Layout>
                <Footer style={{backgroundColor: '#f9f9f9'}}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}>
                        <Button
                            style={{color: "#007c41"}}
                            size="small"
                            startIcon={<CopyrightIcon />}
                            disabled={true}
                        >
                            University of Alberta
                        </Button>
                    </div>
                </Footer>
            </div>
            </ThemeProvider>
        )
    }
}