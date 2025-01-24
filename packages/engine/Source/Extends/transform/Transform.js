import Cartesian3 from "../../Core/Cartesian3.js";
import Cartographic from "../../Core/Cartographic.js";
import Ellipsoid from "../../Core/Ellipsoid.js";
import CesiumMath from "../../Core/Math.js";
import SceneMode from "../../Scene/SceneMode.js";
import SceneTransforms from "../../Scene/SceneTransforms.js";
import WebMercatorProjection from "../../Core/WebMercatorProjection.js";

import Position from "../position/Position.js";

const WMP = new WebMercatorProjection();

/**
 * Cartesian、Cartographic、Position、Window坐标转换
 */
class Transform {
  /**
   * Transforms Cartesian To WGS84
   * @param cartesian {Cartesian3}
   * @returns {Position}
   */
  static transformCartesianToWGS84(cartesian) {
    if (cartesian) {
      const cartographic = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
      return new Position(
        CesiumMath.toDegrees(cartographic.longitude || 0),
        CesiumMath.toDegrees(cartographic.latitude || 0),
        cartographic.height || 0,
      );
    }
    return new Position();
  }

  /**
   * Transforms Cartographic To WGS84
   * @param cartographic {Cartographic}
   * @returns {Position}
   */
  static transformCartographicToWGS84(cartographic) {
    if (cartographic) {
      return new Position(
        CesiumMath.toDegrees(cartographic.longitude || 0),
        CesiumMath.toDegrees(cartographic.latitude || 0),
        cartographic.height || 0,
      );
    }
    return new Position();
  }

  /**
   * Transforms WGS84 To Cartesian
   * @param position {Position}
   * @returns {Cartesian3}
   */
  static transformWGS84ToCartesian(position) {
    return position
      ? Cartesian3.fromDegrees(
          position.lng,
          position.lat,
          position.alt,
          Ellipsoid.WGS84,
        )
      : Cartesian3.ZERO;
  }

  /**
   * Transforms WGS84 To Cartographic
   * @param position {Position}
   * @returns {Cartographic}
   */
  static transformWGS84ToCartographic(position) {
    return position
      ? Cartographic.fromDegrees(position.lng, position.lat, position.alt)
      : Cartographic.ZERO;
  }

  /**
   * Transforms Cartesian Array To WGS84 Array
   * @param cartesianArr {Cartesian3[]}
   * @returns {Position[]}
   */
  static transformCartesianArrayToWGS84Array(cartesianArr) {
    return cartesianArr
      ? cartesianArr.map((item) => this.transformCartesianToWGS84(item))
      : [];
  }

  /**
   * Transforms WGS84 Array To Cartesian Array
   * @param WGS84Arr {Position[]}
   * @returns {Cartesian3[]}
   */
  static transformWGS84ArrayToCartesianArray(WGS84Arr) {
    return WGS84Arr
      ? WGS84Arr.map((item) => this.transformWGS84ToCartesian(item))
      : [];
  }

  /**
   * Transforms WGS84 To Mercator
   * @param position {Position}
   * @returns {Position}
   */
  static transformWGS84ToMercator(position) {
    const mp = WMP.project(
      Cartographic.fromDegrees(position.lng, position.lat, position.alt),
    );
    return new Position(mp.x, mp.y, mp.z);
  }

  /**
   * Transforms Mercator To WGS84
   * @param position {Position}
   * @returns {Position}
   */
  static transformMercatorToWGS84(position) {
    const mp = WMP.unproject(
      new Cartesian3(position.lng, position.lat, position.alt),
    );
    return new Position(
      CesiumMath.toDegrees(mp.longitude),
      CesiumMath.toDegrees(mp.latitude),
      mp.height,
    );
  }

  /**
   * Transforms Window To WGS84
   * @param position {Cartesian2}
   * @param viewer {Viewer}
   * @returns {Position}
   */
  static transformWindowToWGS84(position, viewer) {
    const scene = viewer.scene;
    let cartesian;
    if (scene.mode === SceneMode.SCENE3D) {
      const ray = scene.camera.getPickRay(position);
      cartesian = scene.globe.pick(ray, scene);
    } else {
      cartesian = scene.camera.pickEllipsoid(position, Ellipsoid.WGS84);
    }
    return this.transformCartesianToWGS84(cartesian);
  }

  /**
   * Transforms WGS84 To Window
   * @param position {Position}
   * @param viewer {Viewer}
   * @returns {Cartesian2}
   */
  static transformWGS84ToWindow(position, viewer) {
    return SceneTransforms.worldToWindowCoordinates(
      viewer.scene,
      this.transformWGS84ToCartesian(position),
    );
  }
}

export default Transform;
