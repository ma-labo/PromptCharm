import React, { useRef, useEffect } from 'react'
import {Box, Card, CardContent, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import UndoIcon from '@mui/icons-material/Undo';
import BrushIcon from '@mui/icons-material/Brush';

export default function InpaintingCanvas(props) {

    const canvasRef = useRef(null)
    const undoButtonRef = useRef(null)
    const inpaintButtonRef = useRef(null)
    const [undo, setUndo] = React.useState(false);
    const [inpaint, setInpaint] = React.useState(false);
    const [inpaintImage, setInpaintImage] = React.useState("");
    const [inpaintPrompt, setInpaintPrompt] = React.useState("");

    const handlePromptChange = (event) => {
        setInpaintPrompt(event.target.value)
    }

    const handleUndoClick = () => {
        setUndo(true);
    }

    const handleInpaintClick = () => {
        setInpaint(true);
        props.handleSetInpaintImage([inpaintImage, props.versionToInpaint, inpaintPrompt]);
    }

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        var img = new Image();
        img.src = props.src;
        img.onload = function () {
            var width = props.width;
            var height = img.height * (width / img.width);

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
        };

        var isPress = false;
        var old = null;
        canvas.addEventListener('mousedown', function (e){
            isPress = true;
            old = {x: e.offsetX, y: e.offsetY};
        });
        canvas.addEventListener('mousemove', function (e){
            if (isPress) {
                var x = e.offsetX;
                var y = e.offsetY;
                ctx.globalCompositeOperation = 'destination-out';

                ctx.beginPath();
                ctx.arc(x, y, 10, 0, 2 * Math.PI);
                ctx.fill();

                ctx.lineWidth = 20;
                ctx.beginPath();
                ctx.moveTo(old.x, old.y);
                ctx.lineTo(x, y);
                ctx.stroke();

                old = {x: x, y: y};

            }
        });
        canvas.addEventListener('mouseup', function (e){
            isPress = false;
        });
        const undoButton = undoButtonRef.current
        const inpaintButton = inpaintButtonRef.current
        undoButton.addEventListener('click', function (event) {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            setUndo(false);
        })
        inpaintButton.addEventListener('click', function (event) {
            const dataURL = canvas.toDataURL();
            setInpaint(false);
            setInpaintImage(dataURL);
        })
    }, [undo, setUndo, inpaint, setInpaint, inpaintImage, setInpaintImage])

    return (
        <div align={"center"}>
            <Card elevation={2} style={{width: "440px"}}>
                <Box p={2}>
                    <canvas ref={canvasRef}/>
                </Box>
                <Box pl={2} pr={2}>
                    <TextField
                        fullWidth
                        helperText="Leave empty to erase"
                        id="inpaint"
                        label="Inpaint Prompt"
                        variant="outlined"
                        onChange={handlePromptChange}
                    />
                </Box>
                <CardContent>
                    <Box pl={2} pr={2}>
                        <Button variant="outlined"
                                startIcon={<UndoIcon/>}
                                style={{marginLeft: 10, marginRight: 10}}
                                onClick={handleUndoClick}
                                ref={undoButtonRef}
                        >
                            Undo
                        </Button>
                        <Button variant="outlined"
                                startIcon={<BrushIcon/>}
                                color="secondary"
                                style={{marginLeft: 10, marginRight: 10}}
                                onClick={handleInpaintClick}
                                ref={inpaintButtonRef}
                        >
                            Inpaint
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </div>
    )
}