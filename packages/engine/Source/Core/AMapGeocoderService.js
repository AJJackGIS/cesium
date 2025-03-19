import Cartesian3 from "./Cartesian3.js";
import Frozen from "./Frozen.js";
import Lbs from "./Lbs.js";

/**
 * 高德地址编码服务
 * @param {object} [options]
 * @param {string} [options.key] 高德地图key
 * @param {string} [options.version=v3] 接口版本 v3 | v5
 */
class AMapGeocoderService {
  constructor(options) {
    options = options ?? Frozen.EMPTY_OBJECT;
    this.key = options.key ?? Lbs.defaultAmapKey;
    this.version = options.version || "v3";
  }

  /**
   * 查询实现方法
   * @param {string} query 查询关键字
   * @returns {Promise<GeocoderService.Result[]>}
   */
  geocode(query) {
    const url = `https://restapi.amap.com/${this.version}/place/text?keywords=${query}&key=${this.key}`;
    return fetch(url)
      .then((response) => response.json())
      .then((results) => {
        return results.pois.map((resultObject) => {
          return {
            displayName: `${resultObject.name}-${resultObject.address}`,
            destination: Cartesian3.fromDegrees(
              +resultObject.location.split(",")[0],
              +resultObject.location.split(",")[1],
            ),
          };
        });
      });
  }
}

export default AMapGeocoderService;
