import Frozen from "../../Core/Frozen.js";
import ScreenSpaceEventHandler from "../../Core/ScreenSpaceEventHandler.js";
import CustomDataSource from "../../DataSources/CustomDataSource.js";
import ClampMode from "./ClampMode.js";
import DrawCircle from "./DrawCircle.js";
import DrawMode from "./DrawMode.js";
import DrawPoint from "./DrawPoint.js";
import DrawPolygon from "./DrawPolygon.js";
import DrawPolyline from "./DrawPolyline.js";
import DrawRectangle from "./DrawRectangle.js";

const defaultFunction = () => {};

/**
 * 绘制工具
 * @constructor
 * @param {Viewer} viewer viewer对象
 * @param {object} options
 * @param {DrawMode} options.drawMode 绘制模式，包含点、线、面、图标。
 * @param {ClampMode} options.clampMode 绘制风格，包含空间、贴地、贴对象
 * @param {function} options.drawFinished 绘制完成后的回调函数
 */
class DrawHandler {
  constructor(viewer, options) {
    this.viewer = viewer;
    options = options ?? Frozen.EMPTY_OBJECT;
    this.mode = options.drawMode ?? DrawMode.POINT;
    this.clampMode = options.clampMode ?? ClampMode.GROUND;
    this.drawFinished = options.drawFinished ?? defaultFunction;

    this.tooltip = viewer.tooltip; // 鼠标提示窗口
    this.dataSources = new CustomDataSource("draw_elements"); // 存储绘制对象
    this.viewer.dataSources.add(this.dataSources);
    this.eventHandler = new ScreenSpaceEventHandler(this.viewer.canvas); // 鼠标交互事件
  }

  /**
   * 开始绘制
   */
  start() {
    if (this.tooltip) {
      this.tooltip.enable = true;
    }

    const callback = (data) => {
      this.drawFinished(data);
      this.destroy();
    };

    if (this.mode === DrawMode.POINT) {
      new DrawPoint(
        this.viewer,
        this.clampMode,
        this.dataSources,
        this.eventHandler,
        callback,
      ).addEventHandler();
    } else if (this.mode === DrawMode.POLYLINE) {
      new DrawPolyline(
        this.viewer,
        this.clampMode,
        this.dataSources,
        this.eventHandler,
        callback,
      ).addEventHandler();
    } else if (this.mode === DrawMode.POLYGON) {
      new DrawPolygon(
        this.viewer,
        this.clampMode,
        this.dataSources,
        this.eventHandler,
        callback,
      ).addEventHandler();
    } else if (this.mode === DrawMode.RECTANGLE) {
      new DrawRectangle(
        this.viewer,
        this.clampMode,
        this.dataSources,
        this.eventHandler,
        callback,
      ).addEventHandler();
    } else if (this.mode === DrawMode.CIRCLE) {
      new DrawCircle(
        this.viewer,
        this.clampMode,
        this.dataSources,
        this.eventHandler,
        callback,
      ).addEventHandler();
    }
  }

  /**
   * 移除绘制资源
   * @private
   */
  destroy() {
    if (this.eventHandler && !this.eventHandler.isDestroyed()) {
      this.eventHandler.destroy();
    }
    this.dataSources.entities.removeAll();
    this.viewer.dataSources.remove(this.dataSources);
    if (this.tooltip) {
      this.tooltip.enable = false;
    }
  }
}

export default DrawHandler;
