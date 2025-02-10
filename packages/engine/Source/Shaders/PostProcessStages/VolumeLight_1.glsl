uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
in vec2 v_textureCoordinates;
out vec4 outColor;

// 光源正常渲染，遮挡光源的物体都渲染为黑色，得到一张采样纹理
void main() {
    vec4 color = texture(colorTexture, v_textureCoordinates);
    float depth = czm_readDepth(depthTexture, v_textureCoordinates);
    if (depth > 1.0 - 0.000001) {
        outColor = color;
    } else {
        outColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
