import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import defined from "../Core/defined.js";
import CesiumMath from "../Core/Math.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import Transforms from "../Core/Transforms.js";

/**
 * Cesium3DTileset 工具类
 * @constructor
 */
function Cesium3DTilesetUtils() {}

/**
 * 基于本地的ENU坐标系的偏移，也就是垂直于地表向上为Z，东为X，北为Y
 * @param {Cesium3DTileset} tileset
 * @param {number} dx x轴偏移量。单位：米
 * @param {number} dy y轴偏移量。单位：米
 * @param {number} dz z轴偏移量。单位：米
 */
Cesium3DTilesetUtils.translate = function (tileset, dx, dy, dz) {
  if (dx === 0 && dy === 0 && dz === 0) {
    return;
  }
  // 获取中心点
  const origin = tileset.boundingSphere.center;
  // 以该点建立ENU坐标系
  const toWorldMatrix = Transforms.eastNorthUpToFixedFrame(origin);
  // 该坐标系下平移后的位置
  const translatePosition = new Cartesian3(dx, dy, dz);
  // 获取平移后位置的世界坐标
  const worldPosition = Matrix4.multiplyByPoint(
    toWorldMatrix,
    translatePosition,
    new Cartesian3(),
  );
  // 计算世界坐标下的各个平移量
  const offset = Cartesian3.subtract(worldPosition, origin, new Cartesian3());
  // 从世界坐标下的平移量计算世界坐标的平移矩阵
  const translateMatrix = Matrix4.fromTranslation(offset);
  // 应用平移矩阵。这里应该与原本的模型矩阵点乘，而不是直接赋值
  tileset.modelMatrix = Matrix4.multiply(
    translateMatrix,
    tileset.modelMatrix,
    new Matrix4(),
  );
};

/**
 * 基于本地的ENU坐标系的旋转，也就是垂直于地表向上为Z，东为X，北为Y
 * @param {Cesium3DTileset} tileset
 * @param {number} rx 绕X轴旋转的角度。单位：度
 * @param {number} ry 绕Y轴旋转的角度。单位：度
 * @param {number} rz 绕Z轴旋转的角度。单位：度
 */
Cesium3DTilesetUtils.rotate = function (tileset, rx, ry, rz) {
  if (rx === 0 && ry === 0 && rz === 0) {
    return;
  }
  // 获取中心点。
  const origin = tileset.boundingSphere.center;
  // 以该点建立ENU坐标系
  const toWorldMatrix = Transforms.eastNorthUpToFixedFrame(origin);
  // 获取ENU矩阵的逆矩阵。也就是可以将世界坐标重新转为ENU坐标系的矩阵
  const toLocalMatrix = Matrix4.inverse(toWorldMatrix, new Matrix4());
  // 计算旋转矩阵
  const rotateMatrix = Matrix4.clone(Matrix4.IDENTITY);
  if (rx !== 0) {
    const rotateXMatrix = Matrix4.fromRotation(
      Matrix3.fromRotationX(CesiumMath.toRadians(rx)),
    );
    Matrix4.multiply(rotateXMatrix, rotateMatrix, rotateMatrix);
  }
  if (ry !== 0) {
    const rotateYMatrix = Matrix4.fromRotation(
      Matrix3.fromRotationY(CesiumMath.toRadians(ry)),
    );
    Matrix4.multiply(rotateYMatrix, rotateMatrix, rotateMatrix);
  }
  if (rz !== 0) {
    const rotateZMatrix = Matrix4.fromRotation(
      Matrix3.fromRotationZ(CesiumMath.toRadians(rz)),
    );
    Matrix4.multiply(rotateZMatrix, rotateMatrix, rotateMatrix);
  }
  // ENU坐标系下的结果矩阵
  const localResultMatrix = Matrix4.multiply(
    rotateMatrix,
    toLocalMatrix,
    new Matrix4(),
  );
  // 世界坐标系下的结果矩阵
  const worldResultMatrix = Matrix4.multiply(
    toWorldMatrix,
    localResultMatrix,
    new Matrix4(),
  );
  // 应用结果
  tileset.modelMatrix = Matrix4.multiply(
    worldResultMatrix,
    tileset.modelMatrix,
    new Matrix4(),
  );
};

/**
 * 基于本地的ENU坐标系的缩放，也就是垂直于地表向上为Z，东为X，北为Y
 * @param {Cesium3DTileset} tileset
 * @param {number} sx x轴缩放倍数
 * @param {number} sy y轴缩放倍数
 * @param {number} sz z轴缩放倍数
 */
Cesium3DTilesetUtils.scale = function (tileset, sx, sy, sz) {
  if (sx <= 0 || sy <= 0 || sz <= 0) {
    throw Error("缩放倍数必须大于0");
  }
  if (sx === 1 && sy === 1 && sz === 1) {
    return;
  }
  // 获取中心点。
  const origin = tileset.boundingSphere.center;
  // 以该点建立ENU坐标系
  const toWorldMatrix = Transforms.eastNorthUpToFixedFrame(origin);
  // 获取ENU矩阵的逆矩阵。也就是可以将世界坐标重新转为ENU坐标系的矩阵
  const toLocalMatrix = Matrix4.inverse(toWorldMatrix, new Matrix4());
  // 计算缩放矩阵
  const scaleMatrix = Matrix4.fromScale(new Cartesian3(sx, sy, sz));
  // ENU坐标系下的结果矩阵
  const localResultMatrix = Matrix4.multiply(
    scaleMatrix,
    toLocalMatrix,
    new Matrix4(),
  );
  // 世界坐标系下的结果矩阵
  const worldResultMatrix = Matrix4.multiply(
    toWorldMatrix,
    localResultMatrix,
    new Matrix4(),
  );
  // 应用结果
  tileset.modelMatrix = Matrix4.multiply(
    worldResultMatrix,
    tileset.modelMatrix,
    new Matrix4(),
  );
};

/**
 * 高度调整
 * @param {Cesium3DTileset} tileset
 * @param {number} height 高度
 */
Cesium3DTilesetUtils.updateHeight = function (tileset, height) {
  height = Number(height);
  if (isNaN(height) || !defined(tileset)) {
    return;
  }

  const cartographic = Cartographic.fromCartesian(
    tileset.boundingSphere.center,
  );
  const surface = Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    0.0,
  );
  const offset = Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    height,
  );
  const translation = Cartesian3.subtract(offset, surface, new Cartesian3());
  tileset.modelMatrix = Matrix4.fromTranslation(translation);
};

export default Cesium3DTilesetUtils;
