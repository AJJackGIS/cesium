import BD09TilingScheme from "../tiling-scheme/BD09TilingScheme.js";
import UrlTemplateImageryProvider from "../../../Scene/UrlTemplateImageryProvider.js";
import Cartesian2 from "../../../Core/Cartesian2.js";
import WebMercatorTilingScheme from "../../../Core/WebMercatorTilingScheme.js";
import ImageryProvider from "../../../Scene/ImageryProvider.js";
import CesiumMath from "../../../Core/Math.js";

const TILE_URL = {
  img: "//maponline{s}.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46", // 影像
  cia: "//maponline{s}.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=sl", // 影像标注
  vec: "//maponline{s}.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=pl", // 电子
  custom:
    "//api{s}.map.bdimg.com/customimage/tile?&x={x}&y={y}&z={z}&scale=1&customid={id}", // 个性图
  traffic:
    "//its.map.baidu.com:8002/traffic/TrafficTileService?time={time}&level={z}&x={x}&y={y}&scaler=2",
};

/**
 * 百度地图ImageryProvider
 * @param {string} options.url 自定义链接
 * @param {string} options.crs WGS84
 * @param {string} options.style 地图类型 img:影像地图  vec:电子地图 cia:电子注记 custom:自定义 traffic:交通
 * @param {string} options.id 自定义类型的customid
 * @param {string} options.crs WGS84
 */
class BaiduImageryProvider extends UrlTemplateImageryProvider {
  constructor(options = {}) {
    options["url"] =
      options.url ||
      [
        options.protocol || "",
        TILE_URL[options.style] || TILE_URL["custom"],
      ].join("");

    if (options.crs === "WGS84") {
      const resolutions = [];
      for (let i = 0; i < 19; i++) {
        resolutions[i] = 256 * Math.pow(2, 18 - i);
      }
      options["tilingScheme"] = new BD09TilingScheme({
        resolutions,
        rectangleSouthwestInMeters: new Cartesian2(-20037726.37, -12474104.17),
        rectangleNortheastInMeters: new Cartesian2(20037726.37, 12474104.17),
      });
    } else {
      options["tilingScheme"] = new WebMercatorTilingScheme({
        rectangleSouthwestInMeters: new Cartesian2(-33554054, -33746824),
        rectangleNortheastInMeters: new Cartesian2(33554054, 33746824),
      });
    }
    options["maximumLevel"] = 18;
    super(options);
    this._rectangle = this._tilingScheme.rectangle;
    this._url = options.url;
    this._crs = options.crs || "";
    this._id = options.id || "normal";
    this._time = options.time || new Date().getTime();
    this._subdomains = options.subdomains || ["0", "1", "2", "3"];
  }

  requestImage(x, y, level) {
    const xTiles = this._tilingScheme.getNumberOfXTilesAtLevel(level);
    const yTiles = this._tilingScheme.getNumberOfYTilesAtLevel(level);
    let url = this._url
      .replace("{z}", level)
      .replace(
        "{s}",
        this._subdomains[Math.floor(CesiumMath.randomBetween(0, 4))],
      )
      .replace("{time}", this._time)
      .replace("{id}", this._id);
    if (this._crs === "WGS84") {
      url = url.replace("{x}", String(x)).replace("{y}", String(-y));
    } else {
      url = url
        .replace("{x}", String(x - xTiles / 2))
        .replace("{y}", String(yTiles / 2 - y - 1));
    }
    return ImageryProvider.loadImage(this, url);
  }
}

export default BaiduImageryProvider;
