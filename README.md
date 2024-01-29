# PromptCharm: Text-to-Image Generation through Multi-modal Prompting and Refinement

![basic view](./figs/PromptCharm-UI.png)

PromptCharm is an interactive system for iterative refinement of text-to-image creation with diffusion models.
This repository contains the official implementation of our related paper:

**PromptCharm: Text-to-Image Generation through Multi-modal Prompting and Refinement**

*Zhijie Wang, Yuheng Huang, Da Song, Lei Ma, Tianyi Zhang*

2024 ACM CHI Conference on Human Factors in Computing Systems (CHI 2024)

## Getting Started

### Environments Set-up

##### Python >= 3.6

*We suggest use virtual environment to avoid messing up your own environments.*

Create virtual environments (optional)

~~~sh
$ cd ./backend
$ python -m venv ./venv
$ source ./venv/bin/activate
~~~

Install

```shell
pip install -r requirements.txt

git clone -b penguin https://github.com/paulwong16/ecco.git
cd ecco
pip install -e . 

cd ..
git clone https://github.com/YuhengHuang42/daam.git
cd daam
pip install -e .
cd ..
```
---

#### NPM >= 7

[Download](https://drive.google.com/file/d/1wJxDLRNo-wZRV0xb-AhAIf4imd1XSyS4/view?usp=share_link) pre-mined images from diffusion_db and organize them as the followings. You can also follow the notebook in `./backend` to do it by yourself.

```tree
├── web/dashboard
│   ├── public
│   ├── src
│   │   └── data
│   │       │── diffusion_db
│   │       │   │── 0.jpg
│   │       │   │── 1.jpg
│   │       │   └── ...
│   │       └── ...
│   └── ...
├── backend
└── ...
```

Install

~~~sh
$ cd ./web/dashboard
$ npm install
~~~

### Basic Usage

#### Quick start

~~~sh
$ npm start
~~~
Copy the url and open it in browser.

#### Start backend

~~~sh
$ cd ./backend
$ python main.py --seed [YOUR RANDOM SEED]
~~~


## Citation

If you found our paper/code useful in your research, please consider citing:

```
@inproceedings{wang2024promptcharm,
 author = {Wang, Zhijie and Huang, Yuheng and Song, Da and Ma, Lei and Zhang, Tianyi},
 title = {PromptCharm: Text-to-Image Generation through Multi-modal Prompting and Refinement},
 booktitle = {Proceedings of the 2024 CHI Conference on Human Factors in Computing Systems},
 year = {2024},
} 
```

## License

This project is released under the [MIT license](./LICENSE.md).

## Acknowledgement

Kudos to the following projects:

- [DAAM](https://github.com/castorini/daam)
- [ecco](https://github.com/jalammar/ecco)
- [DeepSeer](https://github.com/Momentum-Research/DeepSeer)
- [DeepLens](https://github.com/Momentum-Research/DeepLens)