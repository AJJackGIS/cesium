import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";
import GCJ02WebMercatorTilingScheme from "../Core/GCJ02WebMercatorTilingScheme.js";

const TILE_URL = {
  img: "//p{s}.map.gtimg.com/sateTiles/{z}/{sx}/{sy}/{x}_{reverseY}.jpg",
  vec: "//rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={reverseY}&styleid={id}",
};

/**
 * 腾讯地图 ImageryProvider
 * @param {object} [options]
 * @param {string} [options.url] 瓦片链接
 * @param {string} [options.protocol] 协议 http: | https:
 * @param {string} [options.crs='gcj02'] scheme 默认：gcj02 纠偏：wgs84
 * @param {string} [options.style] 地图类型 img:影像地图 vec:电子地图
 * @param {string} [options.customId=1] 地图风格 1 电子地图 2 影像标注 3 影像注记+河流 4 暗色系 注：当 style 为 vec 时，该参数才生效
 */
class TencentImageryProvider extends UrlTemplateImageryProvider {
  constructor(options = {}) {
    options.protocol = options.protocol ? `${options.protocol}:` : "";
    options.style = options.style || "img";
    const url = options.url || options.protocol + TILE_URL[options.style];
    options["url"] = url.replace("{id}", options.customId || String(1));
    options["subdomains"] = ["1", "2", "3"];
    if (options.style === "img") {
      options["customTags"] = {
        sx: (imageryProvider, x, y, level) => {
          return x >> 4;
        },
        sy: (imageryProvider, x, y, level) => {
          return ((1 << level) - y) >> 4;
        },
      };
    }
    if (options.crs === "wgs84") {
      options["tilingScheme"] = new GCJ02WebMercatorTilingScheme();
    }
    super(options);
  }
}

export default TencentImageryProvider;
