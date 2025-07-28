import defined from "../../Core/defined.js";
import destroyObject from "../../Core/destroyObject.js";
import Event from "../../Core/Event.js";
import CesiumMath from "../../Core/Math.js";
import Matrix3 from "../../Core/Matrix3.js";
import Matrix4 from "../../Core/Matrix4.js";
import PerspectiveFrustum from "../../Core/PerspectiveFrustum.js";
import Camera from "../../Scene/Camera.js";
import ShadowMap from "../../Scene/ShadowMap.js";
import ShadowMapShader from "../../Scene/ShadowMapShader.js";
import ViewshedPrimitive from "../Primitive/ViewshedPrimitive";

const origin_createShadowReceiveFragmentShader =
  ShadowMapShader.createShadowReceiveFragmentShader;
ShadowMapShader.createShadowReceiveFragmentShader = function (
  fs,
  shadowMap,
  castShadows,
  isTerrain,
  hasTerrainNormal,
) {
  const isSpotLight = shadowMap._isSpotLight;
  const result = origin_createShadowReceiveFragmentShader.bind(this)(
    fs,
    shadowMap,
    castShadows,
    isTerrain,
    hasTerrainNormal,
  );
  if (isSpotLight) {
    let originShader = "out_FragColor.rgb *= visibility;";
    let newShader =
      "out_FragColor.rgb *= (visibility < 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0));";
    result.sources[result.sources.length - 1] = result.sources[
      result.sources.length - 1
    ].replace(originShader, newShader);

    {
      originShader =
        "vec3 directionEC = normalize(positionEC.xyz - shadowMap_lightPositionEC.xyz);";
      newShader = `${
        originShader
      }if (distance(positionEC.xyz, shadowMap_lightPositionEC.xyz) > shadowMap_lightPositionEC.w) { return; }`;
      result.sources[result.sources.length - 1] = result.sources[
        result.sources.length - 1
      ].replace(originShader, newShader);
    }
  }

  return result;
};

function getRotateXtoNZ() {
  const rotateZ = Matrix3.fromRotationZ(CesiumMath.PI * 0.5);
  const rotateY = Matrix3.fromRotationY(CesiumMath.PI * 0.5);
  const rotateXtoNZ = new Matrix3();
  Matrix3.multiply(rotateZ, rotateY, rotateXtoNZ);

  return rotateXtoNZ;
}

const rotateXtoNZ = getRotateXtoNZ();

/**
 * 可视域分析
 * @param {Scene} scene
 * @constructor
 */
class ViewShed {
  constructor(scene) {
    this._fovH = CesiumMath.PI / 3;
    this._fovV = CesiumMath.PI / 6;

    if (!defined(scene)) {
      console.error("scene is not defined!");
    }

    this._scene = scene;

    this._frustum = new PerspectiveFrustum();
    this._updateFov();
    this._frustum.near = 1.0;
    this._frustum.far = 400.0;

    this._spotLightCamera = new Camera(scene);
    this._frustum.clone(this._spotLightCamera.frustum);

    this._viewshedShadowMap = new ShadowMap({
      context: scene.context,
      lightCamera: this._spotLightCamera,
      cascadesEnabled: false,
    });

    this._debugCameraPrimitive = new ViewshedPrimitive({});

    this._enabledChangedEvent = new Event();
  }

  get enabledChangedEvent() {
    return this._enabledChangedEvent;
  }

  _updateFov() {
    if (this._fovH < 0 || this._fovV < 0) {
      return;
    }
    this.frustum.aspectRatio =
      Math.tan(this._fovH * 0.5) / Math.tan(this._fovV * 0.5);
    this.frustum.fov = this._fovH > this._fovV ? this._fovH : this._fovV;
  }

  update(frameState) {
    if (!this._viewshedShadowMap.enabled) {
      return;
    }

    frameState.shadowMaps.unshift(this._viewshedShadowMap);

    if (!this._frustum.equals(this._spotLightCamera.frustum)) {
      this._frustum.clone(this._spotLightCamera.frustum);
      this._viewshedShadowMap._pointLightRadius = this._frustum.far;

      // Cesium设计上的问题，frustum更新了，不会自动更新FBO，所以这里通过_frustum强制更新下
      // 通过修改bs来更新
      // this.shadowMap._needsUpdate = true;
      const bs = this.shadowMap._boundingSphere;
      bs.radius = Math.random();
    }

    if (this._debugCameraPrimitive.show) {
      const mm = this._debugCameraPrimitive.modelMatrix;
      Matrix4.clone(this._spotLightCamera.inverseViewMatrix, mm);
      Matrix4.multiplyByMatrix3(mm, rotateXtoNZ, mm);
      Matrix4.multiplyByUniformScale(mm, this._spotLightCamera.frustum.far, mm);

      const c = this._spotLightCamera;
      const frustum = c.frustum;
      // this._debugCameraPrimitive.fovV = c.frustum.fov;
      // this._debugCameraPrimitive.fovH = c.frustum.fov * c.frustum.aspectRatio;
      // Cesium的fov的傻x设计，导致必须这样更新。。
      this._debugCameraPrimitive.fovV =
        frustum.aspectRatio <= 1
          ? frustum.fov
          : Math.atan(Math.tan(frustum.fov * 0.5) / frustum.aspectRatio) * 2.0;
      this._debugCameraPrimitive.fovH =
        frustum.aspectRatio > 1
          ? frustum.fov
          : Math.atan(Math.tan(frustum.fov * 0.5) * frustum.aspectRatio) * 2.0;

      this._debugCameraPrimitive.update(frameState);
    }
  }

  setView(options) {
    this._spotLightCamera.setView(options);
  }

  isDestroyed() {
    return false;
  }

  destroy() {
    this._debugCameraPrimitive =
      this._debugCameraPrimitive && this._debugCameraPrimitive.destroy();
    this._viewshedShadowMap =
      this._viewshedShadowMap && this._viewshedShadowMap.destroy();
    return destroyObject(this);
  }
}

Object.defineProperties(ViewShed.prototype, {
  /**
   * 视锥体
   * @type {PerspectiveFrustum}
   * @memberof ViewShed.prototype
   */
  frustum: {
    get: function () {
      return this._frustum;
    },
  },
  /**
   * 水平广角
   * @type {number}
   * @memberof ViewShed.prototype
   */
  fovH: {
    get: function () {
      return this._fovH;
    },
    set: function (value) {
      this._fovH = value;
      this._updateFov();
    },
  },
  /**
   * 垂直广角
   * @type {number}
   * @memberof ViewShed.prototype
   */
  fovV: {
    get: function () {
      return this._fovV;
    },
    set: function (value) {
      this._fovV = value;
      this._updateFov();
    },
  },
  /**
   * 近裁
   * @type {number}
   * @memberof ViewShed.prototype
   */
  near: {
    get: function () {
      return this.frustum.near;
    },
    set: function (value) {
      if (this.frustum.near !== value) {
        this.frustum.near = value;
      }
    },
  },
  /**
   * 远裁
   * @type {number}
   * @memberof ViewShed.prototype
   */
  far: {
    get: function () {
      return this.frustum.far;
    },
    set: function (value) {
      if (this.frustum.far !== value) {
        this.frustum.far = value;
      }
    },
  },
  /**
   * 起始位置
   * @type {Cartesian3}
   * @memberof ViewShed.prototype
   */
  position: {
    get: function () {
      return this._spotLightCamera.positionWC;
    },
    set: function (value) {
      this.setView({
        destination: value,
        orientation: {
          heading: this._spotLightCamera.heading,
          pitch: this._spotLightCamera.pitch,
          roll: this._spotLightCamera.roll,
        },
      });
    },
  },
  /**
   * 偏航角
   * @type {number}
   * @memberof ViewShed.prototype
   */
  heading: {
    get: function () {
      return this._spotLightCamera.heading;
    },
    set: function (value) {
      if (this._spotLightCamera.heading === value) {
        return;
      }

      this.setView({
        destination: this._spotLightCamera.positionWC,
        orientation: {
          heading: value,
          pitch: this._spotLightCamera.pitch,
          roll: this._spotLightCamera.roll,
        },
      });
    },
  },
  /**
   * 俯仰角
   * @type {number}
   * @memberof ViewShed.prototype
   */
  pitch: {
    get: function () {
      return this._spotLightCamera.pitch;
    },
    set: function (value) {
      if (this._spotLightCamera.pitch === value) {
        return;
      }

      this.setView({
        destination: this._spotLightCamera.positionWC,
        orientation: {
          heading: this._spotLightCamera.heading,
          pitch: value,
          roll: this._spotLightCamera.roll,
        },
      });
    },
  },
  showHelper: {
    get: function () {
      return this._debugCameraPrimitive.show;
    },
    set: function (value) {
      this._debugCameraPrimitive.show = value;
    },
  },
  /**
   * 翻滚角
   * @type {number}
   * @memberof ViewShed.prototype
   */
  roll: {
    get: function () {
      return this._spotLightCamera.roll;
    },
    set: function (value) {
      if (this._spotLightCamera.roll === value) {
        return;
      }

      this._spotLightCamera.setView({
        destination: this._spotLightCamera.positionWC,
        orientation: {
          heading: this._spotLightCamera.heading,
          pitch: this._spotLightCamera.pitch,
          roll: value,
        },
      });
    },
  },
  shadowMap: {
    get: function () {
      return this._viewshedShadowMap;
    },
  },
  lightCamera: {
    get: function () {
      return this._spotLightCamera;
    },
  },
  /**
   * 视域分析是否可用
   * @type {boolean}
   * @memberof ViewShed.prototype
   */
  enabled: {
    get: function () {
      return this._viewshedShadowMap.enabled;
    },
    set: function (value) {
      if (this._viewshedShadowMap.enabled === value) {
        return;
      }

      if (value) {
        // this._debugCameraPrimitive.show = true;
        this._viewshedShadowMap.enabled = true;
        this._viewshedShadowMap._pointLightRadius =
          this._spotLightCamera.frustum.far; // 把radius传进去做扇形
      } else {
        // this._debugCameraPrimitive.show = false;
        this._viewshedShadowMap.enabled = false;
      }
      this._enabledChangedEvent.raiseEvent(value);
    },
  },
});

export default ViewShed;
