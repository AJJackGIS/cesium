import Color from "../Core/Color.js";
import Event from "../Core/Event.js";
import Material from "../Scene/Material.js";

/**
 * 绘制工具
 * @constructor
 * @param {Viewer} viewer viewer对象
 * @param {DrawMode} mode 绘制模式，包含点、线、面、图标。
 * @param {ClampMode} clampMode 绘制风格，包含空间、贴地、贴对象
 */
class DrawHandler {
  constructor(viewer, mode, clampMode) {
    this.viewer = viewer;
    this.mode = mode;

    /**
     * 获取或者设置绘制几何对象的风格，空间、贴地、贴对象。
     * @type {Number}
     */
    this.clampMode = clampMode;

    /**
     * 绘制handler的激活事件
     *
     * @example
     * handler.activeEvt.addEventListener(result => {
     *
     * });
     * @type {Event}
     *
     * @readonly
     */
    this.activeEvt = new Event();

    /**
     * <p>绘制完成事件,监听绘制完成的事件，获取当前绘制结果。</p>
     * <p>当绘制模式为DrawMode.Point,事件回调的结果是{object : point}。</p>
     * <p>当绘制模式为DrawMode.Polygon,事件回调的结果是{object : polygon}。</p>
     * <p>当绘制模式为DrawMode.Line,事件回调的结果是{object : polyline}。</p>
     * <p>当绘制模式为DrawMode.Marker,事件回调的结果是{object : marker}。</p>
     * @example
     * handler.drawEvt.addEventListener(result => {
     *   console.log(result);
     * });
     * @type {Event}
     *
     * @readonly
     */
    this.drawEvt = new Event();

    /**
     * 绘制handler的移动事件。
     *
     * @example
     * handler.movingEvt.addEventListener(function(result){
     *
     * });
     *
     * @type {Event}
     *
     * @readonly
     */
    this.movingEvt = new Event();

    /**
     * 设置绘制的图元是否开启深度检测，默认开启
     * @type {boolean}
     */
    this.enableDepthTest = true;

    /**
     * 设置线颜色
     * @type {Color}
     */
    this.lineColor = Color.RED;

    /**
     * 获取或设置线材质
     * @type {Material}
     */
    this.lineMaterial = Material.fromType("Color");

    /**
     * 线宽
     * @type {number}
     */
    this.lineWidth = 2;
  }

  /**
   * 激活handler
   */
  activate() {}

  /**
   * 清除所有图元
   */
  clear() {}

  /**
   * 使handler无效
   */
  deactivate() {}
}

export default DrawHandler;
