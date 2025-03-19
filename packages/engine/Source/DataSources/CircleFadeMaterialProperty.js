import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import Frozen from "../Core/Frozen.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.RED;
const defaultSpeed = 1.0;

/**
 * 逐渐消逝圆材质
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Property|Color} [options.color=Color.WHITE] The {@link Color} Property to be used.
 * @param {Property|number} [options.speed=1.0] 速度
 */
function CircleFadeMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._speed = undefined;
  this._speedSubscription = undefined;

  this.color = options.color;
  this.speed = options.speed;
}

Object.defineProperties(CircleFadeMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) && Property.isConstant(this._speed)
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
});

CircleFadeMaterialProperty.prototype.getType = function (time) {
  return "CircleFade";
};

const timeScratch = new JulianDate();

CircleFadeMaterialProperty.prototype.getValue = function (time, result) {
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

  return result;
};

CircleFadeMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof CircleFadeMaterialProperty &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._speed, other._speed))
  );
};

export default CircleFadeMaterialProperty;
