import {
  Atmosphere,
  BoundingSphere,
  Cartesian2,
  Cartesian3,
  CesiumTerrainProvider,
  Color,
  defined,
  Ellipsoid,
  GeographicProjection,
  GeometryInstance,
  HeadingPitchRoll,
  JulianDate,
  Math as CesiumMath,
  PixelFormat,
  Rectangle,
  RectangleGeometry,
  RequestScheduler,
  RuntimeError,
  TaskProcessor,
  WebGLConstants,
  WebMercatorProjection,
  DrawCommand,
  Framebuffer,
  Pass,
  PixelDatatype,
  RenderState,
  ShaderProgram,
  ShaderSource,
  Texture,
  Camera,
  DirectionalLight,
  EllipsoidSurfaceAppearance,
  FrameState,
  Globe,
  Material,
  Primitive,
  PrimitiveCollection,
  Scene,
  SceneTransforms,
  ScreenSpaceCameraController,
  SunLight,
  TweenCollection,
  Sun,
  Terrain,
  GroundPrimitive,
  PerInstanceColorAppearance,
  ColorGeometryInstanceAttribute,
  Resource,
  HeightReference,
  SharedContext,
} from "../../index.js";

import createCanvas from "../../../../Specs/createCanvas.js";
import createScene from "../../../../Specs/createScene.js";
import pollToPromise from "../../../../Specs/pollToPromise.js";
import render from "../../../../Specs/render.js";
import { Cartesian4, Model } from "@cesium/engine";

// The size of the property texture
const textureSizeX = 16;
const textureSizeY = 16;

// A scaling factor (to be applied to the texture size) for
// determining the size of the ("debug") canvas that shows
// the scene where the picking takes place
const canvasScaling = 32;

// The 'toEqualEpsilon' matcher (which is which is defined
// in `Specs/addDefaultMatchers.js`, by the way...) uses
// the epsilon as a relative epsilon, and there is no way
// to pass in an absolute epsilon. For comparing the elements
// of a Cartesian2 that stores UINT8 values, an absolute
// epsilon of 1.0 would be handy. But... here we go:
const propertyValueEpsilon = 0.01;

/**
 * Creates an embedded glTF asset with a property texture.
 *
 * This creates an assed that represents a unit square and uses
 * the `EXT_structural_metadata` extension to assign a single
 * property texture to this square.
 *
 * @param {object} schema The metadata schema
 * @param {object} propertyTextureProperties The property texture properties
 * @returns The gltf
 */
function createEmbeddedGltfWithPropertyTexture(
  schema,
  propertyTextureProperties,
) {
  const result = {
    extensions: {
      EXT_structural_metadata: {
        schema: schema,
        propertyTextures: [
          {
            class: "exampleClass",
            properties: propertyTextureProperties,
          },
        ],
      },
    },
    extensionsUsed: ["EXT_structural_metadata"],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5123,
        count: 6,
        type: "SCALAR",
        max: [3],
        min: [0],
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126,
        count: 4,
        type: "VEC3",
        max: [1.0, 1.0, 0.0],
        min: [0.0, 0.0, 0.0],
      },
      {
        bufferView: 1,
        byteOffset: 48,
        componentType: 5126,
        count: 4,
        type: "VEC3",
        max: [0.0, 0.0, 1.0],
        min: [0.0, 0.0, 1.0],
      },
      {
        bufferView: 1,
        byteOffset: 96,
        componentType: 5126,
        count: 4,
        type: "VEC2",
        max: [1.0, 1.0],
        min: [0.0, 0.0],
      },
    ],
    asset: {
      generator: "JglTF from https://github.com/javagl/JglTF",
      version: "2.0",
    },
    buffers: [
      {
        uri: "data:application/gltf-buffer;base64,AAABAAIAAQADAAIAAAAAAAAAAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAgD8AAAAAAACAPwAAgD8AAAAAAAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAgD8AAAAAAACAPwAAgD8AAAAAAAAAAAAAAAAAAAAAAACAPwAAAAAAAAAA",
        byteLength: 156,
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: 12,
        target: 34963,
      },
      {
        buffer: 0,
        byteOffset: 12,
        byteLength: 144,
        byteStride: 12,
        target: 34962,
      },
    ],
    images: [
      {
        // A 16x16 pixels image that contains all combinations of
        // (0, 127, 255) in its upper-left 9x9 pixels
        uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAi0lEQVR42u2RUQ6AMAhDd3OO/qQt8VP8NRHjNpf0leI5ruqXbNVL4c9Dn+E8ljV+iLaXaoAY1YDaADaynBg2gFZLR1+wAdJEWZpW1AIVqmjCruqybw4qnEJbbQBHdWoS2XIUXdp+F8DNUOpM0tIZCusQJrzHNTnsOy2pFTZ7xpKhYFUu4M1v+OvrdQGABqEpS2kSLgAAAABJRU5ErkJggg==",
        mimeType: "image/png",
      },
    ],
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [1.0, 1.0, 1.0, 1.0],
          metallicFactor: 0.0,
          roughnessFactor: 1.0,
        },
        alphaMode: "OPAQUE",
        doubleSided: true,
      },
    ],
    meshes: [
      {
        primitives: [
          {
            extensions: {
              EXT_structural_metadata: {
                propertyTextures: [0],
              },
            },
            attributes: {
              POSITION: 1,
              NORMAL: 2,
              TEXCOORD_0: 3,
            },
            indices: 0,
            material: 0,
            mode: 4,
          },
        ],
      },
    ],
    nodes: [
      {
        mesh: 0,
      },
    ],
    samplers: [
      {
        magFilter: 9728,
        minFilter: 9728,
      },
    ],
    scene: 0,
    scenes: [
      {
        nodes: [0],
      },
    ],
    textures: [
      {
        sampler: 0,
        source: 0,
      },
      {
        sampler: 0,
        source: 1,
      },
    ],
  };
  return result;
}

/**
 * Create an embedded glTF with the default property texture,
 * and the given schema and property texture properties.
 *
 * @param {object} schema The JSON form of the metadata schema
 * @param {object[]} properties The JSON form of the property texture properties
 * @returns The glTF
 */
function createPropertyTextureGltf(schema, properties) {
  const gltf = createEmbeddedGltfWithPropertyTexture(schema, properties);
  /*/
  // Copy-and-paste this into a file to have the actual glTF:
  console.log("SPEC GLTF:");
  console.log("-".repeat(80));
  console.log(JSON.stringify(gltf, null, 2));
  console.log("-".repeat(80));
  //*/
  return gltf;
}

/**
 * Creates the glTF for the 'scalar' test case
 *
 * @returns The glTF
 */
function createPropertyTextureGltfScalar() {
  const schema = {
    id: "ExampleSchema",
    classes: {
      exampleClass: {
        name: "Example class",
        properties: {
          example_UINT8_SCALAR: {
            name: "Example SCALAR property with UINT8 components",
            type: "SCALAR",
            componentType: "UINT8",
          },
        },
      },
    },
  };
  const properties = {
    example_UINT8_SCALAR: {
      index: 0,
      texCoord: 0,
      channels: [0],
    },
  };
  return createPropertyTextureGltf(schema, properties);
}

/**
 * Creates the glTF for the normalized 'scalar' test case
 *
 * @param {number|undefined} classPropertyOffset The optional offset
 * that will be defined in the class property definition
 * @param {number|undefined} classPropertyScale The optional scale
 * that will be defined in the class property definition
 * @param {number|undefined} metadataPropertyOffset The optional offset
 * that will be defined in the property texture property definition
 * @param {number|undefined} metadataPropertyScale The optional scale
 * that will be defined in the property texture property definition
 * @returns The glTF
 */
function createPropertyTextureGltfNormalizedScalar(
  classPropertyOffset,
  classPropertyScale,
  metadataPropertyOffset,
  metadataPropertyScale,
) {
  const schema = {
    id: "ExampleSchema",
    classes: {
      exampleClass: {
        name: "Example class",
        properties: {
          example_normalized_UINT8_SCALAR: {
            name: "Example SCALAR property with normalized UINT8 components",
            type: "SCALAR",
            componentType: "UINT8",
            normalized: true,
            offset: classPropertyOffset,
            scale: classPropertyScale,
          },
        },
      },
    },
  };
  const properties = {
    example_normalized_UINT8_SCALAR: {
      index: 0,
      texCoord: 0,
      channels: [0],
      offset: metadataPropertyOffset,
      scale: metadataPropertyScale,
    },
  };
  return createPropertyTextureGltf(schema, properties);
}

/**
 * Creates the glTF for the 'scalar array' test case
 *
 * @returns The glTF
 */
function createPropertyTextureGltfScalarArray() {
  const schema = {
    id: "ExampleSchema",
    classes: {
      exampleClass: {
        name: "Example class",
        properties: {
          example_fixed_length_UINT8_SCALAR_array: {
            name: "Example fixed-length SCALAR array property with UINT8 components",
            type: "SCALAR",
            componentType: "UINT8",
            array: true,
            count: 3,
          },
        },
      },
    },
  };
  const properties = {
    example_fixed_length_UINT8_SCALAR_array: {
      index: 0,
      texCoord: 0,
      channels: [0, 1, 2],
    },
  };
  return createPropertyTextureGltf(schema, properties);
}

/**
 * Creates the glTF for the 'normalized scalar array' test case
 *
 * @param {number[]|undefined} classPropertyOffset The optional offset
 * that will be defined in the class property definition
 * @param {number[]|undefined} classPropertyScale The optional scale
 * that will be defined in the class property definition
 * @param {number[]|undefined} metadataPropertyOffset The optional offset
 * that will be defined in the property texture property definition
 * @param {number[]|undefined} metadataPropertyScale The optional scale
 * that will be defined in the property texture property definition
 * @returns The glTF
 */
function createPropertyTextureGltfNormalizedScalarArray(
  classPropertyOffset,
  classPropertyScale,
  metadataPropertyOffset,
  metadataPropertyScale,
) {
  const schema = {
    id: "ExampleSchema",
    classes: {
      exampleClass: {
        name: "Example class",
        properties: {
          example_fixed_length_normalized_UINT8_SCALAR_array: {
            name: "Example fixed-length SCALAR array property with normalized INT8 components",
            type: "SCALAR",
            componentType: "UINT8",
            array: true,
            count: 3,
            normalized: true,
            offset: classPropertyOffset,
            scale: classPropertyScale,
          },
        },
      },
    },
  };
  const properties = {
    example_fixed_length_normalized_UINT8_SCALAR_array: {
      index: 0,
      texCoord: 0,
      channels: [0, 1, 2],
      offset: metadataPropertyOffset,
      scale: metadataPropertyScale,
    },
  };
  return createPropertyTextureGltf(schema, properties);
}

/**
 * Creates the glTF for the 'vec2' test case
 *
 * @returns The glTF
 */
function createPropertyTextureGltfVec2() {
  const schema = {
    id: "ExampleSchema",
    classes: {
      exampleClass: {
        name: "Example class",
        properties: {
          example_UINT8_VEC2: {
            name: "Example VEC2 property with UINT8 components",
            type: "VEC2",
            componentType: "UINT8",
          },
        },
      },
    },
  };
  const properties = {
    example_UINT8_VEC2: {
      index: 0,
      texCoord: 0,
      channels: [0, 1],
    },
  };
  return createPropertyTextureGltf(schema, properties);
}

/**
 * Creates the glTF for the normalized 'vec2' test case
 *
 * @param {number[]|undefined} classPropertyOffset The optional offset
 * that will be defined in the class property definition
 * @param {number[]|undefined} classPropertyScale The optional scale
 * that will be defined in the class property definition
 * @param {number[]|undefined} metadataPropertyOffset The optional offset
 * that will be defined in the property texture property definition
 * @param {number[]|undefined} metadataPropertyScale The optional scale
 * that will be defined in the property texture property definition
 * @returns The glTF
 */
function createPropertyTextureGltfNormalizedVec2(
  classPropertyOffset,
  classPropertyScale,
  metadataPropertyOffset,
  metadataPropertyScale,
) {
  const schema = {
    id: "ExampleSchema",
    classes: {
      exampleClass: {
        name: "Example class",
        properties: {
          example_normalized_UINT8_VEC2: {
            name: "Example VEC2 property with normalized UINT8 components",
            type: "VEC2",
            componentType: "UINT8",
            normalized: true,
            offset: classPropertyOffset,
            scale: classPropertyScale,
          },
        },
      },
    },
  };
  const properties = {
    example_normalized_UINT8_VEC2: {
      index: 0,
      texCoord: 0,
      channels: [0, 1],
      offset: metadataPropertyOffset,
      scale: metadataPropertyScale,
    },
  };
  return createPropertyTextureGltf(schema, properties);
}

/**
 * Creates the glTF for the 'vec3' test case
 *
 * @returns The glTF
 */
function createPropertyTextureGltfVec3() {
  const schema = {
    id: "ExampleSchema",
    classes: {
      exampleClass: {
        name: "Example class",
        properties: {
          example_UINT8_VEC3: {
            name: "Example VEC3 property with UINT8 components",
            type: "VEC3",
            componentType: "UINT8",
          },
        },
      },
    },
  };
  const properties = {
    example_UINT8_VEC3: {
      index: 0,
      texCoord: 0,
      channels: [0, 1, 2],
    },
  };
  return createPropertyTextureGltf(schema, properties);
}

/**
 * Creates the glTF for the 'vec4' test case
 *
 * @returns The glTF
 */
function createPropertyTextureGltfVec4() {
  const schema = {
    id: "ExampleSchema",
    classes: {
      exampleClass: {
        name: "Example class",
        properties: {
          example_UINT8_VEC4: {
            name: "Example VEC4 property with UINT8 components",
            type: "VEC4",
            componentType: "UINT8",
          },
        },
      },
    },
  };
  const properties = {
    example_UINT8_VEC4: {
      index: 0,
      texCoord: 0,
      channels: [0, 1, 2, 3],
    },
  };
  return createPropertyTextureGltf(schema, properties);
}

/**
 * Create a model from the given glTF, add it as a primitive
 * to the given scene, and wait until it is fully loaded.
 *
 * @param {Scene} scene The scene
 * @param {object} gltf The gltf
 */
async function loadAsModel(scene, gltf) {
  const basePath = "SPEC_BASE_PATH";
  const model = await Model.fromGltfAsync({
    gltf: gltf,
    basePath: basePath,
    // This is important to make sure that the property
    // texture is fully loaded when the model is rendered!
    incrementallyLoadTextures: false,
  });
  scene.primitives.add(model);

  await pollToPromise(
    function () {
      scene.renderForSpecs();
      return model.ready;
    },
    { timeout: 10000 },
  );
}

/**
 * Move the camera to exactly look at the unit square along -X
 *
 * @param {Camera} camera
 */
function fitCameraToUnitSquare(camera) {
  const fov = CesiumMath.PI_OVER_THREE;
  camera.frustum.fov = fov;
  camera.frustum.near = 0.01;
  camera.frustum.far = 100.0;
  const distance = 1.0 / (2.0 * Math.tan(fov * 0.5));
  camera.position = new Cartesian3(distance, 0.5, 0.5);
  camera.direction = Cartesian3.negate(Cartesian3.UNIT_X, new Cartesian3());
  camera.up = Cartesian3.clone(Cartesian3.UNIT_Z);
  camera.right = Cartesian3.clone(Cartesian3.UNIT_Y);
}

/**
 * Pick the specified metadata value from the screen that is contained in
 * the property texture at the given coordinates.
 *
 * (This assumes that the property texture is on a unit square, and
 * fitCameraToUnitSquare was called)
 *
 * @param {Scene} scene The scene
 * @param {string|undefined} schemaId The schema ID
 * @param {string} className The class name
 * @param {string} propertyName The property name
 * @param {number} x The x-coordinate in the texture
 * @param {number} y The y-coordinate in the texture
 * @returns The metadata value
 */
function pickMetadataAt(scene, schemaId, className, propertyName, x, y) {
  const screenX = Math.floor(x * canvasScaling + canvasScaling / 2);
  const screenY = Math.floor(y * canvasScaling + canvasScaling / 2);
  const screenPosition = new Cartesian2(screenX, screenY);
  const metadataValue = scene.pickMetadata(
    screenPosition,
    schemaId,
    className,
    propertyName,
  );
  return metadataValue;
}

describe(
  "Scene/Scene",
  function () {
    let scene;

    beforeAll(function () {
      return GroundPrimitive.initializeTerrainHeights();
    });

    beforeEach(function () {
      scene = createScene();
    });

    afterEach(function () {
      scene.destroyForSpecs();
    });

    function getSimpleShaderProgram() {
      return ShaderProgram.fromCache({
        context: scene.context,
        vertexShaderSource: new ShaderSource({
          sources: ["void main() { gl_Position = vec4(1.0); }"],
        }),
        fragmentShaderSource: new ShaderSource({
          sources: ["void main() { out_FragColor = vec4(1.0); }"],
        }),
      });
    }

    function returnTileJson(path) {
      Resource._Implementations.loadWithXhr = function (
        url,
        responseType,
        method,
        data,
        headers,
        deferred,
        overrideMimeType,
      ) {
        Resource._DefaultImplementations.loadWithXhr(
          path,
          responseType,
          method,
          data,
          headers,
          deferred,
        );
      };
    }

    function returnQuantizedMeshTileJson() {
      return returnTileJson(
        "Data/CesiumTerrainTileJson/QuantizedMesh.tile.json",
      );
    }

    function createRectangle(rectangle, height) {
      return new Primitive({
        geometryInstances: new GeometryInstance({
          geometry: new RectangleGeometry({
            rectangle: rectangle,
            vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            height: height,
          }),
        }),
        appearance: new EllipsoidSurfaceAppearance({
          aboveGround: false,
        }),
        asynchronous: false,
      });
    }

    describe("constructor", () => {
      it("has expected defaults", function () {
        const scene = createScene({
          canvas: createCanvas(5, 5),
        });

        expect(scene.canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(scene.primitives).toBeInstanceOf(PrimitiveCollection);
        expect(scene.camera).toBeInstanceOf(Camera);
        expect(scene.screenSpaceCameraController).toBeInstanceOf(
          ScreenSpaceCameraController,
        );
        expect(scene.mapProjection).toBeInstanceOf(GeographicProjection);
        expect(scene.frameState).toBeInstanceOf(FrameState);
        expect(scene.tweens).toBeInstanceOf(TweenCollection);
        expect(scene.msaaSamples).toEqual(4);

        const contextAttributes = scene.context._gl.getContextAttributes();
        // Do not check depth and antialias since they are requests not requirements
        expect(contextAttributes.alpha).toEqual(false);
        expect(contextAttributes.stencil).toEqual(true);
        expect(contextAttributes.premultipliedAlpha).toEqual(true);
        expect(contextAttributes.preserveDrawingBuffer).toEqual(false);
        expect(scene._depthPlane._ellipsoidOffset).toEqual(0);
        scene.destroyForSpecs();
      });

      it("respects default log depth buffer override", () => {
        const previous = Scene.defaultLogDepthBuffer;

        Scene.defaultLogDepthBuffer = false;
        const newScene = createScene();
        expect(newScene._logDepthBuffer).toEqual(false);

        Scene.defaultLogDepthBuffer = previous;
      });

      it("sets options", function () {
        const webglOptions = {
          alpha: true,
          depth: false,
          stencil: true,
          antialias: false,
          premultipliedAlpha: false,
          preserveDrawingBuffer: true,
        };
        const mapProjection = new WebMercatorProjection();

        const s = createScene({
          contextOptions: {
            webgl: webglOptions,
          },
          mapProjection: mapProjection,
          depthPlaneEllipsoidOffset: Number.POSITIVE_INFINITY,
        });

        const contextAttributes = s.context._gl.getContextAttributes();
        expect(contextAttributes.alpha).toEqual(webglOptions.alpha);
        expect(contextAttributes.depth).toEqual(webglOptions.depth);
        expect(contextAttributes.stencil).toEqual(webglOptions.stencil);
        expect(contextAttributes.antialias).toEqual(webglOptions.antialias);
        expect(contextAttributes.premultipliedAlpha).toEqual(
          webglOptions.premultipliedAlpha,
        );
        expect(contextAttributes.preserveDrawingBuffer).toEqual(
          webglOptions.preserveDrawingBuffer,
        );
        expect(s.mapProjection).toEqual(mapProjection);
        expect(s._depthPlane._ellipsoidOffset).toEqual(
          Number.POSITIVE_INFINITY,
        );

        s.destroyForSpecs();
      });

      it("throws without options", function () {
        expect(function () {
          return new Scene();
        }).toThrowDeveloperError();
      });

      it("throws without options.canvas", function () {
        expect(function () {
          return new Scene({});
        }).toThrowDeveloperError();
      });

      it("draws background color", function () {
        expect(scene).toRender([0, 0, 0, 255]);

        scene.backgroundColor = Color.BLUE;
        expect(scene).toRender([0, 0, 255, 255]);
      });

      describe("with shared context", () => {
        // All of these tests require a real WebGL context. Skip them if WebGL is being stubbed.
        const webglStub = !!window.webglStub;

        it("accepts a SharedContext in place of ContextOptions", function () {
          if (webglStub) {
            return;
          }

          const sharedContext = new SharedContext();
          const s = new Scene({
            canvas: createCanvas(5, 5),
            contextOptions: sharedContext,
          });

          expect(s._context._gl).toBe(sharedContext._context._gl);
          s.destroy();
        });

        it("draws background color with SharedContext", function () {
          if (webglStub) {
            return;
          }

          const sharedContext = new SharedContext();
          const s1 = new Scene({
            canvas: createCanvas(1, 1),
            contextOptions: sharedContext,
          });
          const s2 = new Scene({
            canvas: createCanvas(1, 1),
            contextOptions: sharedContext,
          });

          expect(s1).toRender([0, 0, 0, 255]);
          expect(s2).toRender([0, 0, 0, 255]);

          s1.backgroundColor = Color.BLUE;
          s2.backgroundColor = Color.RED;
          expect(s1).toRender([0, 0, 255, 255]);
          expect(s2).toRender([255, 0, 0, 255]);
        });

        it("reference-counts primitives IFF using a SharedContext", function () {
          if (webglStub) {
            return;
          }

          expect(scene.primitives._countReferences).toBe(false);
          const s = new Scene({
            canvas: createCanvas(5, 5),
            contextOptions: new SharedContext(),
          });
          expect(s.primitives._countReferences).toBe(true);
        });
      });
    });

    it("calls afterRender functions", function () {
      const spyListener = jasmine.createSpy("listener");

      const primitive = {
        update: function (frameState) {
          frameState.afterRender.push(spyListener);
        },
        destroy: function () {},
        isDestroyed: () => false,
      };
      scene.primitives.add(primitive);

      scene.renderForSpecs();
      expect(spyListener).toHaveBeenCalled();
    });

    function CommandMockPrimitive(command) {
      this.update = function (frameState) {
        frameState.commandList.push(command);
      };
      this.destroy = function () {};
      this.isDestroyed = function () {
        return false;
      };
    }

    it("debugCommandFilter filters commands", function () {
      const c = new DrawCommand({
        shaderProgram: getSimpleShaderProgram(),
        renderState: new RenderState(),
        pass: Pass.OPAQUE,
      });
      c.execute = function () {};
      spyOn(c, "execute");

      scene.primitives.add(new CommandMockPrimitive(c));

      scene.debugCommandFilter = function (command) {
        return command !== c; // Do not execute command
      };

      scene.renderForSpecs();
      expect(c.execute).not.toHaveBeenCalled();
    });

    it("debugCommandFilter does not filter commands", function () {
      const originalLogDepth = scene.logarithmicDepthBuffer;
      scene.logarithmicDepthBuffer = false;

      const c = new DrawCommand({
        shaderProgram: getSimpleShaderProgram(),
        renderState: new RenderState(),
        pass: Pass.OPAQUE,
      });
      c.execute = function () {};
      spyOn(c, "execute");

      scene.primitives.add(new CommandMockPrimitive(c));

      expect(scene.debugCommandFilter).toBeUndefined();
      scene.renderForSpecs();
      expect(c.execute).toHaveBeenCalled();

      scene.logarithmicDepthBuffer = originalLogDepth;
    });

    it("debugShowBoundingVolume draws a bounding sphere", function () {
      const originalLogDepth = scene.logarithmicDepthBuffer;
      scene.logarithmicDepthBuffer = false;

      const radius = 10.0;
      const center = Cartesian3.add(
        scene.camera.position,
        scene.camera.direction,
        new Cartesian3(),
      );

      const c = new DrawCommand({
        shaderProgram: getSimpleShaderProgram(),
        renderState: new RenderState(),
        pass: Pass.OPAQUE,
        debugShowBoundingVolume: true,
        boundingVolume: new BoundingSphere(center, radius),
      });
      c.execute = function () {};

      scene.primitives.add(new CommandMockPrimitive(c));
      scene.depthTestAgainstTerrain = true;

      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).not.toEqual(0); // Red bounding sphere
      });

      scene.logarithmicDepthBuffer = originalLogDepth;
    });

    it("debugShowCommands tints commands", function () {
      const originalLogDepth = scene.logarithmicDepthBuffer;
      scene.logarithmicDepthBuffer = false;

      const c = new DrawCommand({
        shaderProgram: getSimpleShaderProgram(),
        renderState: new RenderState(),
        pass: Pass.OPAQUE,
      });
      c.execute = function () {};

      const originalShallowClone = DrawCommand.shallowClone;
      spyOn(DrawCommand, "shallowClone").and.callFake(
        function (command, result) {
          result = originalShallowClone(command, result);
          result.execute = function () {
            result.uniformMap.debugShowCommandsColor();
          };
          return result;
        },
      );

      scene.primitives.add(new CommandMockPrimitive(c));

      scene.debugShowCommands = true;
      scene.renderForSpecs();
      expect(c._debugColor).toBeDefined();
      scene.debugShowCommands = false;

      scene.logarithmicDepthBuffer = originalLogDepth;
    });

    it("debugShowFramesPerSecond", function () {
      scene.debugShowFramesPerSecond = true;
      scene.renderForSpecs();
      expect(scene._performanceDisplay).toBeDefined();
      scene.debugShowFramesPerSecond = false;
    });

    it("opaque/translucent render order (1)", function () {
      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);

      const rectanglePrimitive1 = createRectangle(rectangle);
      rectanglePrimitive1.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        1.0,
      );

      const rectanglePrimitive2 = createRectangle(rectangle, 1000.0);
      rectanglePrimitive2.appearance.material.uniforms.color = new Color(
        0.0,
        1.0,
        0.0,
        0.5,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive1);
      primitives.add(rectanglePrimitive2);

      scene.camera.setView({ destination: rectangle });
      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).not.toEqual(0);
        expect(rgba[1]).not.toEqual(0);
        expect(rgba[2]).toEqual(0);
      });

      primitives.raiseToTop(rectanglePrimitive1);
      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).not.toEqual(0);
        expect(rgba[1]).not.toEqual(0);
        expect(rgba[2]).toEqual(0);
      });
    });

    it("opaque/translucent render order (2)", function () {
      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);

      const rectanglePrimitive1 = createRectangle(rectangle, 1000.0);
      rectanglePrimitive1.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        1.0,
      );

      const rectanglePrimitive2 = createRectangle(rectangle);
      rectanglePrimitive2.appearance.material.uniforms.color = new Color(
        0.0,
        1.0,
        0.0,
        0.5,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive1);
      primitives.add(rectanglePrimitive2);

      scene.camera.setView({ destination: rectangle });
      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).not.toEqual(0);
        expect(rgba[1]).toEqual(0);
        expect(rgba[2]).toEqual(0);
      });

      primitives.raiseToTop(rectanglePrimitive1);
      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).not.toEqual(0);
        expect(rgba[1]).toEqual(0);
        expect(rgba[2]).toEqual(0);
      });
    });

    it("renders with OIT and without FXAA", function () {
      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);

      const rectanglePrimitive = createRectangle(rectangle, 1000.0);
      rectanglePrimitive.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        0.5,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive);

      scene.camera.setView({ destination: rectangle });
      scene.postProcessStages.fxaa.enabled = false;
      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).not.toEqual(0);
        expect(rgba[1]).toEqual(0);
        expect(rgba[2]).toEqual(0);
      });
    });

    it("renders with forced FXAA", function () {
      const context = scene.context;

      // Workaround for Firefox on Mac, which does not support RGBA + depth texture
      // attachments, which is allowed by the spec.
      if (context.depthTexture) {
        const framebuffer = new Framebuffer({
          context: context,
          colorTextures: [
            new Texture({
              context: context,
              width: 1,
              height: 1,
              pixelFormat: PixelFormat.RGBA,
              pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
            }),
          ],
          depthTexture: new Texture({
            context: context,
            width: 1,
            height: 1,
            pixelFormat: PixelFormat.DEPTH_COMPONENT,
            pixelDatatype: PixelDatatype.UNSIGNED_SHORT,
          }),
        });

        const status = framebuffer.status;
        framebuffer.destroy();

        if (status !== WebGLConstants.FRAMEBUFFER_COMPLETE) {
          return;
        }
      }

      if (defined(scene._oit)) {
        scene._oit._translucentMRTSupport = false;
        scene._oit._translucentMultipassSupport = false;
      }

      scene.postProcessStages.fxaa.enabled = false;

      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);

      const rectanglePrimitive = createRectangle(rectangle, 1000.0);
      rectanglePrimitive.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        1.0,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive);

      scene.camera.setView({ destination: rectangle });

      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).not.toEqual(0);
        expect(rgba[1]).toEqual(0);
        expect(rgba[2]).toEqual(0);
      });
    });

    it("setting a globe", function () {
      const ellipsoid = Ellipsoid.UNIT_SPHERE;
      const globe = new Globe(ellipsoid);
      scene.globe = globe;

      expect(scene.globe).toBe(globe);
    });

    it("sets verticalExaggeration and verticalExaggerationRelativeHeight", function () {
      expect(scene.verticalExaggeration).toEqual(1.0);
      expect(scene.verticalExaggerationRelativeHeight).toEqual(0.0);

      scene.verticalExaggeration = 2.0;
      scene.verticalExaggerationRelativeHeight = 100000.0;

      expect(scene.verticalExaggeration).toEqual(2.0);
      expect(scene.verticalExaggerationRelativeHeight).toEqual(100000.0);
    });

    it("destroys primitive on set globe", function () {
      const globe = new Globe(Ellipsoid.UNIT_SPHERE);

      scene.globe = globe;
      expect(globe.isDestroyed()).toEqual(false);

      scene.globe = undefined;
      expect(globe.isDestroyed()).toEqual(true);
    });

    describe("render tests", function () {
      let s;

      beforeEach(function () {
        s = createScene();
      });

      afterEach(function () {
        s.destroyForSpecs();
      });

      it("renders a globe", function () {
        s.globe = new Globe(Ellipsoid.UNIT_SPHERE);
        s.camera.position = new Cartesian3(1.02, 0.0, 0.0);
        s.camera.up = Cartesian3.clone(Cartesian3.UNIT_Z);
        s.camera.direction = Cartesian3.negate(
          Cartesian3.normalize(s.camera.position, new Cartesian3()),
          new Cartesian3(),
        );

        return expect(s).toRenderAndCall(function () {
          render(s.frameState, s.globe);
          const pixel = s._context.readPixels();
          const blankPixel = [0, 0, 0, 0];
          expect(pixel).not.toEqual(blankPixel);
        });
      });

      it("renders sky atmosphere without a globe", function () {
        s.globe = new Globe(Ellipsoid.UNIT_SPHERE);
        s.globe.show = false;
        s.camera.position = new Cartesian3(1.02, 0.0, 0.0);
        s.camera.up = Cartesian3.clone(Cartesian3.UNIT_Z);
        s.camera.direction = Cartesian3.negate(
          Cartesian3.normalize(s.camera.position, new Cartesian3()),
          new Cartesian3(),
        );

        return expect(s).toRenderAndCall(function () {
          render(s.frameState, s.globe);
          const pixel = s._context.readPixels();
          const blankPixel = [0, 0, 0, 0];
          expect(pixel).not.toEqual(blankPixel);
        });
      });

      it("renders a globe with an ElevationContour", function () {
        s.globe = new Globe(Ellipsoid.UNIT_SPHERE);
        s.globe.material = Material.fromType("ElevationContour");
        s.camera.position = new Cartesian3(1.02, 0.0, 0.0);
        s.camera.up = Cartesian3.clone(Cartesian3.UNIT_Z);
        s.camera.direction = Cartesian3.negate(
          Cartesian3.normalize(s.camera.position, new Cartesian3()),
          new Cartesian3(),
        );

        return expect(s).toRenderAndCall(function () {
          render(s.frameState, s.globe);
          const pixel = s._context.readPixels();
          const blankPixel = [0, 0, 0, 0];
          expect(pixel).not.toEqual(blankPixel);
        });
      });

      it("renders a globe with a SlopeRamp", function () {
        s.globe = new Globe(Ellipsoid.UNIT_SPHERE);
        s.globe.material = Material.fromType("SlopeRamp");
        s.camera.position = new Cartesian3(1.02, 0.0, 0.0);
        s.camera.up = Cartesian3.clone(Cartesian3.UNIT_Z);
        s.camera.direction = Cartesian3.negate(
          Cartesian3.normalize(s.camera.position, new Cartesian3()),
          new Cartesian3(),
        );

        return expect(s).toRenderAndCall(function () {
          render(s.frameState, s.globe);
          const pixel = s._context.readPixels();
          const blankPixel = [0, 0, 0, 0];
          expect(pixel).not.toEqual(blankPixel);
        });
      });

      it("renders a globe with AspectRamp", function () {
        s.globe = new Globe(Ellipsoid.UNIT_SPHERE);
        s.globe.material = Material.fromType("AspectRamp");
        s.camera.position = new Cartesian3(1.02, 0.0, 0.0);
        s.camera.up = Cartesian3.clone(Cartesian3.UNIT_Z);
        s.camera.direction = Cartesian3.negate(
          Cartesian3.normalize(s.camera.position, new Cartesian3()),
          new Cartesian3(),
        );
        return expect(s).toRenderAndCall(function () {
          render(s.frameState, s.globe);
          const pixel = s._context.readPixels();
          const blankPixel = [0, 0, 0, 0];
          expect(pixel).not.toEqual(blankPixel);
        });
      });

      it("renders a globe with a ElevationRamp", function () {
        s.globe = new Globe(Ellipsoid.UNIT_SPHERE);
        s.globe.material = Material.fromType("ElevationRamp");
        s.camera.position = new Cartesian3(1.02, 0.0, 0.0);
        s.camera.up = Cartesian3.clone(Cartesian3.UNIT_Z);
        s.camera.direction = Cartesian3.negate(
          Cartesian3.normalize(s.camera.position, new Cartesian3()),
          new Cartesian3(),
        );

        return expect(s).toRenderAndCall(function () {
          render(s.frameState, s.globe);
          const pixel = s._context.readPixels();
          const blankPixel = [0, 0, 0, 0];
          expect(pixel).not.toEqual(blankPixel);
        });
      });

      it("renders a globe with an ElevationBand", function () {
        s.globe = new Globe(Ellipsoid.UNIT_SPHERE);
        s.globe.material = Material.fromType("ElevationBand");
        s.camera.position = new Cartesian3(1.02, 0.0, 0.0);
        s.camera.up = Cartesian3.clone(Cartesian3.UNIT_Z);
        s.camera.direction = Cartesian3.negate(
          Cartesian3.normalize(s.camera.position, new Cartesian3()),
          new Cartesian3(),
        );

        return expect(s).toRenderAndCall(function () {
          render(s.frameState, s.globe);
          const pixel = s._context.readPixels();
          const blankPixel = [0, 0, 0, 0];
          expect(pixel).not.toEqual(blankPixel);
        });
      });
    });

    it("renders with multipass OIT if MRT is available", function () {
      if (!scene.context.drawBuffers || !defined(scene._oit)) {
        return;
      }
      scene._oit._translucentMRTSupport = false;
      scene._oit._translucentMultipassSupport = true;

      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);

      const rectanglePrimitive = createRectangle(rectangle, 1000.0);
      rectanglePrimitive.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        0.5,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive);

      scene.camera.setView({ destination: rectangle });

      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).not.toEqual(0);
        expect(rgba[1]).toEqual(0);
        expect(rgba[2]).toEqual(0);
      });
    });

    it("renders with alpha blending if floating point textures are available", function () {
      if (!scene.context.floatingPointTexture || !defined(scene._oit)) {
        return;
      }
      scene._oit._translucentMRTSupport = false;
      scene._oit._translucentMultipassSupport = false;

      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);

      const rectanglePrimitive = createRectangle(rectangle, 1000.0);
      rectanglePrimitive.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        0.5,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive);

      scene.camera.setView({ destination: rectangle });

      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).not.toEqual(0);
        expect(rgba[1]).toEqual(0);
        expect(rgba[2]).toEqual(0);
      });
    });

    it("renders map twice when in 2D", function () {
      scene.morphTo2D(0.0);

      const rectangle = Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0);

      const rectanglePrimitive1 = createRectangle(rectangle, 0.0);
      rectanglePrimitive1.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        1.0,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive1);

      scene.camera.setView({
        destination: new Cartesian3(
          Ellipsoid.WGS84.maximumRadius * Math.PI + 10000.0,
          0.0,
          10.0,
        ),
        convert: false,
      });

      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).not.toEqual(0);
        expect(rgba[1]).toEqual(0);
        expect(rgba[2]).toEqual(0);
      });
    });

    it("renders map when the camera is on the IDL in 2D", function () {
      const s = createScene({
        canvas: createCanvas(5, 5),
      });
      s.morphTo2D(0.0);

      const rectangle = Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0);

      const rectanglePrimitive1 = createRectangle(rectangle, 0.0);
      rectanglePrimitive1.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        1.0,
      );

      const primitives = s.primitives;
      primitives.add(rectanglePrimitive1);

      s.camera.setView({
        destination: new Cartesian3(
          Ellipsoid.WGS84.maximumRadius * Math.PI,
          0.0,
          10.0,
        ),
        convert: false,
      });

      expect(s).toRenderAndCall(function (rgba) {
        expect(rgba[0]).not.toEqual(0);
        expect(rgba[1]).toEqual(0);
        expect(rgba[2]).toEqual(0);
      });

      s.destroyForSpecs();
    });

    it("renders with HDR when available", function () {
      if (!scene.highDynamicRangeSupported) {
        return;
      }

      scene.highDynamicRange = true;

      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);

      const rectanglePrimitive = createRectangle(rectangle, 1000.0);
      rectanglePrimitive.appearance.material.uniforms.color = new Color(
        4.0,
        0.0,
        0.0,
        1.0,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive);

      scene.camera.setView({ destination: rectangle });

      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).toBeGreaterThan(0);
        expect(rgba[0]).toBeLessThanOrEqual(255);
        expect(rgba[1]).toEqualEpsilon(223, 1);
        expect(rgba[2]).toEqualEpsilon(223, 1);
      });
    });

    it("copies the globe depth", function () {
      if (!scene.context.depthTexture) {
        return;
      }
      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);

      const rectanglePrimitive = createRectangle(rectangle, 1000.0);
      rectanglePrimitive.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        0.5,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive);

      scene.camera.setView({ destination: rectangle });

      const uniformState = scene.context.uniformState;

      expect(scene).toRenderAndCall(function (rgba) {
        expect(uniformState.globeDepthTexture).toBeDefined();
      });
    });

    it("pickPosition", function () {
      if (!scene.pickPositionSupported) {
        return;
      }

      const rectangle = Rectangle.fromDegrees(-0.0001, -0.0001, 0.0001, 0.0001);
      scene.camera.setView({ destination: rectangle });

      const canvas = scene.canvas;
      const windowPosition = new Cartesian2(
        canvas.clientWidth / 2,
        canvas.clientHeight / 2,
      );

      expect(scene).toRenderAndCall(function () {
        const position = scene.pickPosition(windowPosition);
        expect(position).not.toBeDefined();

        const rectanglePrimitive = createRectangle(rectangle);
        rectanglePrimitive.appearance.material.uniforms.color = new Color(
          1.0,
          0.0,
          0.0,
          1.0,
        );

        const primitives = scene.primitives;
        primitives.add(rectanglePrimitive);
      });

      expect(scene).toRenderAndCall(function () {
        const position = scene.pickPosition(windowPosition);
        expect(position.x).toBeGreaterThan(Ellipsoid.WGS84.minimumRadius);
        expect(position.y).toEqualEpsilon(0.0, CesiumMath.EPSILON5);
        expect(position.z).toEqualEpsilon(0.0, CesiumMath.EPSILON5);
      });
    });

    it("pickPosition in CV", function () {
      if (!scene.pickPositionSupported) {
        return;
      }

      scene.morphToColumbusView(0.0);

      const rectangle = Rectangle.fromDegrees(-0.0001, -0.0001, 0.0001, 0.0001);
      scene.camera.setView({ destination: rectangle });

      const canvas = scene.canvas;
      const windowPosition = new Cartesian2(
        canvas.clientWidth / 2,
        canvas.clientHeight / 2,
      );

      expect(scene).toRenderAndCall(function () {
        const position = scene.pickPosition(windowPosition);
        expect(position).not.toBeDefined();

        const rectanglePrimitive = createRectangle(rectangle);
        rectanglePrimitive.appearance.material.uniforms.color = new Color(
          1.0,
          0.0,
          0.0,
          1.0,
        );

        const primitives = scene.primitives;
        primitives.add(rectanglePrimitive);
      });

      expect(scene).toRenderAndCall(function () {
        const position = scene.pickPosition(windowPosition);
        expect(position.x).toBeGreaterThan(Ellipsoid.WGS84.minimumRadius);
        expect(position.y).toEqualEpsilon(0.0, CesiumMath.EPSILON5);
        expect(position.z).toEqualEpsilon(0.0, CesiumMath.EPSILON5);
      });
    });

    it("pickPosition in 2D", function () {
      if (!scene.pickPositionSupported) {
        return;
      }

      scene.morphTo2D(0.0);

      const rectangle = Rectangle.fromDegrees(-0.0001, -0.0001, 0.0001, 0.0001);
      scene.camera.setView({ destination: rectangle });

      const canvas = scene.canvas;
      const windowPosition = new Cartesian2(
        canvas.clientWidth / 2,
        canvas.clientHeight / 2,
      );

      expect(scene).toRenderAndCall(function () {
        const position = scene.pickPosition(windowPosition);
        expect(position).not.toBeDefined();

        const rectanglePrimitive = createRectangle(rectangle);
        rectanglePrimitive.appearance.material.uniforms.color = new Color(
          1.0,
          0.0,
          0.0,
          1.0,
        );

        const primitives = scene.primitives;
        primitives.add(rectanglePrimitive);
      });

      expect(scene).toRenderAndCall(function () {
        const position = scene.pickPosition(windowPosition);
        expect(position.x).toBeGreaterThan(Ellipsoid.WGS84.minimumRadius);
        expect(position.y).toEqualEpsilon(0.0, CesiumMath.EPSILON5);
        expect(position.z).toEqualEpsilon(0.0, CesiumMath.EPSILON5);
      });
    });

    it("pickPosition returns undefined when useDepthPicking is false", function () {
      if (!scene.pickPositionSupported) {
        return;
      }

      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);
      scene.camera.setView({
        destination: rectangle,
      });

      const canvas = scene.canvas;
      const windowPosition = new Cartesian2(
        canvas.clientWidth / 2,
        canvas.clientHeight / 2,
      );

      const rectanglePrimitive = createRectangle(rectangle);
      rectanglePrimitive.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        1.0,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive);

      scene.useDepthPicking = false;
      expect(scene).toRenderAndCall(function () {
        const position = scene.pickPosition(windowPosition);
        expect(position).not.toBeDefined();
      });

      scene.useDepthPicking = true;
      expect(scene).toRenderAndCall(function () {
        const position = scene.pickPosition(windowPosition);
        expect(position).toBeDefined();
      });
    });

    it("pickPosition picks translucent geometry when pickTranslucentDepth is true", function () {
      if (!scene.pickPositionSupported) {
        return;
      }

      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);
      scene.camera.setView({
        destination: rectangle,
      });

      const canvas = scene.canvas;
      const windowPosition = new Cartesian2(
        canvas.clientWidth / 2,
        canvas.clientHeight / 2,
      );

      const rectanglePrimitive = scene.primitives.add(
        createRectangle(rectangle),
      );
      rectanglePrimitive.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        0.5,
      );

      scene.useDepthPicking = true;
      scene.pickTranslucentDepth = false;
      expect(scene).toRenderAndCall(function () {
        const position = scene.pickPosition(windowPosition);
        expect(position).not.toBeDefined();
      });

      scene.pickTranslucentDepth = true;
      expect(scene).toRenderAndCall(function () {
        const position = scene.pickPosition(windowPosition);
        expect(position).toBeDefined();
      });
    });

    it("pickPosition caches results per frame", function () {
      if (!scene.pickPositionSupported) {
        return;
      }

      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);
      scene.camera.setView({ destination: rectangle });

      const canvas = scene.canvas;
      const windowPosition = new Cartesian2(
        canvas.clientWidth / 2,
        canvas.clientHeight / 2,
      );
      spyOn(
        SceneTransforms,
        "transformWindowToDrawingBuffer",
      ).and.callThrough();

      expect(scene).toRenderAndCall(function () {
        scene.pickPosition(windowPosition);
        expect(
          SceneTransforms.transformWindowToDrawingBuffer,
        ).toHaveBeenCalled();

        scene.pickPosition(windowPosition);
        expect(
          SceneTransforms.transformWindowToDrawingBuffer.calls.count(),
        ).toEqual(1);

        const rectanglePrimitive = createRectangle(rectangle);
        rectanglePrimitive.appearance.material.uniforms.color = new Color(
          1.0,
          0.0,
          0.0,
          1.0,
        );

        const primitives = scene.primitives;
        primitives.add(rectanglePrimitive);
      });

      expect(scene).toRenderAndCall(function () {
        scene.pickPosition(windowPosition);
        expect(
          SceneTransforms.transformWindowToDrawingBuffer.calls.count(),
        ).toEqual(2);

        scene.pickPosition(windowPosition);
        expect(
          SceneTransforms.transformWindowToDrawingBuffer.calls.count(),
        ).toEqual(2);
      });
    });

    it("pickPosition throws without windowPosition", function () {
      expect(function () {
        scene.pickPosition();
      }).toThrowDeveloperError();
    });

    it("isDestroyed", function () {
      const s = createScene();
      expect(s.isDestroyed()).toEqual(false);
      s.destroyForSpecs();
      expect(s.isDestroyed()).toEqual(true);
    });

    it("raises renderError when render throws", function () {
      const s = createScene({
        rethrowRenderErrors: false,
      });

      const spyListener = jasmine.createSpy("listener");
      s.renderError.addEventListener(spyListener);

      const error = "foo";
      s.primitives.update = function () {
        throw error;
      };

      s.render();

      expect(spyListener).toHaveBeenCalledWith(s, error);

      s.destroyForSpecs();
    });

    it("a render error is rethrown if rethrowRenderErrors is true", function () {
      scene.rethrowRenderErrors = true;

      const spyListener = jasmine.createSpy("listener");
      scene.renderError.addEventListener(spyListener);

      const error = new RuntimeError("error");
      scene.primitives.update = function () {
        throw error;
      };

      expect(function () {
        scene.render();
      }).toThrowError(RuntimeError);

      expect(spyListener).toHaveBeenCalledWith(scene, error);
    });

    it("always raises preUpdate event prior to updating", function () {
      const spyListener = jasmine.createSpy("listener");
      scene.preUpdate.addEventListener(spyListener);

      scene.render();

      expect(spyListener.calls.count()).toBe(1);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      scene.render();

      expect(spyListener.calls.count()).toBe(2);
    });

    it("always raises postUpdate event after updating", function () {
      const spyListener = jasmine.createSpy("listener");
      scene.postUpdate.addEventListener(spyListener);

      scene.render();

      expect(spyListener.calls.count()).toBe(1);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      scene.render();

      expect(spyListener.calls.count()).toBe(2);
    });

    it("raises the preRender event prior to rendering only if the scene renders", function () {
      const spyListener = jasmine.createSpy("listener");
      scene.preRender.addEventListener(spyListener);

      scene.render();

      expect(spyListener.calls.count()).toBe(1);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      scene.render();

      expect(spyListener.calls.count()).toBe(1);
    });

    it("raises the postRender event after rendering if the scene rendered", function () {
      const spyListener = jasmine.createSpy("listener");
      scene.postRender.addEventListener(spyListener);

      scene.render();

      expect(spyListener.calls.count()).toBe(1);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      scene.render();

      expect(spyListener.calls.count()).toBe(1);
    });

    it("raises the cameraMoveStart event after moving the camera", function () {
      scene.render();

      const spyListener = jasmine.createSpy("listener");
      scene.camera.moveStart.addEventListener(spyListener);
      scene._cameraStartFired = false; // reset this value after camera changes for initial render trigger the event

      scene.camera.moveLeft();
      scene.render();

      expect(spyListener.calls.count()).toBe(1);
    });

    it("raises the cameraMoveEvent event when the camera stops moving", function () {
      scene.render();

      const spyListener = jasmine.createSpy("listener");
      scene.camera.moveEnd.addEventListener(spyListener);

      // We use negative time here to ensure the event runs on the next frame.
      scene.cameraEventWaitTime = -1.0;
      scene.camera.moveLeft();
      // The first render will trigger the moveStart event.
      scene.render();
      // The second will trigger the moveEnd.
      scene.render();

      expect(spyListener.calls.count()).toBe(1);
    });

    it("raises the camera changed event on direction changed", function () {
      const spyListener = jasmine.createSpy("listener");
      scene.camera.changed.addEventListener(spyListener);

      scene.initializeFrame();
      scene.render();

      scene.camera.lookLeft(
        scene.camera.frustum.fov * (scene.camera.percentageChanged + 0.1),
      );

      scene.initializeFrame();
      scene.render();

      expect(spyListener.calls.count()).toBe(1);

      const args = spyListener.calls.allArgs();
      expect(args.length).toEqual(1);
      expect(args[0].length).toEqual(1);
      expect(args[0][0]).toBeGreaterThan(scene.camera.percentageChanged);
    });

    it("raises the camera changed event on heading changed when looking up", function () {
      const spyListener = jasmine.createSpy("listener");

      scene.camera.lookUp(0.785398);
      scene.camera.changed.addEventListener(spyListener);

      scene.initializeFrame();
      scene.render();

      scene.camera.twistLeft(
        CesiumMath.PI * (scene.camera.percentageChanged + 0.1),
      );

      scene.initializeFrame();
      scene.render();

      expect(spyListener.calls.count()).toBe(1);

      const args = spyListener.calls.allArgs();
      expect(args.length).toEqual(1);
      expect(args[0].length).toEqual(1);
      expect(args[0][0]).toBeGreaterThan(scene.camera.percentageChanged);
    });
    it("raises the camera changed event on roll changed", function () {
      const spyListener = jasmine.createSpy("listener");
      scene.camera.changed.addEventListener(spyListener);

      scene.initializeFrame();
      scene.render();

      scene.camera.twistLeft(
        CesiumMath.PI * (scene.camera.percentageChanged + 0.1),
      );

      scene.initializeFrame();
      scene.render();

      expect(spyListener.calls.count()).toBe(1);

      const args = spyListener.calls.allArgs();
      expect(args.length).toEqual(1);
      expect(args[0].length).toEqual(1);
      expect(args[0][0]).toBeGreaterThan(scene.camera.percentageChanged);
    });
    it("raises the camera changed event on position changed", function () {
      const spyListener = jasmine.createSpy("listener");
      scene.camera.changed.addEventListener(spyListener);

      scene.initializeFrame();
      scene.render();

      scene.camera.moveUp(
        scene.camera.positionCartographic.height *
          (scene.camera.percentageChanged + 0.1),
      );

      scene.initializeFrame();
      scene.render();

      expect(spyListener.calls.count()).toBe(1);

      const args = spyListener.calls.allArgs();
      expect(args.length).toEqual(1);
      expect(args[0].length).toEqual(1);
      expect(args[0][0]).toBeGreaterThan(scene.camera.percentageChanged);
    });

    it("raises the camera changed event in 2D", function () {
      scene.morphTo2D(0);

      const spyListener = jasmine.createSpy("listener");
      scene.camera.changed.addEventListener(spyListener);

      scene.initializeFrame();
      scene.render();

      scene.camera.moveLeft(
        scene.camera.positionCartographic.height *
          (scene.camera.percentageChanged + 0.1),
      );

      scene.initializeFrame();
      scene.render();

      expect(spyListener.calls.count()).toBe(1);

      const args = spyListener.calls.allArgs();
      expect(args.length).toEqual(1);
      expect(args[0].length).toEqual(1);
      expect(args[0][0]).toBeGreaterThan(scene.camera.percentageChanged);
    });

    it("get maximumAliasedLineWidth", function () {
      expect(scene.maximumAliasedLineWidth).toBeGreaterThanOrEqual(1);
    });

    it("get maximumCubeMapSize", function () {
      expect(scene.maximumCubeMapSize).toBeGreaterThanOrEqual(16);
    });

    it("does not throw with debugShowCommands", function () {
      if (!scene.context.drawBuffers) {
        return;
      }
      scene.debugShowCommands = true;

      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);

      const rectanglePrimitive = createRectangle(rectangle, 1000.0);
      rectanglePrimitive.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        0.5,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive);

      scene.camera.setView({ destination: rectangle });

      expect(function () {
        scene.renderForSpecs();
      }).not.toThrowError(RuntimeError);
    });

    it("does not throw with debugShowFrustums", function () {
      if (!scene.context.drawBuffers) {
        return;
      }
      scene.debugShowFrustums = true;

      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);

      const rectanglePrimitive = createRectangle(rectangle, 1000.0);
      rectanglePrimitive.appearance.material.uniforms.color = new Color(
        1.0,
        0.0,
        0.0,
        0.5,
      );

      const primitives = scene.primitives;
      primitives.add(rectanglePrimitive);

      scene.camera.setView({ destination: rectangle });

      expect(function () {
        scene.renderForSpecs();
      }).not.toThrowError(RuntimeError);
    });

    it("throws when minimumDisableDepthTestDistance is set less than 0.0", function () {
      expect(function () {
        scene.minimumDisableDepthTestDistance = -1.0;
      }).toThrowDeveloperError();
    });

    it("converts to canvas coordinates", function () {
      const mockPosition = new Cartesian3();
      spyOn(SceneTransforms, "worldToWindowCoordinates");
      scene.cartesianToCanvasCoordinates(mockPosition);

      expect(SceneTransforms.worldToWindowCoordinates).toHaveBeenCalledWith(
        scene,
        mockPosition,
        undefined,
      );
    });

    it("converts to canvas coordinates and return it in a variable", function () {
      const result = new Cartesian2();
      const mockPosition = new Cartesian3();
      spyOn(SceneTransforms, "worldToWindowCoordinates");
      scene.cartesianToCanvasCoordinates(mockPosition, result);

      expect(SceneTransforms.worldToWindowCoordinates).toHaveBeenCalledWith(
        scene,
        mockPosition,
        result,
      );
    });

    it("Gets imageryLayers", function () {
      const globe = (scene.globe = new Globe(Ellipsoid.UNIT_SPHERE));
      expect(scene.imageryLayers).toBe(globe.imageryLayers);

      scene.globe = undefined;
      expect(scene.imageryLayers).toBeUndefined();
    });

    it("Gets terrainProvider", function () {
      const globe = (scene.globe = new Globe(Ellipsoid.UNIT_SPHERE));
      expect(scene.terrainProvider).toBe(globe.terrainProvider);

      scene.globe = undefined;
      expect(scene.terrainProvider).toBeUndefined();
    });

    it("Sets terrainProvider", async function () {
      returnQuantizedMeshTileJson();

      const globe = (scene.globe = new Globe(Ellipsoid.UNIT_SPHERE));
      scene.terrainProvider =
        await CesiumTerrainProvider.fromUrl("//terrain/tiles");

      expect(scene.terrainProvider).toBe(globe.terrainProvider);
      scene.globe = undefined;
      const newProvider =
        await CesiumTerrainProvider.fromUrl("//newTerrain/tiles");
      expect(function () {
        scene.terrainProvider = newProvider;
      }).not.toThrow();

      Resource._Implementations.loadWithXhr =
        Resource._DefaultImplementations.loadWithXhr;
    });

    it("setTerrain updates terrain provider", async function () {
      returnQuantizedMeshTileJson();

      const globe = (scene.globe = new Globe(Ellipsoid.UNIT_SPHERE));
      const promise = CesiumTerrainProvider.fromUrl("//terrain/tiles");
      scene.setTerrain(new Terrain(promise));

      const originalProvider = scene.terrainProvider;
      let terrainWasChanged = false;
      scene.terrainProviderChanged.addEventListener((terrainProvider) => {
        expect(terrainProvider).not.toBe(originalProvider);
        expect(scene.terrainProvider).toBe(terrainProvider);
        expect(scene.terrainProvider).toBe(globe.terrainProvider);
        terrainWasChanged = true;
      });

      await promise;

      expect(terrainWasChanged).toBeTrue();

      Resource._Implementations.loadWithXhr =
        Resource._DefaultImplementations.loadWithXhr;
    });

    it("setTerrain handles destroy", async function () {
      const scene = createScene();
      returnQuantizedMeshTileJson();

      scene.globe = new Globe(Ellipsoid.UNIT_SPHERE);

      const promise = CesiumTerrainProvider.fromUrl("//newTerrain/tiles");
      scene.setTerrain(new Terrain(promise));
      scene.destroyForSpecs();

      await expectAsync(promise).toBeResolved();
      expect(scene.isDestroyed()).toBeTrue();

      Resource._Implementations.loadWithXhr =
        Resource._DefaultImplementations.loadWithXhr;
    });

    it("Gets terrainProviderChanged", function () {
      const globe = (scene.globe = new Globe(Ellipsoid.UNIT_SPHERE));
      expect(scene.terrainProviderChanged).toBe(globe.terrainProviderChanged);

      scene.globe = undefined;
      expect(scene.terrainProviderChanged).toBeUndefined();
    });

    it("Sets material", function () {
      const globe = (scene.globe = new Globe(Ellipsoid.UNIT_SPHERE));
      const material = Material.fromType("ElevationContour");
      globe.material = material;
      expect(globe.material).toBe(material);

      globe.material = undefined;
      expect(globe.material).toBeUndefined();
    });

    const scratchTime = new JulianDate();

    it("doesn't render scene if requestRenderMode is enabled", function () {
      scene.renderForSpecs();

      const lastFrameNumber = scene.frameState.frameNumber;

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;
      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).toEqual(lastFrameNumber);
    });

    it("requestRender causes a new frame to be rendered in requestRenderMode", function () {
      scene.renderForSpecs();

      const lastFrameNumber = scene.frameState.frameNumber;
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      scene.requestRender();
      expect(scene._renderRequested).toBe(true);

      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);
    });

    it("moving the camera causes a new frame to be rendered in requestRenderMode", function () {
      scene.renderForSpecs();

      const lastFrameNumber = scene.frameState.frameNumber;
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      scene.camera.moveLeft();

      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);
    });

    it("changing the camera frustum does not cause continuous rendering in requestRenderMode", function () {
      scene.renderForSpecs();

      let lastFrameNumber = scene.frameState.frameNumber;
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      scene.camera.frustum.near *= 1.1;

      // Render once properly
      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);

      // Render again - but this time nothing should happen.
      lastFrameNumber = scene.frameState.frameNumber;
      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).toEqual(lastFrameNumber);
    });

    it("successful completed requests causes a new frame to be rendered in requestRenderMode", function () {
      scene.renderForSpecs();

      const lastFrameNumber = scene.frameState.frameNumber;
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      RequestScheduler.requestCompletedEvent.raiseEvent();

      scene.renderForSpecs();

      expect(scene._renderRequested).toBe(true);

      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);
    });

    it("data returning from a web worker causes a new frame to be rendered in requestRenderMode", function () {
      scene.renderForSpecs();

      const lastFrameNumber = scene.frameState.frameNumber;
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      TaskProcessor.taskCompletedEvent.raiseEvent();

      scene.renderForSpecs();

      expect(scene._renderRequested).toBe(true);

      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);
    });

    it("Executing an after render function causes a new frame to be rendered in requestRenderMode", function () {
      scene.renderForSpecs();

      const lastFrameNumber = scene.frameState.frameNumber;
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      let functionCalled = false;
      scene._frameState.afterRender.push(function () {
        functionCalled = true;
        return true;
      });

      scene.renderForSpecs();

      expect(functionCalled).toBe(true);
      expect(scene._renderRequested).toBe(true);

      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);
    });

    it("Globe tile loading triggers a new frame to be rendered in requestRenderMode", function () {
      scene.renderForSpecs();

      let lastFrameNumber = scene.frameState.frameNumber;
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      const ellipsoid = Ellipsoid.UNIT_SPHERE;
      const globe = new Globe(ellipsoid);
      scene.globe = globe;

      scene.requestRender();
      Object.defineProperty(globe, "tilesLoaded", { value: false });
      scene.renderForSpecs();
      lastFrameNumber = scene.frameState.frameNumber;

      expect(scene._renderRequested).toBe(true);
      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);
    });

    it("Globe imagery updates triggers a new frame to be rendered in requestRenderMode", function () {
      scene.renderForSpecs();

      const lastFrameNumber = scene.frameState.frameNumber;
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      const ellipsoid = Ellipsoid.UNIT_SPHERE;
      const globe = new Globe(ellipsoid);
      scene.globe = globe;
      globe.imageryLayersUpdatedEvent.raiseEvent();

      scene.renderForSpecs();

      expect(scene._renderRequested).toBe(true);

      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);
    });

    it("Globe changing terrain providers triggers a new frame to be rendered in requestRenderMode", function () {
      scene.renderForSpecs();

      const lastFrameNumber = scene.frameState.frameNumber;
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      const ellipsoid = Ellipsoid.UNIT_SPHERE;
      const globe = new Globe(ellipsoid);
      scene.globe = globe;
      globe.terrainProviderChanged.raiseEvent();

      scene.renderForSpecs();

      expect(scene._renderRequested).toBe(true);

      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);
    });

    it("scene morphing causes a new frame to be rendered in requestRenderMode", function () {
      scene.renderForSpecs();

      let lastFrameNumber = scene.frameState.frameNumber;
      let lastRenderTime = JulianDate.clone(scene.lastRenderTime, scratchTime);
      expect(lastRenderTime).toBeDefined();
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      scene.morphTo2D(1.0);
      scene.renderForSpecs(
        JulianDate.addSeconds(lastRenderTime, 0.5, new JulianDate()),
      );
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);

      scene.completeMorph();
      scene.renderForSpecs();
      lastFrameNumber = scene.frameState.frameNumber;

      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).toEqual(lastFrameNumber);
      lastFrameNumber = scene.frameState.frameNumber;
      lastRenderTime = JulianDate.clone(scene.lastRenderTime, scratchTime);

      scene.morphToColumbusView(1.0);
      scene.renderForSpecs(
        JulianDate.addSeconds(lastRenderTime, 0.5, new JulianDate()),
      );
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);

      scene.completeMorph();
      scene.renderForSpecs();
      lastFrameNumber = scene.frameState.frameNumber;

      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).toEqual(lastFrameNumber);
      lastFrameNumber = scene.frameState.frameNumber;
      lastRenderTime = JulianDate.clone(scene.lastRenderTime, scratchTime);

      scene.morphTo3D(1.0);
      scene.renderForSpecs(
        JulianDate.addSeconds(lastRenderTime, 0.5, new JulianDate()),
      );
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);

      scene.completeMorph();
      scene.renderForSpecs();
      lastFrameNumber = scene.frameState.frameNumber;

      scene.renderForSpecs();
      expect(scene.frameState.frameNumber).toEqual(lastFrameNumber);
    });

    it("time change exceeding maximumRenderTimeChange causes a new frame to be rendered in requestRenderMode", function () {
      scene.renderForSpecs();

      const lastFrameNumber = scene.frameState.frameNumber;
      const lastRenderTime = JulianDate.clone(
        scene.lastRenderTime,
        scratchTime,
      );
      expect(lastRenderTime).toBeDefined();
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;

      scene.renderForSpecs(lastRenderTime);
      expect(scene.frameState.frameNumber).toEqual(lastFrameNumber);

      scene.maximumRenderTimeChange = 100.0;

      scene.renderForSpecs(
        JulianDate.addSeconds(lastRenderTime, 50.0, new JulianDate()),
      );
      expect(scene.frameState.frameNumber).toEqual(lastFrameNumber);

      scene.renderForSpecs(
        JulianDate.addSeconds(lastRenderTime, 150.0, new JulianDate()),
      );
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);
    });

    it("undefined maximumRenderTimeChange will not cause a new frame to be rendered in requestRenderMode", function () {
      scene.renderForSpecs();

      const lastFrameNumber = scene.frameState.frameNumber;
      const lastRenderTime = JulianDate.clone(
        scene.lastRenderTime,
        scratchTime,
      );
      expect(lastRenderTime).toBeDefined();
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      const farFuture = JulianDate.addDays(
        lastRenderTime,
        10000,
        new JulianDate(),
      );

      scene.renderForSpecs();
      scene.renderForSpecs(farFuture);

      expect(scene.frameState.frameNumber).toEqual(lastFrameNumber);
    });

    it("forceRender renders a scene regardless of whether a render was requested", function () {
      scene.renderForSpecs();

      const lastFrameNumber = scene.frameState.frameNumber;
      expect(scene._renderRequested).toBe(false);

      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = undefined;

      scene.forceRender();
      expect(scene.frameState.frameNumber).not.toEqual(lastFrameNumber);
    });

    function getFrustumCommandsLength(scene, pass) {
      let commandsLength = 0;
      const frustumCommandsList = scene.frustumCommandsList;
      const frustumsLength = frustumCommandsList.length;
      for (let i = 0; i < frustumsLength; ++i) {
        const frustumCommands = frustumCommandsList[i];
        for (let j = 0; j < Pass.NUMBER_OF_PASSES; ++j) {
          if (!defined(pass) || j === pass) {
            commandsLength += frustumCommands.indices[j];
          }
        }
      }
      return commandsLength;
    }

    it("occludes primitive", function () {
      scene.globe = new Globe(Ellipsoid.WGS84);

      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);
      const rectanglePrimitive = createRectangle(rectangle, 10);
      scene.primitives.add(rectanglePrimitive);

      scene.camera.setView({
        destination: new Cartesian3(
          -588536.1057451078,
          -10512475.371849751,
          6737159.100747835,
        ),
        orientation: new HeadingPitchRoll(
          6.283185307179586,
          -1.5688261558859757,
          0.0,
        ),
      });
      scene.renderForSpecs();
      expect(getFrustumCommandsLength(scene)).toBe(1);

      scene.camera.setView({
        destination: new Cartesian3(
          -5754647.167415793,
          14907694.100240812,
          -483807.2406259497,
        ),
        orientation: new HeadingPitchRoll(
          6.283185307179586,
          -1.5698869547885104,
          0.0,
        ),
      });
      scene.renderForSpecs();
      expect(getFrustumCommandsLength(scene)).toBe(0);

      // Still on opposite side of globe but now show is false, the command should not be occluded anymore
      scene.globe.show = false;
      scene.renderForSpecs();
      expect(getFrustumCommandsLength(scene)).toBe(1);
    });

    it("does not occlude if DrawCommand.occlude is false", function () {
      scene.globe = new Globe(Ellipsoid.WGS84);

      const rectangle = Rectangle.fromDegrees(-100.0, 30.0, -90.0, 40.0);
      const rectanglePrimitive = createRectangle(rectangle, 10);
      scene.primitives.add(rectanglePrimitive);

      scene.renderForSpecs();
      rectanglePrimitive._colorCommands[0].occlude = false;

      scene.camera.setView({
        destination: new Cartesian3(
          -5754647.167415793,
          14907694.100240812,
          -483807.2406259497,
        ),
        orientation: new HeadingPitchRoll(
          6.283185307179586,
          -1.5698869547885104,
          0.0,
        ),
      });
      scene.renderForSpecs();
      expect(getFrustumCommandsLength(scene)).toBe(1);
    });

    it("sets light", function () {
      const uniformState = scene.context.uniformState;
      const lightDirectionWC = uniformState._lightDirectionWC;
      const sunDirectionWC = uniformState._sunDirectionWC;
      const lightColor = uniformState._lightColor;
      const lightColorHdr = uniformState._lightColorHdr;

      // Default light is a sun light
      scene.renderForSpecs();
      expect(lightDirectionWC).toEqual(sunDirectionWC);
      expect(lightColor).toEqual(new Cartesian3(1.0, 1.0, 1.0));
      expect(lightColorHdr).toEqual(new Cartesian3(2.0, 2.0, 2.0));

      // Test directional light
      scene.light = new DirectionalLight({
        direction: new Cartesian3(1.0, 0.0, 0.0),
        color: Color.RED,
        intensity: 2.0,
      });
      scene.renderForSpecs();
      expect(lightDirectionWC).toEqual(new Cartesian3(-1.0, 0.0, 0.0)); // Negated because the uniform is the direction to the light, not from the light
      expect(lightColor).toEqual(new Cartesian3(1.0, 0.0, 0.0));
      expect(lightColorHdr).toEqual(new Cartesian3(2.0, 0.0, 0.0));

      // Test sun light
      scene.light = new SunLight({
        color: Color.BLUE,
        intensity: 0.5,
      });
      scene.renderForSpecs();
      expect(lightDirectionWC).toEqual(sunDirectionWC);
      expect(lightColor).toEqual(new Cartesian3(0.0, 0.0, 0.5));
      expect(lightColorHdr).toEqual(new Cartesian3(0.0, 0.0, 0.5));

      // Test light set to undefined
      scene.light = undefined;
      scene.renderForSpecs();
      expect(lightDirectionWC).toEqual(sunDirectionWC);
      expect(lightColor).toEqual(new Cartesian3(1.0, 1.0, 1.0));
      expect(lightColorHdr).toEqual(new Cartesian3(2.0, 2.0, 2.0));
    });

    function updateGlobeUntilDone(scene) {
      return pollToPromise(function () {
        scene.renderForSpecs();
        return scene.globe.tilesLoaded;
      });
    }

    it("detects when camera is underground", async function () {
      const globe = new Globe();
      scene.globe = globe;

      scene.camera.setView({
        destination: new Rectangle(0.0001, 0.0001, 0.003, 0.003),
      });
      await updateGlobeUntilDone(scene);
      expect(scene.cameraUnderground).toBe(false);

      // Look underground
      scene.camera.setView({
        destination: new Cartesian3(
          -746658.0557573901,
          -5644191.0002196245,
          2863585.099969967,
        ),
        orientation: new HeadingPitchRoll(
          0.3019699121236403,
          0.07316306869231592,
          0.0007089903642230055,
        ),
      });
      await updateGlobeUntilDone(scene);
      expect(scene.cameraUnderground).toBe(true);
    });

    it("detects that camera is above ground if globe is undefined", function () {
      scene.renderForSpecs();
      expect(scene.cameraUnderground).toBe(false);
    });

    it("detects that camera is above ground if scene mode is 2D", function () {
      const globe = new Globe();
      scene.globe = globe;
      scene.morphTo2D(0.0);
      expect(scene.cameraUnderground).toBe(false);
    });

    it("detects that camera is above ground if scene mode is morphing", function () {
      const globe = new Globe();
      scene.globe = globe;
      scene.morphTo2D(1.0);
      expect(scene.cameraUnderground).toBe(false);
    });

    it("detects that camera is underground in Columbus View", async function () {
      const globe = new Globe();
      scene.globe = globe;

      // Look underground
      scene.camera.setView({
        destination: new Cartesian3(
          -4643042.379120885,
          4314056.579506199,
          -451828.8968118975,
        ),
        orientation: new HeadingPitchRoll(
          6.283185307179586,
          -0.7855491933100796,
          6.283185307179586,
        ),
      });
      scene.morphToColumbusView(0.0);

      await updateGlobeUntilDone(scene);
      scene.renderForSpecs();
      expect(scene.cameraUnderground).toBe(true);
    });

    it("does not occlude primitives when camera is underground", async function () {
      const globe = new Globe();
      scene.globe = globe;
      scene.fog.density = 0.0004;

      // A primitive at height -25000.0 is less than the minor axis for WGS84 and will get culled unless the camera is underground
      const center = Cartesian3.fromRadians(
        2.3929070618374535,
        -0.07149851443375346,
        -25000.0,
        globe.ellipsoid,
      );
      const radius = 10.0;

      const command = new DrawCommand({
        shaderProgram: getSimpleShaderProgram(),
        renderState: new RenderState(),
        pass: Pass.OPAQUE,
        boundingVolume: new BoundingSphere(center, radius),
      });

      scene.primitives.add(new CommandMockPrimitive(command));

      spyOn(DrawCommand.prototype, "execute"); // Don't execute any commands, just watch what gets added to the frustum commands list

      await updateGlobeUntilDone(scene);
      expect(getFrustumCommandsLength(scene, Pass.OPAQUE)).toBe(0);

      // Look underground at the primitive, camera height ~-24,000
      scene.camera.setView({
        destination: new Cartesian3(
          -4643042.379120885,
          4314056.579506199,
          -451828.8968118975,
        ),
        orientation: new HeadingPitchRoll(
          6.283185307179586,
          -0.7855491933100796,
          6.283185307179586,
        ),
      });
      await updateGlobeUntilDone(scene);
      scene.renderForSpecs();
      expect(getFrustumCommandsLength(scene, Pass.OPAQUE)).toBe(1);
    });

    it("does not occlude primitives when the globe is translucent", function () {
      const globe = new Globe();
      scene.globe = globe;

      // A primitive at height -25000.0 is less than the minor axis for WGS84 and will get culled unless the globe is translucent
      const center = Cartesian3.fromRadians(
        2.3929070618374535,
        -0.07149851443375346,
        -25000.0,
        globe.ellipsoid,
      );
      const radius = 10.0;

      const command = new DrawCommand({
        shaderProgram: getSimpleShaderProgram(),
        renderState: new RenderState(),
        pass: Pass.OPAQUE,
        boundingVolume: new BoundingSphere(center, radius),
      });

      scene.primitives.add(new CommandMockPrimitive(command));

      spyOn(DrawCommand.prototype, "execute"); // Don't execute any commands, just watch what gets added to the frustum commands list

      scene.renderForSpecs();
      expect(getFrustumCommandsLength(scene, Pass.OPAQUE)).toBe(0);

      scene.globe.translucency.enabled = true;
      scene.globe.translucency.frontFaceAlpha = 0.5;

      scene.renderForSpecs();
      expect(getFrustumCommandsLength(scene, Pass.OPAQUE)).toBe(1);
    });

    it("does not render environment when camera is underground and translucency is disabled", async function () {
      const globe = new Globe();
      scene.globe = globe;
      scene.sun = new Sun();

      // Look underground at the sun
      scene.camera.setView({
        destination: new Cartesian3(
          2838477.9315700866,
          -4939120.816857662,
          1978094.4576285738,
        ),
        orientation: new HeadingPitchRoll(
          5.955798516387474,
          -1.0556025616093283,
          0.39098563693868016,
        ),
      });

      await updateGlobeUntilDone(scene);
      const time = JulianDate.fromIso8601(
        "2020-04-25T03:07:26.04924034334544558Z",
      );
      globe.translucency.enabled = true;
      globe.translucency.frontFaceAlpha = 0.5;
      scene.renderForSpecs(time);

      expect(scene.environmentState.isSunVisible).toBe(true);
      globe.translucency.enabled = false;
      scene.renderForSpecs(time);
      expect(scene.environmentState.isSunVisible).toBe(false);
    });

    it("renders globe with translucency", async function () {
      const globe = new Globe();
      scene.globe = globe;

      scene.camera.setView({
        destination: new Cartesian3(
          2764681.3022502237,
          -20999839.371941473,
          14894754.464869803,
        ),
        orientation: new HeadingPitchRoll(
          6.283185307179586,
          -1.5687983447998315,
          0,
        ),
      });

      await updateGlobeUntilDone(scene);
      let opaqueColor;
      expect(scene).toRenderAndCall(function (rgba) {
        opaqueColor = rgba;
      });

      globe.translucency.enabled = true;
      globe.translucency.frontFaceAlpha = 0.5;

      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba).not.toEqual(opaqueColor);
      });
    });

    it("renders ground primitive on translucent globe", async function () {
      const globe = new Globe();
      scene.globe = globe;
      globe.baseColor = Color.BLACK;
      globe.translucency.enabled = true;
      globe.translucency.frontFaceAlpha = 0.5;

      scene.camera.setView({
        destination: new Cartesian3(
          -557278.4840232887,
          -6744284.200717078,
          2794079.461722868,
        ),
        orientation: new HeadingPitchRoll(
          6.283185307179586,
          -1.5687983448015541,
          0,
        ),
      });

      const redRectangleInstance = new GeometryInstance({
        geometry: new RectangleGeometry({
          rectangle: Rectangle.fromDegrees(-110.0, 20.0, -80.0, 25.0),
          vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(
            new Color(1.0, 0.0, 0.0, 0.5),
          ),
        },
      });

      scene.primitives.add(
        new GroundPrimitive({
          geometryInstances: [redRectangleInstance],
          appearance: new PerInstanceColorAppearance({
            closed: true,
          }),
          asynchronous: false,
        }),
      );

      await updateGlobeUntilDone(scene);
      expect(scene).toRenderAndCall(function (rgba) {
        expect(rgba[0]).toBeGreaterThan(0);
      });
    });

    it("picks ground primitive on translucent globe", async function () {
      const globe = new Globe();
      scene.globe = globe;
      globe.baseColor = Color.BLACK;
      globe.translucency.enabled = true;
      globe.translucency.frontFaceAlpha = 0.5;

      scene.camera.setView({
        destination: new Cartesian3(
          -557278.4840232887,
          -6744284.200717078,
          2794079.461722868,
        ),
        orientation: new HeadingPitchRoll(
          6.283185307179586,
          -1.5687983448015541,
          0,
        ),
      });

      const redRectangleInstance = new GeometryInstance({
        geometry: new RectangleGeometry({
          rectangle: Rectangle.fromDegrees(-110.0, 20.0, -80.0, 25.0),
          vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(
            new Color(1.0, 0.0, 0.0, 0.5),
          ),
        },
      });

      const primitive = scene.primitives.add(
        new GroundPrimitive({
          geometryInstances: [redRectangleInstance],
          appearance: new PerInstanceColorAppearance({
            closed: true,
          }),
          asynchronous: false,
        }),
      );

      await updateGlobeUntilDone(scene);
      expect(scene).toPickPrimitive(primitive);
    });

    it("updates frameState.atmosphere", function () {
      const frameState = scene.frameState;

      // Before the first render, the atmosphere has not yet been set
      expect(frameState.atmosphere).toBeUndefined();

      // On the first render, the atmosphere settings are propagated to the
      // frame state
      const originalAtmosphere = scene.atmosphere;
      scene.renderForSpecs();
      expect(frameState.atmosphere).toBe(originalAtmosphere);

      // If we change the atmosphere to a new object
      const anotherAtmosphere = new Atmosphere();
      scene.atmosphere = anotherAtmosphere;
      scene.renderForSpecs();
      expect(frameState.atmosphere).toBe(anotherAtmosphere);
    });

    function TilesetMockPrimitive() {
      this.update = function () {};
      this.destroy = function () {};
      this.show = true;
      this.isDestroyed = function () {
        return false;
      };
      this.isCesium3DTileset = true;
      this.enableCollision = false;
      this.getHeight = function () {
        return undefined;
      };
      this.updateHeight = function () {
        return function () {};
      };
    }

    it("subscribes to globe height updates when tileset is added", function () {
      const mockTileset = new TilesetMockPrimitive();
      mockTileset.enableCollision = true;
      spyOn(mockTileset, "updateHeight");

      scene.primitives.add(mockTileset);
      scene.renderForSpecs();

      expect(mockTileset.updateHeight).toHaveBeenCalled();
    });

    it("adds nested primitive collection to scene", function () {
      const expectedHeight = 100;

      const mockTileset = new TilesetMockPrimitive();
      mockTileset.enableCollision = true;
      mockTileset.getHeight = function () {
        return expectedHeight;
      };
      mockTileset.heightReference = HeightReference.CLAMP_TO_GROUND;

      const mockTileset2 = new TilesetMockPrimitive();
      mockTileset2.enableCollision = true;
      mockTileset2.getHeight = function () {
        return 80;
      };
      mockTileset2.heightReference = HeightReference.CLAMP_TO_GROUND;

      const nestedCollection = new PrimitiveCollection();
      nestedCollection.add(mockTileset);
      nestedCollection.add(mockTileset2);

      scene.primitives.add(nestedCollection);

      const actualHeight = scene.getHeight(
        scene.camera.positionCartographic,
        HeightReference.CLAMP_TO_GROUND,
      );

      expect(actualHeight).toEqual(expectedHeight);
    });
  },

  describe("pickMetadata", () => {
    // When using a WebGL stub, the functionality of reading metadata
    // values back from the frame buffer is not supported. So nearly
    // all the tests have to be skipped.
    const webglStub = !!window.webglStub;

    const defaultDate = JulianDate.fromDate(
      new Date("January 1, 2014 12:00:00 UTC"),
    );

    it("throws without windowPosition", async function () {
      const windowPosition = undefined; // For spec
      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_UINT8_SCALAR";

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      scene.initializeFrame();
      scene.render(defaultDate);
      expect(() => {
        scene.pickMetadata(windowPosition, schemaId, className, propertyName);
      }).toThrowDeveloperError();
      scene.destroyForSpecs();
    });

    it("throws without className", async function () {
      const windowPosition = new Cartesian2();
      const schemaId = undefined;
      const className = undefined; // For spec
      const propertyName = "example_UINT8_SCALAR";

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      scene.initializeFrame();
      scene.render(defaultDate);
      expect(() => {
        scene.pickMetadata(windowPosition, schemaId, className, propertyName);
      }).toThrowDeveloperError();
      scene.destroyForSpecs();
    });

    it("throws without propertyName", async function () {
      const windowPosition = new Cartesian2();
      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = undefined; // For spec

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      scene.initializeFrame();
      scene.render(defaultDate);
      expect(() => {
        scene.pickMetadata(windowPosition, schemaId, className, propertyName);
      }).toThrowDeveloperError();
      scene.destroyForSpecs();
    });

    it("returns undefined for class name that does not exist", async function () {
      const schemaId = undefined;
      const className = "exampleClass_THAT_DOES_NOT_EXIST"; // For spec
      const propertyName = "example_UINT8_SCALAR";
      const gltf = createPropertyTextureGltfScalar();

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      const windowPosition = new Cartesian2(
        Math.floor(canvasSizeX / 2),
        Math.floor(canvasSizeY / 2),
      );
      const actualMetadataValue = scene.pickMetadata(
        windowPosition,
        schemaId,
        className,
        propertyName,
      );
      expect(actualMetadataValue).toBeUndefined();
      scene.destroyForSpecs();
    });

    it("returns undefined when there is no object with metadata", async function () {
      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_UINT8_SCALAR";

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      fitCameraToUnitSquare(scene.camera);

      const windowPosition = new Cartesian2(
        Math.floor(canvasSizeX / 2),
        Math.floor(canvasSizeY / 2),
      );
      const actualMetadataValue = scene.pickMetadata(
        windowPosition,
        schemaId,
        className,
        propertyName,
      );
      expect(actualMetadataValue).toBeUndefined();
      scene.destroyForSpecs();
    });

    it("pickMetadataSchema returns undefined when there is no object with metadata", async function () {
      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      fitCameraToUnitSquare(scene.camera);

      const windowPosition = new Cartesian2(
        Math.floor(canvasSizeX / 2),
        Math.floor(canvasSizeY / 2),
      );
      const metadataSchema = scene.pickMetadataSchema(windowPosition);

      expect(metadataSchema).toBeUndefined();
      scene.destroyForSpecs();
    });

    it("pickMetadataSchema picks the metadata schema object", async function () {
      if (webglStub) {
        return;
      }

      const gltf = createPropertyTextureGltfScalar();

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const windowPosition = new Cartesian2(
        Math.floor(canvasSizeX / 2),
        Math.floor(canvasSizeY / 2),
      );

      // The pickMetadataSchema call should return the schema that
      // was defined in createPropertyTextureGltfScalar
      const metadataSchema = scene.pickMetadataSchema(windowPosition);

      expect(metadataSchema).toBeDefined();
      expect(metadataSchema.id).toEqual("ExampleSchema");
      expect(metadataSchema.classes).toBeDefined();
      scene.destroyForSpecs();
    });

    it("picks UINT8 SCALAR from a property texture", async function () {
      if (webglStub) {
        return;
      }

      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_UINT8_SCALAR";
      const gltf = createPropertyTextureGltfScalar();

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        2,
      );
      const expectedMetadataValue0 = 0;
      const expectedMetadataValue1 = 127;
      const expectedMetadataValue2 = 255;

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });

    it("picks normalized UINT8 SCALAR from a property texture", async function () {
      if (webglStub) {
        return;
      }
      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_normalized_UINT8_SCALAR";
      const classPropertyOffset = undefined;
      const classPropertyScale = undefined;
      const metadataPropertyOffset = undefined;
      const metadataPropertyScale = undefined;
      const gltf = createPropertyTextureGltfNormalizedScalar(
        classPropertyOffset,
        classPropertyScale,
        metadataPropertyOffset,
        metadataPropertyScale,
      );

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        2,
      );
      const expectedMetadataValue0 = 0.0;
      const expectedMetadataValue1 = 0.5;
      const expectedMetadataValue2 = 1.0;

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });

    it("picks normalized UINT8 SCALAR from a property texture with offset and scale in class property", async function () {
      if (webglStub) {
        return;
      }
      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_normalized_UINT8_SCALAR";
      const classPropertyOffset = 100.0;
      const classPropertyScale = 2.0;
      const metadataPropertyOffset = undefined;
      const metadataPropertyScale = undefined;
      const gltf = createPropertyTextureGltfNormalizedScalar(
        classPropertyOffset,
        classPropertyScale,
        metadataPropertyOffset,
        metadataPropertyScale,
      );

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        2,
      );
      const expectedMetadataValue0 =
        classPropertyOffset + classPropertyScale * 0.0;
      const expectedMetadataValue1 =
        classPropertyOffset + classPropertyScale * 0.5;
      const expectedMetadataValue2 =
        classPropertyOffset + classPropertyScale * 1.0;

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });

    it("picks normalized UINT8 SCALAR from a property texture with offset and scale in property texture property", async function () {
      if (webglStub) {
        return;
      }
      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_normalized_UINT8_SCALAR";
      const classPropertyOffset = 100.0;
      const classPropertyScale = 200.0;
      // These should override the values from the class property:
      const metadataPropertyOffset = 200.0;
      const metadataPropertyScale = 3.0;
      const gltf = createPropertyTextureGltfNormalizedScalar(
        classPropertyOffset,
        classPropertyScale,
        metadataPropertyOffset,
        metadataPropertyScale,
      );

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        2,
      );
      const expectedMetadataValue0 =
        metadataPropertyOffset + metadataPropertyScale * 0.0;
      const expectedMetadataValue1 =
        metadataPropertyOffset + metadataPropertyScale * 0.5;
      const expectedMetadataValue2 =
        metadataPropertyOffset + metadataPropertyScale * 1.0;

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });

    it("picks fixed length UINT8 SCALAR array from a property texture", async function () {
      if (webglStub) {
        return;
      }
      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_fixed_length_UINT8_SCALAR_array";
      const gltf = createPropertyTextureGltfScalarArray();

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        1,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        2,
        2,
      );
      const expectedMetadataValue0 = [0, 0, 0];
      const expectedMetadataValue1 = [127, 0, 127];
      const expectedMetadataValue2 = [255, 0, 255];

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });

    it("picks fixed length normalized UINT8 SCALAR array from a property texture", async function () {
      if (webglStub) {
        return;
      }
      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_fixed_length_normalized_UINT8_SCALAR_array";
      const classPropertyOffset = undefined;
      const classPropertyScale = undefined;
      const metadataPropertyOffset = undefined;
      const metadataPropertyScale = undefined;
      const gltf = createPropertyTextureGltfNormalizedScalarArray(
        classPropertyOffset,
        classPropertyScale,
        metadataPropertyOffset,
        metadataPropertyScale,
      );

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        1,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        2,
        2,
      );
      const expectedMetadataValue0 = [0, 0, 0];
      const expectedMetadataValue1 = [0.5, 0, 0.5];
      const expectedMetadataValue2 = [1.0, 0, 1.0];

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });

    it("picks UINT8 VEC2 from a property texture", async function () {
      if (webglStub) {
        return;
      }

      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_UINT8_VEC2";
      const gltf = createPropertyTextureGltfVec2();

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        1,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        2,
        2,
      );
      const expectedMetadataValue0 = new Cartesian2(0, 0);
      const expectedMetadataValue1 = new Cartesian2(127, 0);
      const expectedMetadataValue2 = new Cartesian2(255, 0);

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });

    it("picks normalized UINT8 VEC2 from a property texture", async function () {
      if (webglStub) {
        return;
      }

      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_normalized_UINT8_VEC2";
      const classPropertyOffset = undefined;
      const classPropertyScale = undefined;
      const metadataPropertyOffset = undefined;
      const metadataPropertyScale = undefined;
      const gltf = createPropertyTextureGltfNormalizedVec2(
        classPropertyOffset,
        classPropertyScale,
        metadataPropertyOffset,
        metadataPropertyScale,
      );

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        1,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        2,
        2,
      );

      const expectedMetadataValue0 = new Cartesian2(0.0, 0.0);
      const expectedMetadataValue1 = new Cartesian2(0.5, 0.0);
      const expectedMetadataValue2 = new Cartesian2(1.0, 0.0);

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });

    it("picks normalized UINT8 VEC2 from a property texture with offset and scale in class property", async function () {
      if (webglStub) {
        return;
      }

      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_normalized_UINT8_VEC2";
      const classPropertyOffset = [100.0, 200.0];
      const classPropertyScale = [2.0, 3.0];
      const metadataPropertyOffset = undefined;
      const metadataPropertyScale = undefined;
      const gltf = createPropertyTextureGltfNormalizedVec2(
        classPropertyOffset,
        classPropertyScale,
        metadataPropertyOffset,
        metadataPropertyScale,
      );

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        1,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        2,
        2,
      );

      const expectedMetadataValue0 = new Cartesian2(
        classPropertyOffset[0] + classPropertyScale[0] * 0.0,
        classPropertyOffset[1] + classPropertyScale[1] * 0.0,
      );
      const expectedMetadataValue1 = new Cartesian2(
        classPropertyOffset[0] + classPropertyScale[0] * 0.5,
        classPropertyOffset[1] + classPropertyScale[1] * 0.0,
      );
      const expectedMetadataValue2 = new Cartesian2(
        classPropertyOffset[0] + classPropertyScale[0] * 1.0,
        classPropertyOffset[1] + classPropertyScale[1] * 0.0,
      );

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });

    it("picks normalized UINT8 VEC2 from a property texture with offset and scale in property texture property", async function () {
      if (webglStub) {
        return;
      }

      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_normalized_UINT8_VEC2";
      const classPropertyOffset = [100.0, 200.0];
      const classPropertyScale = [2.0, 3.0];
      // These should override the values from the class property:
      const metadataPropertyOffset = [300.0, 400.0];
      const metadataPropertyScale = [4.0, 5.0];
      const gltf = createPropertyTextureGltfNormalizedVec2(
        classPropertyOffset,
        classPropertyScale,
        metadataPropertyOffset,
        metadataPropertyScale,
      );

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        1,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        2,
        2,
      );

      const expectedMetadataValue0 = new Cartesian2(
        metadataPropertyOffset[0] + metadataPropertyScale[0] * 0.0,
        metadataPropertyOffset[1] + metadataPropertyScale[1] * 0.0,
      );
      const expectedMetadataValue1 = new Cartesian2(
        metadataPropertyOffset[0] + metadataPropertyScale[0] * 0.5,
        metadataPropertyOffset[1] + metadataPropertyScale[1] * 0.0,
      );
      const expectedMetadataValue2 = new Cartesian2(
        metadataPropertyOffset[0] + metadataPropertyScale[0] * 1.0,
        metadataPropertyOffset[1] + metadataPropertyScale[1] * 0.0,
      );

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });

    it("picks UINT8 VEC3 from a property texture", async function () {
      if (webglStub) {
        return;
      }

      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_UINT8_VEC3";
      const gltf = createPropertyTextureGltfVec3();

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        1,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        2,
        2,
      );
      const expectedMetadataValue0 = new Cartesian3(0, 0, 0);
      const expectedMetadataValue1 = new Cartesian3(127, 0, 127);
      const expectedMetadataValue2 = new Cartesian3(255, 0, 255);

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });

    it("picks UINT8 VEC4 from a property texture", async function () {
      if (webglStub) {
        return;
      }

      const schemaId = undefined;
      const className = "exampleClass";
      const propertyName = "example_UINT8_VEC4";
      const gltf = createPropertyTextureGltfVec4();

      const canvasSizeX = textureSizeX * canvasScaling;
      const canvasSizeY = textureSizeY * canvasScaling;
      const scene = createScene({
        canvas: createCanvas(canvasSizeX, canvasSizeY),
        contextOptions: {
          requestWebgl1: true,
        },
      });

      await loadAsModel(scene, gltf);
      fitCameraToUnitSquare(scene.camera);

      scene.initializeFrame();
      scene.render(defaultDate);

      const actualMetadataValue0 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        0,
        0,
      );
      const actualMetadataValue1 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        1,
        1,
      );
      const actualMetadataValue2 = pickMetadataAt(
        scene,
        schemaId,
        className,
        propertyName,
        2,
        2,
      );

      const expectedMetadataValue0 = new Cartesian4(0, 0, 0, 0);
      const expectedMetadataValue1 = new Cartesian4(127, 0, 127, 0);
      const expectedMetadataValue2 = new Cartesian4(255, 0, 255, 0);

      expect(actualMetadataValue0).toEqualEpsilon(
        expectedMetadataValue0,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue1).toEqualEpsilon(
        expectedMetadataValue1,
        propertyValueEpsilon,
      );
      expect(actualMetadataValue2).toEqualEpsilon(
        expectedMetadataValue2,
        propertyValueEpsilon,
      );
      scene.destroyForSpecs();
    });
  }),
  "WebGL",
);
