uniform vec4 color;
uniform float spacing;
uniform float width;
uniform vec4 rect;
uniform vec4 m_0;
uniform vec4 m_1;
uniform vec4 m_2;
uniform vec4 m_3;

czm_material czm_getMaterial(czm_materialInput materialInput)
{

    czm_material material = czm_getDefaultMaterial(materialInput);

    // 这一行计算了当前像素的高度与最接近的等高线之间的差值。
    // mod函数返回的是当前高度除以spacing后的余数，也就是到下一个等高线的距离
    float distanceToContour = mod(materialInput.height, spacing);

    // 是否支持标准导数 GL_OES_standard_derivatives
    #if (__VERSION__ == 300 || defined(GL_OES_standard_derivatives))
    // 如果支持，则使用dFdx和dFdy函数来计算相邻像素高度变化的最大值，并结合像素比例和等高线宽度来决定是否绘制等高线
    float dxc = abs(dFdx(materialInput.height));
    float dyc = abs(dFdy(materialInput.height));
    float dF = max(dxc, dyc) * czm_pixelRatio * width;
    float alpha = (distanceToContour < dF) ? 1.0 : 0.0;
    #else
    // If no derivatives available (IE 10?), use pixel ratio
    // 直接使用像素比例和宽度来判断
    float alpha = (distanceToContour < (czm_pixelRatio * width)) ? 1.0 : 0.0;
    #endif

    vec4 outColor = czm_gammaCorrect(vec4(color.rgb, alpha * color.a));
    material.diffuse = outColor.rgb;

    mat4 m = mat4(m_0[0], m_0[1], m_0[2], m_0[3],
    m_1[0], m_1[1], m_1[2], m_1[3],
    m_2[0], m_2[1], m_2[2], m_2[3],
    m_3[0], m_3[1], m_3[2], m_3[3]);

    vec4 eyeCoordinate = vec4(-materialInput.positionToEyeEC, 1.0);
    vec4 worldCoordinate4 = czm_inverseView * eyeCoordinate;
    vec3 worldCoordinate = worldCoordinate4.xyz; // worldCoordinate4.w;
    vec4 local = m * vec4(worldCoordinate, 1.);
    material.alpha = 0.;
    if (local.x > rect.x && local.x < rect.z && local.y < rect.w && local.y > rect.y) {
        material.alpha = outColor.a;
    }

    return material;
}
