import GCJ02TilingScheme from "../Core/GCJ02TilingScheme.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";

const TILE_URL = {
  img: "//webst{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
  cia: "//webst{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}",
  vec: "//webrd{s}.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}&size=1&scale=1",
  traffic:
    "//tm.amap.com/trafficengine/mapabc/traffictile?x={x}&y={y}&z={z}&t={time}",
};

/**
 * 高德地图 ImageryProvider
 * @param {object} [options]
 * @param {string} [options.url] 瓦片链接
 * @param {string} [options.protocol] 协议 http: | https:
 * @param {string} [options.crs='gcj02'] scheme 默认：gcj02 纠偏：wgs84
 * @param {string} [options.style='img'] 地图类型 vec:电子地图 img:影像地图 cia:电子注记 traffic:交通
 * @param {number} [options.time] style 为 traffic 时生效
 */
class AMapImageryProvider extends UrlTemplateImageryProvider {
  constructor(options = {}) {
    options["url"] =
      options.url ||
      [options.protocol || "", TILE_URL[options.style] || TILE_URL["img"]]
        .join("")
        .replace("{time}", String(options.time || new Date().getTime()));
    options["subdomains"] = ["01", "02", "03", "04"];
    if (options.crs === "wgs84") {
      options["tilingScheme"] = new GCJ02TilingScheme();
    }
    super(options);
  }
}

export default AMapImageryProvider;
