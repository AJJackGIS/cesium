import Check from "../Core/Check.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";

/**
 * A property in a property attribute from EXT_structural_metadata.
 *
 * <p>
 * See the {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata|EXT_structural_metadata Extension}
 * </p>
 *
 * @param {object} options Object with the following properties:
 * @param {object} options.property The property JSON object.
 * @param {MetadataClassProperty} options.classProperty The class property.
 *
 * @alias PropertyAttributeProperty
 * @constructor
 *
 * @private
 * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
 */
function PropertyAttributeProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  const property = options.property;
  const classProperty = options.classProperty;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.property", property);
  Check.typeOf.object("options.classProperty", classProperty);
  //>>includeEnd('debug');

  this._attribute = property.attribute;
  this._classProperty = classProperty;
  this._min = property.min;
  this._max = property.max;

  let offset = property.offset;
  let scale = property.scale;

  // This needs to be set before handling default values
  const hasValueTransform =
    classProperty.hasValueTransform || defined(offset) || defined(scale);

  // If the property attribute does not define an offset/scale, it inherits from
  // the class property. The class property handles setting the default of
  // identity: (offset 0, scale 1) with the same scalar/vector/matrix types.
  // array types are disallowed by the spec.
  offset = offset ?? classProperty.offset;
  scale = scale ?? classProperty.scale;

  // offset and scale are applied on the GPU, so unpack the values
  // as math types we can use in uniform callbacks.
  offset = classProperty.unpackVectorAndMatrixTypes(offset);
  scale = classProperty.unpackVectorAndMatrixTypes(scale);

  this._offset = offset;
  this._scale = scale;
  this._hasValueTransform = hasValueTransform;

  this._extras = property.extras;
  this._extensions = property.extensions;
}

Object.defineProperties(PropertyAttributeProperty.prototype, {
  /**
   * The attribute semantic
   *
   * @memberof PropertyAttributeProperty.prototype
   * @type {string}
   * @readonly
   * @private
   */
  attribute: {
    get: function () {
      return this._attribute;
    },
  },

  /**
   * True if offset/scale should be applied. If both offset/scale were
   * undefined, they default to identity so this property is set false
   *
   * @memberof PropertyAttributeProperty.prototype
   * @type {boolean}
   * @readonly
   * @private
   */
  hasValueTransform: {
    get: function () {
      return this._hasValueTransform;
    },
  },

  /**
   * The offset to be added to property values as part of the value transform.
   *
   * This is always defined, even when `hasValueTransform` is `false`. If
   * the property JSON itself did not define it, then it will inherit the
   * value from the `MetadataClassProperty`. There, it also is always
   * defined, and initialized to the default value if it was not contained
   * in the class property JSON.
   *
   * @memberof PropertyAttributeProperty.prototype
   * @type {number|Cartesian2|Cartesian3|Cartesian4|Matrix2|Matrix3|Matrix4}
   * @readonly
   * @private
   */
  offset: {
    get: function () {
      return this._offset;
    },
  },

  /**
   * The scale to be multiplied to property values as part of the value transform.
   *
   * This is always defined, even when `hasValueTransform` is `false`. If
   * the property JSON itself did not define it, then it will inherit the
   * value from the `MetadataClassProperty`. There, it also is always
   * defined, and initialized to the default value if it was not contained
   * in the class property JSON.
   *
   * @memberof PropertyAttributeProperty.prototype
   * @type {number|Cartesian2|Cartesian3|Cartesian4|Matrix2|Matrix3|Matrix4}
   * @readonly
   * @private
   */
  scale: {
    get: function () {
      return this._scale;
    },
  },

  /**
   * The properties inherited from this property's class
   *
   * @memberof PropertyAttributeProperty.prototype
   * @type {MetadataClassProperty}
   * @readonly
   * @private
   */
  classProperty: {
    get: function () {
      return this._classProperty;
    },
  },

  /**
   * Extra user-defined properties.
   *
   * @memberof PropertyAttributeProperty.prototype
   * @type {*}
   * @readonly
   * @private
   */
  extras: {
    get: function () {
      return this._extras;
    },
  },

  /**
   * An object containing extensions.
   *
   * @memberof PropertyAttributeProperty.prototype
   * @type {*}
   * @readonly
   * @private
   */
  extensions: {
    get: function () {
      return this._extensions;
    },
  },
});

export default PropertyAttributeProperty;
