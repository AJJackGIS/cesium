import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import PolylineFlowMaterialProperty from "./PolylineFlowMaterialProperty.js";
import Property from "./Property.js";

const defaultColor = Color.RED;
const defaultSpeed = 1.0;
const defaultCount = 2.0;
const defaultGradient = 0.1;

/**
 * 圆形波纹
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 *
 * @param {Property|Color} [options.color=Color.WHITE] The {@link Color} Property to be used.
 * @param {Property|number} [options.speed=1.0] 速度
 * @param {Property|number} [options.count=2.0] 波纹个数
 * @param {Property|number} [options.gradient=0.1] 渐变力度
 *
 */
function CircleWaveMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._speed = undefined;
  this._speedSubscription = undefined;
  this._count = undefined;
  this._countSubscription = undefined;
  this._gradient = undefined;
  this._gradientSubscription = undefined;

  this.color = options.color;
  this.speed = options.speed;
  this.count = options.count;
  this.gradient = options.gradient;
}

Object.defineProperties(CircleWaveMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) &&
        Property.isConstant(this._speed) &&
        Property.isConstant(this._count) &&
        Property.isConstant(this._gradient)
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
  count: createPropertyDescriptor("count"),
  gradient: createPropertyDescriptor("gradient"),
});

CircleWaveMaterialProperty.prototype.getType = function (time) {
  return "CircleWave";
};

const timeScratch = new JulianDate();

CircleWaveMaterialProperty.prototype.getValue = function (time, result) {
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
  result.count = Property.getValueOrDefault(this._count, time, defaultCount);
  result.gradient = Property.getValueOrDefault(
    this._gradient,
    time,
    defaultGradient,
  );

  return result;
};

CircleWaveMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineFlowMaterialProperty &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._speed, other._speed) &&
      Property.equals(this._count, other._count) &&
      Property.equals(this._gradient, other._gradient))
  );
};
export default CircleWaveMaterialProperty;
