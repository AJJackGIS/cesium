uniform sampler2D sampleTexture; // VolumnLight_1生成的Texture
uniform vec2 lightPositionOnScreen; //需要把通过太阳世界坐标转为屏幕坐标
uniform float decay;
uniform float exposure;
uniform float density;
uniform float weight;
uniform int samples;
in vec2 v_textureCoordinates;
out vec4 outColor;

// 把上一步渲染的纹理传给径向模糊的着色器，在这张纹理上采样，逐片元算出径向模糊后的颜色，得到径向模糊纹理
void main()
{
    vec2 tc = v_textureCoordinates;
    vec2 deltaTexCoord = (tc - lightPositionOnScreen.xy);
    deltaTexCoord *= 1.0 / float(samples) * density;
    float illuminationDecay = 1.0;
    vec4 color = texture(sampleTexture, tc) * 0.4;
    for (int i = 0; i < samples; i++)
    {
        tc -= deltaTexCoord;
        vec4 s = texture(sampleTexture, tc) * 0.4;
        s *= illuminationDecay * weight;
        color += s;
        illuminationDecay *= decay;
    }
    outColor = vec4(color.rgb * illuminationDecay, 1.0);
}
