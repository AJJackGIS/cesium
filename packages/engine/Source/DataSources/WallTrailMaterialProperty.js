import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import Frozen from "../Core/Frozen.js";
import JulianDate from "../Core/JulianDate.js";
import Material from "../Scene/Material.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.RED;
const defaultImage = Material.DefaultImageId;
const defaultSpeed = 1.0;

/**
 * 流动墙材质
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Property|Color} [options.color=Color.WHITE] 颜色
 * @param {Property|string} [options.image=''] 材质
 * @param {Property|number} [options.speed=1.0] 速度
 */
function WallTrailMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._definitionChanged = new Event();
  this._image = undefined;
  this._imageSubscription = undefined;
  this._color = undefined;
  this._colorSubscription = undefined;
  this._speed = undefined;
  this._speedSubscription = undefined;

  this.image = options.image;
  this.color = options.color;
  this.speed = options.speed;
}

Object.defineProperties(WallTrailMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._image) &&
        Property.isConstant(this._color) &&
        Property.isConstant(this._speed)
      );
    },
  },

  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  image: createPropertyDescriptor("image"),
  color: createPropertyDescriptor("color"),
  speed: createPropertyDescriptor("speed"),
});

WallTrailMaterialProperty.prototype.getType = function (time) {
  return "WallTrail";
};

const timeScratch = new JulianDate();

WallTrailMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.image = Property.getValueOrDefault(this._image, time, defaultImage);
  result.color = Property.getValueOrClonedDefault(
    this._color,
    time,
    defaultColor,
    result.color,
  );
  result.speed = Property.getValueOrDefault(this._speed, time, defaultSpeed);
  return result;
};

WallTrailMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof WallTrailMaterialProperty &&
      Property.equals(this._image, other._image) &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._speed, other._speed))
  );
};

export default WallTrailMaterialProperty;
