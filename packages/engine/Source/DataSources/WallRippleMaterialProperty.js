import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import Frozen from "../Core/Frozen.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.RED;
const defaultSpeed = 1.0;
const defaultCount = 5.0;

/**
 * 波纹墙体材质
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Property|Color} [options.color=Color.WHITE] 颜色
 * @param {Property|number} [options.speed=1.0] 速度
 * @param {Property|number} [options.count=3.0] 个数
 */
function WallRippleMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._speed = undefined;
  this._speedSubscription = undefined;
  this._count = undefined;
  this._countSubscription = undefined;

  this.color = options.color;
  this.speed = options.speed;
  this.count = options.count;
}

Object.defineProperties(WallRippleMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) &&
        Property.isConstant(this._speed) &&
        Property.isConstant(this._count)
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
  repeat: createPropertyDescriptor("count"),
});

WallRippleMaterialProperty.prototype.getType = function (time) {
  return "WallRipple";
};

const timeScratch = new JulianDate();

WallRippleMaterialProperty.prototype.getValue = function (time, result) {
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
  return result;
};

WallRippleMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof WallRippleMaterialProperty &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._speed, other._speed) &&
      Property.equals(this._count, other._count))
  );
};

export default WallRippleMaterialProperty;
