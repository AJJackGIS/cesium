import {
  BoundingSphere,
  BoxGeometry,
  Cartesian2,
  Cartesian3,
  Color,
  defined,
  destroyObject,
  GeometryPipeline,
  Math as CesiumMath,
  Matrix4,
  Resource,
  BufferUsage,
  DrawCommand,
  Pass,
  RenderState,
  Sampler,
  ShaderProgram,
  VertexArray,
  BillboardCollection,
  BlendingState,
  TextureAtlas,
} from "../../index.js";

import createScene from "../../../../Specs/createScene.js";
import pollToPromise from "../../../../Specs/pollToPromise.js";

describe(
  "Scene/Multifrustum",
  function () {
    let scene;
    let primitives;
    let atlas;

    let greenImage;
    let blueImage;
    let whiteImage;

    let logDepth;

    beforeAll(function () {
      scene = createScene();
      logDepth = scene.logarithmicDepthBuffer;
      scene.destroyForSpecs();

      return Promise.all([
        Resource.fetchImage("./Data/Images/Green.png").then(function (image) {
          greenImage = image;
        }),
        Resource.fetchImage("./Data/Images/Blue.png").then(function (image) {
          blueImage = image;
        }),
        Resource.fetchImage("./Data/Images/White.png").then(function (image) {
          whiteImage = image;
        }),
      ]);
    });

    beforeEach(function () {
      scene = createScene();
      primitives = scene.primitives;

      scene.logarithmicDepthBuffer = false;

      const camera = scene.camera;
      camera.position = new Cartesian3();
      camera.direction = Cartesian3.negate(Cartesian3.UNIT_Z, new Cartesian3());
      camera.up = Cartesian3.clone(Cartesian3.UNIT_Y);
      camera.right = Cartesian3.clone(Cartesian3.UNIT_X);

      camera.frustum.near = 1.0;
      camera.frustum.far = 1000000000.0;
      camera.frustum.fov = CesiumMath.toRadians(60.0);
      camera.frustum.aspectRatio = 1.0;
    });

    afterEach(function () {
      atlas = atlas && atlas.destroy();
      scene.destroyForSpecs();
    });

    let billboard0;
    let billboard1;
    let billboard2;

    function createBillboards() {
      atlas = new TextureAtlas({
        borderWidthInPixels: 1,
        initialSize: new Cartesian2(3, 3),
        // ANGLE workaround
        sampler: Sampler.NEAREST,
      });
      let billboards = new BillboardCollection({
        textureAtlas: atlas,
      });
      billboards.destroyTextureAtlas = false;
      billboard0 = billboards.add({
        position: new Cartesian3(0.0, 0.0, -50.0),
        image: greenImage,
      });
      primitives.add(billboards);

      billboards = new BillboardCollection();
      billboards.textureAtlas = atlas;
      billboards.destroyTextureAtlas = false;
      billboard1 = billboards.add({
        position: new Cartesian3(0.0, 0.0, -50000.0),
        image: blueImage,
      });
      primitives.add(billboards);

      billboards = new BillboardCollection();
      billboards.textureAtlas = atlas;
      billboards.destroyTextureAtlas = false;
      billboard2 = billboards.add({
        position: new Cartesian3(0.0, 0.0, -50000000.0),
        image: whiteImage,
      });
      primitives.add(billboards);

      return pollToPromise(function () {
        scene.renderForSpecs();
        return billboard0.ready && billboard1.ready && billboard2.ready;
      });
    }

    it("renders primitive in closest frustum", function () {
      return createBillboards().then(function () {
        expect(scene).toRenderAndCall(function (rgba) {
          expect(rgba[0]).toEqual(0);
          expect(rgba[1]).not.toEqual(0);
          expect(rgba[2]).toEqual(0);
          expect(rgba[3]).toEqual(255);
        });

        expect(scene).toRenderAndCall(function (rgba) {
          expect(rgba[0]).toEqual(0);
          expect(rgba[1]).not.toEqual(0);
          expect(rgba[2]).toEqual(0);
          expect(rgba[3]).toEqual(255);
        });
      });
    });

    it("renders primitive in middle frustum", function () {
      return createBillboards().then(function () {
        billboard0.color = new Color(1.0, 1.0, 1.0, 0.0);

        expect(scene).toRender([0, 0, 255, 255]);
        expect(scene).toRender([0, 0, 255, 255]);
      });
    });

    it("renders primitive in last frustum", function () {
      return createBillboards().then(function () {
        const color = new Color(1.0, 1.0, 1.0, 0.0);
        billboard0.color = color;
        billboard1.color = color;

        expect(scene).toRender([255, 255, 255, 255]);
        expect(scene).toRender([255, 255, 255, 255]);
      });
    });

    it("renders primitive in last frustum with debugShowFrustums", function () {
      return createBillboards().then(function () {
        const color = new Color(1.0, 1.0, 1.0, 1.0);
        billboard0.color = color;
        billboard1.color = color;

        spyOn(DrawCommand.prototype, "execute");

        scene.debugShowFrustums = true;
        scene.renderForSpecs();

        expect(DrawCommand.prototype.execute).toHaveBeenCalled();

        const calls = DrawCommand.prototype.execute.calls.all();
        let billboardCall;
        let i;
        for (i = 0; i < calls.length; ++i) {
          if (calls[i].object.owner instanceof BillboardCollection) {
            billboardCall = calls[i];
            break;
          }
        }

        expect(billboardCall).toBeDefined();
        expect(billboardCall.args.length).toEqual(2);

        let found = false;
        const sources =
          billboardCall.object.shaderProgram.fragmentShaderSource.sources;
        for (let j = 0; j < sources.length; ++j) {
          if (sources[j].indexOf("czm_Debug_main") !== -1) {
            found = true;
            break;
          }
        }
        expect(found).toBe(true);
      });
    });

    function createPrimitive(bounded, closestFrustum) {
      bounded = bounded ?? true;
      closestFrustum = closestFrustum ?? false;

      function Primitive() {
        this._va = undefined;
        this._sp = undefined;
        this._rs = undefined;
        this._modelMatrix = Matrix4.fromTranslation(
          new Cartesian3(0.0, 0.0, -50000.0),
          new Matrix4(),
        );

        this.color = new Color(1.0, 1.0, 0.0, 1.0);

        const that = this;
        this._um = {
          u_color: function () {
            return that.color;
          },
          u_model: function () {
            return that._modelMatrix;
          },
        };
      }
      Primitive.prototype.update = function (frameState) {
        if (!defined(this._sp)) {
          const zUpdate = closestFrustum
            ? `gl_Position.z = clamp(gl_Position.z, gl_DepthRange.near, gl_DepthRange.far);`
            : ``;
          const vs = `
          in vec4 position;
          void main()
          {
              vec4 positionEC = czm_modelView * position;
              gl_Position = czm_projection * positionEC;
              ${zUpdate}
          }`;
          const fs = `
          uniform vec4 u_color;
          void main()
          {
              out_FragColor = u_color;
          }`;

          const dimensions = new Cartesian3(500000.0, 500000.0, 500000.0);
          const maximum = Cartesian3.multiplyByScalar(
            dimensions,
            0.5,
            new Cartesian3(),
          );
          const minimum = Cartesian3.negate(maximum, new Cartesian3());
          const geometry = BoxGeometry.createGeometry(
            new BoxGeometry({
              minimum: minimum,
              maximum: maximum,
            }),
          );
          const attributeLocations =
            GeometryPipeline.createAttributeLocations(geometry);
          this._va = VertexArray.fromGeometry({
            context: frameState.context,
            geometry: geometry,
            attributeLocations: attributeLocations,
            bufferUsage: BufferUsage.STATIC_DRAW,
          });

          this._sp = ShaderProgram.fromCache({
            context: frameState.context,
            vertexShaderSource: vs,
            fragmentShaderSource: fs,
            attributeLocations: attributeLocations,
          });

          this._rs = RenderState.fromCache({
            blending: BlendingState.ALPHA_BLEND,
          });
        }

        frameState.commandList.push(
          new DrawCommand({
            renderState: this._rs,
            shaderProgram: this._sp,
            vertexArray: this._va,
            uniformMap: this._um,
            modelMatrix: this._modelMatrix,
            executeInClosestFrustum: closestFrustum,
            boundingVolume: bounded
              ? new BoundingSphere(Cartesian3.clone(Cartesian3.ZERO), 500000.0)
              : undefined,
            pass: Pass.OPAQUE,
          }),
        );
      };

      Primitive.prototype.destroy = function () {
        this._va = this._va && this._va.destroy();
        this._sp = this._sp && this._sp.destroy();
        return destroyObject(this);
      };

      Primitive.prototype.isDestroyed = () => {
        return false;
      };

      return new Primitive();
    }

    it("renders primitive with undefined bounding volume", function () {
      const primitive = createPrimitive(false);
      primitives.add(primitive);

      expect(scene).toRender([255, 255, 0, 255]);
      expect(scene).toRender([255, 255, 0, 255]);
    });

    it("renders only in the closest frustum", function () {
      return createBillboards().then(function () {
        const color = new Color(1.0, 1.0, 1.0, 0.0);
        billboard0.color = color;
        billboard1.color = color;
        billboard2.color = color;

        const primitive = createPrimitive(true, true);
        primitive.color = new Color(1.0, 1.0, 0.0, 0.5);
        primitives.add(primitive);

        expect(scene).toRenderAndCall(function (rgba) {
          expect(rgba[0]).not.toEqual(0);
          expect(rgba[1]).not.toEqual(0);
          expect(rgba[2]).toEqual(0);
          expect(rgba[3]).toEqual(255);
        });

        expect(scene).toRenderAndCall(function (rgba) {
          expect(rgba[0]).not.toEqual(0);
          expect(rgba[1]).not.toEqual(0);
          expect(rgba[2]).toEqual(0);
          expect(rgba[3]).toEqual(255);
        });
      });
    });

    it("render without a central body or any primitives", function () {
      scene.renderForSpecs();
    });

    it("does not crash when near plane is greater than or equal to the far plane", function () {
      const camera = scene.camera;
      camera.frustum.far = 1000.0;
      camera.position = new Cartesian3(0.0, 0.0, 1e12);

      return createBillboards();
    });

    it("log depth uses less frustums", function () {
      if (!logDepth) {
        return;
      }

      return createBillboards().then(function () {
        scene.render();
        expect(scene.frustumCommandsList.length).toEqual(3);

        scene.logarithmicDepthBuffer = true;
        scene.render();
        expect(scene.frustumCommandsList.length).toEqual(1);
      });
    });
  },
  "WebGL",
);
