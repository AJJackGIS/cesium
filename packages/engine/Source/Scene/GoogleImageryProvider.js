import GCJ02TilingScheme from "../Core/GCJ02TilingScheme.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";

// 船讯网 提供服务
const TILE_URL = {
  img: "//gwxc.shipxy.com/tile.g?z={z}&x={x}&y={y}",
  vec: "//gdtc.shipxy.com/tile.g?z={z}&x={x}&y={y}",
  ship: "//m12.shipxy.com/tile.c?l=Na&m=o&x={x}&y={y}&z={z}",
};

/**
 * 谷歌地图 ImageryProvider
 * @param {object} [options]
 * @param {string} [options.url] 瓦片链接
 * @param {string} [options.protocol] 协议 http: | https:
 * @param {string} [options.crs='gcj02'] scheme 默认：gcj02 纠偏：wgs84
 * @param {string} [options.style='img'] 地图类型 img:影像地图 vec:电子地图 ship:海图
 */
class GoogleImageryProvider extends UrlTemplateImageryProvider {
  constructor(options = {}) {
    options["url"] =
      options.url ||
      [options.protocol || "", TILE_URL[options.style] || TILE_URL["img"]].join(
        "",
      );
    options.maximumLevel = 18;
    if (options.crs === "wgs84") {
      options["tilingScheme"] = new GCJ02TilingScheme();
    }
    super(options);
  }
}

export default GoogleImageryProvider;
