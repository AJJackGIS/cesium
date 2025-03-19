import buildModuleUrl from "../Core/buildModuleUrl.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";
import CustomShader from "../Scene/Model/CustomShader.js";
import LightingModel from "../Scene/Model/LightingModel.js";
import TextureUniform from "../Scene/Model/TextureUniform.js";
import UniformType from "../Scene/Model/UniformType.js";
import VaryingType from "../Scene/Model/VaryingType.js";

/**
 * Cesium3DTileset 白膜特效
 */
class Cesium3DTilesetWhiteModelShader {
  /**
   * 根据高度实现渐变色(高度越高颜色越不透明)
   * @param {object} [options] Object with the following properties:
   * @param {Color} [options.color=Color.WHITE] 默认的颜色
   * @param {number} [options.height=100] 最大高度
   * @param {boolean} [options.reverse=false] 反转透明度
   * @returns {CustomShader}
   */
  static createShaderByHeight(options) {
    options = options ?? Frozen.EMPTY_OBJECT;
    const color = options.color ?? Color.WHITE;
    const height = options.height ?? 100.0;
    const reverse = options.reverse ?? false;

    return new CustomShader({
      lightingModel: LightingModel.UNLIT,
      uniforms: {
        u_color: {
          type: UniformType.VEC3,
          value: new Cartesian3(color.red, color.green, color.blue),
        },
        u_height: {
          type: UniformType.FLOAT,
          value: height,
        },
        u_reverse: {
          type: UniformType.BOOL,
          value: reverse,
        },
      },
      fragmentShaderText: `
        void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
        {
          material.diffuse = u_color;
          vec4 position = czm_inverseModelView * vec4(fsInput.attributes.positionEC, 1);
          float a = clamp(position.z / u_height, 0.0, 1.0);
          material.alpha = u_reverse ? 1.0 - a : a;
        }
      `,
    });
  }

  /**
   * 根据高度实现渐变色(高度越高颜色越不透明),外加动态光环
   * @param {object} [options] Object with the following properties:
   * @param {Color} [options.color=Color.WHITE] 默认的颜色
   * @param {number} [options.baseHeight=0] 基础高度
   * @param {number} [options.height=100] 最大高度
   * @param {boolean} [options.reverse=false] 反转透明度
   * @returns {CustomShader}
   */
  static createShaderByHeightAndHale(options) {
    options = options ?? Frozen.EMPTY_OBJECT;
    const color = options.color ?? Color.WHITE;
    const baseHeight = options.baseHeight ?? 0.0;
    const height = options.height ?? 100.0;
    const reverse = options.reverse ?? false;

    return new CustomShader({
      lightingModel: LightingModel.UNLIT,
      uniforms: {
        u_color: {
          type: UniformType.VEC3,
          value: new Cartesian3(color.red, color.green, color.blue),
        },
        u_baseHeight: {
          type: UniformType.FLOAT,
          value: baseHeight,
        },
        u_height: {
          type: UniformType.FLOAT,
          value: height,
        },
        u_reverse: {
          type: UniformType.BOOL,
          value: reverse,
        },
      },
      fragmentShaderText: `
        void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
        {
          vec4 position = czm_inverseModelView * vec4(fsInput.attributes.positionEC, 1);
          // vec3 position = fsInput.attributes.positionMC; // 直接使用这个positionMC不准

          // 建筑基础色
          float czm_height = position.z - u_baseHeight; // 建筑高度
          material.diffuse = u_color;
          float a = clamp(czm_height / u_height, 0.0, 1.0);
          material.alpha = u_reverse ? 1.0 - a : a;

          // 动态光环
          float time = fract(czm_frameNumber / 1000.0);
          time = abs(time - 0.5) * 2.0;
          float d = step(0.003, abs(a - time));
          material.diffuse += material.diffuse * (1.0 - d);
        }
      `,
    });
  }

  /**
   * 白膜贴图
   * @param {object} [options] Object with the following properties:
   * @param {string} [options.ceiling] 顶部材质
   * @param {number} [options.ceilingSize] 顶部材质大小
   * @param {string} [options.profile] 立面材质
   * @param {number} [options.profileSize] 立面材质大小
   * @returns {CustomShader}
   */
  static createShaderByTexture(options) {
    options = options ?? Frozen.EMPTY_OBJECT;
    const ceiling =
      options.ceiling ?? buildModuleUrl("Assets/Textures/blue_ceiling.png");
    const profile =
      options.profile ?? buildModuleUrl("Assets/Textures/blue_profile.png");
    const ceilingSize = options.ceilingSize ?? 30.0;
    const profileSize = options.profileSize ?? 30.0;

    return new CustomShader({
      lightingModel: LightingModel.UNLIT,
      uniforms: {
        u_ceiling_texture: {
          type: UniformType.SAMPLER_2D,
          value: new TextureUniform({
            url: ceiling,
          }),
        },
        u_ceiling_size: {
          type: UniformType.FLOAT,
          value: ceilingSize,
        },
        u_profile_texture: {
          type: UniformType.SAMPLER_2D,
          value: new TextureUniform({
            url: profile,
          }),
        },
        u_profile_size: {
          type: UniformType.FLOAT,
          value: profileSize,
        },
      },
      varyings: {
        v_normalMC: VaryingType.VEC3,
      },
      vertexShaderText: `
        void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput)
        {
          v_normalMC = vsInput.attributes.normalMC;
        }
      `,
      fragmentShaderText: `
        void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
        {
          vec4 position = czm_inverseModelView * vec4(fsInput.attributes.positionEC, 1);
          if(dot(vec3(0.0, 0.0, 1.0), v_normalMC) > 0.9){ // 顶面
            float textureX = mod(position.x, u_ceiling_size) / u_ceiling_size;
            float textureY = mod(position.y, u_ceiling_size) / u_ceiling_size;
            vec4 color = texture(u_ceiling_texture, vec2(textureX, textureY));
            material.diffuse = color.rgb;
          }else{
            float textureX = 0.0;
            float v = dot(vec3(0.0, 1.0, 0.0), v_normalMC);
            if(v > 0.71 || v < -0.71) { // 前面和后面
              textureX = mod(position.x, u_profile_size) / u_profile_size;
            }else{
              textureX = mod(position.y, u_profile_size) / u_profile_size;
            }
            float textureY = mod(position.z, u_profile_size) / u_profile_size;
            vec4 color = texture(u_profile_texture, vec2(textureX, textureY));
            material.diffuse = color.rgb;
          }
        }
      `,
    });
  }
}

export default Cesium3DTilesetWhiteModelShader;
