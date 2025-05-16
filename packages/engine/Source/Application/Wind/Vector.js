/**
 * 向量方向
 * @param u
 * @param v
 * @constructor
 * @private
 */
function Vector(u, v) {
  this.u = u;
  this.v = v;
  this.m = this.magnitude();
}

/**
 * the vector value
 * 向量值（流体强度）
 * @returns {Number}
 */
Vector.prototype.magnitude = function () {
  // Math.pow(u, 2)
  // Math.pow(v, 2)
  return Math.sqrt(this.u * this.u + this.v * this.v);
};

/**
 * Angle in degrees (0 to 360º) --> Towards
 * 流体方向
 * N is 0º and E is 90º
 * @returns {Number}
 */
Vector.prototype.directionTo = function () {
  const verticalAngle = Math.atan2(this.u, this.v);
  let inDegrees = verticalAngle * (180.0 / Math.PI);
  if (inDegrees < 0) {
    inDegrees += 360.0;
  }
  return inDegrees;
};

/**
 * Angle in degrees (0 to 360º) From x-->
 * N is 0º and E is 90º
 * @returns {Number}
 */
Vector.prototype.directionFrom = function () {
  const a = this.directionTo();
  return (a + 180.0) % 360.0;
};

export default Vector;
