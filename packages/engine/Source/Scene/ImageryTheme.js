import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";
import PixelFormat from "../Core/PixelFormat.js";
import WebGLConstants from "../Core/WebGLConstants.js";
import Framebuffer from "../Renderer/Framebuffer.js";
import PixelDatatype from "../Renderer/PixelDatatype.js";
import RenderState from "../Renderer/RenderState.js";
import Texture from "../Renderer/Texture.js";
import BlendingState from "./BlendingState.js";

/**
 * @typedef {Object} ImageryTheme.ConstructorOptions
 *
 * Initialization options for the ImageryTheme constructor.
 *
 * @property {Color} [bgColor=Color.TRANSPARENT] The background color.
 * @property {number} [alpha=0.5] The front color alpha.
 * @property {boolean} [invert=false] Whether to invert grayscale.
 * @property {boolean} [preMultiplyAlpha=true] Whether to pre multiply alpha.
 */

/**
 * The theme of the imagery layer
 *
 * @alias ImageryTheme
 * @constructor
 */
class ImageryTheme {
  constructor(options) {
    this.params = options ?? Frozen.EMPTY_OBJECT;
    this.params.bgColor = options.bgColor ?? Color.TRANSPARENT;
    this.params.alpha = options.alpha ?? 0.5;
    this.params.invert = options.invert ?? false;
    this.params.preMultiplyAlpha = options.preMultiplyAlpha ?? true;

    this.shaders = {
      // 背景处理的shader代码
      bgFS: `
        uniform sampler2D u_map;
        uniform vec4 u_bgColor;

        in vec2 v_textureCoordinates;
        void main(){
            vec2 uv = v_textureCoordinates;
            vec4 bgColor = u_bgColor;
            vec4 color = texture(u_map, uv);
            if(color.a > 0.){
                out_FragColor = bgColor;
            }
        }
      `,
      // 处理瓦片图像的shader代码
      mainFS: `
        uniform sampler2D u_map;
        uniform bool u_invert;
        uniform float u_alpha;

        in vec2 v_textureCoordinates;
        void main(){
            vec2 uv = v_textureCoordinates;
            vec4 color = texture(u_map, uv);
            // 计算灰度
            float grayVal = (color.r + color.g + color.b ) / 3.;
            // 灰度反转
            if(u_invert){
                grayVal = 1. - grayVal;
            }
            //应用前景透明度，以便和背景混合
            float alpha = color.a * u_alpha;
            out_FragColor = vec4(vec3(grayVal) , alpha);
        }
      `,
      uniformMap: {
        u_invert: () => {
          return this.params.invert;
        },
        u_alpha: () => {
          return this.params.alpha;
        },
        u_bgColor: () => {
          return this.params.bgColor;
        },
      },
    };
  }

  processTexture(context, texture) {
    const sampler = texture.sampler;

    //创建处理后的瓦片贴图，作为RTT的目标纹理
    const textureProcessed = new Texture({
      context: context,
      pixelFormat: PixelFormat.RGBA,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      sampler: sampler,
      width: texture.width,
      height: texture.height,
      flipY: texture.flipY,
      target: WebGLConstants.TEXTURE_2D,
      preMultiplyAlpha: this.params.preMultiplyAlpha,
    });
    const framebuffer = new Framebuffer({
      context: context,
      colorTextures: [textureProcessed],
      destroyAttachments: false,
    });
    const renderState = RenderState.fromCache({
      depthTest: {
        enabled: false,
      },
      blending: this.params.preMultiplyAlpha
        ? BlendingState.PRE_MULTIPLIED_ALPHA_BLEND
        : BlendingState.ALPHA_BLEND,
      viewport: {
        x: 0,
        y: 0,
        width: texture.width,
        height: texture.height,
      },
    });

    //传递原始瓦片贴图
    this.shaders.uniformMap.u_map = function () {
      return texture;
    };

    //画背景
    if (!Color.equals(this.params.bgColor, Color.TRANSPARENT)) {
      const bgCommand = context.createViewportQuadCommand(this.shaders.bgFS, {
        framebuffer: framebuffer,
        renderState: renderState,
        uniformMap: this.shaders.uniformMap,
      });
      bgCommand.execute(context);
    }

    //瓦片加工
    const mainCommand = context.createViewportQuadCommand(this.shaders.mainFS, {
      framebuffer: framebuffer,
      renderState: renderState,
      uniformMap: this.shaders.uniformMap,
    });
    mainCommand.execute(context);

    framebuffer.destroy();
    texture.destroy();

    return textureProcessed;
  }
}

export default ImageryTheme;
