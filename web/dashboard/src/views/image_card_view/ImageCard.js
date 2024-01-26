import {Box, Card, CardActions, CardContent, Collapse, Skeleton} from "@mui/material";
import Typography from "@mui/material/Typography";
import HighlightedTokens from "../my_highlight_view/HighlightedTokens";
import Button from "@mui/material/Button";
import GestureIcon from "@mui/icons-material/Gesture";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CircularProgress from "@mui/material/CircularProgress";
import InpaintingCanvas from "../inpainting_view/InpaintingCanvas";
import React from "react";
import {styled} from "@mui/material/styles";


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


export default function ImageCard(props) {
    const version = props.version
    const generatedImages = props.generatedImages
    const hoveredToken = props.hoveredToken
    const serverResponse = props.serverResponse
    const inpaintCanvasExpanded = props.inpaintCanvasExpanded
    const inpaintLoading = props.inpaintLoading
    
    return (
        <div align={"center"}>
            <Card elevation={2} style={{width: "440px"}}>
                <Box p={2}>
                    <div align="center">
                        <Box mb={2}>
                            <Typography variant="h5" sx={{color: '#00000099'}}>
                                Version {version}
                            </Typography>
                        </Box>
                        {
                            generatedImages.length <= version ? <Skeleton variant="rounded" width={400} height={400} /> :
                                generatedImages[version][0] === '' ? <Skeleton variant="rounded" width={400} height={400} /> :
                                    hoveredToken[version] === undefined ?
                                        <img src={generatedImages[version][0]} width="400px"/> :
                                        generatedImages[version][1]['v'+version+'_token' + String(hoveredToken[version])+'.png'] === undefined ?
                                            <img src={generatedImages[version][0]} width="400px"/> :
                                            <img src={generatedImages[version][1]['v'+version+'_token' + String(hoveredToken[version])+'.png']} width="400px"/>
                        }
                    </div>
                </Box>
                <div align={"left"}>
                    <CardContent>
                        {/*<Typography variant="body2" color="text.secondary">*/}
                        {/*    {this.state.prompts[version]}*/}
                        {/*</Typography>*/}
                        {serverResponse[version] === undefined ? null :
                            <HighlightedTokens setHoveredToken={props.handleHover} version={version} data={serverResponse[version]['token_explanations']} focusedTokens={serverResponse[version]['focused_tokens']} tokenImportance={serverResponse[version]['token_importance']} unhoverable={serverResponse[version]['unhoverable']}/> }
                    </CardContent>
                </div>
                {serverResponse[version] === undefined ? null :
                    <Box pl={2} pr={2} pb={2}>
                        {serverResponse[version]['focused_tokens'][0] === null ? null :
                            <ColorButton sx={{border: '2px solid', borderColor: '#E65100', color: '#00000099'}}
                                         disableElevation={true} disableRipple={true}>
                                More Focus
                            </ColorButton>
                        }
                        {serverResponse[version]['focused_tokens'][1] === null ? null :
                            <ColorButton sx={{border: '2px solid', borderColor: '#009688', color: '#00000099'}}
                                         disableElevation={true} disableRipple={true}>
                                Less Focus
                            </ColorButton>
                        }
                    </Box>
                }
                <CardActions>
                    <Button startIcon={<GestureIcon/>}
                            onClick={e => props.handleExpandClick(e, version)}
                            endIcon={inpaintCanvasExpanded[version] === false ? <ExpandMoreIcon/> : <ExpandLessIcon/>}
                    >
                        {inpaintLoading === version && (
                            <CircularProgress
                                size={36}
                                sx={{
                                    color: 'primary',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    marginTop: '-18px',
                                    marginLeft: '-65px',
                                }}
                            />
                        )}
                        Inpaint
                    </Button>
                    <Button onClick={e => props.handlePromptCopy(version)} size="small">Copy Prompt</Button>
                </CardActions>
                {generatedImages[version] === undefined ? null :
                    <Collapse in={inpaintCanvasExpanded[version]} timeout="auto" unmountOnExit>
                        <InpaintingCanvas src={generatedImages[version][0]} width="400"
                                          handleSetInpaintImage={props.handleSetInpaintImage}
                                          versionToInpaint={version}
                        />
                    </Collapse>
                }
            </Card>
        </div>
    )
}