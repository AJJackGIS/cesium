import UrlTemplateImageryProvider from "../../../Scene/UrlTemplateImageryProvider.js";
import GCJ02TilingScheme from "../tiling-scheme/GCJ02TilingScheme.js";

const TILE_URL = {
  img: "//p{s}.map.gtimg.com/sateTiles/{z}/{sx}/{sy}/{x}_{reverseY}.jpg",
  vec: "//rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={reverseY}&styleid={id}",
};

/**
 * 腾讯地图
 * @param {string} options.url 自定义链接
 * @param {string} options.style 地图类型 img:影像地图  vec:电子地图
 * @param {string} options.id 地图风格 1 电子地图 2 影像标注 3 影像注记+河流 4 暗色系
 */
class TencentImageryProvider extends UrlTemplateImageryProvider {
  constructor(options = {}) {
    const url =
      options.url ||
      [options.protocol || "", TILE_URL[options.style] || TILE_URL["vec"]].join(
        "",
      );
    options["url"] = url.replace("{id}", options.id || String(1));
    options["subdomains"] = options.subdomains || ["1", "2", "3"];
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
    if (options.crs === "WGS84") {
      options["tilingScheme"] = new GCJ02TilingScheme();
    }
    super(options);
  }
}

export default TencentImageryProvider;
