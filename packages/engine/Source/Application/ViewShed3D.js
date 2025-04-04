import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import clone from "../Core/clone.js";
import Color from "../Core/Color.js";
import DeveloperError from "../Core/DeveloperError.js";
import Frozen from "../Core/Frozen.js";
import CesiumMath from "../Core/Math.js";
import Matrix3 from "../Core/Matrix3.js";
import PerspectiveFrustum from "../Core/PerspectiveFrustum.js";
import Quaternion from "../Core/Quaternion.js";
import ScreenSpaceEventHandler from "../Core/ScreenSpaceEventHandler.js";
import ScreenSpaceEventType from "../Core/ScreenSpaceEventType.js";
import Camera from "../Scene/Camera.js";
import PostProcessStage from "../Scene/PostProcessStage.js";
import SceneMode from "../Scene/SceneMode.js";
import ShadowMap from "../Scene/ShadowMap.js";
import ViewShed3DFS from "../Shaders/PostProcessStages/ViewShed3DFS.js";

const defaultOpts = {
  cameraPosition: null, //相机位置
  viewPosition: null, //视点位置
  horizontalAngle: 120, //水平张角
  verticalAngle: 90, //垂直张角
  visibleAreaColor: new Color(0, 1, 0), //可视颜色
  hiddenAreaColor: new Color(1, 0, 0), //不可视颜色
  alpha: 0.5, //混合度
  distance: 100, //距离
  frustum: true, //视椎体显示
  show: true, //可视域显示
};

/**
 * 可视域分析
 * @param {Viewer} viewer
 * @param {object} options
 * @param {Cartesian3} options.cameraPosition 相机位置
 * @param {Cartesian3} options.viewPosition 视点位置
 * @param {number} options.horizontalAngle 水平张角
 * @param {number} options.verticalAngle 垂直张角
 * @param {Color} options.visibleAreaColor 可视区域颜色
 * @param {Color} options.hiddenAreaColor 不可视区域颜色
 * @param {number} options.alpha 透明度
 * @param {number} options.distance 距离
 * @param {boolean} options.frustum 是否显示视锥
 * @param {boolean} options.show 是否显示
 * @param {function} options.calback 回调函数
 *
 * @constructor
 */
function ViewShed3D(viewer, options) {
  if (!viewer) {
    throw new DeveloperError("ViewShed3D: viewer is not defined");
  }

  options = options ?? Frozen.EMPTY_OBJECT;

  this.viewer = viewer;
  this.cameraPosition = options.cameraPosition ?? defaultOpts.cameraPosition;
  this.viewPosition = options.viewPosition ?? defaultOpts.viewPosition;
  this._horizontalAngle =
    options.horizontalAngle ?? defaultOpts.horizontalAngle;
  this._verticalAngle = options.verticalAngle ?? defaultOpts.verticalAngle;
  this._visibleAreaColor =
    options.visibleAreaColor ?? defaultOpts.visibleAreaColor;
  this._hiddenAreaColor =
    options.hiddenAreaColor ?? defaultOpts.hiddenAreaColor;
  this._alpha = options.alpha ?? defaultOpts.alpha;
  this._distance = options.distance ?? defaultOpts.distance;
  this._frustum = options.frustum ?? defaultOpts.frustum;
  this.calback = options.calback;
  this.defaultShow = options.show ?? true;
  if (this.cameraPosition && this.viewPosition) {
    this._addToScene();
    if (this.calback) {
      this.calback();
    }
  } else {
    this._bindMouseEvent();
  }
}

ViewShed3D.prototype._bindMouseEvent = function () {
  const viewer = this.viewer;
  const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
  handler.setInputAction((event) => {
    const cartesian = getCurrentMousePosition(viewer.scene, event.position);
    if (!cartesian) {
      return;
    }
    if (!this.cameraPosition) {
      this.cameraPosition = cartesian;
    } else if (this.cameraPosition && !this.viewPosition) {
      this.viewPosition = cartesian;
      this._addToScene();
      this._unbindMouseEvent();
      if (this.calback) {
        this.calback();
      }
    }
  }, ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((event) => {
    const cartesian = getCurrentMousePosition(viewer.scene, event.endPosition);
    if (!cartesian) {
      return;
    }
    const cp = this.cameraPosition;
    if (cp) {
      this.frustumQuaternion = this.getFrustumQuaternion(cp, cartesian);
      this.distance = Number(Cartesian3.distance(cp, cartesian).toFixed(1));
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);
  this._handler = handler;
};

ViewShed3D.prototype._unbindMouseEvent = function () {
  if (this._handler === null) {
    return;
  }
  this._handler.destroy();
  delete this._handler;
};

ViewShed3D.prototype._addToScene = function () {
  this.frustumQuaternion = this.getFrustumQuaternion(
    this.cameraPosition,
    this.viewPosition,
  );
  this._createShadowMap(this.cameraPosition, this.viewPosition);
  this._addPostProcess();
  if (!this.radar) {
    this.addRadar(this.cameraPosition, this.frustumQuaternion);
  }
  this.viewer.scene.primitives.add(this);
};

ViewShed3D.prototype._createShadowMap = function (cpos, viewPosition) {
  const camera_pos = cpos;
  const lookAt_pos = viewPosition;
  const scene = this.viewer.scene;
  const camera1 = new Camera(scene);
  camera1.position = camera_pos;
  camera1.direction = Cartesian3.subtract(
    lookAt_pos,
    camera_pos,
    new Cartesian3(0, 0, 0),
  );
  camera1.up = Cartesian3.normalize(camera_pos, new Cartesian3(0, 0, 0));

  const far = Number(Cartesian3.distance(lookAt_pos, camera_pos).toFixed(1));
  this.distance = far;

  camera1.frustum = new PerspectiveFrustum({
    fov: CesiumMath.toRadians(120),
    aspectRatio: scene.canvas.clientWidth / scene.canvas.clientHeight,
    near: 0.1,
    far: 5000,
  });

  const isSpotLight = true;
  this.viewShadowMap = new ShadowMap({
    lightCamera: camera1,
    enable: false,
    isPointLight: !isSpotLight,
    isSpotLight: isSpotLight,
    cascadesEnabled: false,
    context: scene.context,
    pointLightRadius: far,
    brightness: 1,
  });
};

/**
 * 呈现投影相机的第一视角
 */
ViewShed3D.prototype.locate = function () {
  const camera_pos = clone(this.cameraPosition);
  const lookAt_pos = clone(this.viewPosition);
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

ViewShed3D.prototype.getFrustumQuaternion = function (cpos, viewPosition) {
  let direction = Cartesian3.normalize(
    Cartesian3.subtract(viewPosition, cpos, new Cartesian3()),
    new Cartesian3(),
  );
  let up = Cartesian3.normalize(cpos, new Cartesian3());
  const camera = new Camera(this.viewer.scene);
  camera.position = cpos;
  camera.direction = direction;
  camera.up = up;
  direction = camera.directionWC;
  up = camera.upWC;
  let right = camera.rightWC;
  const scratchRight = new Cartesian3();
  const scratchRotation = new Matrix3();
  const scratchOrientation = new Quaternion();

  // var right = Cesium.Cartesian3.cross(direction,up,new Cesium.Cartesian3());
  right = Cartesian3.negate(right, scratchRight);
  const rotation = scratchRotation;
  Matrix3.setColumn(rotation, 0, right, rotation);
  Matrix3.setColumn(rotation, 1, up, rotation);
  Matrix3.setColumn(rotation, 2, direction, rotation);
  //计算视锥姿态
  return Quaternion.fromRotationMatrix(rotation, scratchOrientation);
};

ViewShed3D.prototype._addPostProcess = function () {
  const _this = this;
  const fragmentShaderSource = ViewShed3DFS;
  const shadow_stc = this;
  const bias = shadow_stc.viewShadowMap._isPointLight
    ? shadow_stc.viewShadowMap._pointBias
    : shadow_stc.viewShadowMap._primitiveBias;
  this.postProcess = new PostProcessStage({
    fragmentShader: fragmentShaderSource,
    uniforms: {
      czzj: function () {
        return _this.verticalAngle;
      },
      dis: function () {
        return _this.distance;
      },
      spzj: function () {
        return _this.horizontalAngle;
      },
      visibleColor: function () {
        return _this.visibleAreaColor;
      },
      disVisibleColor: function () {
        return _this.hiddenAreaColor;
      },
      mixNum: function () {
        return _this.alpha;
      },
      stcshadow: function () {
        return shadow_stc.viewShadowMap._shadowMapTexture;
      },
      _shadowMap_matrix: function () {
        return shadow_stc.viewShadowMap._shadowMapMatrix;
      },
      shadowMap_lightPositionEC: function () {
        return shadow_stc.viewShadowMap._lightPositionEC;
      },
      shadowMap_lightDirectionEC: function () {
        return shadow_stc.viewShadowMap._lightDirectionEC;
      },
      shadowMap_lightUp: function () {
        return shadow_stc.viewShadowMap._lightCamera.up;
      },
      shadowMap_lightDir: function () {
        return shadow_stc.viewShadowMap._lightCamera.direction;
      },
      shadowMap_lightRight: function () {
        return shadow_stc.viewShadowMap._lightCamera.right;
      },
      shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: function () {
        const texelStepSize = new Cartesian2();
        texelStepSize.x = 1.0 / shadow_stc.viewShadowMap._textureSize.x;
        texelStepSize.y = 1.0 / shadow_stc.viewShadowMap._textureSize.y;
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
          shadow_stc.viewShadowMap._distance,
          shadow_stc.viewShadowMap.maximumDistance,
          shadow_stc.viewShadowMap._darkness,
          this.combinedUniforms2,
        );
      },
    },
  });
  if (this.show) {
    this.viewer.scene.postProcessStages.add(this.postProcess);
  }
};

ViewShed3D.prototype.removeRadar = function () {
  this.viewer.entities.remove(this.radar);
};

ViewShed3D.prototype.resetRadar = function () {
  this.removeRadar();
  this.addRadar(this.cameraPosition, this.frustumQuaternion);
};

ViewShed3D.prototype.addRadar = function (cpos, frustumQuaternion) {
  const position = cpos;
  const _this = this;
  this.radar = this.viewer.entities.add({
    position: position,
    orientation: frustumQuaternion,
    show: this.show,
    rectangularSensor: {
      radius: _this.distance, //传感器的半径
      xHalfAngle: CesiumMath.toRadians(_this.horizontalAngle / 2), //传感器水平半角
      yHalfAngle: CesiumMath.toRadians(_this.verticalAngle / 2), //传感器垂直半角
      // material: new Color(0.0, 1.0, 0.0, 1.0), //目前用的统一材质
      lineColor: new Color(1.0, 1.0, 1.0, 1.0), //线的颜色
      // domeSurfaceMaterial: new Color(1.0, 0.0, 0.0, 1.0),
      // slice: 4,
      showScanPlane: false, //是否显示扫描面
      // scanPlaneColor: new Color(1.0, 1.0, 1.0, 1.0), //扫描面颜色
      // scanPlaneMode: "horizontal", // 扫描面模式 垂直vertical/水平horizontal
      // scanPlaneRate: 3, //扫描速率,
      showThroughEllipsoid: false, //此参数控制深度检测，为false启用深度检测，可以解决雷达一半在地球背面时显示的问题
      showLateralSurfaces: false,
      showDomeSurfaces: false,
      // showDomeLines: false,
      // showIntersection: false,
      showSectorSegmentLines: true,
    },
  });
};

ViewShed3D.prototype._switchRadar = function () {
  this.radar.show = this._frustum;
};

ViewShed3D.prototype.update = function (frameState) {
  if (this.viewShadowMap) {
    frameState.shadowMaps.push(this.viewShadowMap);
  }
};

ViewShed3D.prototype._switchShow = function () {
  if (this.show) {
    if (!this.postProcess) {
      this._addPostProcess();
    }
  } else {
    this.viewer.scene.postProcessStages.remove(this.postProcess);
    delete this.postProcess;
    this.postProcess = null;
  }
  this.radar.show = this.show;
};

ViewShed3D.prototype.isDestroyed = function () {
  return false;
};

/**
 * destroy
 */
ViewShed3D.prototype.destroy = function () {
  this._unbindMouseEvent();

  this.viewer.scene.postProcessStages.remove(this.postProcess);
  this.viewer.entities.remove(this.radar);

  delete this.radar;
  delete this.postProcess;
  delete this.viewShadowMap;
  delete this.verticalAngle;
  delete this.viewer;
  delete this.horizontalAngle;
  delete this.visibleAreaColor;
  delete this.hiddenAreaColor;
  delete this.distance;
  delete this.frustumQuaternion;
  delete this.cameraPosition;
  delete this.viewPosition;
  delete this.alpha;
};

Object.defineProperties(ViewShed3D.prototype, {
  /**
   * 获取或设置 水平张角
   * @memberof ViewShed3D.prototype
   *
   * @type {number}
   */
  horizontalAngle: {
    get: function get() {
      return this._horizontalAngle;
    },
    set: function set(val) {
      this._horizontalAngle = val;
      this.resetRadar();
    },
  },

  /**
   * 获取或设置 垂直张角
   * @memberof ViewShed3D.prototype
   *
   * @type {number}
   */
  verticalAngle: {
    get: function get() {
      return this._verticalAngle;
    },
    set: function set(val) {
      this._verticalAngle = val;
      this.resetRadar();
    },
  },

  /**
   * 获取或设置 可视距离
   * @memberof ViewShed3D.prototype
   *
   * @type {number}
   */
  distance: {
    get: function get() {
      return this._distance;
    },
    set: function set(val) {
      this._distance = val;
      this.resetRadar();
    },
  },

  /**
   * 获取或设置 可视区域颜色
   * @memberof ViewShed3D.prototype
   *
   * @type {Color}
   */
  visibleAreaColor: {
    get: function get() {
      return this._visibleAreaColor;
    },
    set: function set(val) {
      this._visibleAreaColor = val;
    },
  },

  /**
   * 获取或设置 不可视区域颜色
   * @memberof ViewShed3D.prototype
   *
   * @type {Color}
   */
  hiddenAreaColor: {
    get: function get() {
      return this._hiddenAreaColor;
    },
    set: function set(val) {
      this._hiddenAreaColor = val;
    },
  },

  /**
   * 获取或设置 透明度 0 - 1
   * @memberof ViewShed3D.prototype
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
   * 获取或设置 显示和隐藏
   * @memberof ViewShed3D.prototype
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

  /**
   * 获取或设置 视锥是否显示
   * @memberof ViewShed3D.prototype
   *
   * @type {boolean}
   */
  frustum: {
    get: function get() {
      return this._frustum;
    },
    set: function set(val) {
      this._frustum = Boolean(val);
      this._switchRadar();
    },
  },
});

/**
 * 获取鼠标当前的屏幕坐标位置的三维Cesium坐标
 * @param {Scene} scene
 * @param {Cartesian2} position 二维屏幕坐标位置
 */
function getCurrentMousePosition(scene, position) {
  let cartesian;

  //测试scene.pickPosition和globe.pick的适用场景 https://zhuanlan.zhihu.com/p/44767866
  //1. globe.pick的结果相对稳定准确，不论地形深度检测开启与否，不论加载的是默认地形还是别的地形数据；
  //2. scene.pickPosition只有在开启地形深度检测，且不使用默认地形时是准确的。
  //注意点： 1. globe.pick只能求交地形； 2. scene.pickPosition不仅可以求交地形，还可以求交除地形以外其他所有写深度的物体。

  //提取鼠标点的地理坐标
  if (scene.mode === SceneMode.SCENE3D) {
    //三维模式下
    const pickRay = scene.camera.getPickRay(position);
    cartesian = scene.globe.pick(pickRay, scene);
  } else {
    //二维模式下
    cartesian = scene.camera.pickEllipsoid(position, scene.globe.ellipsoid);
  }
  return cartesian;
}

export default ViewShed3D;
