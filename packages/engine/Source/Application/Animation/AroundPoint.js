import HeadingPitchRange from "../../Core/HeadingPitchRange.js";
import CesiumMath from "../../Core/Math.js";
import Matrix4 from "../../Core/Matrix4.js";
import TransformUtils from "../../Utils/TransformUtils.js";

/**
 * 定点环绕
 * @constructor
 *
 * @param {Viewer} viewer
 * @param {Position} position 定点位置
 * @param {number} range 相机距离位置的距离
 */
function AroundPoint(viewer, position, range) {
  this._viewer = viewer;
  this._position = position;
  this._heading = position.heading ?? viewer.camera.heading;
  this._pitch = position.pitch ?? 0;
  this._range = range ?? 1000;
  this._aroundAmount = 0.2;
}

Object.defineProperties(AroundPoint.prototype, {
  /**
   * 设置或获取定点位置
   * @memberof AroundPoint.prototype
   * @type {Position}
   */
  position: {
    get: function () {
      return this._position;
    },
    set: function (position) {
      this._position = position;
    },
  },
  /**
   * 设置或获取定点距离
   * @memberof AroundPoint.prototype
   * @type {number}
   */
  range: {
    get: function () {
      return this._range;
    },
    set: function (range) {
      this._range = range;
    },
  },
  /**
   * 设置或获取动画速率
   * @memberof AroundPoint.prototype
   * @type {number}
   */
  aroundAmount: {
    get: function () {
      return this._aroundAmount;
    },
    set: function (value) {
      this._aroundAmount = value;
    },
  },
});

AroundPoint.prototype.onAround = function () {
  this._heading += CesiumMath.toRadians(this._aroundAmount);
  if (this._heading >= Math.PI * 2 || this._heading <= -Math.PI * 2) {
    this._heading = 0;
  }
  this._viewer.camera.lookAt(
    TransformUtils.transformWGS84ToCartesian(this._position),
    new HeadingPitchRange(
      this._heading,
      CesiumMath.toRadians(this._pitch),
      this._range,
    ),
  );
};

/**
 * 开始
 */
AroundPoint.prototype.start = function () {
  this._viewer.clock.shouldAnimate = true;
  this._viewer.clock.onTick.addEventListener(this.onAround, this);
};

/**
 * 停止
 */
AroundPoint.prototype.stop = function () {
  this._viewer.camera.lookAtTransform(Matrix4.IDENTITY);
  this._viewer.clock.onTick.removeEventListener(this.onAround, this);
};

export default AroundPoint;
