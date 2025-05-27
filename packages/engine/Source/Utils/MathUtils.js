import BoundingSphere from "../Core/BoundingSphere.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import CoplanarPolygonGeometry from "../Core/CoplanarPolygonGeometry.js";
import EllipsoidGeodesic from "../Core/EllipsoidGeodesic.js";
import Frozen from "../Core/Frozen.js";
import CesiumMath from "../Core/Math.js";
import Matrix4 from "../Core/Matrix4.js";
import Rectangle from "../Core/Rectangle.js";
import Transforms from "../Core/Transforms.js";
import VertexFormat from "../Core/VertexFormat.js";
import TransformUtils from "./TransformUtils.js";

/**
 * 拓展CesiumMath工具类
 */
class MathUtils {
  /**
   * 判断数字是否在某个区间
   * @param value 值
   * @param min 最小值
   * @param max 最大值
   * @returns {boolean}
   */
  static isBetween(value, min, max) {
    value = parseFloat(value) || 0.0;
    return value >= parseFloat(min) && value <= parseFloat(max);
  }

  /**
   * 计算三角面的面积
   * @param { Cartesian3 } p0
   * @param { Cartesian3 } p1
   * @param { Cartesian3 } p2
   * @returns {number}
   * @private
   */
  static triangleArea(p0, p1, p2) {
    const v0 = Cartesian3.subtract(p0, p1, new Cartesian3());
    const v1 = Cartesian3.subtract(p2, p1, new Cartesian3());
    const cross = Cartesian3.cross(v0, v1, v0);
    return Cartesian3.magnitude(cross) * 0.5;
  }

  /**
   * 计算多边形面积
   * @param {Cartesian3[]} positions
   * @returns {number}
   */
  static area(positions) {
    let result = 0;
    // 根据任意点构面
    const geometry = CoplanarPolygonGeometry.createGeometry(
      CoplanarPolygonGeometry.fromPositions({
        positions: positions,
        vertexFormat: VertexFormat.POSITION_ONLY,
      }),
    );
    if (!geometry) {
      return result;
    }
    // 获取所有的点
    const flatPositions = geometry.attributes.position.values;
    // 获取所有的构面点索引
    const indices = geometry.indices;
    for (let i = 0; i < indices.length; i += 3) {
      const p0 = Cartesian3.unpack(
        flatPositions,
        indices[i] * 3,
        new Cartesian3(),
      );
      const p1 = Cartesian3.unpack(
        flatPositions,
        indices[i + 1] * 3,
        new Cartesian3(),
      );
      const p2 = Cartesian3.unpack(
        flatPositions,
        indices[i + 2] * 3,
        new Cartesian3(),
      );
      result += this.triangleArea(p0, p1, p2);
    }
    return result;
  }

  /**
   * 计算最大外包矩形
   * @param {Cartesian3[]} positions
   * @param {number} expand 缩放比例
   * @returns {Rectangle}
   */
  static bounds(positions, expand) {
    const array = TransformUtils.transformCartesianArrayToWGS84Array(positions);
    let minLng = 180;
    let minLat = 90;
    let maxLng = -180;
    let maxLat = -90;
    array.forEach((item) => {
      minLng = Math.min(minLng, item.lng);
      minLat = Math.min(minLat, item.lat);
      maxLng = Math.max(maxLng, item.lng);
      maxLat = Math.max(maxLat, item.lat);
    });

    if (expand > 0) {
      const diffLng = Math.abs(maxLng - maxLng);
      const diffLat = Math.abs(maxLat - minLat);
      minLng -= diffLng * expand;
      minLat -= diffLat * expand;
      maxLng += diffLng * expand;
      maxLat += diffLat * expand;
    }
    return new Rectangle(
      CesiumMath.toRadians(minLng),
      CesiumMath.toRadians(minLat),
      CesiumMath.toRadians(maxLng),
      CesiumMath.toRadians(maxLat),
    );
  }

  /**
   * 计算中心点
   * @param {Cartesian3[]} positions
   * @returns {Cartesian3}
   */
  static center(positions) {
    const boundingSphere = BoundingSphere.fromPoints(positions);
    return boundingSphere.center;
  }

  /**
   * 根据弧线的坐标节点数组
   * @param points
   * @param options
   * @returns {number[]}
   */
  static curve(points, options) {
    options = options ?? Frozen.EMPTY_OBJECT;
    let curvePoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p = this.getCurveByTwoPoints(
        points[i],
        points[i + 1],
        options.count,
      );
      if (p && p.length > 0) {
        curvePoints = curvePoints.concat(p);
      }
    }
    return curvePoints;
  }

  /**
   * 获取线段的空间长度
   * @param {Cartesian3[]} positions
   * @returns {number}
   */
  static distance(positions) {
    let distance = 0;
    for (let i = 0; i < positions.length - 1; i++) {
      const c1 = TransformUtils.transformCartesianToCartographic(positions[i]);
      const c2 = TransformUtils.transformCartesianToCartographic(
        positions[i + 1],
      );
      const geodesic = new EllipsoidGeodesic();
      geodesic.setEndPoints(c1, c2);
      let s = geodesic.surfaceDistance;
      s = Math.sqrt(Math.pow(s, 2) + Math.pow(c2.height - c1.height, 2));
      distance += s;
    }

    return +distance.toFixed(3);
  }

  /**
   * 计算两点的方位角
   * @param {Cartesian3} start
   * @param {Cartesian3} end
   * @returns {number}
   */
  static heading(start, end) {
    const ff = Transforms.eastNorthUpToFixedFrame(start);
    const v = Cartesian3.subtract(end, start, new Cartesian3());
    const vector = Matrix4.multiplyByPointAsVector(
      Matrix4.inverse(ff, new Matrix4()),
      v,
      new Cartesian3(),
    );
    let heading = Math.atan2(vector.y, vector.x) - CesiumMath.PI_OVER_TWO;
    heading = CesiumMath.TWO_PI - CesiumMath.zeroToTwoPi(heading);
    return isNaN(heading) ? 0 : heading;
  }

  /**
   * 计算中间点坐标
   * @param {Cartesian3} start
   * @param {Cartesian3} end
   * @param {number} fraction 小数
   * @returns {Cartesian3}
   */
  static midPosition(start, end, fraction) {
    const startPosition =
      TransformUtils.transformCartesianToCartographic(start);
    const endPosition = TransformUtils.transformCartesianToCartographic(end);
    const mc = new EllipsoidGeodesic(
      startPosition,
      endPosition,
    ).interpolateUsingFraction(fraction);
    return Cartographic.toCartesian(mc);
  }

  /**
   * 计算抛物线
   * <p>方程 y=-(4h/L^2)*x^2+h h:顶点高度 L：横纵间距较大者</p>
   * @param {Position} startPosition
   * @param {Position} endPosition
   * @param {number} height
   * @param {number} count
   * @returns {Position[]}
   */
  static parabola(startPosition, endPosition, height = 0, count = 50) {
    const result = [];
    height = Math.max(+height, 100);
    count = Math.max(+count, 50);
    const diffLng = Math.abs(startPosition.lng - endPosition.lng);
    const diffLat = Math.abs(startPosition.lat - endPosition.lat);
    const L = Math.max(diffLng, diffLat);
    let dlt = L / count;
    if (diffLng > diffLat) {
      //base on lng
      const delLat = (endPosition.lat - startPosition.lat) / count;
      if (startPosition.lng - endPosition.lng > 0) {
        dlt = -dlt;
      }
      for (let i = 0; i < count; i++) {
        const h =
          height -
          (Math.pow(-0.5 * L + Math.abs(dlt) * i, 2) * 4 * height) /
            Math.pow(L, 2);
        const lng = startPosition.lng + dlt * i;
        const lat = startPosition.lat + delLat * i;
        result.push([lng, lat, h]);
      }
    } else {
      //base on lat
      const delLng = (endPosition.lng - startPosition.lng) / count;
      if (startPosition.lat - endPosition.lat > 0) {
        dlt = -dlt;
      }
      for (let i = 0; i < count; i++) {
        const h =
          height -
          (Math.pow(-0.5 * L + Math.abs(dlt) * i, 2) * 4 * height) /
            Math.pow(L, 2);
        const lng = startPosition.lng + delLng * i;
        const lat = startPosition.lat + dlt * i;
        result.push([lng, lat, h]);
      }
    }
    result.push([endPosition.lng, endPosition.lat, endPosition.alt || 0]);
    return result;
  }

  /**
   * 根据两点获取曲线坐标点数组
   * @param {Position} obj1
   * @param {Position} obj2
   * @param {number} count
   * @returns {number[]}
   * @private
   */
  static getCurveByTwoPoints(obj1, obj2, count) {
    const curveCoordinates = [];
    count = count ?? 40; // 曲线是由一些小的线段组成的，这个表示这个曲线所有到的折线的个数
    const fun_1 = function (x) {
      return 1 - 2 * x + x * x;
    };
    const fun_2 = (x) => {
      return 2 * x - 2 * x * x;
    };
    const fun_3 = (x) => {
      return x * x;
    };

    let t,
      h,
      inc = 0;
    const lat1 = parseFloat(obj1.lat);
    const lat2 = parseFloat(obj2.lat);
    let lng1 = parseFloat(obj1.lng);
    let lng2 = parseFloat(obj2.lng);

    // 计算曲线角度的方法
    if (lng2 > lng1) {
      if (lng2 - lng1 > 180) {
        if (lng1 < 0) {
          lng1 = 180 + 180 + lng1;
          lng2 = 180 + 180 + lng2;
        }
      }
    }
    // 此时纠正了 lng1 lng2
    // 纬度相同
    if (lat2 === lat1) {
      t = 0;
      h = lng1 - lng2;
      // 经度相同
    } else if (lng2 === lng1) {
      t = Math.PI / 2;
      h = lat1 - lat2;
    } else {
      t = Math.atan((lat2 - lat1) / (lng2 - lng1));
      h = (lat2 - lat1) / Math.sin(t);
    }
    const t2 = t + Math.PI / 5;
    const h2 = h / 2;
    const lng3 = h2 * Math.cos(t2) + lng1;
    const lat3 = h2 * Math.sin(t2) + lat1;

    for (let i = 0; i < count + 1; i++) {
      const x = lng1 * fun_1(inc) + lng3 * fun_2(inc) + lng2 * fun_3(inc);
      const y = lat1 * fun_1(inc) + lat3 * fun_2(inc) + lat2 * fun_3(inc);
      const lng1_src = obj1.lng;
      const lng2_src = obj2.lng;
      curveCoordinates.push([lng1_src < 0 && lng2_src > 0 ? x - 360 : x, y]);
      inc = inc + 1 / count;
    }
    return curveCoordinates;
  }
}

export default MathUtils;
