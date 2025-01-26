uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float speed;

float random(float p)
{
    return fract(sin(p) * 10000.0);
}

float noise(vec2 p) {
    return random(p.x + p.y * 10000.0);
}

float stepNoise(vec2 p) {
    return noise(floor(p));
}

vec2 sw(vec2 p) { return vec2(floor(p.x), floor(p.y)); }
vec2 se(vec2 p) { return vec2(ceil(p.x), floor(p.y)); }
vec2 nw(vec2 p) { return vec2(floor(p.x), ceil(p.y)); }
vec2 ne(vec2 p) { return vec2(ceil(p.x), ceil(p.y)); }

float smoothNoise(vec2 p) {
    vec2 inter = smoothstep(0., 1., fract(p));
    float s = mix(noise(sw(p)), noise(se(p)), inter.x);
    float n = mix(noise(nw(p)), noise(ne(p)), inter.x);
    return mix(s, n, inter.y);
}

float fractalNoise(vec2 p) {
    float total = 0.0;
    total += smoothNoise(p);
    total += smoothNoise(p * 2.) / 2.;
    total += smoothNoise(p * 4.) / 4.;
    total += smoothNoise(p * 8.) / 8.;
    total += smoothNoise(p * 16.) / 16.;
    total /= 1. + 1./2. + 1./4. + 1./8. + 1./16.;
    return total;
}

float normalizedSin(float x) {
    return abs(sin(x));
}

void main()
{
    float time = czm_frameNumber * 10.0 * speed / 1000.0;
    vec2 uv = v_textureCoordinates;
    vec2 p = uv * 6.0;
    p.x -= time;
    p.y += normalizedSin(time * 0.4);
    float brightness = fractalNoise(p);
    float fogIntensity = 0.4 + 0.2 * (normalizedSin(time));
    vec3 color = vec3(brightness) * fogIntensity;
    vec3 orgColor = texture(colorTexture, v_textureCoordinates).rgb;
    out_FragColor = vec4(orgColor * 0.9 + color, 1.0);
}
