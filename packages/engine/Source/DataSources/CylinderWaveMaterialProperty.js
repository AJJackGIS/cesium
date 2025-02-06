import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import PolylineFlowMaterialProperty from "./PolylineFlowMaterialProperty.js";
import Property from "./Property.js";

const defaultColor = Color.YELLOW;
const defaultSpeed = 1.0;
const defaultRepeat = 20.0;
const defaultThickness = 0.3;
const defaultReversed = false;

/**
 * 圆锥波纹
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 *
 * @param {Property|Color} [options.color=Color.YELLOW] The {@link Color} Property to be used.
 * @param {Property|number} [options.speed=1.0] 速度
 * @param {Property|number} [options.repeat=20.0] 圈圈个数
 * @param {Property|number} [options.thickness=0.3] 圈圈的厚度
 * @param {Property|boolean} [options.reverse=false] 反向动画
 *
 */
function CylinderWaveMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._speed = undefined;
  this._speedSubscription = undefined;
  this._repeat = undefined;
  this._repeatSubscription = undefined;
  this._thickness = undefined;
  this._thicknessSubscription = undefined;
  this._reverse = undefined;
  this._reverseSubscription = undefined;

  this.color = options.color;
  this.speed = options.speed;
  this.repeat = options.repeat;
  this.thickness = options.thickness;
  this.reverse = options.reverse;
}

Object.defineProperties(CylinderWaveMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) &&
        Property.isConstant(this._speed) &&
        Property.isConstant(this._repeat) &&
        Property.isConstant(this._thickness) &&
        Property.isConstant(this._reverse)
      );
    },
  },

  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  color: createPropertyDescriptor("color"),
  speed: createPropertyDescriptor("speed"),
  repeat: createPropertyDescriptor("repeat"),
  thickness: createPropertyDescriptor("thickness"),
  reverse: createPropertyDescriptor("reverse"),
});

CylinderWaveMaterialProperty.prototype.getType = function (time) {
  return "CylinderWave";
};

const timeScratch = new JulianDate();

CylinderWaveMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.color = Property.getValueOrClonedDefault(
    this._color,
    time,
    defaultColor,
    result.color,
  );

  result.speed = Property.getValueOrDefault(this._speed, time, defaultSpeed);
  result.repeat = Property.getValueOrDefault(this._repeat, time, defaultRepeat);
  result.thickness = Property.getValueOrDefault(
    this._thickness,
    time,
    defaultThickness,
  );
  result.reverse = Property.getValueOrDefault(
    this._reverse,
    time,
    defaultReversed,
  );

  return result;
};

CylinderWaveMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineFlowMaterialProperty &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._speed, other._speed) &&
      Property.equals(this._repeat, other._repeat) &&
      Property.equals(this._thickness, other._thickness) &&
      Property.equals(this._reverse, other._reverse))
  );
};
export default CylinderWaveMaterialProperty;
