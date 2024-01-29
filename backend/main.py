import os
import random
import numpy as np
import torch
import string
import cv2
from PIL import Image

from flask import Flask, request
from flask import send_file
from flask_restful import Resource, Api, reqparse
from flask_cors import CORS, cross_origin

from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler, StableDiffusionInpaintPipeline
from transformers import AutoModelForCausalLM, AutoTokenizer
from daam import trace
from ecco.output import NMF
import ecco
import re
import shutil
import base64
from io import BytesIO

import argparse

os.environ['CUBLAS_WORKSPACE_CONFIG'] = ':4096:8'


def parse_layer_name(layer_name, base_module):
    """
    Return pytorch model layer based on layer_name and the model.
    One can register forward hook easily by using the returned module.
    ---
    Input:
        layer_name: string. Use "." to indicates the sub_module level.
            For example, features.denseblock1.denselayer1.conv in densenet.
        base_module: torch.nn.modules. DNN model. If the model is in DataParallel,
            pass model.module.
    Return:
        target_module: torch.nn.modules or None(when not found).
    """
    target_name_list = layer_name.split(".")
    target_name = target_name_list[0]
    for name, module in base_module._modules.items():
        if name == target_name:
            if len(target_name_list) == 1:
                return module
            else:
                next_level_layer = target_name_list[1:]
                next_level_layer = ".".join(next_level_layer)
                return parse_layer_name(next_level_layer, module)
    return None


class HookRecorder:
    """This is the hook for pytorch model.
    It is used to record the value of hidden states.
    """

    def __init__(self, layer_names: list, model, record_mode="aggregate", position='output'):
        '''
        record_mode:
            aggregate: for all the record input, use torch.cat() to aggregate them.
            separate: for all the record input, only append the final result.
        '''
        self.recorder = dict()
        self.layer_names = layer_names
        if isinstance(model, torch.nn.DataParallel):
            self.model = model.module
        else:
            self.model = model
        self.handlers = list()
        self.record_mode = record_mode
        self.position = position

    def _register_hooker(self, name):
        self.recorder[name] = list()
        if self.position == 'output':
            def named_hooker(module, input, output):
                self.recorder[name].append(output)
        else:
            def named_hooker(module, input, output):
                self.recorder[name].append(input)
        return named_hooker

    def register_hookers(self):
        for l_name in self.layer_names:
            module = parse_layer_name(l_name, self.model)
            if module is None:
                raise Exception("Layer not found")
            handler = module.register_forward_hook(self._register_hooker(l_name))
            self.handlers.append(handler)

    def get_result(self):
        result = dict()
        for key in self.recorder:
            if self.record_mode == "aggregate":
                result[key] = torch.cat(self.recorder[key])
            else:
                result[key] = self.recorder[key]
        return result

    def clear_cache(self):
        for key in self.recorder:
            self.recorder[key] = list()

    def remove_handlers(self):
        for i in self.handlers:
            i.remove()
        self.handlers.clear()

    def __del__(self):
        self.remove_handlers()


class DiffusionModelWrapper:
    def __init__(self, device="cuda:0", random_seed=2023):
        self.device = device
        self.random_seed = random_seed

        # control random seed
        torch.manual_seed(self.random_seed)
        random.seed(self.random_seed)
        np.random.seed(self.random_seed)
        torch.use_deterministic_algorithms(True)

        # initialize diffusion model
        model_id = "stabilityai/stable-diffusion-2-1"
        self.pipe = StableDiffusionPipeline.from_pretrained(model_id)
        self.pipe.scheduler = DPMSolverMultistepScheduler.from_config(self.pipe.scheduler.config)
        self.pipe = self.pipe.to(self.device)

        # hook text encoder
        layers_to_hook = []
        for i in range(23):
            layers_to_hook.append('text_model.encoder.layers.' + str(i) + '.mlp.activation_fn')

        self.hooker = HookRecorder(layers_to_hook, self.pipe.text_encoder, 'raw')

    def generate_image(self, prompts, attention):
        highlight_keywords = [None, None]
        attention_multiplier = [1.5, 0.8]
#         focus_more = re.finditer("\[.+?\]", prompts)
#         focus_less = re.finditer("\<.+?\>", prompts)
#         for span in focus_more:
#             keyword_s, keyword_e = span.span()
#             keyword = prompts[keyword_s+1:keyword_e-1]
#             if highlight_keywords[0] is None:
#                 highlight_keywords[0] = [keyword]
#             else:
#                 highlight_keywords[0].append(keyword)
#         for span in focus_less:
#             keyword_s, keyword_e = span.span()
#             keyword = prompts[keyword_s+1:keyword_e-1]
#             if highlight_keywords[1] is None:
#                 highlight_keywords[1] = [keyword]
#             else:
#                 highlight_keywords[1] .append(keyword)
#         input_prompts = prompts
#         if highlight_keywords[0]:
#             for keyword in highlight_keywords[0]:
#                 input_prompts = input_prompts.replace('['+keyword+']', keyword)
#         if highlight_keywords[1]:
#             for keyword in highlight_keywords[1]:
#                 input_prompts = input_prompts.replace('<'+keyword+'>', keyword)
#         prompts = input_prompts
        if len(attention[0][0]) > 0:
            highlight_keywords[0] = attention[0][0]
            attention_multiplier[0] = [2 if v == 2 else 1.5 for v in attention[0][1]]
        if len(attention[1][0]) > 0:
            highlight_keywords[1] = attention[1][0]
            attention_multiplier[1] = [0.5 if v == -2 else 0.8 for v in attention[1][1]]
        print(prompts)

        with trace(self.pipe, prompt=prompts, highlight_key_words=highlight_keywords, highlight_amp_mags=attention_multiplier) as tc:
            self.hooker.register_hookers()
            torch.manual_seed(self.random_seed)
            out = self.pipe(prompts)
            heat_map_global = tc.compute_global_heat_map()
            activations = {'encoder': []}
            for k, v in self.hooker.get_result().items():
                activations['encoder'].append(v[0].detach().cpu().numpy())
            activations['encoder'] = np.array(activations['encoder'])
            activations['encoder'] = np.moveaxis(activations['encoder'], 0, 1)
            activations['encoder'] = np.moveaxis(activations['encoder'], 2, 3)
            self.hooker.remove_handlers()
            tokenizer_output = self.pipe.tokenizer(prompts,
                                                   padding="max_length",
                                                   max_length=self.pipe.tokenizer.model_max_length,
                                                   return_tensors="pt")
            n_input_tokens = tokenizer_output['attention_mask'].sum().item()
            token_ids = tokenizer_output['input_ids'][0][:n_input_tokens]
            tokens = [[v.replace('</w>', '') for v in self.pipe.tokenizer.convert_ids_to_tokens(token_ids)]]

            old_tokens = [[v for v in self.pipe.tokenizer.convert_ids_to_tokens(token_ids)]]
            old_token_ids = token_ids.unsqueeze(0)
            old_activations = activations['encoder'].transpose(3, 0, 1, 2)
            tokens = [[]]
            token_ids = [[]]
            activations = {'encoder': []}
            token_index = 0
            while token_index < n_input_tokens:
                sub_token = old_tokens[0][token_index]
                if sub_token == '<|startoftext|>' or sub_token == '<|endoftext|>' or '</w>' in sub_token:
                    tokens[0].append(sub_token.replace('</w>', ''))
                    token_ids[0].append(old_token_ids[0][token_index])
                    activations['encoder'].append(old_activations[token_index])
                    token_index += 1
                else:
                    sub_token_index = token_index
                    tmp_token = ""
                    tmp_attention = np.zeros(old_activations[token_index].shape)
                    while '</w>' not in old_tokens[0][sub_token_index]:
                        tmp_attention += old_activations[sub_token_index]
                        tmp_token += old_tokens[0][sub_token_index]
                        sub_token_index += 1
                    tmp_attention += old_activations[sub_token_index]
                    tmp_token += old_tokens[0][sub_token_index]
                    sub_token_index += 1
                    tokens[0].append(tmp_token.replace('</w>', ''))
                    token_ids[0].append(old_token_ids[0][token_index])
                    activations['encoder'].append(tmp_attention / (sub_token_index - token_index))
                    token_index = sub_token_index
            activations['encoder'] = np.array(activations['encoder']).transpose(1, 2, 3, 0)
            n_input_tokens = len(tokens[0])

            config = {'tokenizer_config': {'token_prefix': '', 'partial_token_prefix': ''}}
            nmf = NMF(activations=activations, n_components=10, n_input_tokens=n_input_tokens, token_ids=token_ids,
                      tokens=tokens, _path=os.path.dirname(ecco.__file__), config=config)
            explanations = nmf.explore(filter_token=True, top_k=5, printJson=True)
            highlighted_images = []
            os.makedirs('./tmp/', exist_ok=True)
            token_importance = {-1: 0, -2: float('inf'), -3: 0}
            for i in range(len(tokens[0])):
                token = tokens[0][i]
                if token in string.punctuation or token == '<|startoftext|>' or token == '<|endoftext|>':
                    continue
                heat_map = heat_map_global.compute_word_heat_map(token, i-1)
                heat_map_mean = heat_map.value.mean().detach().cpu().item()
                heat_map_array = heat_map.value.cpu().numpy()

                token_importance[i] = float(np.sum(heat_map_array))
                token_importance[-1] += float(np.sum(heat_map_array))
                if float(np.sum(heat_map_array)) > token_importance[-3]:
                    token_importance[-3] = float(np.sum(heat_map_array))
                if float(np.sum(heat_map_array)) < token_importance[-2]:
                    token_importance[-2] = float(np.sum(heat_map_array))

                heat_map_array = cv2.resize(heat_map_array, (768, 768))
                image = np.array(out.images[0])
                heat_map_array[heat_map_array >= heat_map_mean] = 1
                heat_map_array[heat_map_array < heat_map_mean] = 0.2
                heat_map_array *= 255
                heat_map_array = heat_map_array.astype(np.uint8)
                heat_map_array = np.expand_dims(heat_map_array, -1)
                rgba_image = np.concatenate((image, heat_map_array), axis=2)
                highlight_image = Image.fromarray(rgba_image, mode='RGBA')
                highlight_image.save('./tmp/token%d.png' % i)
                highlighted_images.append('./tmp/token%d.png' % i)
            out.images[0].save('./tmp/img.png')
            return {'token_explanations': explanations,
                    'token_image_highlight': highlighted_images,
                    'focused_tokens': tc.user_hightlight_key_words,
                    'token_importance': token_importance,
                    'generated_image': './tmp/img.png'}


class InpaintingDiffusionModelWrapper:
    def __init__(self, device="cuda:0", random_seed=2023):
        self.device = device
        self.random_seed = random_seed

        # control random seed
        torch.manual_seed(self.random_seed)
        random.seed(self.random_seed)
        np.random.seed(self.random_seed)
        torch.use_deterministic_algorithms(True)

        # initialize diffusion model
        model_id = "stabilityai/stable-diffusion-2-inpainting"
        self.pipe = StableDiffusionInpaintPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
        self.pipe = self.pipe.to(self.device)

    def inpaint(self, mask, version_old, version_new, prompt=""):
        mask_str = re.search(r'base64,(.*)', mask).group(1)
        mask_code = base64.b64decode(mask_str)
        mask_img = Image.open(BytesIO(mask_code))
        original_img = Image.open('./tmp/ver_' + version_old + '.png')
        mask_array = np.array(mask_img)[...,:3] - np.array(original_img.resize(mask_img.size))
        mask_array[np.array(mask_img)[...,:3] != 0] = 255
        mask_array[mask_array != 255] = 0
        mask_array = 255 - mask_array
        mask_img_resized = Image.fromarray(mask_array).resize((512, 512))
        image = self.pipe(prompt=prompt, image=original_img.resize((512, 512)), mask_image=mask_img_resized).images[0]
        image = image.resize(original_img.size)
        image_file = './tmp/ver_' + version_new + '.png'
        image.save(image_file)
        return image_file


class PrompterModelWrapper:
    def __init__(self, device="cuda:1", random_seed=2023):
        self.device = device
        self.random_seed = random_seed

        # control random seed
        torch.manual_seed(self.random_seed)
        random.seed(self.random_seed)
        np.random.seed(self.random_seed)
        torch.use_deterministic_algorithms(True)

        self.prompter_model = AutoModelForCausalLM.from_pretrained("microsoft/Promptist").to(self.device)
        self.tokenizer = AutoTokenizer.from_pretrained("gpt2")
        self.tokenizer.pad_token = self.tokenizer.eos_token
        self.tokenizer.padding_side = "left"

    def generate(self, plain_text):
        input_ids = self.tokenizer(plain_text.strip()+" Rephrase:", return_tensors="pt").input_ids
        eos_id = self.tokenizer.eos_token_id
        outputs = self.prompter_model.generate(input_ids.to(self.device), do_sample=True, max_new_tokens=77, num_beams=8, num_return_sequences=8, eos_token_id=eos_id, pad_token_id=eos_id, length_penalty=-1.0)
        output_texts = self.tokenizer.batch_decode(outputs, skip_special_tokens=True)
        res = output_texts[0]
        res = res.replace(plain_text.strip() + " Rephrase:", "").strip()
        return res


if __name__ == '__main__':
    parser = argparse.ArgumentParser(prog='PromptCharm Backend', description='This is the backend program of PromptCharm')
    parser.add_argument("--seed", default=2024, help="random seed", type=int)
    args = parser.parse_args()

    custom_diffusion_model = DiffusionModelWrapper(random_seed=args.seed)
    inpainting_model = InpaintingDiffusionModelWrapper(random_seed=args.seed)
    prompter_model = PrompterModelWrapper(random_seed=args.seed)
    app = Flask("Penguin")


    @app.route("/api/v1/predict", methods=['POST'])
    @cross_origin()
    def get_prompts():
        data = request.get_json()
        prompts = data['input']
        version = data['version']
        attention = data['attention']
        explanations = custom_diffusion_model.generate_image(prompts, attention)
        shutil.copy(explanations['generated_image'], explanations['generated_image'].replace('img', 'ver_' + version))
        return explanations, 200

    @app.route("/api/v1/images", methods=['GET'])
    @cross_origin()
    def get_images():
        img = request.args.get('file')
        print(img)
        return send_file(img, as_attachment=True)

    @app.route("/api/v1/inpaint", methods=['POST'])
    @cross_origin()
    def get_inpainting():
        data = request.get_json()
        mask = data['image']
        version_old = str(data['version_old'])
        version_new = str(data['version_new'])
        prompt = data['prompt']
        inpaint_img = inpainting_model.inpaint(mask, version_old, version_new, prompt)
        return send_file(inpaint_img, as_attachment=True)

    @app.route("/api/v1/prompter", methods=['POST'])
    @cross_origin()
    def get_prompting():
        data = request.get_json()
        init_prompt = data['prompt']
        return {'new_prompt': prompter_model.generate(init_prompt)}, 200


    # CORS(app, origins=["http://localhost:3000"], resources=r'/api/*')
    cors = CORS(app, resorces={r'/d/*': {"origins": '*'}})
    api = Api(app)
    # api.add_resource(PredictServer, '/api/v1/predict')
    app.run(host='127.0.0.1', port=5000)
