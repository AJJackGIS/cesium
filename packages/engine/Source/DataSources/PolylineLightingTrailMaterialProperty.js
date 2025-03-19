import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import Frozen from "../Core/Frozen.js";
import JulianDate from "../Core/JulianDate.js";
import Material from "../Scene/Material.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultImage = Material.DefaultImageId;
const defaultColor = Color.WHITE;
const defaultSpeed = 1.0;

/**
 * 发光线轨迹材质
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Property|string} [options.image=''] 轨迹材质
 * @param {Property|Color} [options.color=Color.WHITE] 轨迹线颜色
 * @param {Property|number} [options.speed=1.0] 流动帧率速度
 */
function PolylineLightingTrailMaterialProperty(options) {
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

Object.defineProperties(PolylineLightingTrailMaterialProperty.prototype, {
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

PolylineLightingTrailMaterialProperty.prototype.getType = function (time) {
  return "PolylineLightingTrail";
};

const timeScratch = new JulianDate();

PolylineLightingTrailMaterialProperty.prototype.getValue = function (
  time,
  result,
) {
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

PolylineLightingTrailMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineLightingTrailMaterialProperty &&
      Property.equals(this._image, other._image) &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._speed, other._speed))
  );
};

export default PolylineLightingTrailMaterialProperty;
