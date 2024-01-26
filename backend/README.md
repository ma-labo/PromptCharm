# Diffusion Model Backend

## Create virtual environments (optional)

~~~sh
$ python -m venv ./venv
$ source ./venv/bin/activate
~~~

## Install

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

## Usage

### Start server

```shell
python3 main.py
```

### Querry

### Generate Diffusion Results and Explanations

```shell
curl http://127.0.0.1:5000/api/v1/predict\?input=Hello%20Word!
```

### Get images

Get generated image.

```shell
curl http://127.0.0.1:5000/api/v1/images\?input=tmp/img.png
```

Get explanation image.

```shell
curl http://127.0.0.1:5000/api/v1/images\?input=tmp/token1.png
```