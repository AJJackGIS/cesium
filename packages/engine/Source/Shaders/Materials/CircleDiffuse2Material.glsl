uniform vec4 color;
uniform float speed;

czm_material czm_getMaterial(czm_materialInput materialInput)
{
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = materialInput.st * 2.0 - 1.0;
    float d = length(st);
    float movingCircleD = fract(czm_frameNumber * speed / 1000.0);
    float alpha = fract(d * 3.0) * fract(d * 3.0) * step(d, 1.);
    alpha = smoothstep(0.0, 1.0, alpha);
    alpha += step(d, 1.) * step(movingCircleD, d) * step(d, movingCircleD + .2) * smoothstep(movingCircleD, movingCircleD + .2, d);
    material.diffuse = color.rgb;
    material.alpha = alpha;

    return material;
}
