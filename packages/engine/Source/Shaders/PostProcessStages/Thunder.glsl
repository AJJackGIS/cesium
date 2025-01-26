uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float speed;

float rand(float x)
{
    return fract(sin(x) * 75154.32912);
}

float noise(float x)
{
    float i = floor(x);
    float a = rand(i), b = rand(i + 1.);
    float f = x - i;
    return mix(a, b, f);
}

float perlin(float x)
{
    float r = 0., s = 1., w = 1.;
    for (int i = 0; i < 6; i++) {
        s *= 2.0;
        w *= 0.5;
        r += w * noise(s * x);
    }
    return r;
}

float f(float y)
{
    float w = 0.1;// width of strike
    return w * (perlin(2. * y) - 0.5);
}

float plot(vec2 p, float d, bool thicker)
{
    if (thicker) d += 5. * abs(f(p.y + 0.001) - f(p.y));
    return smoothstep(d, 0., abs(f(p.y) - p.x));
}

vec3 render(vec2 uv)
{
    float x = czm_frameNumber * 10.0 * speed / 1000.0;
    float m = 0.25;// max duration of strike
    float i = floor(x/m);
    float f = x/m - i;
    float k = 0.4;// frequency of strikes
    float n = noise(i);
    float t = ceil(n-k);// occurrence
    float d = max(0., n-k) / (1.-k);// duration
    float o = ceil(t - f - (1. - d));// occurrence with duration
    float gt = 0.1;// glare duration
    float lightning = 0.;
    float light = 0.;

    if (o == 1.) {
        vec2 uv2 = uv;
        uv2.y += i * 2.;// select type of lightning
        float p = (noise(i + 10.) - 0.5) * 2.;// position of lightning
        uv2.x -= p;

        float strike = plot(uv2, 0.01, true);
        float glow = plot(uv2, 0.04, false);
        float glow2 = plot(uv2, 1.5, false);

        lightning = strike * 0.4 + glow * 0.15;

        float h = noise(i + 5.);// height
        lightning *= smoothstep(h, h + 0.05, uv.y + perlin(1.2 * uv.x + 4. * h) * 0.03);
        lightning += glow2 * 0.3;
        light = smoothstep(5., 0., abs(uv.x - p));
    }
    vec3 background = texture(colorTexture, v_textureCoordinates).rgb;
    background *= (0.8 + light * 0.00001);
    return vec3(background + lightning);
}

void main(void){
    vec2 uv = v_textureCoordinates;
    uv.x = 2. * uv.x - 1.;
    uv.x *= czm_viewport.z / czm_viewport.w;//按比例拉平坐标
    out_FragColor = vec4(render(uv), 1.0);
}
