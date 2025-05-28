import CesiumMath from "../../Core/Math.js";
import Matrix4 from "../../Core/Matrix4.js";

/**
 * 相机环绕
 * @constructor
 *
 * @param {Viewer} viewer
 */
function AroundView(viewer) {
  this._viewer = viewer;
  this._heading = viewer.camera.heading;
  this._aroundAmount = 0.2;
}

Object.defineProperties(AroundView.prototype, {
  /**
   * 设置或获取动画速率
   * @memberof AroundView.prototype
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

AroundView.prototype.onAround = function () {
  this._heading += CesiumMath.toRadians(this._aroundAmount);
  if (this._heading >= Math.PI * 2 || this._heading <= -Math.PI * 2) {
    this._heading = 0;
  }
  this._viewer.camera.setView({
    orientation: {
      heading: this._heading,
      pitch: this._viewer.camera.pitch,
      roll: this._viewer.camera.roll,
    },
  });
};

/**
 * 开始
 */
AroundView.prototype.start = function () {
  this._viewer.clock.shouldAnimate = true;
  this._viewer.clock.onTick.addEventListener(this.onAround, this);
};

/**
 * 结束
 */
AroundView.prototype.stop = function () {
  this._viewer.camera.lookAtTransform(Matrix4.IDENTITY);
  this._viewer.clock.onTick.removeEventListener(this.onAround, this);
};

export default AroundView;
