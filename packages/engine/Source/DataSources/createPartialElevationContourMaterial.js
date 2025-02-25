import BoundingRectangle from "../Core/BoundingRectangle.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Cartographic from "../Core/Cartographic.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Matrix4 from "../Core/Matrix4.js";
import Rectangle from "../Core/Rectangle.js";
import Transforms from "../Core/Transforms.js";
import Material from "../Scene/Material.js";

/**
 * 局部等高线材质
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Color} [options.color=Color.YELLOW] 等高线颜色
 * @param {number} [options.spacing=50.0] 间距
 * @param {number} [options.width=1.0] 线宽
 * @param {Rectangle} [options.rectangle] 范围
 */
function createPartialElevationContourMaterial(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  this._color = options.color || Color.YELLOW;
  this._spacing = options.spacing || 50;
  this._width = options.width || 1;

  if (!defined(options.rectangle)) {
    throw new DeveloperError("rectangle can't be empty");
  }
  this._rectangle = options.rectangle;

  const centerPoint = Rectangle.center(this._rectangle);
  const m = Transforms.eastNorthUpToFixedFrame(
    Cartographic.toCartesian(centerPoint),
  );
  const inverse = Matrix4.inverse(m, new Matrix4());

  const nw = Cartographic.toCartesian(Rectangle.northwest(this._rectangle));
  const sw = Cartographic.toCartesian(Rectangle.southwest(this._rectangle));
  const se = Cartographic.toCartesian(Rectangle.southeast(this._rectangle));
  const ne = Cartographic.toCartesian(Rectangle.northeast(this._rectangle));

  const localPositions = [];
  localPositions.push(Matrix4.multiplyByPoint(inverse, nw, new Cartesian3()));
  localPositions.push(Matrix4.multiplyByPoint(inverse, sw, new Cartesian3()));
  localPositions.push(Matrix4.multiplyByPoint(inverse, se, new Cartesian3()));
  localPositions.push(Matrix4.multiplyByPoint(inverse, ne, new Cartesian3()));

  // 计算矩形范围
  const localRectangle = BoundingRectangle.fromPoints(
    localPositions,
    new BoundingRectangle(),
  );
  const rect = new Cartesian4(
    localRectangle.x,
    localRectangle.y,
    localRectangle.x + localRectangle.width,
    localRectangle.y + localRectangle.height,
  );

  const m_0 = new Cartesian4(inverse[0], inverse[1], inverse[2], inverse[3]);
  const m_1 = new Cartesian4(inverse[4], inverse[5], inverse[6], inverse[7]);
  const m_2 = new Cartesian4(inverse[8], inverse[9], inverse[10], inverse[11]);
  const m_3 = new Cartesian4(
    inverse[12],
    inverse[13],
    inverse[14],
    inverse[15],
  );

  const material = Material.fromType(Material.PartialElevationContourType);
  material.uniforms.color = this._color;
  material.uniforms.spacing = this._spacing;
  material.uniforms.width = this._width;

  material.uniforms.rect = rect;
  material.uniforms.m_0 = m_0;
  material.uniforms.m_1 = m_1;
  material.uniforms.m_2 = m_2;
  material.uniforms.m_3 = m_3;

  return material;
}

export default createPartialElevationContourMaterial;
