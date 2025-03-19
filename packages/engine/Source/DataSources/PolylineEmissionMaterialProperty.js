import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import Frozen from "../Core/Frozen.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.WHITE;

/**
 * 发散线材质
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Property|Color} [options.color=Color.WHITE] 粒子颜色
 * @param {Property|number} [options.speed=1.0] 流动帧率速度
 */
function PolylineEmissionMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;

  this.color = options.color;
}

Object.defineProperties(PolylineEmissionMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return Property.isConstant(this._color);
    },
  },

  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  color: createPropertyDescriptor("color"),
});

PolylineEmissionMaterialProperty.prototype.getType = function (time) {
  return "PolylineEmission";
};

const timeScratch = new JulianDate();

PolylineEmissionMaterialProperty.prototype.getValue = function (time, result) {
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
  return result;
};

PolylineEmissionMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineEmissionMaterialProperty &&
      Property.equals(this._color, other._color))
  );
};

export default PolylineEmissionMaterialProperty;
