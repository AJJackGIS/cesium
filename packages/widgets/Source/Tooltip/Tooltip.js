import {
  defined,
  DeveloperError,
  getElement,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "@cesium/engine";

/**
 * 鼠标提示文本
 * <p>The Tooltip is a widget for displaying tip text.</p>
 * @alias Tooltip
 * @constructor
 *
 * @param {Element} container The parent HTML container node for this widget.
 * @param {CesiumWidget} cesiumWidget The scene.
 **/
function Tooltip(container, cesiumWidget) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(container)) {
    throw new DeveloperError("container is required.");
  }
  if (!defined(cesiumWidget)) {
    throw new DeveloperError("cesiumWidget is required.");
  }
  //>>includeEnd('debug');

  container = getElement(container);
  this._container = container;
  this._cesiumWidget = cesiumWidget;
  this._canvas = cesiumWidget.canvas;
}

/**
 * @private
 * @param {ScreenSpaceEventHandler.MotionEvent} event
 */
Tooltip.prototype._updateFromMove = function (event) {
  let x = event.endPosition.x + 15; // 右移15个像素
  let y = event.endPosition.y - this._container.offsetHeight / 2;
  const offset = getViewOffset(this._cesiumWidget);
  x += offset.x;
  y += offset.y;
  this._container.style.cssText = `display:block; z-index:1;
        transform:translate3d(${Math.round(x)}px,${Math.round(y)}px, 0);`;
};

Object.defineProperties(Tooltip.prototype, {
  /**
   * 设置是否启用
   * @memberof Tooltip.prototype
   * @type {boolean}
   */
  enable: {
    set: function (value) {
      if (value) {
        if (!this._screenSpaceEventHandler) {
          this._screenSpaceEventHandler = new ScreenSpaceEventHandler(
            this._canvas,
          );
        }
        this._screenSpaceEventHandler.setInputAction((event) => {
          this._updateFromMove(event);
        }, ScreenSpaceEventType.MOUSE_MOVE);
        this.show();
      } else {
        if (this._screenSpaceEventHandler) {
          this._screenSpaceEventHandler.destroy();
        }
        this.hide();
      }
    },
  },

  /**
   * 设置提示内容
   * @memberof Tooltip.prototype
   * @type {string | Element}
   */
  content: {
    set: function (value) {
      if (value && typeof value === "string") {
        this._container.innerHTML = value;
      } else if (value && value instanceof Element) {
        while (this._container.hasChildNodes()) {
          this._container.removeChild(this._container.firstChild);
        }
        this._container.appendChild(value);
      }
    },
  },
});

/**
 * 显示
 */
Tooltip.prototype.show = function () {
  if (this._container) {
    this._container.style.display = "block";
  }
};

/**
 * 隐藏
 */
Tooltip.prototype.hide = function () {
  if (this._container) {
    this._container.style.display = "none";
  }
};

/**
 *
 * @param {CesiumWidget} cesiumWidget
 * @returns {{x: number, y: number}}
 * @private
 */
function getViewOffset(cesiumWidget) {
  const offset = { x: 0, y: 0 };
  if (cesiumWidget) {
    if (cesiumWidget.container.getBoundingClientRect) {
      const rect = cesiumWidget.container.getBoundingClientRect();
      offset.x = rect.left;
      offset.y = rect.top;
    } else {
      offset.x = cesiumWidget.container.offsetLeft;
      offset.y = cesiumWidget.container.offsetTop;
    }
  }
  return offset;
}

export default Tooltip;
