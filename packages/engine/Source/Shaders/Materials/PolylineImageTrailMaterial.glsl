uniform sampler2D image;
uniform vec4 color;
uniform float speed;
uniform vec2 repeat;

czm_material czm_getMaterial(czm_materialInput materialInput)
{
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = repeat * materialInput.st;
    float time = fract(czm_frameNumber * speed * 10.0 / 1000.0);
    vec4 colorImage = texture(image, vec2(fract(st.s - time), st.t));
    // 如果颜色透明
    if (color.a == 0.0) {
        // 如果材质是白色或者黑色
        if (colorImage.rgb == vec3(1.0) || colorImage.rgb == vec3(0.0)) {
            discard;
        }
        material.alpha = colorImage.a;
        material.diffuse = colorImage.rgb;
    } else {
        material.alpha = colorImage.a * color.a;
        material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);
    }
    return material;
}
