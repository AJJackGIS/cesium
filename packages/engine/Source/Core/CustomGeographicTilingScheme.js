import Cartesian2 from "./Cartesian2.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import Rectangle from "./Rectangle.js";
import CesiumMath from "./Math.js";

/**
 * 自定义 GeographicTilingScheme
 * <p>根据瓦片的比例尺(degrees/px)和切图原点重新计算瓦片行列号,最终会采用 EPSG:4326 的瓦片计算规则平铺瓦片(可能会存在偏移)</p>
 *
 * @constructor
 * @param {object} options Object with the following properties:
 * @param {number[]} options.origin 切图原点，默认为[-20037508.3427892, 20037508.3427892]
 * @param {number} options.zoomOffset 瓦片的0级对应Cesium的瓦片层级，值为：0-Cesium 层级，若瓦片的0级对应Cesium的10级，则值为 0 - 10 = -10，同时在瓦片请求时{z}的数值替换时也需加上这个层级偏移值
 * @param {number} options.tileSize 瓦片的大小，默认为256，即一张瓦片的大小为 256 * 256
 * @param {number[]} options.resolutions 瓦片每一层级分辨率
 * @param {Ellipsoid} options.ellipsoid 平铺的椭球体,默认为 WGS84 椭球
 * @param {Rectangle} options.rectangle 平铺方案覆盖的矩形（以弧度表示）
 *
 * @example
 * const tilingScheme = new Cesium.CustomGeographicTilingScheme({
 *   origin: [-180, 90],
 *   resolutions: [0.703125, 0.3515625, 0.17578125, 0.087890625],
 * });
 */
class CustomGeographicTilingScheme extends GeographicTilingScheme {
  constructor(options = {}) {
    super(options);
    this._origin = options.origin || [-180, 90];
    this._zoomOffset = options.zoomOffset || 0;
    this._tileSize = options.tileSize || 256;
    this._resolutions = options.resolutions || [];
  }

  tileXYToRectangle(x, y, level, result) {
    if (!this._resolutions || !this._resolutions[level + this._zoomOffset]) {
      return Rectangle.MAX_VALUE;
    }

    const tileRes =
      this._resolutions[level + this._zoomOffset] * this._tileSize;
    const west = CesiumMath.toRadians(this._origin[0] + x * tileRes);
    const south = CesiumMath.toRadians(this._origin[1] - (y + 1) * tileRes);
    const east = CesiumMath.toRadians(this._origin[0] + (x + 1) * tileRes);
    const north = CesiumMath.toRadians(this._origin[1] - y * tileRes);
    if (!result) {
      return new Rectangle(west, south, east, north);
    }
    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  }

  positionToTileXY(position, level, result) {
    if (!this._resolutions || !this._resolutions[level + this._zoomOffset]) {
      return new Cartesian2();
    }
    const tileRes =
      this._resolutions[level + this._zoomOffset] * this._tileSize;
    const longitude = CesiumMath.toDegrees(position.longitude);
    const latitude = CesiumMath.toDegrees(position.latitude);
    // Calculate the tile row and column numbers in the current coordinate system
    const xTileCoordinate = Math.floor((longitude - this._origin[0]) / tileRes);
    const yTileCoordinate = Math.floor((this._origin[1] - latitude) / tileRes);
    if (!result) {
      return new Cartesian2(
        Math.max(0, xTileCoordinate),
        Math.max(0, yTileCoordinate),
      );
    }
    result.x = xTileCoordinate;
    result.y = yTileCoordinate;
    return result;
  }
}

export default CustomGeographicTilingScheme;
