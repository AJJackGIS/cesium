import BoundingRectangle from "../Core/BoundingRectangle.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import PixelFormat from "../Core/PixelFormat.js";
import Framebuffer from "../Renderer/Framebuffer.js";
import Texture from "../Renderer/Texture.js";
import SunLight from "../Scene/SunLight.js";

/**
 * FBO工具类
 */
export default class FrameBufferUtils {
  /**
   * 创建一个framebuffer
   * @param {Scene} scene
   * @return {Framebuffer}
   */
  static createFramebuffer(scene) {
    return new Framebuffer({
      context: scene.context,
      colorTextures: [
        new Texture({
          context: scene.context,
          width: scene.context.drawingBufferWidth,
          height: scene.context.drawingBufferHeight,
          pixelFormat: PixelFormat.RGBA,
        }),
      ],
    });
  }

  /**
   * Render the scene to framebuffer (代码源于Scene中的render方法)
   *
   * @param {Framebuffer} framebuffer
   * @param {Scene} scene
   * @param {Camera} fboCamera
   */
  static renderToFramebuffer(framebuffer, scene, fboCamera) {
    let defaultCamera;
    // 如果自定义了fbo相机
    if (fboCamera) {
      // 保存原始相机,并将fbo相机设置为当前相机
      defaultCamera = scene._defaultView.camera;
      scene._defaultView.camera = fboCamera;
    }

    // 获取场景的帧状态、WebGL上下文和uniform状态
    const frameState = scene._frameState;
    const context = scene.context;
    const { uniformState } = context;

    // 设置默认视图
    const view = scene._defaultView;
    scene._view = view;

    // 更新场景帧状态
    scene.updateFrameState();

    // 设置3DTiles渲染通道状态
    frameState.passes.render = true;
    frameState.passes.postProcess = scene.postProcessStages.hasSelected;
    frameState.tilesetPassState = scene.renderTilesetPassState;

    // 设置背景颜色,如果不是HDR模式需要进行gamma校正
    let backgroundColor = scene.backgroundColor ?? Color.BLACK;
    if (scene._hdr) {
      backgroundColor = Color.clone(
        backgroundColor,
        scene.scratchBackgroundColor,
      );
      backgroundColor.red = Math.pow(backgroundColor.red, scene.gamma);
      backgroundColor.green = Math.pow(backgroundColor.green, scene.gamma);
      backgroundColor.blue = Math.pow(backgroundColor.blue, scene.gamma);
    }
    frameState.backgroundColor = backgroundColor;

    // 更新大气和雾效果
    frameState.atmosphere = scene.atmosphere;
    scene.fog.update(frameState);

    // 更新uniform状态
    uniformState.update(frameState);

    // 处理阴影贴图
    const shadowMap = scene.shadowMap;
    if (defined(shadowMap) && shadowMap.enabled) {
      if (!defined(scene.light) || scene.light instanceof SunLight) {
        // 将太阳方向取反,使其从太阳射向场景
        Cartesian3.negate(
          uniformState.sunDirectionWC,
          scene._shadowMapCamera.direction,
        );
      } else {
        Cartesian3.clone(
          scene.light.direction,
          scene._shadowMapCamera.direction,
        );
      }
      frameState.shadowMaps.push(shadowMap);
    }

    // 清空命令列表
    scene._computeCommandList.length = 0;
    scene._overlayCommandList.length = 0;

    // 设置视口尺寸
    const viewport = view.viewport;
    viewport.x = 0;
    viewport.y = 0;
    viewport.width = context.drawingBufferWidth;
    viewport.height = context.drawingBufferHeight;

    // 设置通道状态
    const passState = view.passState;
    passState.framebuffer = framebuffer;
    passState.blendingEnabled = undefined;
    passState.scissorTest = undefined;
    passState.viewport = BoundingRectangle.clone(viewport, passState.viewport);

    context.beginFrame();

    // 更新并执行渲染
    scene.updateEnvironment();
    scene.updateAndExecuteCommands(passState, backgroundColor);
    scene.resolveFramebuffers(passState);

    // 清理状态
    passState.framebuffer = undefined;

    context.endFrame();

    // 恢复原始相机和地球显示
    if (fboCamera) {
      scene._defaultView.camera = defaultCamera;
    }
  }

  /**
   * FBO转换为纹理
   * @param {Framebuffer} framebuffer
   * @param {Scene} scene
   * @return {Texture}
   */
  static framebuffer2Texture(framebuffer, scene) {
    return Texture.fromFramebuffer({
      context: scene.context,
      framebuffer: framebuffer,
    });
  }

  /**
   * FBO转换为Canvas
   * @param {Framebuffer} framebuffer
   * @param {Scene} scene
   * @param {HTMLCanvasElement} canvas
   */
  static framebuffer2Canvas(framebuffer, scene, canvas) {
    const width = scene.context.drawingBufferWidth;
    const height = scene.context.drawingBufferHeight;
    const pixels = scene.context.readPixels({
      x: 0,
      y: 0,
      width: width,
      height: height,
      framebuffer: framebuffer,
    });

    const ctx = canvas.getContext("2d"); // 目标canvas

    // 创建临时canvas（原始尺寸）
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");

    const imgData = new ImageData(new Uint8ClampedArray(pixels), width, height);
    tempCtx.putImageData(imgData, 0, 0);

    ctx.save();
    // 翻转
    ctx.translate(0, canvas.height);
    // 镜面反转
    ctx.scale(1, -1);

    ctx.drawImage(
      tempCanvas,
      0,
      0,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    ctx.restore();
  }
}
