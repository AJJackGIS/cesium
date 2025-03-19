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

/**
 * 粒子锥材质
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Property|string} [options.image=''] 轨迹材质
 * @param {Property|Color} [options.color=Color.WHITE] 轨迹线颜色
 */
function CylinderParticlesMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._definitionChanged = new Event();
  this._image = undefined;
  this._imageSubscription = undefined;
  this._color = undefined;
  this._colorSubscription = undefined;

  this.image = options.image;
  this.color = options.color;
}

Object.defineProperties(CylinderParticlesMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._image) && Property.isConstant(this._color)
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
});

CylinderParticlesMaterialProperty.prototype.getType = function (time) {
  return "CylinderParticles";
};

const timeScratch = new JulianDate();

CylinderParticlesMaterialProperty.prototype.getValue = function (time, result) {
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
  return result;
};

CylinderParticlesMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof CylinderParticlesMaterialProperty &&
      Property.equals(this._image, other._image) &&
      Property.equals(this._color, other._color))
  );
};

export default CylinderParticlesMaterialProperty;
