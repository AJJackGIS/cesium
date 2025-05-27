import createGuid from "../../Core/createGuid.js";
import Frozen from "../../Core/Frozen.js";
import MathUtils from "../../Utils/MathUtils.js";
import HtmlPosition from "./HtmlPosition.js";

/**
 * 自定义Html图标
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {string} [options.id] 元素ID
 * @param {Position} [options.position] 元素坐标
 * @param {Element | string} [options.content] 元素内容
 * @param {object} [options.style] 元素样式
 * @param {HtmlPosition} [options.style.position] 定位
 * @param {number} [options.style.top] 相对位置
 * @param {number} [options.style.left] 相对位置
 * @param {NearFarScalar} [options.style.scaleByDistance] 缩放设置
 * @param {DistanceDisplayCondition} [options.style.distanceDisplayCondition] 可见设置
 *
 */
function HtmlIcon(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  this._id = options.id ?? createGuid();
  this._htmlLayer = undefined;
  this._divElement = document.createElement("div");
  this._divElement.className = "cesium-widget-divIcon";
  this._divElement.id = this._id;
  this._position = options.position;
  this.content = options.content;
  this._show = true;
  const style = options.style ?? Frozen.EMPTY_OBJECT;
  this._style = {
    position: style.position ?? HtmlPosition.CENTER,
    top: `${style.top ?? 0}px`,
    left: `${style.left ?? 0}px`,
  };
  this._attr = {};
}

Object.defineProperties(HtmlIcon.prototype, {
  /**
   * 设置或获取元素是否显示
   * @memberof HtmlIcon.prototype
   * @type {boolean}
   */
  show: {
    get: function get() {
      return this._show;
    },
    set: function (show) {
      this._show = show;
      this._divElement.style.visibility = this._show ? "visible" : "hidden";
    },
  },

  /**
   * 设置或获取元素位置
   * @memberof HtmlIcon.prototype
   * @type {boolean}
   */
  position: {
    get: function get() {
      return this._position;
    },
    set: function (position) {
      this._position = position;
    },
  },

  /**
   * 获取或设置Element的子元素
   * @memberof HtmlIcon.prototype
   * @type {NodeListOf<ChildNode> | string | Element}
   */
  content: {
    get: function get() {
      return this._divElement.childNodes;
    },
    set: function (content) {
      if (content && typeof content === "string") {
        this._divElement.innerHTML = content;
      } else if (content && content instanceof Element) {
        while (this._divElement.hasChildNodes()) {
          this._divElement.removeChild(this._divElement.firstChild);
        }
        this._divElement.appendChild(content);
      }
    },
  },

  /**
   * 设置或获取所有的属性
   * @memberof HtmlIcon.prototype
   * @type {object}
   */
  attr: {
    get: function get() {
      return this._attr;
    },
    set: function (attr) {
      this._attr = attr;
    },
  },
});

/**
 * Update style
 * @param {Cartesian2} windowCoord
 * @param {number} distance
 * @param {boolean} isFront
 * @private
 */
HtmlIcon.prototype._updateStyle = function (windowCoord, distance, isFront) {
  if (!this._show || !windowCoord) {
    return;
  }

  // center
  let x = windowCoord.x - this._divElement.offsetWidth / 2;
  let y = windowCoord.y - this._divElement.offsetHeight / 2;

  if (this._style.position === HtmlPosition.TOP_LEFT) {
    x = windowCoord.x;
    y = windowCoord.y;
  } else if (this._style.position === HtmlPosition.TOP_RIGHT) {
    x = windowCoord.x - this._divElement.offsetWidth;
    y = windowCoord.y;
  } else if (this._style.position === HtmlPosition.TOP_CENTER) {
    x = windowCoord.x - this._divElement.offsetWidth / 2;
    y = windowCoord.y;
  } else if (this._style.position === HtmlPosition.BOTTOM_LEFT) {
    x = windowCoord.x;
    y = windowCoord.y - this._divElement.offsetHeight;
  } else if (this._style.position === HtmlPosition.BOTTOM_RIGHT) {
    x = windowCoord.x - this._divElement.offsetWidth;
    y = windowCoord.y - this._divElement.offsetHeight;
  } else if (this._style.position === HtmlPosition.BOTTOM_CENTER) {
    x = windowCoord.x - this._divElement.offsetWidth / 2;
    y = windowCoord.y - this._divElement.offsetHeight;
  } else if (this._style.position === HtmlPosition.CENTER_LEFT) {
    x = windowCoord.x;
    y = windowCoord.y - this._divElement.offsetHeight / 2;
  } else if (this._style.position === HtmlPosition.CENTER_RIGHT) {
    x = windowCoord.x - this._divElement.offsetWidth;
    y = windowCoord.y - this._divElement.offsetHeight / 2;
  }
  const translate3d = `translate3d(${Math.round(x)}px,${Math.round(y)}px, 0)`;

  // set scale
  let scale3d = "scale3d(1,1,1)";
  const scaleByDistance = this._style.scaleByDistance;
  if (distance && scaleByDistance) {
    const near = scaleByDistance.near || 0.0;
    const nearValue = scaleByDistance.nearValue || 1.0;
    const far = scaleByDistance.far || Number.MAX_VALUE;
    const farValue = scaleByDistance.farValue || 0.0;
    const f = distance / far;
    if (distance < near) {
      scale3d = `scale3d(${nearValue},${nearValue},1)`;
    } else if (distance > far) {
      scale3d = `scale3d(${farValue},${farValue},1)`;
    } else {
      const scale = farValue + f * (nearValue - farValue);
      scale3d = `scale3d(${scale},${scale},1)`;
    }
  }

  // set condition
  let isDisplay = true;
  const distanceDisplayCondition = this._style.distanceDisplayCondition;
  if (distance && distanceDisplayCondition) {
    isDisplay = MathUtils.isBetween(
      distance,
      distanceDisplayCondition.near || 0.0,
      distanceDisplayCondition.far || Number.MAX_VALUE,
    );
  }

  // update style
  this._divElement.style.position = "absolute";
  this._divElement.style.left = this._style.left;
  this._divElement.style.top = this._style.top;
  this._divElement.style.transform = `${translate3d} ${scale3d}`;
  this._divElement.style.visibility =
    isDisplay && isFront ? "visible" : "hidden";
};

/**
 * 添加到HtmlLayer
 * @param {HtmlLayer} layer
 */
HtmlIcon.prototype.addTo = function (layer) {
  this._htmlLayer = layer;
  this._htmlLayer.elements[this._id] = this;
  this._htmlLayer.container.appendChild(this._divElement);
};

/**
 * 移除
 */
HtmlIcon.prototype.remove = function () {
  if (this._htmlLayer) {
    this._htmlLayer.container.removeChild(this._htmlLayer);
    delete this._htmlLayer.elements[this._id];
  }
};

export default HtmlIcon;
