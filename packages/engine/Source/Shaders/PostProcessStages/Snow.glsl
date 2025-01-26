in vec2 v_textureCoordinates;
uniform sampler2D colorTexture;
uniform float speed;
uniform float size;

float snow(vec2 uv, float scale) {
    float time = float(czm_frameNumber * 10.0 * speed) / 1000.0;
    float w = smoothstep(1.0, 0.0, -uv.y * (scale / 10.0));
    if (w < 0.1) return 0.0;
    uv += time / scale;
    uv.y += time * 2.0 / scale;
    uv.x += sin(uv.y + time * 0.5) / scale;
    uv *= scale;
    vec2 s = floor(uv), f = fract(uv), p;
    float k = 3.0, d;
    p = 0.5 + 0.35 * sin(11.0 * fract(sin((s + p + scale) * mat2(7, 3, 6, 5)) * 5.0)) - f;
    d = length(p);
    k = min(d, k);
    k = smoothstep(0.0, k, sin(f.x + f.y) * size / 100.0);
    return k * w;
}

void main() {
    vec2 resolution = czm_viewport.zw;
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    vec3 finalColor = vec3(0.0);
    float c = 0.0;
    c += snow(uv, 100.0);
    c += snow(uv, 80.0);
    c += snow(uv, 50.0);
    c += snow(uv, 30.0);
    c += snow(uv, 20.0);
    c += snow(uv, 15.0);
    c += snow(uv, 10.0);
    c += snow(uv, 8.0);
    c += snow(uv, 6.0);
    c += snow(uv, 5.0);
    finalColor = vec3(c);
    out_FragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(finalColor, 1.0), 0.5);
}
