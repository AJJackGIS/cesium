uniform vec4 color;
uniform float speed;
uniform float repeat;
uniform bool reverse;
uniform float thickness;

czm_material czm_getMaterial(czm_materialInput materialInput) {
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = materialInput.st;
    float time = fract(czm_frameNumber * speed / 1000.);
    float dis = distance(st, vec2(0.5)); // 距离中心点的距离
    // 利用取模函数mod达到反复渐变效果 x – y ∗ floor (x/y)
    float m = mod((reverse ? 1.- dis : dis) + time, 1. / repeat);  // 计算这repeat圈圈周围的渐变值
    // 利用step(edge, x)实现斑马线条纹效果
    // float a = step(0.03, m);
    // 如果值小于0.03则为0 大于0.03则为1 实现斑马两级分化 这个值越大 圈圈的线越细
    float a = step(1. / repeat * (1. - thickness), m);
    material.diffuse = color.rgb;
    material.alpha = color.a * a;
    return material;
}
