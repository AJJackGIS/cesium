import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";

const MAP_URL =
  "//t{s}.tianditu.com/DataServer?T={style}_w&x={x}&y={y}&l={z}&tk={key}";
const COVER_URL =
  "//lcdata.tianditu.gov.cn/glc2020_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0" +
  "&LAYER=glc2020&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}" +
  "&TILEROW={y}&TILECOL={x}&tk={key}";

/**
 * 天地图 ImageryProvider
 * @param {object} [options]
 * @param {string} [options.url] 瓦片链接
 * @param {string} [options.protocol] 协议 http: | https:
 * @param {string} [options.style] 地图类型 img:影像 cia:影像注记 vec:电子 cva:电子注记 ter:地形 cta:地形注记 ibo:全球境界 cover:地表覆盖
 * @param {string} [options.key] 天地图秘钥
 */
class TdtImageryProvider extends UrlTemplateImageryProvider {
  constructor(options = {}) {
    const url =
      options.url ||
      [
        options.protocol || "",
        options.style === "cover"
          ? COVER_URL.replace("{key}", options.key)
          : MAP_URL.replace("{style}", options.style || "img").replace(
              "{key}",
              options.key || "",
            ),
      ].join("");
    super({
      url: url,
      subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
      maximumLevel: 18,
    });
  }
}

export default TdtImageryProvider;
