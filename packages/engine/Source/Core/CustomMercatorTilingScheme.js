import Cartesian2 from "./Cartesian2.js";
import Rectangle, { MAX_VALUE } from "./Rectangle.js";
import WebMercatorTilingScheme from "./WebMercatorTilingScheme.js";

/**
 * 自定义 MercatorTilingScheme
 * <p>根据瓦片的比例尺(meters/px)和切图原点重新计算瓦片行列号,最终会采用 EPSG:3857 的瓦片计算规则平铺瓦片(可能会存在偏移)</p>
 *
 * @constructor
 * @param {object} options Object with the following properties:
 * @param {number[]} options.origin 切图原点，默认为[-20037508.3427892, 20037508.3427892]
 * @param {number} options.zoomOffset 瓦片的0级对应Cesium的瓦片层级，值为：0-Cesium 层级，若瓦片的0级对应Cesium的10级，则值为 0 - 10 = -10，同时在瓦片请求时{z}的数值替换时也需加上这个层级偏移值
 * @param {number} options.tileSize 瓦片的大小，默认为256，即一张瓦片的大小为 256 * 256
 * @param {number[]} options.resolutions 瓦片每一层级分辨率
 * @param {Ellipsoid} options.ellipsoid 平铺的椭球体,默认为 WGS84 椭球
 * @param {number} options.numberOfLevelZeroTilesX X方向瓦片个数
 * @param {number} options.numberOfLevelZeroTilesY Y方向瓦片个数
 * @param {Cartesian2} options.rectangleSouthwestInMeters 切片方案覆盖的矩形的西南角，以米为单位。如果不指定该参数或矩形NortheastInMeters，则在经度方向上覆盖整个地球，在纬度方向上覆盖等距离，形成正方形投影
 * @param {Cartesian2} options.rectangleNortheastInMeters 切片方案覆盖的矩形的东北角（以米为单位）。如果未指定此参数或矩形SouthwestInMeters，则在经度方向上覆盖整个地球，并在纬度方向上覆盖相等的距离，从而形成方形投影
 *
 * @example
 * const tilingScheme = new Cesium.CustomMercatorTilingScheme({
 *   origin: [-20037508.3427892, 20037508.3427892],
 *   resolutions: [
 *     156543.033928, 78271.516964, 39135.758482, 19567.879241, 9783.939621,
 *   ],
 * });
 */
class CustomMercatorTilingScheme extends WebMercatorTilingScheme {
  constructor(options = {}) {
    super(options);
    this._origin = options.origin ?? [-20037508.3427892, 20037508.3427892];
    this._zoomOffset = options.zoomOffset ?? 0;
    this._tileSize = options.tileSize ?? 256;
    this._resolutions = options.resolutions ?? [];
  }

  tileXYToNativeRectangle(x, y, level, result) {
    if (!this._resolutions || !this._resolutions[level + this._zoomOffset]) {
      return MAX_VALUE;
    }
    if (x < 0 || y < 0) {
      return Rectangle.MAX_VALUE;
    }
    const tileRes =
      this._resolutions[level + this._zoomOffset] * this._tileSize;
    const west = this._origin[0] + x * tileRes;
    const south = this._origin[1] - (y + 1) * tileRes;
    const east = this._origin[0] + (x + 1) * tileRes;
    const north = this._origin[1] - y * tileRes;

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
    const rectangle = this._rectangle;
    if (!Rectangle.contains(rectangle, position)) {
      return undefined;
    }
    if (!this._resolutions || !this._resolutions[level + this._zoomOffset]) {
      return new Cartesian2();
    }
    const tileRes =
      this._resolutions[level + this._zoomOffset] * this._tileSize;
    const projection = this._projection;
    const webMercatorPosition = projection.project(position);

    // Calculate the tile row and column numbers in the current coordinate system
    const xTileCoordinate = Math.floor(
      (webMercatorPosition.x - this._origin[0]) / tileRes,
    );

    const yTileCoordinate = Math.floor(
      (this._origin[1] - webMercatorPosition.y) / tileRes,
    );
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

export default CustomMercatorTilingScheme;
