import CoordTransformUtils from "../Utils/CoordTransformUtils.js";
import WebMercatorTilingScheme from "./WebMercatorTilingScheme.js";
import WebMercatorProjection from "./WebMercatorProjection.js";
import CesiumMath from "./Math.js";
import Cartographic from "./Cartographic.js";
import Cartesian2 from "./Cartesian2.js";

/**
 * GCJ02火星坐标系WebMercatorTilingScheme
 */
class GCJ02TilingScheme extends WebMercatorTilingScheme {
  constructor(options) {
    super(options);
    const projection = new WebMercatorProjection();
    this._projection.project = function (cartographic, result) {
      result = CoordTransformUtils.WGS84ToGCJ02(
        CesiumMath.toDegrees(cartographic.longitude),
        CesiumMath.toDegrees(cartographic.latitude),
      );
      result = projection.project(
        new Cartographic(
          CesiumMath.toRadians(result[0]),
          CesiumMath.toRadians(result[1]),
        ),
      );
      return new Cartesian2(result.x, result.y);
    };
    this._projection.unproject = function (cartesian, result) {
      const cartographic = projection.unproject(cartesian);
      result = CoordTransformUtils.GCJ02ToWGS84(
        CesiumMath.toDegrees(cartographic.longitude),
        CesiumMath.toDegrees(cartographic.latitude),
      );
      return new Cartographic(
        CesiumMath.toRadians(result[0]),
        CesiumMath.toRadians(result[1]),
      );
    };
  }
}

export default GCJ02TilingScheme;
