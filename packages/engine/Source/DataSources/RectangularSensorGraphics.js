import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import Frozen from "../Core/Frozen.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} RectangularSensorGraphics.ConstructorOptions
 *
 * Initialization options for the RectangularSensorGraphics constructor
 *
 * @property {Property | boolean} [show=true] 是否显示
 * @property {Property | number} [radius] 半径
 * @property {Property | number} [xHalfAngle] 水平半角
 * @property {Property | number} [yHalfAngle] 垂直半角
 * @property {Property | Color} [lineColor] 线的颜色
 * @property {Property | boolean} [showSectorLines] 是否显示扇面的线
 * @property {Property | boolean} [showSectorSegmentLines] 是否显示扇面和圆顶面连接的线
 * @property {Property | boolean} [showLateralSurfaces] 是否显示侧面
 * @property {Property | Color} [material] 统一材质
 * @property {Property | boolean} [showDomeSurfaces] 是否显示圆顶表面
 * @property {Property | boolean} [showDomeLines] 是否显示圆顶面线
 * @property {Property | boolean} [showIntersection] 是否显示与地球相交的线
 * @property {Property | Color} [intersectionColor] 与地球相交的线的颜色
 * @property {Property | number} [intersectionWidth] 与地球相交的线的宽度（像素）
 * @property {Property | boolean} [showThroughEllipsoid] 是否穿过地球
 * @property {Property | number} [gaze] 特定角度
 * @property {Property | boolean} [showScanPlane] 是否显示扫描面
 * @property {Property | Color} [scanPlaneColor] 扫描面颜色
 * @property {Property | string} [scanPlaneMode] 扫描面模式 垂直vertical/水平horizontal
 * @property {Property | number} [scanPlaneRate] 扫描速率
 */

/**
 * RectangularSensor 相控阵雷达
 *
 * @alias RectangularSensorGraphics
 * @constructor
 *
 * @param {RectangularSensorGraphics.ConstructorOptions} [options] Object describing initialization options
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Rectangle.html|Cesium Sandcastle Rectangle Demo}
 */
function RectangularSensorGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._radius = undefined;
  this._radiusSubscription = undefined;
  this._xHalfAngle = undefined;
  this._xHalfAngleSubscription = undefined;
  this._yHalfAngle = undefined;
  this._yHalfAngleSubscription = undefined;
  this._lineColor = undefined;
  this._lineColorSubscription = undefined;
  this._showSectorLines = undefined;
  this._showSectorLinesSubscription = undefined;
  this._showSectorSegmentLines = undefined;
  this._showSectorSegmentLinesSubscription = undefined;
  this._showLateralSurfaces = undefined;
  this._showLateralSurfacesSubscription = undefined;
  this._material = undefined;
  this._materialSubscription = undefined;
  this._showDomeSurfaces = undefined;
  this._showDomeSurfacesSubscription = undefined;
  this._showDomeLines = undefined;
  this._showDomeLinesSubscription = undefined;
  this._showIntersection = undefined;
  this._showIntersectionSubscription = undefined;
  this._intersectionColor = undefined;
  this._intersectionColorSubscription = undefined;
  this._intersectionWidth = undefined;
  this._intersectionWidthSubscription = undefined;
  this._showThroughEllipsoid = undefined;
  this._showThroughEllipsoidSubscription = undefined;
  this._gaze = undefined;
  this._gazeSubscription = undefined;
  this._showScanPlane = undefined;
  this._showScanPlaneSubscription = undefined;
  this._scanPlaneColor = undefined;
  this._scanPlaneColorSubscription = undefined;
  this._scanPlaneMode = undefined;
  this._scanPlaneModeSubscription = undefined;
  this._scanPlaneRate = undefined;
  this._scanPlaneRateSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(RectangularSensorGraphics.prototype, {
  /**
   * Gets the event that is raised whenever a property or sub-property is changed or modified.
   * @memberof RectangularSensorGraphics.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function get() {
      return this._definitionChanged;
    },
  },

  /**
   * 是否显示
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  show: createPropertyDescriptor("show"),

  /**
   * 半径
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  radius: createPropertyDescriptor("radius"),

  /**
   * 水平半角
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  xHalfAngle: createPropertyDescriptor("xHalfAngle"),

  /**
   * 垂直半角
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  yHalfAngle: createPropertyDescriptor("yHalfAngle"),

  /**
   * 线的颜色
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  lineColor: createPropertyDescriptor("lineColor"),

  /**
   * 是否显示扇面的线
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  showSectorLines: createPropertyDescriptor("showSectorLines"),

  /**
   * 是否显示扇面和圆顶面连接的线
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  showSectorSegmentLines: createPropertyDescriptor("showSectorSegmentLines"),

  /**
   * 是否显示侧面
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  showLateralSurfaces: createPropertyDescriptor("showLateralSurfaces"),

  /**
   * 统一材质
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 是否显示圆顶表面
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  showDomeSurfaces: createPropertyDescriptor("showDomeSurfaces"),

  /**
   * 是否显示圆顶面线
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  showDomeLines: createPropertyDescriptor("showDomeLines"),

  /**
   * 是否显示与地球相交的线
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  showIntersection: createPropertyDescriptor("showIntersection"),

  /**
   * 与地球相交的线的颜色
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  intersectionColor: createPropertyDescriptor("intersectionColor"),

  /**
   * 与地球相交的线的宽度
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  intersectionWidth: createPropertyDescriptor("intersectionWidth"),

  /**
   * 是否穿过地球
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  showThroughEllipsoid: createPropertyDescriptor("showThroughEllipsoid"),

  /**
   * 特定角度
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  gaze: createPropertyDescriptor("gaze"),

  /**
   * 是否显示扫描面
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  showScanPlane: createPropertyDescriptor("showScanPlane"),

  /**
   * 扫描面颜色
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  scanPlaneColor: createPropertyDescriptor("scanPlaneColor"),

  /**
   * 扫描面模式
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  scanPlaneMode: createPropertyDescriptor("scanPlaneMode"),

  /**
   * 扫描速率
   * @memberof RectangularSensorGraphics.prototype
   * @type {Property|undefined}
   */
  scanPlaneRate: createPropertyDescriptor("scanPlaneRate"),
});

/**
 * Duplicates this instance.
 *
 * @param {RectangularSensorGraphics} [result] The object onto which to store the result.
 * @returns {RectangularSensorGraphics} The modified result parameter or a new instance if one was not provided.
 */
RectangularSensorGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    result = new RectangularSensorGraphics(this);
  }

  result.show = this.show;
  result.radius = this.radius;
  result.xHalfAngle = this.xHalfAngle;
  result.yHalfAngle = this.yHalfAngle;
  result.lineColor = this.lineColor;
  result.showSectorLines = this.showSectorLines;
  result.showSectorSegmentLines = this.showSectorSegmentLines;
  result.showLateralSurfaces = this.showLateralSurfaces;
  result.material = this.material;
  result.showDomeSurfaces = this.showDomeSurfaces;
  result.showDomeLines = this.showDomeLines;
  result.showIntersection = this.showIntersection;
  result.intersectionColor = this.intersectionColor;
  result.intersectionWidth = this.intersectionWidth;
  result.showThroughEllipsoid = this.showThroughEllipsoid;
  result.gaze = this.gaze;
  result.showScanPlane = this.showScanPlane;
  result.scanPlaneColor = this.scanPlaneColor;
  result.scanPlaneMode = this.scanPlaneMode;
  result.scanPlaneRate = this.scanPlaneRate;
  return result;
};

/**
 * Assigns each unassigned property on this object to the value
 * of the same property on the provided source object.
 *
 * @param {RectangularSensorGraphics} source The object to be merged into this object.
 */
RectangularSensorGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.slice = this.slice ?? source.slice;
  this.show = this.show ?? source.show;
  this.radius = this.radius ?? source.radius;
  this.xHalfAngle = this.xHalfAngle ?? source.xHalfAngle;
  this.yHalfAngle = this.yHalfAngle ?? source.yHalfAngle;
  this.lineColor = this.lineColor ?? source.lineColor;
  this.showSectorLines = this.showSectorLines ?? source.showSectorLines;
  this.showSectorSegmentLines =
    this.showSectorSegmentLines ?? source.showSectorSegmentLines;
  this.showLateralSurfaces =
    this.showLateralSurfaces ?? source.showLateralSurfaces;
  this.material = this.material ?? source.material;
  this.showDomeSurfaces = this.showDomeSurfaces ?? source.showDomeSurfaces;
  this.showDomeLines = this.showDomeLines ?? source.showDomeLines;
  this.showIntersection = this.showIntersection ?? source.showIntersection;
  this.intersectionColor = this.intersectionColor ?? source.intersectionColor;
  this.intersectionWidth = this.intersectionWidth ?? source.intersectionWidth;
  this.showThroughEllipsoid =
    this.showThroughEllipsoid ?? source.showThroughEllipsoid;
  this.gaze = this.gaze ?? source.gaze;
  this.showScanPlane = this.showScanPlane ?? source.showScanPlane;
  this.scanPlaneColor = this.scanPlaneColor ?? source.scanPlaneColor;
  this.scanPlaneMode = this.scanPlaneMode ?? source.scanPlaneMode;
  this.scanPlaneRate = this.scanPlaneRate ?? source.scanPlaneRate;
};

export default RectangularSensorGraphics;
