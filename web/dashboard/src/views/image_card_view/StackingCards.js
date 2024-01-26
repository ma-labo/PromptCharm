import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { Button, CardActionArea, CardActions } from "@mui/material";
import Stack from "@mui/material/Stack";
import Backdrop from "@mui/material/Backdrop";

export default function StackingCards() {
    const [open, setOpen] = React.useState(false);
    // const [selection, setSelection] = React.useState(null);
    const [versions, setVersions] = React.useState([0, 1, 2]);

    const [margins, setMargins] = React.useState([
        0,
        -25,
        -25,
    ]);

    const [marginsBasic, setMarginsBasic] = React.useState([
        0,
        -25,
        -25,
    ]);

    const getMargin = (version, openStatus) => {
        if (version === 0) {
            return 0;
        } else {
            if (openStatus) {
                return 2;
            } else {
                return -23;
            }
        }
    };

    const handleClickOpen = () => {
        if (!open) {
            setMargins([0, 2, 2]);
        } else {
            setMargins([0, -23, -23]);
        }
        setOpen(!open);
    };

    const changeVersionsOrder = (version) => {
        let newVersions = [];
        for (let i = 0; i < versions.length; i++) {
            if (versions[i] !== version) {
                newVersions.push(versions[i]);
            }
        }
        newVersions.push(version);
        setVersions(newVersions);
        setOpen(false);
        setMarginsBasic([0, -25, -25]);
    };

    const enterStackingEffect = (event) => {
        if (open) {
            return;
        }
        setMarginsBasic([0, -23, -23]);
    };

    const leaveStackingEffect = (event) => {
        if (open) {
            return;
        }
        setMarginsBasic([0, -25, -25]);
    };

    return (
        <div>
            <Stack direction="row">
                {versions.map((version, index) => {
                    return (
                        <Card
                            sx={{
                                maxWidth: 200,
                                marginLeft: marginsBasic[index],
                                transition: "0.5s"
                            }}
                            onMouseOver={enterStackingEffect}
                            onMouseOut={leaveStackingEffect}
                        >
                            <CardActionArea
                                sx={{ backgroundColor: "#ffffff" }}
                                onClick={(e) => {
                                    if (!open) {
                                        handleClickOpen();
                                        setVersions(versions.sort());
                                        return ;
                                    }
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image="https://mui.com/static/images/cards/contemplative-reptile.jpg"
                                    alt="green iguana"
                                />
                                <CardContent>
                                    <Typography gutterBottom variant="h5" component="div">
                                        Lizard {version}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Lizards are a widespread group of squamate reptiles
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    );
                })}
            </Stack>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={open}
            >
                <Stack direction="row">
                    {versions.map((version, index) => {
                        return (
                            <Card
                                sx={{
                                    maxWidth: 200,
                                    marginLeft: margins[index],
                                    transition: "0.5s"
                                }}
                            >
                                <CardActionArea
                                    sx={{ backgroundColor: "#ffffff" }}
                                    onClick={(e) => {
                                        changeVersionsOrder(version);
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        height="140"
                                        image="https://mui.com/static/images/cards/contemplative-reptile.jpg"
                                        alt="green iguana"
                                    />
                                    <CardContent>
                                        <Typography gutterBottom variant="h5" component="div">
                                            Lizard {version}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Lizards are a widespread group of squamate reptiles
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        );
                    })}
                </Stack>
            </Backdrop>
        </div>
    );
}
