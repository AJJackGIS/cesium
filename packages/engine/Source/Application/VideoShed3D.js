import buildModuleUrl from "../Core/buildModuleUrl.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import clone from "../Core/clone.js";
import Color from "../Core/Color.js";
import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Frozen from "../Core/Frozen.js";
import FrustumOutlineGeometry from "../Core/FrustumOutlineGeometry.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import CesiumMath from "../Core/Math.js";
import Matrix3 from "../Core/Matrix3.js";
import PerspectiveFrustum from "../Core/PerspectiveFrustum.js";
import PixelFormat from "../Core/PixelFormat.js";
import Quaternion from "../Core/Quaternion.js";
import writeTextToCanvas from "../Core/writeTextToCanvas.js";
import PixelDatatype from "../Renderer/PixelDatatype.js";
import Texture from "../Renderer/Texture.js";
import Camera from "../Scene/Camera.js";
import PerInstanceColorAppearance from "../Scene/PerInstanceColorAppearance.js";
import PostProcessStage from "../Scene/PostProcessStage.js";
import Primitive from "../Scene/Primitive.js";
import ShadowMap from "../Scene/ShadowMap.js";
import VideoShed3DFS from "../Shaders/PostProcessStages/VideoShed3DFS.js";

/**
 * 视频投射
 *
 * @constructor
 * @param {Viewer} viewer
 * @param {object} options
 * @param {Cartesian3} options.cameraPosition 相机位置
 * @param {Cartesian3} options.viewPosition 视点位置
 * @param {number} options.type 投射类型 (纯色: 1, 图片: 2, 视频: 3, 文字: 4)
 * @param {number} options.alpha 混合因子
 * @param {string} options.url 视频或者图片url
 * @param {Color} options.color 颜色
 * @param {string} options.text 文字
 * @param {object} options.textStyle 文字样式 {@link writeTextToCanvas}
 * @param {boolean} options.debugFrustum 显示视椎体
 * @param {number} options.fov 相机水平张角
 * @param {boolean} options.videoPlay 暂停播放
 * @param {boolean} options.show 显示隐藏
 * @param {boolean} options.enableMask 控制羽化
 * @param {string} options.maskUrl 羽化材质
 */
function VideoShed3D(viewer, options) {
  if (!defined(viewer)) {
    throw new DeveloperError("Viewer is not defined.");
  }
  this.viewer = viewer;

  options = options ?? Frozen.EMPTY_OBJECT;

  if (!defined(options.cameraPosition)) {
    throw new DeveloperError("cameraPosition is not defined.");
  }
  this._cameraPosition = options.cameraPosition;

  if (!defined(options.viewPosition)) {
    throw new DeveloperError("viewPosition is not defined.");
  }
  this._viewPosition = options.viewPosition;

  this.type = options.type ?? 1;
  this.alpha = options.alpha ?? 1;
  this.url = options.url;
  this.color = options.color ?? Color.RED.withAlpha(0.7);
  this.text = options.text ?? "Hello World";
  this.textStyle = options.textStyle;
  this._debugFrustum = options.debugFrustum ?? true;
  this._aspectRatio = this._getAspectRatio(); //宽高比
  this._camerafov =
    options.fov ?? CesiumMath.toDegrees(this.viewer.scene.camera.frustum.fov);
  this.viewDis = undefined; // 相机与视野距离
  // 视频对象
  this.videoElement = undefined;
  this.activeVideoListener = undefined; // 视频监听事件

  const emptyTexture = new Texture({
    context: this.viewer.scene.context,
    source: {
      width: 1,
      height: 1,
      arrayBufferView: new Uint8Array([255, 255, 255, 255]),
    },
    flipY: false,
  });
  //初始化一个默认材质，否则会报错
  this.videoTexture = emptyTexture;
  this._videoPlay = options.videoPlay ?? true; //暂停播放
  this.defaultShow = options.show ?? true; //显示和隐藏
  this.cameraFrustum = undefined; // 视锥体
  this.orientation = undefined;
  this.viewShadowMap = undefined;
  this.enableMask = options.enableMask ?? true;
  this.maskUrl =
    options.maskUrl ?? buildModuleUrl("Assets/Textures/eclosion.png");
  this.maskTexture = emptyTexture;
  if (this.enableMask) {
    const image = new Image();
    image.onload = () => {
      this.maskTexture = new Texture({
        context: this.viewer.scene.context,
        source: image,
      });
    };
    image.onerror = (e) => {
      console.error(`图片加载失败：${this.maskUrl}`, e);
    };
    image.src = this.maskUrl;
  }

  switch (this.type) {
    case 4:
      this.activeText(this.text, this.textStyle);
      break;
    case 3:
      this.activeVideo(this.url);
      break;
    case 2:
      this.activePicture(this.url);
      this.deActiveVideo();
      break;
    case 1:
      this.activeColor(this.color);
      this.deActiveVideo();
      break;
    default:
      break;
  }

  this._createShadowMap();
  this._getOrientation();
  this._addCameraFrustum();
  this._addPostProcess();
  this.viewer.scene.primitives.add(this);
}

/**
 * 改变相机的水平张角
 * @private
 */
VideoShed3D.prototype._changeCameraFov = function () {
  this.viewer.scene.postProcessStages.remove(this.postProcess);
  this.viewer.scene.primitives.remove(this.cameraFrustum);
  this._createShadowMap(this.cameraPosition, this._viewPosition);
  this._getOrientation();
  this._addCameraFrustum();
  this._addPostProcess();
};

/**
 * 改变相机视野的宽高比例（垂直张角）
 * @private
 */
VideoShed3D.prototype.changeVideoAspect = function () {
  this.viewer.scene.postProcessStages.remove(this.postProcess);
  this.viewer.scene.primitives.remove(this.cameraFrustum);
  this._createShadowMap(this.cameraPosition, this._viewPosition);
  this._getOrientation();
  this._addCameraFrustum();
  this._addPostProcess();
};

/**
 * 改变相机的位置
 *
 * @private
 */
VideoShed3D.prototype._changeCameraPos = function () {
  this.viewer.scene.postProcessStages.remove(this.postProcess);
  this.viewer.scene.primitives.remove(this.cameraFrustum);
  this.viewShadowMap.destroy();
  this.cameraFrustum.destroy();
  this._createShadowMap(this.cameraPosition, this._viewPosition);
  this._getOrientation();
  this._addCameraFrustum();
  this._addPostProcess();
};

/**
 * 改变相机视点的位置
 * @private
 */
VideoShed3D.prototype._changeViewPos = function () {
  this.viewer.scene.postProcessStages.remove(this.postProcess);
  this.viewer.scene.primitives.remove(this.cameraFrustum);
  this.viewShadowMap.destroy();
  this.cameraFrustum.destroy();
  this._createShadowMap(this.cameraPosition, this._viewPosition);
  this._getOrientation();
  this._addCameraFrustum();
  this._addPostProcess();
};

VideoShed3D.prototype._switchShow = function () {
  if (this.show) {
    if (!this.postProcess) {
      this._addPostProcess();
    }
  } else {
    this.viewer.scene.postProcessStages.remove(this.postProcess);
    delete this.postProcess;
    this.postProcess = null;
  }
  this.cameraFrustum.show = this.show;
};

/**
 * 激活或重置视频URL
 * @param videoSrc
 * @private
 */
VideoShed3D.prototype.activeVideo = function (videoSrc) {
  //在可视域添加视频
  const videoElement = this._createVideoEle(videoSrc);
  if (videoElement) {
    this.videoElement = videoElement;

    if (!this.activeVideoListener) {
      this.activeVideoListener = () => {
        try {
          if (this._videoPlay && this.videoElement.paused) {
            this.videoElement.play();
          }
        } catch (e) {
          //规避浏览器权限异常
        }
        this.videoTexture.destroy(); // 去掉默认的材质，改为视频材质
        this.videoTexture = new Texture({
          context: this.viewer.scene.context,
          source: this.videoElement,
          pixelFormat: PixelFormat.RGBA,
          pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
        });
      };
    }
    videoElement.addEventListener("canplaythrough", () => {
      this.viewer.clock.onTick.addEventListener(this.activeVideoListener, this);
    });
  }
};

/**
 * 删除视频播放监听
 * @private
 */
VideoShed3D.prototype.deActiveVideo = function () {
  if (this.activeVideoListener) {
    this.viewer.clock.onTick.removeEventListener(this.activeVideoListener);
    delete this.activeVideoListener;
  }
};

/**
 * 激活或重置图片URL
 * @param picSrc
 * @private
 */
VideoShed3D.prototype.activePicture = function (picSrc) {
  const image = new Image();
  image.onload = () => {
    this.videoTexture = new Texture({
      context: this.viewer.scene.context,
      source: image,
    });
  };
  image.onerror = () => {
    console.log(`图片加载失败：${picSrc}`);
  };
  image.src = picSrc;
};

/**
 * 激活或重置颜色
 * @param color
 * @private
 */
VideoShed3D.prototype.activeColor = function (color) {
  const r = color.red * 255;
  const g = color.green * 255;
  const b = color.blue * 255;
  const a = color.alpha * 255;
  this.videoTexture = new Texture({
    context: this.viewer.scene.context,
    source: {
      width: 1,
      height: 1,
      arrayBufferView: new Uint8Array([r, g, b, a]),
    },
    flipY: false,
  });
};

/**
 * 激活或重置文字
 * @param text
 * @param styles
 * @private
 */
VideoShed3D.prototype.activeText = function (text, styles) {
  //在可视域添加文字
  styles = {
    font: "50px 楷体",
    fill: true,
    stroke: true,
    fillColor: new Color(1.0, 1.0, 0.0, 1.0),
    strokeColor: new Color(1.0, 1.0, 1.0, 0.8),
    backgroundColor: new Color(1.0, 1.0, 1.0, 0.1),
    strokeWidth: 2,
    padding: 40,
    ...styles,
  };
  this.textCanvas = writeTextToCanvas(text, styles);
  this.videoTexture = new Texture({
    context: this.viewer.scene.context,
    source: this.textCanvas,
    flipY: true,
  });
};

/**
 * 呈现投影相机的第一视角
 */
VideoShed3D.prototype.locate = function () {
  const camera_pos = clone(this._cameraPosition);
  const lookAt_pos = clone(this._viewPosition);
  this.viewer.camera.position = camera_pos;
  this.viewer.camera.direction = Cartesian3.subtract(
    lookAt_pos,
    camera_pos,
    new Cartesian3(0, 0, 0),
  );
  this.viewer.camera.up = Cartesian3.normalize(
    camera_pos,
    new Cartesian3(0, 0, 0),
  );
};

/**
 * 获取四元数
 * @returns {Quaternion}
 * @private
 */
VideoShed3D.prototype._getOrientation = function () {
  const cameraPosition = this._cameraPosition;
  const viewPosition = this._viewPosition;
  let direction = Cartesian3.normalize(
    Cartesian3.subtract(viewPosition, cameraPosition, new Cartesian3()),
    new Cartesian3(),
  );
  let up = Cartesian3.normalize(cameraPosition, new Cartesian3());
  const camera = new Camera(this.viewer.scene);
  camera.position = cameraPosition;
  camera.direction = direction;
  camera.up = up;
  direction = camera.directionWC;
  up = camera.upWC;
  let right = camera.rightWC;
  const scratchRight = new Cartesian3();
  const scratchRotation = new Matrix3();
  const scratchOrientation = new Quaternion();

  right = Cartesian3.negate(right, scratchRight);
  const rotation = scratchRotation;
  Matrix3.setColumn(rotation, 0, right, rotation);
  Matrix3.setColumn(rotation, 1, up, rotation);
  Matrix3.setColumn(rotation, 2, direction, rotation);
  //计算视锥姿态
  const orientation = Quaternion.fromRotationMatrix(
    rotation,
    scratchOrientation,
  );
  this.orientation = orientation;
  return orientation;
};

/**
 * 创建video元素
 * @param src
 * @returns {HTMLElement}
 * @private
 */
VideoShed3D.prototype._createVideoEle = function (src) {
  //创建可视域video元素
  const source_map4 = document.createElement("source");
  source_map4.type = "video/mp4";
  source_map4.src = src;

  const source_mov = document.createElement("source");
  source_mov.type = "video/quicktime";
  source_mov.src = src;

  const videoEle = document.createElement("video");
  videoEle.autoplay = true;
  videoEle.muted = true; // 静音下的自动播放是允许的
  videoEle.loop = true;
  videoEle.crossorigin = true;

  videoEle.appendChild(source_map4);
  videoEle.appendChild(source_mov);
  videoEle.style.display = "none";
  document.body.appendChild(videoEle);
  return videoEle;
};

/**
 * 获取canvas默认宽高比例
 * @returns {number}
 * @private
 */
VideoShed3D.prototype._getAspectRatio = function () {
  const scene = this.viewer.scene;
  return scene.canvas.clientWidth / scene.canvas.clientHeight;
};

/**
 * 创建ShadowMap
 * @private
 */
VideoShed3D.prototype._createShadowMap = function () {
  const camera_pos = this._cameraPosition;
  const view_pos = this._viewPosition;
  const scene = this.viewer.scene;
  const camera = new Camera(scene);
  camera.position = camera_pos;
  camera.direction = Cartesian3.subtract(
    view_pos,
    camera_pos,
    new Cartesian3(0, 0, 0),
  );
  camera.up = Cartesian3.normalize(camera_pos, new Cartesian3(0, 0, 0));
  const far = Cartesian3.distance(view_pos, camera_pos);
  this.viewDis = far;
  camera.frustum = new PerspectiveFrustum({
    fov: CesiumMath.toRadians(this._camerafov),
    aspectRatio: this._aspectRatio,
    near: 0.1,
    far: far * 2,
  });

  this.viewShadowMap = new ShadowMap({
    lightCamera: camera,
    enable: false,
    isPointLight: false,
    isSpotLight: true,
    cascadesEnabled: false,
    context: scene.context,
    pointLightRadius: far,
    darkness: 1,
  });
};

/**
 * 添加视椎体
 * @private
 */
VideoShed3D.prototype._addCameraFrustum = function () {
  this.cameraFrustum = new Primitive({
    geometryInstances: new GeometryInstance({
      geometry: new FrustumOutlineGeometry({
        origin: this._cameraPosition,
        orientation: this.orientation,
        frustum: this.viewShadowMap._lightCamera.frustum,
        // _drawNearPlane: true,
      }),
      attributes: {
        color: ColorGeometryInstanceAttribute.fromColor(
          new Color(0.0, 1.0, 0.0),
        ),
      },
    }),
    appearance: new PerInstanceColorAppearance({
      translucent: false,
      flat: true,
    }),
    asynchronous: false,
    show: this.debugFrustum && this.show,
  });
  this.viewer.scene.primitives.add(this.cameraFrustum);
};

/**
 * 添加后处理
 * @private
 */
VideoShed3D.prototype._addPostProcess = function () {
  const fragmentShaderSource = VideoShed3DFS;
  const bias = this.viewShadowMap._isPointLight
    ? this.viewShadowMap._pointBias
    : this.viewShadowMap._primitiveBias;

  const _this = this;
  this.postProcess = new PostProcessStage({
    fragmentShader: fragmentShaderSource,
    uniforms: {
      alpha: function () {
        return _this.alpha;
      },
      mask: function () {
        return _this.enableMask;
      },
      shadowMapTexture: function () {
        return _this.viewShadowMap._shadowMapTexture;
      },
      videoTexture: function () {
        return _this.videoTexture;
      },
      maskTexture: function () {
        return _this.maskTexture;
      },
      shadowMap_matrix: function () {
        return _this.viewShadowMap._shadowMapMatrix;
      },
      shadowMap_lightPositionEC: function () {
        return _this.viewShadowMap._lightPositionEC;
      },
      shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: function () {
        const texelStepSize = new Cartesian2();
        texelStepSize.x = 1.0 / _this.viewShadowMap._textureSize.x;
        texelStepSize.y = 1.0 / _this.viewShadowMap._textureSize.y;
        return Cartesian4.fromElements(
          texelStepSize.x,
          texelStepSize.y,
          bias.depthBias,
          bias.normalShadingSmooth,
          this.combinedUniforms1,
        );
      },
      shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: function () {
        return Cartesian4.fromElements(
          bias.normalOffsetScale,
          _this.viewShadowMap._distance,
          _this.viewShadowMap.maximumDistance,
          _this.viewShadowMap._darkness,
          this.combinedUniforms2,
        );
      },
    },
  });
  if (this.show) {
    this.viewer.scene.postProcessStages.add(this.postProcess);
  }
};

VideoShed3D.prototype.update = function (frameState) {
  if (this.viewShadowMap) {
    frameState.shadowMaps.push(this.viewShadowMap);
  }
};

VideoShed3D.prototype.isDestroyed = function () {
  return false;
};

/**
 * destroy
 */
VideoShed3D.prototype.destroy = function () {
  this.viewer.scene.postProcessStages.remove(this.postProcess);
  this.viewer.scene.primitives.remove(this.cameraFrustum);
  if (this.videoElement) {
    this.videoElement.parentNode.removeChild(this.videoElement);
  }
  this.viewer.clock.onTick.removeEventListener(this.activeVideoListener);
  delete this.activeVideoListener;
  delete this.postProcess;
  delete this.viewShadowMap;
  delete this.color;
  delete this.viewDis;
  delete this.cameraPosition;
  delete this.viewPosition;
  delete this.alpha;
  delete this._camerafov;
  delete this._cameraPosition;
  delete this.videoTexture;
  delete this.cameraFrustum;

  delete this._debugFrustum;
  delete this._aspectRatio;
  delete this.url;
  delete this.orientation;
  delete this.type;
  delete this.videoTexture;
  delete this.url;
  this.viewer.scene.primitives.remove(this);
  delete this.viewer;
};

Object.defineProperties(VideoShed3D.prototype, {
  /**
   * 获取或设置 alpha
   * @memberof VideoShed3D.prototype
   *
   * @type {number}
   */
  alpha: {
    get: function get() {
      return this._alpha;
    },
    set: function set(val) {
      this._alpha = val;
    },
  },
  /**
   * 获取或设置 aspectRatio
   * @memberof VideoShed3D.prototype
   *
   * @type {number}
   */
  aspectRatio: {
    get: function get() {
      return this._aspectRatio;
    },
    set: function set(val) {
      this._aspectRatio = val;
      this.changeVideoAspect();
    },
  },
  /**
   * 获取或设置 debugFrustum
   * @memberof VideoShed3D.prototype
   *
   * @type {boolean}
   */
  debugFrustum: {
    get: function get() {
      return this._debugFrustum;
    },
    set: function set(val) {
      this._debugFrustum = val;
      this.cameraFrustum.show = val;
    },
  },
  /**
   * 获取或设置 fov
   * @memberof VideoShed3D.prototype
   *
   * @type {number}
   */
  fov: {
    get: function get() {
      return this._camerafov;
    },
    set: function set(val) {
      this._camerafov = val;
      this._changeCameraFov();
    },
  },
  /**
   * 获取或设置 cameraPosition
   * @memberof VideoShed3D.prototype
   *
   * @type {Cartesian3}
   */
  cameraPosition: {
    get: function get() {
      return this._cameraPosition;
    },
    set: function set(pos) {
      if (!pos) {
        return;
      }
      this._cameraPosition = pos;
      this._changeCameraPos();
    },
  },
  /**
   * 获取或设置 viewPosition
   * @memberof VideoShed3D.prototype
   *
   * @type {Cartesian3}
   */
  viewPosition: {
    get: function get() {
      return this.viewPosition;
    },
    set: function set(pos) {
      if (!pos) {
        return;
      }
      this.viewPosition = pos;
      this._changeViewPos();
    },
  },
  /**
   * 获取或设置 videoPlay
   * @memberof VideoShed3D.prototype
   *
   * @type {boolean}
   */
  videoPlay: {
    get: function get() {
      return this._videoPlay;
    },
    set: function set(val) {
      this._videoPlay = Boolean(val);
      if (this.videoElement) {
        if (this.videoPlay) {
          this.videoElement.play();
        } else {
          this.videoElement.pause();
        }
      }
    },
  },
  /**
   * 获取 params
   * @memberof VideoShed3D.prototype
   *
   * @type {boolean}
   * @readonly
   */
  params: {
    get: function get() {
      const viewJson = {};
      viewJson.type = this.type;
      if (this.type === 1) {
        viewJson.color = this.color;
      } else {
        viewJson.url = this.url;
      }
      viewJson.viewPosition = this.viewPosition;
      viewJson.cameraPosition = this.cameraPosition;
      viewJson.fov = this.fov;
      viewJson.aspectRatio = this.aspectRatio;
      viewJson.alpha = this.alpha;
      viewJson.debugFrustum = this.debugFrustum;
      return viewJson;
    },
  },
  /**
   * 获取或设置 show
   * @memberof VideoShed3D.prototype
   *
   * @type {boolean}
   */
  show: {
    get: function get() {
      return this.defaultShow;
    },
    set: function set(val) {
      this.defaultShow = Boolean(val);
      this._switchShow();
    },
  },
});

export default VideoShed3D;
