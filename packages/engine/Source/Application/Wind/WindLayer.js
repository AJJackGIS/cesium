import Cartesian2 from "../../Core/Cartesian2.js";
import Cartesian3 from "../../Core/Cartesian3.js";
import Ellipsoid from "../../Core/Ellipsoid.js";
import EllipsoidalOccluder from "../../Core/EllipsoidalOccluder.js";
import Frozen from "../../Core/Frozen.js";
import CesiumMath from "../../Core/Math.js";
import SceneTransforms from "../../Scene/SceneTransforms.js";
import Field from "./Field.js";
import WindCanvas from "./WindCanvas.js";

const defaultOptions = {
  globalAlpha: 0.9,
  lineWidth: 1,
  colorScale: "#fff",
  velocityScale: 0.03,
  maxAge: 90,
  paths: 1000,
  frameRate: 32,
  minVelocity: null,
  maxVelocity: null,
};

/**
 * @typedef {Object} WindLayer.ConstructorOptions
 *
 * Initialization options for the WindLayer constructor.
 *
 * @property {object} data The wind json(grib->json) data.
 * @property {object} options 参数
 * @property {string | Array | function} [options.colorScale='#fff'] 粒子颜色
 * @property {number | function} [options.lineWidth=1] 粒子线宽
 * @property {number} [options.frameRate=32] 粒子时间刷新(越小刷新越快).
 * @property {number} [options.maxAge=90] 粒子最大存活时间.
 * @property {number} [options.globalAlpha=0.9] 粒子颜色透明度.
 * @property {number} [options.velocityScale=0.03] 粒子大小缩放比例.
 * @property {number} [options.paths=1000] 粒子个数.
 * @property {number} [options.minVelocity] 最小速度.
 * @property {number} [options.maxVelocity] 最大速度.
 */

/**
 * The wind layer
 *
 * @example
 *
 * colorScale 数组的取值示例
 * [
 *  "rgb(36,104, 180)",
 *  "rgb(60,157, 194)",
 *  "rgb(128,205,193 )",
 *  "rgb(151,218,168 )",
 *  "rgb(198,231,181)",
 *  "rgb(238,247,217)",
 *  "rgb(255,238,159)",
 *  "rgb(252,217,125)",
 *  "rgb(255,182,100)",
 *  "rgb(252,150,75)",
 *  "rgb(250,112,52)",
 *  "rgb(245,64,32)",
 *  "rgb(237,45,28)",
 *  "rgb(220,24,32)",
 *  "rgb(180,0,35)",
 * ]
 *
 * @alias WindLayer
 * @constructor
 */
class WindLayer {
  constructor(data, options) {
    this.canvas = null;
    this.wind = null;
    this.field = null;
    this.viewer = null;
    this.options = Object.assign(
      defaultOptions,
      options ?? Frozen.EMPTY_OBJECT,
    );
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;left:0;top:0;user-select:none;pointer-events:none;";
    this.canvas = canvas;
    if (data) {
      this.setData(data);
    }
  }

  /**
   * 设置显示隐藏
   * @param show
   */
  set show(show) {
    this.canvas.style.visibility = show ? "visible" : "hidden";
  }

  /**
   * 添加到viewer场景中
   * @param {Viewer} viewer viewer对象
   */
  addTo(viewer) {
    this.viewer = viewer;
    this.appendCanvas();
    this.render();
    window.onresize = () => {
      this.adjustSize();
      this.wind.prerender();
      this.wind.render();
    };
  }

  /**
   * 移除layer
   */
  remove() {
    if (this.wind) {
      this.wind.clearCanvas();
    }
    if (this.canvas) {
      this.removeDomNode(this.canvas);
    }
    delete this.canvas;
  }

  removeDomNode(node) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }

  /**
   * format gfs json to vector
   * @example
   * {
   *   "header": {
   *       "parameterCategory": 1,
   *       "parameterNumber": 2,
   *       "la1": 90.5,
   *       "la2": -90.5,
   *       "lo1": -180.5,
   *       "lo2": 179.5,
   *       "extent": [
   *         -180.5,
   *         -90.5,
   *         179.5,
   *         90.5
   *       ],
   *       "nx": 360,
   *       "ny": 181,
   *       "dx": 1,
   *       "dy": 1,
   *       "min": -20.7940673828125,
   *       "max": 30.645931243896484,
   *       "GRIB_COMMENT": "u-component of wind [m/s]",
   *       "GRIB_DISCIPLINE": "0(Meteorological)",
   *       "GRIB_ELEMENT": "UGRD",
   *       "GRIB_FORECAST_SECONDS": "0 sec",
   *       "GRIB_IDS": "CENTER=7(US-NCEP) SUBCENTER=0 MASTER_TABLE=2 LOCAL_TABLE=1 SIGNF_REF_TIME=1(Start_of_Forecast) REF_TIME=2020-06-20T00:00:00Z PROD_STATUS=0(Operational) TYPE=1(Forecast)",
   *       "GRIB_PDS_PDTN": "0",
   *       "GRIB_PDS_TEMPLATE_ASSEMBLED_VALUES": "2 2 2 0 81 0 0 1 0 103 0 10 255 0 0",
   *       "GRIB_PDS_TEMPLATE_NUMBERS": "2 2 2 0 81 0 0 0 1 0 0 0 0 103 0 0 0 0 10 255 0 0 0 0 0",
   *       "GRIB_REF_TIME": "1592611200 sec UTC",
   *       "GRIB_SHORT_NAME": "10-HTGL",
   *       "GRIB_UNIT": "[m/s]",
   *       "GRIB_VALID_TIME": "1592611200 sec UTC"
   *     },
   *     "data": []
   * }
   * @param {Array[]} data
   * @return {Field | null}
   *
   * @private
   */
  formatData(data) {
    let uComp;
    let vComp;
    data.forEach(function (record) {
      switch (
        `${record.header.parameterCategory},${record.header.parameterNumber}`
      ) {
        case "1,2":
        case "2,2":
          uComp = record;
          break;
        case "1,3":
        case "2,3":
          vComp = record;
          break;
      }
    });
    if (!vComp || !uComp) {
      return null;
    }
    const header = uComp.header;
    return new Field({
      xmin: header.lo1,
      ymin: header.la1,
      xmax: header.lo2,
      ymax: header.la2,
      deltaX: header.dx,
      deltaY: header.dy,
      cols: header.nx,
      rows: header.ny,
      us: uComp.data,
      vs: vComp.data,
    });
  }

  /**
   * 设置数据
   * @param {Array[]} data
   * @private
   */
  setData(data) {
    this.field = this.formatData(data);
    if (this.field === null) {
      console.error("数据格式不正确");
    }
  }

  getData() {
    return this.field;
  }

  getOptions() {
    return this.options;
  }

  /**
   * 动态设置参数
   * @param {WindLayer.ConstructorOptions} options 参数
   */
  setOptions(options) {
    this.options = {
      ...this.options,
      ...options,
    };
    if (this.wind) {
      this.wind.setOptions(this.options);
      this.wind.prerender();
      this.wind.render();
    }
  }

  getContext() {
    return this.canvas.getContext("2d");
  }

  appendCanvas() {
    this.adjustSize();
    const cesiumWidget = this.viewer.canvas.parentNode;
    cesiumWidget.appendChild(this.canvas);
  }

  adjustSize() {
    const viewer = this.viewer;
    const canvas = this.canvas;
    const { width, height } = viewer.canvas;
    const devicePixelRatio = 1;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  render() {
    const opt = this.getOptions();
    if (this.canvas && !this.wind) {
      const data = this.getData();
      const ctx = this.getContext();
      this.wind = new WindCanvas(ctx, opt, data);
      this.wind.project = this.project.bind(this);
      this.wind.unproject = this.unproject.bind(this);
      this.wind.intersectsCoordinate = this.intersectsCoordinate.bind(this);
    }
    if (this.wind) {
      this.wind.prerender();
      this.wind.render();
    }
  }

  project(coordinate) {
    const position = Cartesian3.fromDegrees(coordinate[0], coordinate[1]);
    const scene = this.viewer.scene;
    const sceneCoor = SceneTransforms.worldToWindowCoordinates(scene, position);
    return [sceneCoor.x, sceneCoor.y];
  }

  unproject(pixel) {
    const viewer = this.viewer;
    const pick = new Cartesian2(pixel[0], pixel[1]);
    const cartesian = viewer.scene.globe.pick(
      viewer.camera.getPickRay(pick),
      viewer.scene,
    );

    if (!cartesian) {
      return null;
    }

    const ellipsoid = viewer.scene.globe.ellipsoid;
    const cartographic = ellipsoid.cartesianToCartographic(cartesian);
    const lat = CesiumMath.toDegrees(cartographic.latitude);
    const lng = CesiumMath.toDegrees(cartographic.longitude);
    return [lng, lat];
  }

  intersectsCoordinate(coordinate) {
    const ellipsoid = Ellipsoid.WGS84;
    const camera = this.viewer.camera;
    const occluder = new EllipsoidalOccluder(ellipsoid, camera.position);
    const point = Cartesian3.fromDegrees(coordinate[0], coordinate[1]);
    return occluder.isPointVisible(point);
  }
}

export default WindLayer;
