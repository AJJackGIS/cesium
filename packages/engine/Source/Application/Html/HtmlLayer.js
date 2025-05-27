import Cartesian3 from "../../Core/Cartesian3.js";
import createGuid from "../../Core/createGuid.js";
import Frozen from "../../Core/Frozen.js";
import SceneTransforms from "../../Scene/SceneTransforms.js";
import TransformUtils from "../../Utils/TransformUtils.js";

/**
 * 自定义html元素图层
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {string} [options.id] the layer id
 */
function HtmlLayer(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  this._id = options.id ?? createGuid();
  this._htmlContainer = document.createElement("div");
  this._htmlContainer.className = "html-layer";
  this._htmlContainer.id = this._id;
  this._show = true;
  this._renderRemoveCallback = undefined;
  this._elements = {};
}

Object.defineProperties(HtmlLayer.prototype, {
  /**
   * 获取layer的容器
   * @memberof HtmlLayer.prototype
   * @type {HTMLDivElement}
   * @readonly
   */
  container: {
    get: function get() {
      return this._htmlContainer;
    },
  },

  /**
   * 获取所有的elements
   * @memberof HtmlLayer.prototype
   * @type {object}
   * @readonly
   */
  elements: {
    get: function get() {
      return this._elements;
    },
  },

  /**
   * 设置或获取layer是否显示
   * @memberof HtmlLayer.prototype
   * @type {boolean}
   */
  show: {
    get: function get() {
      return this._show;
    },
    set: function (show) {
      this._show = show;
      this._htmlContainer.style.visibility = this._show ? "visible" : "hidden";
      Object.keys(this._elements).forEach((key) => {
        this._elements[key].show = this._show;
      });
    },
  },
});

/**
 * 遍历每个元素
 * @param {function} method
 * @param context
 */
HtmlLayer.prototype.eachElement = function (method, context) {
  Object.keys(this._elements).forEach((key) => {
    if (method) {
      method.call(context || this, this._elements[key]);
    }
  });
};

/**
 * 获取图层内所有的html元素
 * @returns {HtmlIcon[]}
 */
HtmlLayer.prototype.getAllHtmlElements = function () {
  const result = [];
  Object.keys(this._elements).forEach((key) => {
    result.push(this._elements[key]);
  });
  return result;
};

/**
 * 根据自定义属性查找element
 * @param attrName 属性名称
 * @param attrVal 属性值
 */
HtmlLayer.prototype.getElementsByAttr = function (attrName, attrVal) {
  const result = [];
  this.eachElement((item) => {
    if (item.attr[attrName] === attrVal) {
      result.push(item);
    }
  }, this);
  return result;
};

/**
 * add to viewer
 * @param {Viewer} viewer
 */
HtmlLayer.prototype.addTo = function (viewer) {
  this._viewer = viewer;
  this._viewer.container.appendChild(this._htmlContainer);
  const scene = this._viewer.scene;
  this._renderRemoveCallback = scene.postRender.addEventListener(() => {
    const cp = this._viewer.camera.positionWC;
    const cd = this._viewer.camera.direction;
    this.eachElement((item) => {
      if (item && item.position) {
        const position = TransformUtils.transformWGS84ToCartesian(
          item.position,
        );
        const up = scene.globe.ellipsoid.geodeticSurfaceNormal(
          position,
          new Cartesian3(),
        );
        const windowCoord = SceneTransforms.worldToWindowCoordinates(
          scene,
          position,
        );
        item._updateStyle(
          windowCoord,
          Cartesian3.distance(position, cp),
          Cartesian3.dot(cd, up) <= 0,
        );
      }
    }, this);
  }, this);
};

/**
 * remove html layer
 */
HtmlLayer.prototype.remove = function () {
  if (this._renderRemoveCallback) {
    this._renderRemoveCallback();
  }
  this._viewer.container.removeChild(this._htmlContainer);
};

/**
 * Clears all divIcons
 */
HtmlLayer.prototype.clear = function () {
  while (this._htmlContainer.hasChildNodes()) {
    this._htmlContainer.removeChild(this._htmlContainer.firstChild);
  }
  this._elements = {};
};

export default HtmlLayer;
