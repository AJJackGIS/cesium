import createGuid from "../Core/createGuid.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";

/**
 * A collection of primitives.  This is most often used with {@link Scene#primitives},
 * but <code>PrimitiveCollection</code> is also a primitive itself so collections can
 * be added to collections forming a hierarchy.
 *
 * @alias PrimitiveCollection
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {boolean} [options.show=true] Determines if the primitives in the collection will be shown.
 * @param {boolean} [options.destroyPrimitives=true] Determines if primitives in the collection are destroyed when they are removed.
 * @privateParam {boolean} [options.countReferences=false] Specifies whether adding and removing primitives from this collection alters their reference counts. If so, adding a
 * primitive to this collection increments its reference count. Removing the primitive decrements its reference count and - if the count reaches zero **and** destroyPrimitives is true - destroys the primitive.
 * This permits primitives to be shared between multiple collections.
 *
 * @example
 * const billboards = new Cesium.BillboardCollection();
 * const labels = new Cesium.LabelCollection();
 *
 * const collection = new Cesium.PrimitiveCollection();
 * collection.add(billboards);
 *
 * scene.primitives.add(collection);  // Add collection
 * scene.primitives.add(labels);      // Add regular primitive
 */
function PrimitiveCollection(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._primitives = [];
  this._guid = createGuid();
  this._primitiveAdded = new Event();
  this._primitiveRemoved = new Event();

  // Used by the OrderedGroundPrimitiveCollection
  this._zIndex = undefined;

  /**
   * Determines if primitives in this collection will be shown.
   *
   * @type {boolean}
   * @default true
   */
  this.show = options.show ?? true;

  /**
   * Determines if primitives in the collection are destroyed when they are removed by
   * {@link PrimitiveCollection#destroy} or  {@link PrimitiveCollection#remove} or implicitly
   * by {@link PrimitiveCollection#removeAll}.
   *
   * @type {boolean}
   * @default true
   *
   * @example
   * // Example 1. Primitives are destroyed by default.
   * const primitives = new Cesium.PrimitiveCollection();
   * const labels = primitives.add(new Cesium.LabelCollection());
   * primitives = primitives.destroy();
   * const b = labels.isDestroyed(); // true
   *
   * @example
   * // Example 2. Do not destroy primitives in a collection.
   * const primitives = new Cesium.PrimitiveCollection();
   * primitives.destroyPrimitives = false;
   * const labels = primitives.add(new Cesium.LabelCollection());
   * primitives = primitives.destroy();
   * const b = labels.isDestroyed(); // false
   * labels = labels.destroy();    // explicitly destroy
   */
  this.destroyPrimitives = options.destroyPrimitives ?? true;

  this._countReferences = options.countReferences ?? false;
}

Object.defineProperties(PrimitiveCollection.prototype, {
  /**
   * Gets the number of primitives in the collection.
   *
   * @memberof PrimitiveCollection.prototype
   *
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._primitives.length;
    },
  },

  /**
   * An event that is raised when a primitive is added to the collection.
   * Event handlers are passed the primitive that was added.
   * @memberof PrimitiveCollection.prototype
   * @type {Event}
   * @readonly
   */
  primitiveAdded: {
    get: function () {
      return this._primitiveAdded;
    },
  },

  /**
   * An event that is raised when a primitive is removed from the collection.
   * Event handlers are passed the primitive that was removed.
   * <p>
   * Note: Depending on the destroyPrimitives constructor option, the primitive may already be destroyed.
   * </p>
   * @memberof PrimitiveCollection.prototype
   * @type {Event}
   * @readonly
   */
  primitiveRemoved: {
    get: function () {
      return this._primitiveRemoved;
    },
  },
});

/**
 * Adds a primitive to the collection.
 *
 * @param {object} primitive The primitive to add.
 * @param {number} [index] The index to add the layer at.  If omitted, the primitive will be added at the bottom of all existing primitives.
 * @returns {object} The primitive added to the collection.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 * @example
 * const billboards = scene.primitives.add(new Cesium.BillboardCollection());
 */
PrimitiveCollection.prototype.add = function (primitive, index) {
  const hasIndex = defined(index);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(primitive)) {
    throw new DeveloperError("primitive is required.");
  }
  if (hasIndex) {
    if (index < 0) {
      throw new DeveloperError("index must be greater than or equal to zero.");
    } else if (index > this._primitives.length) {
      throw new DeveloperError(
        "index must be less than or equal to the number of primitives.",
      );
    }
  }
  //>>includeEnd('debug');

  const external = (primitive._external = primitive._external || {});
  const composites = (external._composites = external._composites || {});
  composites[this._guid] = {
    collection: this,
  };

  if (!hasIndex) {
    this._primitives.push(primitive);
  } else {
    this._primitives.splice(index, 0, primitive);
  }

  if (this._countReferences) {
    if (!defined(external._referenceCount)) {
      external._referenceCount = 1;
    } else {
      ++external._referenceCount;
    }
  }

  this._primitiveAdded.raiseEvent(primitive);

  return primitive;
};

/**
 * Removes a primitive from the collection.
 *
 * @param {object} [primitive] The primitive to remove.
 * @returns {boolean} <code>true</code> if the primitive was removed; <code>false</code> if the primitive is <code>undefined</code> or was not found in the collection.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 *
 * @example
 * const billboards = scene.primitives.add(new Cesium.BillboardCollection());
 * scene.primitives.remove(billboards);  // Returns true
 *
 * @see PrimitiveCollection#destroyPrimitives
 */
PrimitiveCollection.prototype.remove = function (primitive) {
  // PERFORMANCE_IDEA:  We can obviously make this a lot faster.
  if (this.contains(primitive)) {
    const index = this._primitives.indexOf(primitive);
    if (index !== -1) {
      this._primitives.splice(index, 1);

      delete primitive._external._composites[this._guid];
      if (this._countReferences) {
        primitive._external._referenceCount--;
      }

      if (
        this.destroyPrimitives &&
        (!this._countReferences || primitive._external._referenceCount <= 0)
      ) {
        primitive.destroy();
      }

      this._primitiveRemoved.raiseEvent(primitive);

      return true;
    }
    // else ... this is not possible, I swear.
  }

  return false;
};

/**
 * Removes and destroys a primitive, regardless of destroyPrimitives or countReferences setting.
 * @private
 */
PrimitiveCollection.prototype.removeAndDestroy = function (primitive) {
  const removed = this.remove(primitive);
  if (removed && !this.destroyPrimitives) {
    primitive.destroy();
  }
  return removed;
};

/**
 * Removes all primitives in the collection.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 * @see PrimitiveCollection#destroyPrimitives
 */
PrimitiveCollection.prototype.removeAll = function () {
  const primitives = this._primitives;
  const length = primitives.length;
  for (let i = 0; i < length; ++i) {
    const primitive = primitives[i];
    delete primitive._external._composites[this._guid];
    if (this._countReferences) {
      primitive._external._referenceCount--;
    }

    if (
      this.destroyPrimitives &&
      (!this._countReferences || primitive._external._referenceCount <= 0)
    ) {
      primitive.destroy();
    }

    this._primitiveRemoved.raiseEvent(primitive);
  }
  this._primitives = [];
};

/**
 * Determines if this collection contains a primitive.
 *
 * @param {object} [primitive] The primitive to check for.
 * @returns {boolean} <code>true</code> if the primitive is in the collection; <code>false</code> if the primitive is <code>undefined</code> or was not found in the collection.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 * @see PrimitiveCollection#get
 */
PrimitiveCollection.prototype.contains = function (primitive) {
  return !!(
    defined(primitive) &&
    primitive._external &&
    primitive._external._composites &&
    primitive._external._composites[this._guid]
  );
};

function getPrimitiveIndex(compositePrimitive, primitive) {
  //>>includeStart('debug', pragmas.debug);
  if (!compositePrimitive.contains(primitive)) {
    throw new DeveloperError("primitive is not in this collection.");
  }
  //>>includeEnd('debug');

  return compositePrimitive._primitives.indexOf(primitive);
}

/**
 * Raises a primitive "up one" in the collection.  If all primitives in the collection are drawn
 * on the globe surface, this visually moves the primitive up one.
 *
 * @param {object} [primitive] The primitive to raise.
 *
 * @exception {DeveloperError} primitive is not in this collection.
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 * @see PrimitiveCollection#raiseToTop
 * @see PrimitiveCollection#lower
 * @see PrimitiveCollection#lowerToBottom
 */
PrimitiveCollection.prototype.raise = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== primitives.length - 1) {
      const p = primitives[index];
      primitives[index] = primitives[index + 1];
      primitives[index + 1] = p;
    }
  }
};

/**
 * Raises a primitive to the "top" of the collection.  If all primitives in the collection are drawn
 * on the globe surface, this visually moves the primitive to the top.
 *
 * @param {object} [primitive] The primitive to raise the top.
 *
 * @exception {DeveloperError} primitive is not in this collection.
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 * @see PrimitiveCollection#raise
 * @see PrimitiveCollection#lower
 * @see PrimitiveCollection#lowerToBottom
 */
PrimitiveCollection.prototype.raiseToTop = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== primitives.length - 1) {
      // PERFORMANCE_IDEA:  Could be faster
      primitives.splice(index, 1);
      primitives.push(primitive);
    }
  }
};

/**
 * Lowers a primitive "down one" in the collection.  If all primitives in the collection are drawn
 * on the globe surface, this visually moves the primitive down one.
 *
 * @param {object} [primitive] The primitive to lower.
 *
 * @exception {DeveloperError} primitive is not in this collection.
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 * @see PrimitiveCollection#lowerToBottom
 * @see PrimitiveCollection#raise
 * @see PrimitiveCollection#raiseToTop
 */
PrimitiveCollection.prototype.lower = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== 0) {
      const p = primitives[index];
      primitives[index] = primitives[index - 1];
      primitives[index - 1] = p;
    }
  }
};

/**
 * Lowers a primitive to the "bottom" of the collection.  If all primitives in the collection are drawn
 * on the globe surface, this visually moves the primitive to the bottom.
 *
 * @param {object} [primitive] The primitive to lower to the bottom.
 *
 * @exception {DeveloperError} primitive is not in this collection.
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 * @see PrimitiveCollection#lower
 * @see PrimitiveCollection#raise
 * @see PrimitiveCollection#raiseToTop
 */
PrimitiveCollection.prototype.lowerToBottom = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== 0) {
      // PERFORMANCE_IDEA:  Could be faster
      primitives.splice(index, 1);
      primitives.unshift(primitive);
    }
  }
};

/**
 * Returns the primitive in the collection at the specified index.
 *
 * @param {number} index The zero-based index of the primitive to return.
 * @returns {object} The primitive at the <code>index</code>.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 *
 * @example
 * // Toggle the show property of every primitive in the collection.
 * const primitives = scene.primitives;
 * const length = primitives.length;
 * for (let i = 0; i < length; ++i) {
 *   const p = primitives.get(i);
 *   p.show = !p.show;
 * }
 *
 * @see PrimitiveCollection#length
 */
PrimitiveCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.");
  }
  //>>includeEnd('debug');

  return this._primitives[index];
};

/**
 * @private
 */
PrimitiveCollection.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    primitives[i].update(frameState);
  }
};

/**
 * @private
 */
PrimitiveCollection.prototype.prePassesUpdate = function (frameState) {
  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    const primitive = primitives[i];
    if (defined(primitive.prePassesUpdate)) {
      primitive.prePassesUpdate(frameState);
    }
  }
};

/**
 * @private
 */
PrimitiveCollection.prototype.updateForPass = function (frameState, passState) {
  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    const primitive = primitives[i];
    if (defined(primitive.updateForPass)) {
      primitive.updateForPass(frameState, passState);
    }
  }
};

/**
 * @private
 */
PrimitiveCollection.prototype.postPassesUpdate = function (frameState) {
  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    const primitive = primitives[i];
    if (defined(primitive.postPassesUpdate)) {
      primitive.postPassesUpdate(frameState);
    }
  }
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 * <br /><br />
 * If this object was destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
 *
 * @returns {boolean} True if this object was destroyed; otherwise, false.
 *
 * @see PrimitiveCollection#destroy
 */
PrimitiveCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * Destroys the WebGL resources held by each primitive in this collection.  Explicitly destroying this
 * collection allows for deterministic release of WebGL resources, instead of relying on the garbage
 * collector to destroy this collection.
 * <br /><br />
 * Since destroying a collection destroys all the contained primitives, only destroy a collection
 * when you are sure no other code is still using any of the contained primitives.
 * <br /><br />
 * Once this collection is destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
 * assign the return value (<code>undefined</code>) to the object as done in the example.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 *
 * @example
 * primitives = primitives && primitives.destroy();
 *
 * @see PrimitiveCollection#isDestroyed
 */
PrimitiveCollection.prototype.destroy = function () {
  this.removeAll();
  return destroyObject(this);
};
export default PrimitiveCollection;
