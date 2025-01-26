import Cartesian2 from "./Cartesian2.js";
import defined from "./defined.js";
import Rectangle from "./Rectangle.js";
import WebMercatorTilingScheme from "./WebMercatorTilingScheme.js";
import BaiduProjectionUtils from "../Utils/BaiduProjectionUtils.js";
import CoordTransformUtils from "../Utils/CoordTransformUtils.js";
import CesiumMath from "./Math.js";
import Cartographic from "./Cartographic.js";

/**
 * 百度WebMercatorTilingScheme
 */
class BaiduWebMercatorTilingScheme extends WebMercatorTilingScheme {
  constructor(options) {
    super(options);
    const projection = new BaiduProjectionUtils();
    this._projection.project = function (cartographic, result) {
      result = CoordTransformUtils.WGS84ToGCJ02(
        CesiumMath.toDegrees(cartographic.longitude),
        CesiumMath.toDegrees(cartographic.latitude),
      );
      result = CoordTransformUtils.GCJ02ToBD09(result[0], result[1]);
      result[0] = Math.min(result[0], 180);
      result[0] = Math.max(result[0], -180);
      result[1] = Math.min(result[1], 74.000022);
      result[1] = Math.max(result[1], -71.988531);
      result = projection.lngLatToPoint({
        lng: result[0],
        lat: result[1],
      });
      return new Cartesian2(result.x, result.y);
    };
    this._projection.unproject = function (cartesian, result) {
      result = projection.mercatorToLngLat({
        lng: cartesian.x,
        lat: cartesian.y,
      });
      result = CoordTransformUtils.BD09ToGCJ02(result.lng, result.lat);
      result = CoordTransformUtils.GCJ02ToWGS84(result[0], result[1]);
      return new Cartographic(
        CesiumMath.toRadians(result[0]),
        CesiumMath.toRadians(result[1]),
      );
    };
    this.resolutions = options.resolutions || [];
  }

  tileXYToNativeRectangle(x, y, level, result) {
    const tileWidth = this.resolutions[level];
    const west = x * tileWidth;
    const east = (x + 1) * tileWidth;
    const north = ((y = -y) + 1) * tileWidth;
    const south = y * tileWidth;

    if (!defined(result)) {
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
    const projection = this._projection;
    const webMercatorPosition = projection.project(position);
    if (!defined(webMercatorPosition)) {
      return undefined;
    }
    const tileWidth = this.resolutions[level];
    const xTileCoordinate = Math.floor(webMercatorPosition.x / tileWidth);
    const yTileCoordinate = -Math.floor(webMercatorPosition.y / tileWidth);
    if (!defined(result)) {
      return new Cartesian2(xTileCoordinate, yTileCoordinate);
    }
    result.x = xTileCoordinate;
    result.y = yTileCoordinate;
    return result;
  }
}

export default BaiduWebMercatorTilingScheme;
