uniform sampler2D blendTexture;
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;

float blendScreen(float base, float blend) {
    return 1.0 - ((1.0 - base) * (1.0 - blend));
}

vec3 blendScreen(vec3 base, vec3 blend) {
    return vec3(blendScreen(base.r, blend.r), blendScreen(base.g, blend.g), blendScreen(base.b, blend.b));
}

// 把上一步经过径向模糊的纹理和原始纹理叠加就可以看到体积光的效果了
void main()
{
    vec4 base = texture(colorTexture, v_textureCoordinates);
    vec4 blend = texture(blendTexture, v_textureCoordinates);
    vec3 sceneColor = blend.xyz;
    sceneColor = czm_RGBToHSB(sceneColor);
    if (sceneColor.z > 0.8) {
        sceneColor.z -= 0.2; // 降低亮度
        // 限制亮度值在0到1之间
        sceneColor.z = max(sceneColor.z, 0.0);
    }
    sceneColor = czm_HSBToRGB(sceneColor);
    float opacity = 1.0;
    vec3 blendColorDodge = (blendScreen(vec3(base.rgb), sceneColor)) * opacity + vec3((base.rgb) * (1.0 - opacity));
    out_FragColor = vec4(blendColorDodge, base.a);
}
