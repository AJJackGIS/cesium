import BoundingSphere from "../../Core/BoundingSphere.js";
import clone from "../../Core/clone.js";
import Color from "../../Core/Color.js";
import ComponentDatatype from "../../Core/ComponentDatatype.js";
import defined from "../../Core/defined.js";
import destroyObject from "../../Core/destroyObject.js";
import IndexDatatype from "../../Core/IndexDatatype.js";
import CesiumMath from "../../Core/Math.js";
import Matrix4 from "../../Core/Matrix4.js";
import PrimitiveType from "../../Core/PrimitiveType.js";
import Buffer from "../../Renderer/Buffer.js";
import BufferUsage from "../../Renderer/BufferUsage.js";
import DrawCommand from "../../Renderer/DrawCommand.js";
import Pass from "../../Renderer/Pass.js";
import RenderState from "../../Renderer/RenderState.js";
import ShaderProgram from "../../Renderer/ShaderProgram.js";
import ShaderSource from "../../Renderer/ShaderSource.js";
import VertexArray from "../../Renderer/VertexArray.js";
import Appearance from "../../Scene/Appearance.js";

function getDir(heading, pitch) {
  return [
    Math.cos(-heading) * Math.cos(-pitch),
    Math.sin(-heading) * Math.cos(-pitch),
    Math.sin(-pitch),
  ];
}

function getFov(fov, segment, index) {
  return fov * (-0.5 + index / segment);
}

function getGridDirs(fovH, fovV, segmentH, segmentV) {
  const dirs = new Float32Array((segmentH + 1) * (segmentV + 1) * 3 + 3);
  for (let i = 0; i < segmentH + 1; ++i) {
    for (let j = 0; j < segmentV + 1; ++j) {
      const dir = getDir(getFov(fovH, segmentH, i), getFov(fovV, segmentV, j));
      dirs[(j * (segmentH + 1) + i) * 3] = dir[0];
      dirs[(j * (segmentH + 1) + i) * 3 + 1] = dir[1];
      dirs[(j * (segmentH + 1) + i) * 3 + 2] = dir[2];
    }
  }

  // 增加原点
  dirs[(segmentH + 1) * (segmentV + 1) * 3] = 0;
  dirs[(segmentH + 1) * (segmentV + 1) * 3 + 1] = 0;
  dirs[(segmentH + 1) * (segmentV + 1) * 3 + 2] = 0;

  return dirs;
}

function getGridIndices(segmentH, segmentV) {
  const indices = new Uint16Array(segmentH * segmentV * 6);
  for (let i = 0; i < segmentH; ++i) {
    for (let j = 0; j < segmentV; ++j) {
      const lb = j * (segmentH + 1) + i;
      const rb = j * (segmentH + 1) + i + 1;
      const lt = (j + 1) * (segmentH + 1) + i;
      const rt = (j + 1) * (segmentH + 1) + i + 1;
      const start = (j * segmentH + i) * 6;
      indices[start] = lb;
      indices[start + 1] = rb;
      indices[start + 2] = rt;
      indices[start + 3] = lb;
      indices[start + 4] = rt;
      indices[start + 5] = lt;
    }
  }

  return indices;
}

// 线段索引的计算方法
// 顶点和面片用的一致
function getLineGridIndices(segmentH, segmentV, subsegmentH, subSegmentV) {
  const finalSegmentH = segmentH * subsegmentH;
  const finalSegmentV = segmentV * subSegmentV;
  const indices = new Uint16Array(
    (segmentH + 1) * (finalSegmentV * 2) +
      (segmentV + 1) * (finalSegmentH * 2) +
      4 * 2,
  );

  for (let i = 0; i < segmentH + 1; ++i) {
    for (let j = 0; j < finalSegmentV; ++j) {
      const fi = i * subsegmentH;
      indices[(i * finalSegmentV + j) * 2] = j * (finalSegmentH + 1) + fi;
      indices[(i * finalSegmentV + j) * 2 + 1] =
        (j + 1) * (finalSegmentH + 1) + fi;
    }
  }

  const lastIndex = (segmentH + 1) * (finalSegmentV * 2);

  for (let j = 0; j < segmentV + 1; ++j) {
    for (let i = 0; i < finalSegmentH; ++i) {
      const fj = j * subSegmentV;
      indices[lastIndex + (i + j * finalSegmentH) * 2] =
        fj * (finalSegmentH + 1) + i;
      indices[lastIndex + (i + j * finalSegmentH) * 2 + 1] =
        fj * (finalSegmentH + 1) + i + 1;
    }
  }

  const lastIndex2 =
    (segmentH + 1) * (finalSegmentV * 2) + (segmentV + 1) * (finalSegmentH * 2);

  // 和原点的联系
  const lb = 0;
  const rb = finalSegmentH;
  const lt = (finalSegmentH + 1) * finalSegmentV;
  const rt = (finalSegmentH + 1) * (finalSegmentV + 1) - 1;

  indices[lastIndex2] = lb;
  indices[lastIndex2 + 1] = (finalSegmentH + 1) * (finalSegmentV + 1);

  indices[lastIndex2 + 2] = rb;
  indices[lastIndex2 + 3] = (finalSegmentH + 1) * (finalSegmentV + 1);

  indices[lastIndex2 + 4] = lt;
  indices[lastIndex2 + 5] = (finalSegmentH + 1) * (finalSegmentV + 1);

  indices[lastIndex2 + 6] = rt;
  indices[lastIndex2 + 7] = (finalSegmentH + 1) * (finalSegmentV + 1);

  return indices;
}

const vertexShader = `
            in vec3 position;
            in vec3 normal;
            out vec3 v_positionEC;
            out vec3 v_normalEC;
            void main()
            {
                v_positionEC = (czm_modelView * vec4(position, 1.0)).xyz;       // position in eye coordinates
                v_normalEC = czm_normal * normal;                               // normal in eye coordinates
                gl_Position = czm_modelViewProjection * vec4(position, 1.0);
            }
            `;

const fragmentShader = `
            in vec3 v_positionEC;
            in vec3 v_normalEC;
            uniform vec4 color;

            void main()
            {
                vec3 positionToEyeEC = -v_positionEC;
                vec3 normalEC = normalize(v_normalEC);

            #ifdef FACE_FORWARD
                normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
            #endif

                czm_materialInput materialInput;
                materialInput.normalEC = normalEC;
                materialInput.positionToEyeEC = positionToEyeEC;
                czm_material material = czm_getDefaultMaterial(materialInput);
                material.diffuse = color.rgb;
                material.alpha = color.a;

            #ifdef FLAT
                out_FragColor = vec4(material.diffuse + material.emission, material.alpha);
            #else
                out_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
            #endif
            }
            `;

const attributeLocations = {
  position: 0,
  normal: 1,
};

// 1 自定义Primitive
class ViewshedPrimitive {
  constructor(options) {
    this.modelMatrix = options.modelMatrix ?? new Matrix4();
    this.fovH = options.fovH ?? CesiumMath.toRadians(60);
    this.fovV = options.fovV ?? CesiumMath.toRadians(30);
    this.segmentH = options.segmentH ?? 12;
    this.segmentV = options.segmentV ?? 4;
    this.subSegmentH = options.subSegmentH ?? 3;
    this.subSegmentV = options.subSegmentV ?? 3;
    this._faceColor = options.faceColor ?? new Color(0.0, 1.0, 1.0, 0.5);
    this._lineColor = options.lineColor ?? new Color(1.0, 0.0, 0.0);
    this.show = options.show ?? true;
    this._modelMatrix = Matrix4.clone(Matrix4.IDENTITY);

    this._fovH = 0.0;
    this._fovV = 0.0;
    this._segmentH = 1;
    this._segmentV = 1;
    this._subSegmentH = 1;
    this._subSegmentV = 1;

    this._boundingSphere = new BoundingSphere();
    this._initBoundingSphere = undefined;
    this._command = undefined;
  }

  // 1.9 创建command
  _createCommand(context) {
    const finalSegmentH = this._subSegmentH * this._segmentH;
    const finalSegmentV = this._subSegmentV * this._segmentV;
    const positions = getGridDirs(
      this._fovH,
      this._fovV,
      finalSegmentH,
      finalSegmentV,
    );
    const normals = getGridDirs(
      this._fovH,
      this._fovV,
      finalSegmentH,
      finalSegmentV,
    );
    const indices = getGridIndices(finalSegmentH, finalSegmentV);
    const lineIndices = getLineGridIndices(
      this._segmentH,
      this._segmentV,
      this._subSegmentH,
      this._subSegmentV,
    );

    const translucent = true;
    const closed = false;
    // 借用一下Appearance.getDefaultRenderState
    const rawRenderState = Appearance.getDefaultRenderState(
      translucent,
      closed,
      undefined,
    );
    const renderState = RenderState.fromCache(rawRenderState);

    const vertexShaderSource = new ShaderSource({
      sources: [vertexShader],
    });

    const fragmentShaderSource = new ShaderSource({
      sources: [fragmentShader],
    });

    const uniformMap = {
      color: () => this._faceColor,
    };

    const lineUniformMap = {
      color: () => this._lineColor,
    };

    const shaderProgram = ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: vertexShaderSource,
      fragmentShaderSource: fragmentShaderSource,
      attributeLocations: attributeLocations,
    });

    this._shaderprogram = shaderProgram;

    const positionBuffer = Buffer.createVertexBuffer({
      context: context,
      // sizeInBytes: 12,
      typedArray: positions,
      usage: BufferUsage.STATIC_DRAW,
    });

    const normalBuffer = Buffer.createVertexBuffer({
      context: context,
      // sizeInBytes: 12,
      typedArray: normals,
      usage: BufferUsage.STATIC_DRAW,
    });

    const indexBuffer = Buffer.createIndexBuffer({
      context: context,
      typedArray: indices,
      usage: BufferUsage.STATIC_DRAW,
      indexDatatype: IndexDatatype.UNSIGNED_SHORT,
    });

    const lineIndexBuffer = Buffer.createIndexBuffer({
      context: context,
      typedArray: lineIndices,
      usage: BufferUsage.STATIC_DRAW,
      indexDatatype: IndexDatatype.UNSIGNED_SHORT,
    });

    const vertexArray = new VertexArray({
      context: context,
      attributes: [
        {
          index: 0,
          vertexBuffer: positionBuffer,
          componentsPerAttribute: 3,
          componentDatatype: ComponentDatatype.FLOAT,
        },
        {
          index: 1,
          vertexBuffer: normalBuffer,
          componentsPerAttribute: 3,
          componentDatatype: ComponentDatatype.FLOAT,
        },
      ],
      indexBuffer: indexBuffer,
    });

    const lineVertexArray = new VertexArray({
      context: context,
      attributes: [
        {
          index: 0,
          vertexBuffer: positionBuffer,
          componentsPerAttribute: 3,
          componentDatatype: ComponentDatatype.FLOAT,
        },
        {
          index: 1,
          vertexBuffer: normalBuffer,
          componentsPerAttribute: 3,
          componentDatatype: ComponentDatatype.FLOAT,
        },
      ],
      indexBuffer: lineIndexBuffer,
    });

    this._initBoundingSphere = BoundingSphere.fromVertices(positions);

    this._command = new DrawCommand({
      vertexArray: vertexArray,
      primitiveType: PrimitiveType.TRIANGLES,
      renderState: renderState,
      shaderProgram: shaderProgram,
      uniformMap: uniformMap,
      owner: this,
      pass: Pass.TRANSLUCENT,
      modelMatrix: new Matrix4(),
      boundingVolume: new BoundingSphere(),
      cull: true,
    });

    this._lineCommand = new DrawCommand({
      vertexArray: lineVertexArray,
      primitiveType: PrimitiveType.LINES,
      renderState: renderState,
      shaderProgram: shaderProgram,
      uniformMap: lineUniformMap,
      owner: this,
      pass: Pass.TRANSLUCENT,
      modelMatrix: new Matrix4(),
      boundingVolume: new BoundingSphere(),
      cull: true,
    });
  }

  update(frameState) {
    if (!this.show) {
      return;
    }

    if (!frameState.passes.render) {
      return;
    }

    const dirty =
      this.fovH !== this._fovH ||
      this.fovV !== this._fovV ||
      this.segmentH !== this._segmentH ||
      this.segmentV !== this._segmentV ||
      this.subSegmentH !== this._subSegmentH ||
      this.subSegmentV !== this._subSegmentV;
    if (dirty) {
      this._fovH = this.fovH;
      this._fovV = this.fovV;
      this._segmentH = this.segmentH;
      this._segmentV = this.segmentV;
      this._subSegmentH = this.subSegmentH;
      this._subSegmentV = this.subSegmentV;
      this._modelMatrix = clone(Matrix4.IDENTITY);

      this._destroyVideoMemory();
    }

    if (!defined(this._command)) {
      this._createCommand(frameState.context);
    }

    if (!Matrix4.equals(this.modelMatrix, this._modelMatrix)) {
      Matrix4.clone(this.modelMatrix, this._modelMatrix);
      this._command.modelMatrix = Matrix4.IDENTITY;
      this._command.modelMatrix = this._modelMatrix;
      this._command.boundingVolume = BoundingSphere.transform(
        this._initBoundingSphere,
        this._modelMatrix,
        this._boundingSphere,
      );

      this._lineCommand.modelMatrix = Matrix4.IDENTITY;
      this._lineCommand.modelMatrix = this._modelMatrix;
      this._lineCommand.boundingVolume = BoundingSphere.transform(
        this._initBoundingSphere,
        this._modelMatrix,
        this._boundingSphere,
      );
    }

    if (this._command) {
      frameState.commandList.push(this._command);
    }
    if (this._lineCommand) {
      frameState.commandList.push(this._lineCommand);
    }
  }

  isDestroyed() {
    return false;
  }

  _destroyVideoMemory() {
    // 两个command共用了一个shaderProgram，不能销毁两次，否则报错
    this._shaderprogram = this._shaderprogram && this._shaderprogram.destroy();

    if (defined(this._command)) {
      this._command.vertexArray =
        this._command.vertexArray && this._command.vertexArray.destroy();
      this._command = undefined;
    }

    if (defined(this._lineCommand)) {
      this._lineCommand.vertexArray =
        this._lineCommand.vertexArray &&
        this._lineCommand.vertexArray.destroy();
      this._lineCommand = undefined;
    }
  }

  destroy() {
    this._destroyVideoMemory();
    return destroyObject(this);
  }
}

export default ViewshedPrimitive;
