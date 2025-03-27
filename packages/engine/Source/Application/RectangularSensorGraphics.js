import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import Frozen from "../Core/Frozen.js";
import createMaterialPropertyDescriptor from "../DataSources/createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "../DataSources/createPropertyDescriptor.js";

function RectangularSensorGraphics(options) {
  this._show = undefined;
  this._radius = undefined;
  this._xHalfAngle = undefined;
  this._yHalfAngle = undefined;
  this._lineColor = undefined;
  this._showSectorLines = undefined;
  this._showSectorSegmentLines = undefined;
  this._showLateralSurfaces = undefined;
  this._material = undefined;
  this._showDomeSurfaces = undefined;
  this._showDomeLines = undefined;
  this._showIntersection = undefined;
  this._intersectionColor = undefined;
  this._intersectionWidth = undefined;
  this._showThroughEllipsoid = undefined;
  this._gaze = undefined;
  this._showScanPlane = undefined;
  this._scanPlaneColor = undefined;
  this._scanPlaneMode = undefined;
  this._scanPlaneRate = undefined;
  this._definitionChanged = new Event();

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(RectangularSensorGraphics.prototype, {
  definitionChanged: {
    get: function get() {
      return this._definitionChanged;
    },
  },

  show: createPropertyDescriptor("show"),
  radius: createPropertyDescriptor("radius"),
  xHalfAngle: createPropertyDescriptor("xHalfAngle"),
  yHalfAngle: createPropertyDescriptor("yHalfAngle"),
  lineColor: createPropertyDescriptor("lineColor"),
  showSectorLines: createPropertyDescriptor("showSectorLines"),
  showSectorSegmentLines: createPropertyDescriptor("showSectorSegmentLines"),
  showLateralSurfaces: createPropertyDescriptor("showLateralSurfaces"),
  material: createMaterialPropertyDescriptor("material"),
  showDomeSurfaces: createPropertyDescriptor("showDomeSurfaces"),
  showDomeLines: createPropertyDescriptor("showDomeLines "),
  showIntersection: createPropertyDescriptor("showIntersection"),
  intersectionColor: createPropertyDescriptor("intersectionColor"),
  intersectionWidth: createPropertyDescriptor("intersectionWidth"),
  showThroughEllipsoid: createPropertyDescriptor("showThroughEllipsoid"),
  gaze: createPropertyDescriptor("gaze"),
  showScanPlane: createPropertyDescriptor("showScanPlane"),
  scanPlaneColor: createPropertyDescriptor("scanPlaneColor"),
  scanPlaneMode: createPropertyDescriptor("scanPlaneMode"),
  scanPlaneRate: createPropertyDescriptor("scanPlaneRate"),
});

RectangularSensorGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    result = new RectangularSensorGraphics();
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

RectangularSensorGraphics.prototype.merge = function (source) {
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
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
