import Cartesian2 from "./Cartesian2.js";
import Ellipsoid from "./Ellipsoid.js";
import Frozen from "./Frozen.js";
import GeographicProjection from "./GeographicProjection.js";
import CesiumMath from "./Math.js";
import Rectangle from "./Rectangle.js";

/**
 * CGCS2000 专用的 GeographicTilingScheme
 * @param options
 * @constructor
 */
function CGCS2000GeographicTilingScheme(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  this._tileInfo = options.tileInfo;
  this._ellipsoid = Ellipsoid.CGCS2000;
  this._rectangle = Rectangle.MAX_VALUE;
  this._projection = new GeographicProjection(this._ellipsoid);
  // 这个没用
  this._numberOfLevelZeroTilesX = options.numberOfLevelZeroTilesX ?? 4;
  // 按照 WMTS里面第一级的MatrixHeight来设置，但是好像也没用
  this._numberOfLevelZeroTilesY = options.numberOfLevelZeroTilesY ?? 2;
}

Object.defineProperties(CGCS2000GeographicTilingScheme.prototype, {
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },

  rectangle: {
    get: function () {
      return this._rectangle;
    },
  },

  projection: {
    get: function () {
      return this._projection;
    },
  },
});

CGCS2000GeographicTilingScheme.prototype.getNumberOfXTilesAtLevel = function (
  level,
) {
  // 默认：console.log(this._numberOfLevelZeroTilesX * Math.pow(2, level));
  // 根据配置中自定义分辨率计算得到level级别下共有多少张瓦片
  const currentMatrix = this._tileInfo.lods.find(
    (item) => item.level === level,
  );
  const currentResolution = currentMatrix.resolution; // 当前级别下的分辨率
  // 360 / (256 * resolution)
  return Math.round(360 / (this._tileInfo.rows * currentResolution));
};

CGCS2000GeographicTilingScheme.prototype.getNumberOfYTilesAtLevel = function (
  level,
) {
  // 这里并没有被调用
  return this._numberOfLevelZeroTilesY << level;
  // return this._numberOfLevelZeroTilesY * Math.pow(2, level);
};

CGCS2000GeographicTilingScheme.prototype.tileXYToRectangle = function (
  x,
  y,
  level,
  result,
) {
  // 当前级别的分辨率
  const currentMatrix = this._tileInfo.lods.find(
    (item) => item.level === level,
  );
  const currentResolution = currentMatrix.resolution;

  // 原点 - 瓦片的坐标 = 实际坐标
  let north =
    this._tileInfo.origin.y - y * (this._tileInfo.cols * currentResolution);
  let west =
    this._tileInfo.origin.x + x * (this._tileInfo.rows * currentResolution);
  let south =
    this._tileInfo.origin.y -
    (y + 1) * (this._tileInfo.cols * currentResolution);
  let east =
    this._tileInfo.origin.x +
    (x + 1) * (this._tileInfo.rows * currentResolution);

  west = CesiumMath.toRadians(west);
  north = CesiumMath.toRadians(north);
  east = CesiumMath.toRadians(east);
  south = CesiumMath.toRadians(south);
  return new Rectangle(west, south, east, north);
};

CGCS2000GeographicTilingScheme.prototype.positionToTileXY = function (
  position,
  level,
  result,
) {
  // 只处理区域内的瓦片
  if (!Rectangle.contains(this._rectangle, position)) {
    return undefined;
  }

  // 当前级别的分辨率
  const currentMatrix = this._tileInfo.lods.find(
    (item) => item.level === level,
  );
  const currentResolution = currentMatrix.resolution;

  const degLon = CesiumMath.toDegrees(position.longitude);
  const degLat = CesiumMath.toDegrees(position.latitude);

  // 经纬度转瓦片号
  const x_4490 = Math.floor(
    (degLon - this._tileInfo.origin.x) /
      (this._tileInfo.rows * currentResolution),
  );
  const y_4490 = Math.floor(
    (this._tileInfo.origin.y - degLat) /
      (this._tileInfo.cols * currentResolution),
  );

  return new Cartesian2(x_4490, y_4490);
};

export default CGCS2000GeographicTilingScheme;
