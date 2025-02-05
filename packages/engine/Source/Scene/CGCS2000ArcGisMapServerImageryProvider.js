import Cartesian2 from "../Core/Cartesian2.js";
import CGCS2000GeographicTilingScheme from "../Core/CGCS2000GeographicTilingScheme.js";
import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import DiscardMissingTileImagePolicy from "./DiscardMissingTileImagePolicy.js";
import ImageryProvider from "./ImageryProvider.js";

function ImageryProviderBuilder(options) {
  this.useTiles = true;

  const ellipsoid = options.ellipsoid;
  this.tilingScheme = new GeographicTilingScheme({ ellipsoid: ellipsoid });
  this.rectangle = defaultValue(options.rectangle, this.tilingScheme.rectangle);
  this.ellipsoid = ellipsoid;

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this.credit = credit;
  this.tileCredits = undefined;
  this.tileDiscardPolicy = options.tileDiscardPolicy;

  this.tileWidth = defaultValue(options.tileWidth, 256);
  this.tileHeight = defaultValue(options.tileHeight, 256);
  this.maximumLevel = options.maximumLevel;
}

ImageryProviderBuilder.prototype.build = function (provider) {
  provider._useTiles = this.useTiles;
  provider._tilingScheme = this.tilingScheme;
  provider._rectangle = this.rectangle;
  provider._credit = this.credit;
  provider._tileCredits = this.tileCredits;
  provider._tileDiscardPolicy = this.tileDiscardPolicy;
  provider._tileWidth = this.tileWidth;
  provider._tileHeight = this.tileHeight;
  provider._maximumLevel = this.maximumLevel;

  if (this.useTiles && !defined(this.tileDiscardPolicy)) {
    provider._tileDiscardPolicy = new DiscardMissingTileImagePolicy({
      missingImageUrl: buildImageResource(
        provider,
        0,
        0,
        this.maximumLevel,
        undefined,
      ).url,
      pixelsToCheck: [
        new Cartesian2(0, 0),
        new Cartesian2(200, 20),
        new Cartesian2(20, 200),
        new Cartesian2(80, 110),
        new Cartesian2(160, 130),
      ],
      disableCheckIfAllPixelsAreTransparent: true,
    });
  }
};

function metadataSuccess(data, imageryProviderBuilder) {
  const tileInfo = data.tileInfo;
  // 设置瓦片大小256
  imageryProviderBuilder.tileWidth = tileInfo.rows;
  imageryProviderBuilder.tileHeight = tileInfo.cols;
  // 专门处理4490坐标系
  if (data.tileInfo.spatialReference.wkid === 4490) {
    imageryProviderBuilder.tilingScheme = new CGCS2000GeographicTilingScheme({
      tileInfo: tileInfo, // 传入切片信息
    });
  } else {
    const message = `Tile spatial reference WKID is not 4490.`;
    throw new RuntimeError(message);
  }
  imageryProviderBuilder.maximumLevel = data.tileInfo.lods.length - 1; // 设置级别

  // 设置数据范围fullExtent
  if (defined(data.fullExtent)) {
    if (
      defined(data.fullExtent.spatialReference) &&
      defined(data.fullExtent.spatialReference.wkid)
    ) {
      imageryProviderBuilder.rectangle = Rectangle.fromDegrees(
        data.fullExtent.xmin,
        data.fullExtent.ymin,
        data.fullExtent.xmax,
        data.fullExtent.ymax,
      );
    }
  } else {
    imageryProviderBuilder.rectangle =
      imageryProviderBuilder.tilingScheme.rectangle;
  }
  imageryProviderBuilder.useTiles = true;
}

function metadataFailure(resource, error) {
  let message = `An error occurred while accessing ${resource.url}`;
  if (defined(error) && defined(error.message)) {
    message += `: ${error.message}`;
  }

  throw new RuntimeError(message);
}

async function requestMetadata(resource, imageryProviderBuilder) {
  const jsonResource = resource.getDerivedResource({
    queryParameters: {
      f: "json",
    },
  });

  try {
    const data = await jsonResource.fetchJson();
    metadataSuccess(data, imageryProviderBuilder);
  } catch (error) {
    metadataFailure(resource, error);
  }
}

/**
 * <div class="notice">
 * This object is normally not instantiated directly, use {@link CGCS2000ArcGisMapServerImageryProvider.fromUrl}.
 * </div>
 *
 * CSCS2000 瓦片ImageryProvider

 * @alias CGCS2000ArcGisMapServerImageryProvider
 * @constructor
 *
 * @param {CGCS2000ArcGisMapServerImageryProvider.ConstructorOptions} [options] Object describing initialization options
 *
 * @see CGCS2000ArcGisMapServerImageryProvider.fromUrl
 *
 * @example
 * Cesium.CGCS2000ArcGisMapServerImageryProvider.fromUrl(
 *   "http://218.94.6.92:6080/arcgis/rest/services/jssl_raster_L3_L17/MapServer",
 * ).then((provider) => {
 *   viewer.imageryLayers.addImageryProvider(provider);
 * });
 *
 * viewer.camera.flyTo({
 *   destination: Cesium.Rectangle.fromDegrees(
 *     115.65146381800002,
 *     30.661798358000055,
 *     122.13938395900004,
 *     35.373045702000034,
 *   ),
 * });
 */
function CGCS2000ArcGisMapServerImageryProvider(options) {
  this._tileDiscardPolicy = options.tileDiscardPolicy;
  this._tileWidth = 256;
  this._tileHeight = 256;
  this._maximumLevel = options.maximumLevel;
  this._tilingScheme = defaultValue(
    options.tilingScheme,
    new GeographicTilingScheme({ ellipsoid: options.ellipsoid }),
  );
  this._useTiles = true;
  this._rectangle = defaultValue(
    options.rectangle,
    this._tilingScheme.rectangle,
  );
  this._layers = options.layers;
  this._credit = options.credit;
  this._tileCredits = undefined;

  this.enablePickFeatures = false;

  this._errorEvent = new Event();
}

function buildImageResource(imageryProvider, x, y, level, request) {
  return imageryProvider._resource.getDerivedResource({
    url: `tile/${level}/${y}/${x}`,
    request: request,
  });
}

Object.defineProperties(CGCS2000ArcGisMapServerImageryProvider.prototype, {
  url: {
    get: function () {
      return this._resource._url;
    },
  },

  token: {
    get: function () {
      return this._resource.queryParameters.token;
    },
  },

  proxy: {
    get: function () {
      return this._resource.proxy;
    },
  },

  tileWidth: {
    get: function () {
      return this._tileWidth;
    },
  },

  tileHeight: {
    get: function () {
      return this._tileHeight;
    },
  },

  maximumLevel: {
    get: function () {
      return this._maximumLevel;
    },
  },

  minimumLevel: {
    get: function () {
      return 0;
    },
  },

  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  rectangle: {
    get: function () {
      return this._rectangle;
    },
  },

  tileDiscardPolicy: {
    get: function () {
      return this._tileDiscardPolicy;
    },
  },

  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  credit: {
    get: function () {
      return this._credit;
    },
  },

  usingPrecachedTiles: {
    get: function () {
      return this._useTiles;
    },
  },

  hasAlphaChannel: {
    get: function () {
      return true;
    },
  },

  layers: {
    get: function () {
      return this._layers;
    },
  },
});

/**
 * Creates an {@link ImageryProvider} which provides tiled imagery hosted by an ArcGIS MapServer.  By default, the server's pre-cached tiles are
 * used, if available.
 *
 * @param {Resource|String} url The URL of the ArcGIS MapServer service.
 * @param {CGCS2000ArcGisMapServerImageryProvider.ConstructorOptions} [options] Object describing initialization options.
 * @returns {Promise<CGCS2000ArcGisMapServerImageryProvider>} A promise that resolves to the created CGCS2000ArcGisMapServerImageryProvider.
 *
 * @example
 * const esri = await Cesium.CGCS2000ArcGisMapServerImageryProvider.fromUrl(
 *     "http://218.94.6.92:6080/arcgis/rest/services/jssl_raster_L3_L17/MapServer"
 * );
 *
 * @exception {RuntimeError} metadata spatial reference specifies an unknown WKID
 * @exception {RuntimeError} metadata fullExtent.spatialReference specifies an unknown WKID
 */
CGCS2000ArcGisMapServerImageryProvider.fromUrl = async function (url, options) {
  const resource = new Resource({
    url: url,
  });
  resource.appendForwardSlash();
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const provider = new CGCS2000ArcGisMapServerImageryProvider(options);
  provider._resource = resource;
  const imageryProviderBuilder = new ImageryProviderBuilder(options);
  await requestMetadata(resource, imageryProviderBuilder);
  imageryProviderBuilder.build(provider);
  return provider;
};

CGCS2000ArcGisMapServerImageryProvider.prototype.getTileCredits = function (
  x,
  y,
  level,
) {
  return this._tileCredits;
};

CGCS2000ArcGisMapServerImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request,
) {
  return ImageryProvider.loadImage(
    this,
    buildImageResource(this, x, y, level, request),
  );
};

CGCS2000ArcGisMapServerImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return undefined;
};

CGCS2000ArcGisMapServerImageryProvider._metadataCache = {};

export default CGCS2000ArcGisMapServerImageryProvider;
