import Cartesian3 from "../../Core/Cartesian3.js";
import defined from "../../Core/defined.js";
import Matrix4 from "../../Core/Matrix4.js";
import Transforms from "../../Core/Transforms.js";

/**
 * 地球旋转
 * @constructor
 *
 * @param {Viewer} viewer
 * @param {number} speed 旋转速率
 */
function GlobeRotate(viewer, speed) {
  this._viewer = viewer;
  this._speed = speed ?? 12;
}

GlobeRotate.prototype.icrf = function () {
  const time = this._viewer.clock.currentTime;
  const icrfToFixed = Transforms.computeIcrfToFixedMatrix(time);
  if (defined(icrfToFixed)) {
    const camera = this._viewer.camera;
    const offset = Cartesian3.clone(camera.position);
    const transform = Matrix4.fromRotationTranslation(icrfToFixed);
    camera.lookAtTransform(transform, offset);
  }
};

/**
 * 开始
 */
GlobeRotate.prototype.start = function () {
  this._viewer.clock.shouldAnimate = true;
  this._viewer.clock.multiplier = this._speed * 1000;
  this._viewer.camera.lookAtTransform(Matrix4.IDENTITY);
  this._viewer.scene.postUpdate.addEventListener(this.icrf, this);
};

/**
 * 停止
 */
GlobeRotate.prototype.stop = function () {
  this._viewer.clock.multiplier = 1;
  this._viewer.camera.lookAtTransform(Matrix4.IDENTITY);
  this._viewer.scene.postUpdate.removeEventListener(this.icrf, this);
};

export default GlobeRotate;
