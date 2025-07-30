uniform vec4 color;
uniform float speed;

czm_material czm_getMaterial(czm_materialInput materialInput)
{
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = materialInput.st * 2.0 - 1.0;
    float d = length(st);
    float movingCircleD = fract(czm_frameNumber * speed / 1000.0);
    float alpha = step(-0.01, st.t) * step(st.t, 0.01) + step(-0.01, st.s) * step(st.s, 0.01) + step(.3, d) * step(d, .35) + step(.98, d) * step(d, 1.) + fract(d * 3.0) * fract(d * 3.0) * step(d, 1.);
    alpha = smoothstep(0.0, 1.0, alpha);
    float angle = atan(st.s, st.t);
    float angleRange = 0.3; // 扇形扫描的角度范围
    float currentAngleRange = angle - 6.28 * (movingCircleD - step(0.5, movingCircleD));
    alpha += step(d, 1.) * step(-angleRange, currentAngleRange) * smoothstep(-angleRange, 0.0, currentAngleRange) * step(currentAngleRange, angleRange); // 扇形扫描效果
    material.diffuse = color.rgb;
    material.alpha = alpha;
    return material;
}
