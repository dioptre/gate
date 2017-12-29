// Copyright 2017 Matthew D. Michelotti
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#version 130

uniform sampler2D tex;
uniform vec2 tex_dims;
in vec2 fs_tex_vert_lt; // left-top vertex of sampling region
in vec2 fs_tex_vert_rb; // right-bottom vertex of sampling region
in float fs_flash_ratio;

out vec4 out_color;

// assumes texture sampling is nearest
// TODO play it safer when tex_vert_lt or tex_vert_rb lies on a pixel boundary,
//      or verify that we don't need to play it safer, regardless of OpenGL version or OS

vec4 sample_tex(vec2 vert) {
    vec4 result = texture(tex, vert);
    result = vec4(fs_flash_ratio + (1.0 - fs_flash_ratio) * vec3(result[0], result[1], result[2]), result[3]);
    return result * result;
}

vec4 blend(vec4 color_a, vec4 color_b, float ratio_a, float ratio_b) {
    if (color_a[3] == 0.0) {
        return vec4(color_b[0], color_b[1], color_b[2], ratio_b * color_b[3]);
    } else if (color_b[3] == 0.0) {
        return vec4(color_a[0], color_a[1], color_a[2], ratio_a * color_a[3]);
    } else {
        return ratio_a * color_a + ratio_b * color_b;
    }
}

void main() {
    vec4 lt_color = sample_tex(fs_tex_vert_lt);
    vec4 rt_color = sample_tex(vec2(fs_tex_vert_rb[0], fs_tex_vert_lt[1]));
    vec4 lb_color = sample_tex(vec2(fs_tex_vert_lt[0], fs_tex_vert_rb[1]));
    vec4 rb_color = sample_tex(fs_tex_vert_rb);
    vec2 tex_vert_mid = floor(fs_tex_vert_rb * tex_dims) / tex_dims;
    vec2 ratio_a = (tex_vert_mid - fs_tex_vert_lt) / (fs_tex_vert_rb - fs_tex_vert_lt);
    vec2 ratio_b = 1.0 - ratio_a;
    vec4 t_color = blend(lt_color, rt_color, ratio_a[0], ratio_b[0]);
    vec4 b_color = blend(lb_color, rb_color, ratio_a[0], ratio_b[0]);
    vec4 result_color = blend(t_color, b_color, ratio_a[1], ratio_b[1]);
    out_color = vec4(sqrt(vec3(result_color[0], result_color[1], result_color[2])), result_color[3]);
}