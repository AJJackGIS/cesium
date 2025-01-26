in vec2 v_textureCoordinates;
uniform sampler2D colorTexture;
uniform float speed;
uniform float size;
uniform float angle;

float hash(float x) {
    return fract(sin(x * 133.3) * 13.13);
}

void main() {
    float time = float(czm_frameNumber * 10.0 * speed) / 1000.0;
    vec2 resolution = czm_viewport.zw;
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    vec3 c = vec3(0.6, 0.7, 0.8);
    float a = angle;
    float si = sin(a), co = cos(a);
    uv *= mat2(co, -si, si, co);
    uv *= length(uv + vec2(0, 20.0 / size)) * 0.3 + 1.0;
    float v = 1.0 - sin(hash(floor(uv.x * 100.0)) * 2.0);
    float b = clamp(abs(sin(20.0 * time * v + uv.y * (5.0 / (2.0 + v)))) - 0.95, 0.0, 1.0) * 20.0;
    c *= v * b;
    out_FragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c, 1.0), 0.5);
}
