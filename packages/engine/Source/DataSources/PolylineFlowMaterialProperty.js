import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import Frozen from "../Core/Frozen.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.WHITE;
const defaultSpeed = 1.0;
const defaultPercent = 0.05;
const defaultGradient = 0.0;

/**
 * 粒子流光线
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Property|Color} [options.color=Color.WHITE] 粒子颜色
 * @param {Property|number} [options.speed=1.0] 流动帧率速度
 * @param {Property|number} [options.percent=0.05] 流动部分占比
 * @param {Property|number} [options.gradient=0.0] 打底线的透明度 如果为 0 则不显示打底线
 */
function PolylineFlowMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._speed = undefined;
  this._speedSubscription = undefined;
  this._percent = undefined;
  this._percentSubscription = undefined;
  this._gradient = undefined;
  this._gradientSubscription = undefined;

  this.color = options.color;
  this.speed = options.speed;
  this.percent = options.percent;
  this.gradient = options.gradient;
}

Object.defineProperties(PolylineFlowMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) &&
        Property.isConstant(this._speed) &&
        Property.isConstant(this._percent) &&
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
  percent: createPropertyDescriptor("percent"),
  gradient: createPropertyDescriptor("gradient"),
});

PolylineFlowMaterialProperty.prototype.getType = function (time) {
  return "PolylineFlow";
};

const timeScratch = new JulianDate();

PolylineFlowMaterialProperty.prototype.getValue = function (time, result) {
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
  result.percent = Property.getValueOrDefault(
    this._percent,
    time,
    defaultPercent,
  );
  result.gradient = Property.getValueOrDefault(
    this._gradient,
    time,
    defaultGradient,
  );
  return result;
};

PolylineFlowMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineFlowMaterialProperty &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._speed, other._speed) &&
      Property.equals(this._percent, other._percent) &&
      Property.equals(this._gradient, other._gradient))
  );
};

export default PolylineFlowMaterialProperty;
