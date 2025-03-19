import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import Frozen from "../Core/Frozen.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.RED.withAlpha(0.7);
const defaultbgColor = Color.RED.withAlpha(0.1);
const defaultBidirectional = 0.0;
const defaultGlobalAlphal = 1.0;
const defaultSpeed = 1.0;
const defaultStartTime = 0.0;

/**
 * OD线材质
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Property|Color} [options.color=Color.RED.withAlpha(0.7)] 颜色
 * @param {Property|Color} [options.bgColor=Color.RED.withAlpha(0.1)] 背景颜色
 * @param {Property|number} [options.bidirectional=0.0]
 * @param {Property|number} [options.globalAlpha=1.0]
 * @param {Property|number} [options.speed=1.0]
 * @param {Property|number} [options.startTime=0.0]
 */
function PolylineODMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._bgColor = undefined;
  this._bgColorSubscription = undefined;
  this._bidirectional = undefined;
  this._bidirectionalSubscription = undefined;
  this._globalAlpha = undefined;
  this._globalAlphaSubscription = undefined;
  this._speed = undefined;
  this._speedSubscription = undefined;
  this._startTime = undefined;
  this._startTimeSubscription = undefined;

  this.color = options.color;
  this.bgColor = options.bgColor;
  this.bidirectional = options.bidirectional;
  this.globalAlpha = options.globalAlpha;
  this.speed = options.speed;
  this.startTime = options.startTime;
}

Object.defineProperties(PolylineODMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) &&
        Property.isConstant(this._bgColor) &&
        Property.isConstant(this._bidirectional) &&
        Property.isConstant(this._globalAlpha) &&
        Property.isConstant(this._speed) &&
        Property.isConstant(this._startTime)
      );
    },
  },

  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  color: createPropertyDescriptor("color"),
  bgColor: createPropertyDescriptor("bgColor"),
  bidirectional: createPropertyDescriptor("bidirectional"),
  globalAlpha: createPropertyDescriptor("globalAlpha"),
  speed: createPropertyDescriptor("speed"),
  startTime: createPropertyDescriptor("startTime"),
});

PolylineODMaterialProperty.prototype.getType = function (time) {
  return "PolylineODLine";
};

const timeScratch = new JulianDate();

PolylineODMaterialProperty.prototype.getValue = function (time, result) {
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
  result.bgColor = Property.getValueOrClonedDefault(
    this._bgColor,
    time,
    defaultbgColor,
    result.bgColor,
  );
  result.bidirectional = Property.getValueOrDefault(
    this._bidirectional,
    time,
    defaultBidirectional,
  );
  result.globalAlpha = Property.getValueOrDefault(
    this._globalAlpha,
    time,
    defaultGlobalAlphal,
  );
  result.speed = Property.getValueOrDefault(this._speed, time, defaultSpeed);
  result.startTime = Property.getValueOrDefault(
    this._startTime,
    time,
    defaultStartTime,
  );
  return result;
};

PolylineODMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineODMaterialProperty &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._bgColor, other._bgColor) &&
      Property.equals(this._bidirectional, other._bidirectional) &&
      Property.equals(this._globalAlpha, other._globalAlpha) &&
      Property.equals(this._speed, other._speed) &&
      Property.equals(other._startTime, other._startTime))
  );
};

export default PolylineODMaterialProperty;
