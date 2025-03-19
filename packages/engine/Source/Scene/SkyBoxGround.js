import buildModuleUrl from "../Core/buildModuleUrl.js";
import BoxGeometry from "../Core/BoxGeometry.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import GeometryPipeline from "../Core/GeometryPipeline.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import transforms from "../Core/Transforms.js";
import VertexFormat from "../Core/VertexFormat.js";
import BufferUsage from "../Renderer/BufferUsage.js";
import CubeMap from "../Renderer/CubeMap.js";
import DrawCommand from "../Renderer/DrawCommand.js";
import loadCubeMap from "../Renderer/loadCubeMap.js";
import RenderState from "../Renderer/RenderState.js";
import ShaderProgram from "../Renderer/ShaderProgram.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import VertexArray from "../Renderer/VertexArray.js";
import SkyBoxFS from "../Shaders/SkyBoxFS.js";
import SkyBoxGroundVS from "../Shaders/SkyBoxGroundVS.js";
import BlendingState from "./BlendingState.js";
import SceneMode from "./SceneMode.js";

/**
 * 近景天空盒
 * @constructor
 *
 * @param {Viewer} viewer
 * @param {object} options Object with the following properties:
 * @param {object} [options.sources] The source URL or <code>Image</code> object for each of the six cube map faces.  See the example below.
 * @param {boolean} [options.show=true] Determines if this primitive will be shown.
 * @param {number} [options.changeHeight=240000] 默认天空盒和近景天空盒自动切换的高度.
 *
 *
 * @example
 * scene.skyBox = new Cesium.SkyBoxGround({
 *   sources : {
 *     positiveX : 'skybox_px.png',
 *     negativeX : 'skybox_nx.png',
 *     positiveY : 'skybox_py.png',
 *     negativeY : 'skybox_ny.png',
 *     positiveZ : 'skybox_pz.png',
 *     negativeZ : 'skybox_nz.png'
 *   }
 * });
 *
 * @see Scene#skyBox
 * @see Transforms.computeTemeToPseudoFixedMatrix
 */
function SkyBoxGround(viewer, options) {
  options = options ?? {};
  this._viewer = viewer;
  this._skybox = viewer.scene.skyBox;
  this._changeHeight = options.changeHeight ?? 240000;
  this.sources = options.sources;
  this._sources = undefined;
  this.show = options.show ?? true;
  this._command = new DrawCommand({
    modelMatrix: Matrix4.clone(Matrix4.IDENTITY),
    owner: this,
  });
  this._cubeMap = undefined;
  this._attributeLocations = undefined;
  this._useHdr = undefined;
  this._hasError = false;
  this._error = undefined;
}

SkyBoxGround.prototype.update = function (frameState, useHdr) {
  const that = this;
  const { mode, passes, context } = frameState;

  if (!this.show) {
    return undefined;
  }

  if (mode !== SceneMode.SCENE3D && mode !== SceneMode.MORPHING) {
    return undefined;
  }

  if (!passes.render) {
    return undefined;
  }

  if (this._hasError) {
    const error = this._error;
    this._hasError = false;
    this._error = undefined;
    throw error;
  }

  if (this._sources !== this.sources) {
    this._sources = this.sources;
    const sources = this.sources;

    //>>includeStart('debug', pragmas.debug);
    Check.defined("this.sources", sources);
    if (
      Object.values(CubeMap.FaceName).some(
        (faceName) => !defined(sources[faceName]),
      )
    ) {
      throw new DeveloperError(
        "this.sources must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties.",
      );
    }

    const sourceType = typeof sources.positiveX;
    if (
      Object.values(CubeMap.FaceName).some(
        (faceName) => typeof sources[faceName] !== sourceType,
      )
    ) {
      throw new DeveloperError(
        "this.sources properties must all be the same type.",
      );
    }
    //>>includeEnd('debug');

    if (typeof sources.positiveX === "string") {
      // Given urls for cube-map images.  Load them.
      loadCubeMap(context, this._sources)
        .then(function (cubeMap) {
          that._cubeMap = that._cubeMap && that._cubeMap.destroy();
          that._cubeMap = cubeMap;
        })
        .catch((error) => {
          this._hasError = true;
          this._error = error;
        });
    } else {
      this._cubeMap = this._cubeMap && this._cubeMap.destroy();
      this._cubeMap = new CubeMap({
        context: context,
        source: sources,
      });
    }
  }

  const command = this._command;

  command.modelMatrix = transforms.eastNorthUpToFixedFrame(
    frameState.camera._positionWC,
  );

  if (!defined(command.vertexArray)) {
    command.uniformMap = {
      u_cubeMap: function () {
        return that._cubeMap;
      },
      u_rotateMatrix: function () {
        return Matrix4.getRotation(command.modelMatrix, new Matrix3());
      },
    };

    const geometry = BoxGeometry.createGeometry(
      BoxGeometry.fromDimensions({
        dimensions: new Cartesian3(2.0, 2.0, 2.0),
        vertexFormat: VertexFormat.POSITION_ONLY,
      }),
    );
    const attributeLocations = (this._attributeLocations =
      GeometryPipeline.createAttributeLocations(geometry));

    command.vertexArray = VertexArray.fromGeometry({
      context: context,
      geometry: geometry,
      attributeLocations: attributeLocations,
      bufferUsage: BufferUsage.STATIC_DRAW,
    });

    command.renderState = RenderState.fromCache({
      blending: BlendingState.ALPHA_BLEND,
    });
  }

  if (!defined(command.shaderProgram) || this._useHdr !== useHdr) {
    const fs = new ShaderSource({
      defines: [useHdr ? "HDR" : ""],
      sources: [SkyBoxFS],
    });
    command.shaderProgram = ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: SkyBoxGroundVS,
      fragmentShaderSource: fs,
      attributeLocations: this._attributeLocations,
    });
    this._useHdr = useHdr;
  }

  if (!defined(this._cubeMap)) {
    return undefined;
  }

  return command;
};

SkyBoxGround.prototype.isDestroyed = function () {
  return false;
};

/**
 * 摧毁近景天空盒
 */
SkyBoxGround.prototype.destroy = function () {
  this._viewer.scene.preUpdate.removeEventListener(this.changeEvent, this);
  this._viewer.scene.skyBox = this._skybox;
  this._viewer.scene.skyAtmosphere.show = true;
  const command = this._command;
  command.vertexArray = command.vertexArray && command.vertexArray.destroy();
  command.shaderProgram =
    command.shaderProgram && command.shaderProgram.destroy();
  this._cubeMap = this._cubeMap && this._cubeMap.destroy();
  return destroyObject(this);
};

SkyBoxGround.prototype.changeEvent = function () {
  const height = this._viewer.camera.positionCartographic.height;
  if (height < this._changeHeight) {
    this._viewer.scene.skyBox = this;
    this._viewer.scene.skyAtmosphere.show = false;
  } else {
    this._viewer.scene.skyBox = this._skybox;
    this._viewer.scene.skyAtmosphere.show = true;
  }
};

/**
 * 自动更换默认天空盒和近景天空盒
 */
SkyBoxGround.prototype.autoChange = function () {
  this._viewer.scene.preUpdate.addEventListener(this.changeEvent, this);
};

function getDefaultSkyBoxUrl(suffix) {
  return buildModuleUrl(`Assets/Textures/SkyBoxGround/${suffix}.jpg`);
}

/**
 * Creates a ground skybox instance with the default map for the Earth.
 * 会自动调用 autoChange 方法
 *
 * @param {Viewer} viewer
 * @param {object} options Object with the following properties:
 * @param {number} [options.changeHeight=240000] 默认天空盒和近景天空盒自动切换的高度.
 * @return {SkyBoxGround} The default ground skybox for the Earth
 *
 * @example
 * Cesium.SkyBoxGround.createEarthGroundSkyBox(viewer);
 */
SkyBoxGround.createEarthGroundSkyBox = function (viewer, options) {
  options = options || {};
  const groundSkyBox = new SkyBoxGround(viewer, {
    sources: {
      positiveX: getDefaultSkyBoxUrl("px"),
      negativeX: getDefaultSkyBoxUrl("nx"),
      positiveY: getDefaultSkyBoxUrl("py"),
      negativeY: getDefaultSkyBoxUrl("ny"),
      positiveZ: getDefaultSkyBoxUrl("pz"),
      negativeZ: getDefaultSkyBoxUrl("nz"),
    },
    changeHeight: options.changeHeight,
  });
  groundSkyBox.autoChange();
  return groundSkyBox;
};

export default SkyBoxGround;
