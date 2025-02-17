import Cartesian2 from "../Core/Cartesian2.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import Material from "../Scene/Material.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultImage = Material.DefaultImageId;
const defaultColor = Color.WHITE;
const defaultSpeed = 1.0;
const defaultRepeat = new Cartesian2(1.0, 1.0);

/**
 * 动态材质轨迹线
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Property|string} [options.image=''] 轨迹材质
 * @param {Property|Color} [options.color=Color.WHITE] 轨迹线颜色
 * @param {Property|number} [options.speed=1.0] 流动帧率速度
 * @param {Property|Cartesian2} [options.repeat=new Cartesian2(1.0, 1.0)] 材质重复次数
 */
function PolylineImageTrailMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._image = undefined;
  this._imageSubscription = undefined;
  this._color = undefined;
  this._colorSubscription = undefined;
  this._speed = undefined;
  this._speedSubscription = undefined;
  this._repeat = undefined;
  this._repeatSubscription = undefined;

  this.image = options.image;
  this.color = options.color;
  this.speed = options.speed;
  this.repeat = options.repeat;
}

Object.defineProperties(PolylineImageTrailMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._image) &&
        Property.isConstant(this._color) &&
        Property.isConstant(this._speed) &&
        Property.isConstant(this._repeat)
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
  repeat: createPropertyDescriptor("repeat"),
});

PolylineImageTrailMaterialProperty.prototype.getType = function (time) {
  return "PolylineImageTrail";
};

const timeScratch = new JulianDate();

PolylineImageTrailMaterialProperty.prototype.getValue = function (
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
  result.repeat = Property.getValueOrClonedDefault(
    this._repeat,
    time,
    defaultRepeat,
    result.repeat,
  );
  return result;
};

PolylineImageTrailMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineImageTrailMaterialProperty &&
      Property.equals(this._image, other._image) &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._repeat, other._repeat) &&
      Property.equals(this._speed, other._speed))
  );
};

export default PolylineImageTrailMaterialProperty;
