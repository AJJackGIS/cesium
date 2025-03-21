import Frozen from "../Core/Frozen.js";
import ScreenSpaceEventHandler from "../Core/ScreenSpaceEventHandler.js";
import ScreenSpaceEventType from "../Core/ScreenSpaceEventType.js";

/**
 * 鼠标提示文本
 */
class Tooltip {
  /**
   * constructor
   * @param {options} [options] Object with the following properties:
   * @param {Viewer} [options.viewer] viewer
   */
  constructor(options) {
    options = options ?? Frozen.EMPTY_OBJECT;
    this._viewer = options.viewer;
    this._wrapper = this._createDom("div", "widget tool-tip");
    this._enable = false;
    this._event = new ScreenSpaceEventHandler(this._viewer.canvas);
  }

  /**
   * 设置是否启用
   * @param {boolean} enable
   */
  set enable(enable) {
    if (this._enable === enable) {
      return;
    }
    this._enable = enable;
    this._enableHook();
  }

  set content(content) {
    if (content && typeof content === "string") {
      this._wrapper.innerHTML = content;
    } else if (content && content instanceof Element) {
      while (this._wrapper.hasChildNodes()) {
        this._wrapper.removeChild(this._wrapper.firstChild);
      }
      this._wrapper.appendChild(content);
    }
  }

  hide() {
    if (this._wrapper) {
      this._wrapper.style.cssText = "visibility:hidden";
    }
  }

  _getOffset() {
    const offset = { x: 0, y: 0 };
    const container = this._viewer.container;
    if (container) {
      if (container.getBoundingClientRect) {
        const rect = container.getBoundingClientRect();
        offset.x = rect.left;
        offset.y = rect.top;
      } else {
        offset.x = container.offsetLeft;
        offset.y = container.offsetTop;
      }
    }
    return offset;
  }

  _enableHook() {
    if (this._enable) {
      this._viewer.container.appendChild(this._wrapper);
      this._event.setInputAction((movePosition) => {
        let x = movePosition.endPosition.x + 10;
        let y = movePosition.endPosition.y - this._wrapper.offsetHeight / 2;
        const offset = this._getOffset();
        x += offset.x;
        y += offset.y;
        this._wrapper.style.cssText = `
        visibility:visible;
        z-index:1;
        transform:translate3d(${Math.round(x)}px,${Math.round(y)}px, 0);
        `;
      }, ScreenSpaceEventType.MOUSE_MOVE);
    } else {
      this._event.destroy();
      this._viewer.container.removeChild(this._wrapper);
    }
  }

  _createDom(tagName, className, container = null) {
    const el = document.createElement(tagName);
    el.className = className || "";
    if (container) {
      container.appendChild(el);
    }
    return el;
  }
}

export default Tooltip;
