import h337 from "@mars3d/heatmap.js";
import BoundingSphere from "../../Core/BoundingSphere.js";
import Cartesian3 from "../../Core/Cartesian3.js";
import Cartographic from "../../Core/Cartographic.js";
import ComponentDatatype from "../../Core/ComponentDatatype.js";
import createGuid from "../../Core/createGuid.js";
import Geometry from "../../Core/Geometry.js";
import GeometryAttribute from "../../Core/GeometryAttribute.js";
import GeometryAttributes from "../../Core/GeometryAttributes.js";
import GeometryInstance from "../../Core/GeometryInstance.js";
import CesiumMath from "../../Core/Math.js";
import Matrix3 from "../../Core/Matrix3.js";
import Matrix4 from "../../Core/Matrix4.js";
import PrimitiveType from "../../Core/PrimitiveType.js";
import Transforms from "../../Core/Transforms.js";
import Material from "../../Scene/Material.js";
import MaterialAppearance from "../../Scene/MaterialAppearance.js";
import Primitive from "../../Scene/Primitive.js";

const defaultColorGradient = {
  ".3": "blue",
  ".5": "green",
  ".7": "yellow",
  ".95": "red",
};

/**
 * 3D 热力图
 * @constructor
 *
 * @param {Viewer} viewer
 * @param {Position[]} positions
 * @param {object} options
 * @param {number} options.radius 热力点半径
 * @param {number} options.maxOpacity 最大透明度
 * @param {number} options.minOpacity 最小透明度
 * @param {number} options.blur 模糊距离
 * @param {number} options.baseElevation 最低高度
 * @param {object} options.colorGradient 颜色配置
 * @param {string} options.primitiveType 渲染方式 TRIANGLES | LINES
 */
function HeatMap(viewer, positions, options) {
  this._viewer = viewer;
  this._instanceId = createGuid();
  this._options = options || {};
  this._dataPoints = positions || [];
  this._containerElement = undefined;
  this._canvasWidth = 200;
  this._boundingBox = {}; // 四角坐标
  this._boundingRect = {}; // 经纬度范围
  this._xAxis = undefined; // x 轴
  this._yAxis = undefined; // y 轴
  this._xAxisLength = 0; // x轴长度
  this._yAxisLength = 0; // y轴长度
  this._baseElevation = this._options.baseElevation || 0;
  this._heatmapPrimitive = undefined;
  this._positionHierarchy = [];
  this._heatmapInstance = undefined;

  if (this._dataPoints.length < 2) {
    console.warn("热力图点位不得少于3个！");
    return;
  }

  this.createHeatmapContainer();

  const config = {
    container: document.getElementById(`heatmap-${this._instanceId}`),
    radius: this._options.radius ?? 20,
    maxOpacity: this._options.maxOpacity ?? 0.7,
    minOpacity: this._options.minOpacity ?? 0,
    blur: this._options.blur ?? 0.75,
    gradient: this._options.colorGradient ?? defaultColorGradient,
  };

  this._primitiveType = this._options.primitiveType || "TRIANGLES";
  this._heatmapInstance = h337.create(config);

  this.initializeHeatmap();
}

/**
 * 创建热力图画布
 * @private
 */
HeatMap.prototype.createHeatmapContainer = function () {
  this._containerElement = document.createElement("div");
  this._containerElement.id = `heatmap-${this._instanceId}`;
  this._containerElement.className = `heatmap`;
  this._containerElement.style.width = `${this._canvasWidth}px`;
  this._containerElement.style.height = `${this._canvasWidth}px`;
  this._containerElement.style.position = "absolute";
  this._containerElement.style.display = "none";
  this._viewer.container.appendChild(this._containerElement);
};

/**
 * 构建三维热力图
 * @private
 */
HeatMap.prototype.initializeHeatmap = function () {
  // 构造数组，计算数据范围
  for (let i = 0; i < this._dataPoints.length; i++) {
    const cartesianPosition = Cartesian3.fromDegrees(
      this._dataPoints[i].lng,
      this._dataPoints[i].lat,
      this._dataPoints[i].alt,
    );
    this._positionHierarchy.push(cartesianPosition);
  }

  this.computeBoundingBox(this._positionHierarchy);

  // 把数据转换成热力图要的数据格式 alt作为权重
  const heatmapPoints = this._positionHierarchy.map((position, index) => {
    const normalizedCoords = this.computeNormalizedCoordinates(position);
    return {
      x: normalizedCoords.x,
      y: normalizedCoords.y,
      value: this._dataPoints[index].alt,
    };
  });

  // 添加点，热力图绘制完成
  this._heatmapInstance.addData(heatmapPoints);

  // 构造三维热力
  const geometryInstance = new GeometryInstance({
    geometry: this.createHeatmapGeometry(),
  });

  this._heatmapPrimitive = this._viewer.scene.primitives.add(
    new Primitive({
      geometryInstances: geometryInstance,
      appearance: new MaterialAppearance({
        material: new Material({
          fabric: {
            type: "Image",
            uniforms: {
              image: this._heatmapInstance.getDataURL(),
            },
          },
        }),
        vertexShaderSource: `
          in vec3 position3DHigh;
          in vec3 position3DLow;
          in vec2 st;
          in vec3 normal;
          in float batchId;
          uniform sampler2D image_0;
          out vec3 v_positionEC;
          out vec3 v_normalEC;
          out vec2 v_st;
          void main(){
              vec4 p = czm_computePosition();
              v_normalEC = czm_normal * normal;
              v_positionEC = (czm_modelViewRelativeToEye * p).xyz;
              vec4 positionWC = czm_inverseModelView * vec4(v_positionEC, 1.0);
              v_st = st;
              vec4 color = texture(image_0, v_st);
              vec3 upDir = normalize(positionWC.xyz);
              p += vec4(color.r * upDir * 1000., 0.0);
              gl_Position = czm_modelViewProjectionRelativeToEye * p;
          }
        `,
        translucent: true,
        flat: true,
      }),
      asynchronous: false,
    }),
  );
  this._heatmapPrimitive.id = "heatmap3d";
};

HeatMap.prototype.createHeatmapGeometry = function () {
  const meshData = this.generateMeshData();
  return new Geometry({
    attributes: new GeometryAttributes({
      position: new GeometryAttribute({
        componentDatatype: ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: meshData.positions,
      }),
      st: new GeometryAttribute({
        componentDatatype: ComponentDatatype.FLOAT,
        componentsPerAttribute: 2,
        values: new Float32Array(meshData.textureCoords),
      }),
    }),
    indices: new Uint16Array(meshData.indices),
    primitiveType: PrimitiveType[this._primitiveType],
    boundingSphere: BoundingSphere.fromVertices(meshData.positions),
  });
};

HeatMap.prototype.generateMeshData = function () {
  const gridWidth = this._canvasWidth || 200;
  const gridHeight = this._canvasWidth || 200;
  const { maxLongitude, maxLatitude, minLongitude, minLatitude } =
    this._boundingRect;
  const longitudeStep = (maxLongitude - minLongitude) / gridWidth;
  const latitudeStep = (maxLatitude - minLatitude) / gridHeight;
  const positions = [];
  const textureCoords = [];
  const indices = [];

  for (let i = 0; i < gridWidth; i++) {
    const currentLongitude = minLongitude + longitudeStep * i;

    for (let j = 0; j < gridHeight; j++) {
      const currentLatitude = minLatitude + latitudeStep * j;
      const heatValue = this._heatmapInstance.getValueAt({
        x: i,
        y: j,
      });
      const cartesian3 = Cartesian3.fromDegrees(
        currentLongitude,
        currentLatitude,
        this._baseElevation + heatValue,
      );
      positions.push(cartesian3.x, cartesian3.y, cartesian3.z);
      textureCoords.push(i / gridWidth, j / gridHeight);
      if (j !== gridHeight - 1 && i !== gridWidth - 1) {
        indices.push(
          i * gridHeight + j,
          i * gridHeight + j + 1,
          (i + 1) * gridHeight + j,
        );
        indices.push(
          (i + 1) * gridHeight + j,
          (i + 1) * gridHeight + j + 1,
          i * gridHeight + j + 1,
        );
      }
    }
  }

  return {
    positions,
    textureCoords,
    indices,
  };
};

HeatMap.prototype.computeNormalizedCoordinates = function (position) {
  if (!position) {
    return;
  }
  const cartographic = Cartographic.fromCartesian(position.clone());
  cartographic.height = 0;
  position = Cartographic.toCartesian(cartographic.clone());

  const originVector = Cartesian3.subtract(
    position.clone(),
    this._boundingBox.leftTop,
    new Cartesian3(),
  );
  const xOffset = Cartesian3.dot(originVector, this._xAxis);
  const yOffset = Cartesian3.dot(originVector, this._yAxis);
  return {
    x: Number((xOffset / this._xAxisLength) * this._canvasWidth).toFixed(0),
    y: Number((yOffset / this._yAxisLength) * this._canvasWidth).toFixed(0),
  };
};

HeatMap.prototype.cartesiansToLnglats = function (cartesians) {
  if (!cartesians || cartesians.length < 1) {
    return;
  }
  const coordinates = [];
  for (let i = 0; i < cartesians.length; i++) {
    coordinates.push(this.cartesianToLnglat(cartesians[i]));
  }
  return coordinates;
};

HeatMap.prototype.cartesianToLnglat = function (cartesian) {
  if (!cartesian) {
    return [];
  }
  const cartographic = Cartographic.fromCartesian(cartesian);
  const latitude = CesiumMath.toDegrees(cartographic.latitude);
  const longitude = CesiumMath.toDegrees(cartographic.longitude);
  const height = cartographic.height;
  return [longitude, latitude, height];
};

/**
 * 计算数据范围
 * @param positions
 * @private
 */
HeatMap.prototype.computeBoundingBox = function (positions) {
  // 根据散点构造包围盒
  const boundingSphere = BoundingSphere.fromPoints(
    positions,
    new BoundingSphere(),
  );
  const centerPoint = boundingSphere.center;
  const sphereRadius = boundingSphere.radius;

  // 计算矩阵
  const modelMatrix = Transforms.eastNorthUpToFixedFrame(centerPoint.clone());
  const yAxisVector = new Cartesian3(0, 1, 0);

  const boundingVertices = [];
  for (let angle = 45; angle <= 360; angle += 90) {
    const rotationMatrix = Matrix3.fromRotationZ(
      CesiumMath.toRadians(angle),
      new Matrix3(),
    );
    let rotatedYAxis = Matrix3.multiplyByVector(
      rotationMatrix,
      yAxisVector,
      new Cartesian3(),
    );
    rotatedYAxis = Cartesian3.normalize(rotatedYAxis, new Cartesian3());
    const scaledVector = Cartesian3.multiplyByScalar(
      rotatedYAxis,
      sphereRadius,
      new Cartesian3(),
    );
    const vertex = Matrix4.multiplyByPoint(
      modelMatrix,
      scaledVector.clone(),
      new Cartesian3(),
    );

    boundingVertices.push(vertex);
  }

  const coordinates = this.cartesiansToLnglats(boundingVertices);
  let minLatitude = Number.MAX_VALUE,
    maxLatitude = Number.MIN_VALUE,
    minLongitude = Number.MAX_VALUE,
    maxLongitude = Number.MIN_VALUE;
  const vertexCount = boundingVertices.length;

  coordinates.forEach((coordinate) => {
    if (coordinate[0] < minLongitude) {
      minLongitude = coordinate[0];
    }
    if (coordinate[0] > maxLongitude) {
      maxLongitude = coordinate[0];
    }
    if (coordinate[1] < minLatitude) {
      minLatitude = coordinate[1];
    }
    if (coordinate[1] > maxLatitude) {
      maxLatitude = coordinate[1];
    }
  });

  const latitudeRange = maxLatitude - minLatitude;
  const longitudeRange = maxLongitude - minLongitude;

  this._boundingRect = {
    minLatitude: minLatitude - latitudeRange / vertexCount,
    maxLatitude: maxLatitude + latitudeRange / vertexCount,
    minLongitude: minLongitude - longitudeRange / vertexCount,
    maxLongitude: maxLongitude + longitudeRange / vertexCount,
  };

  this._boundingBox = {
    leftTop: Cartesian3.fromDegrees(
      this._boundingRect.minLongitude,
      this._boundingRect.maxLatitude,
    ),
    leftBottom: Cartesian3.fromDegrees(
      this._boundingRect.minLongitude,
      this._boundingRect.minLatitude,
    ),
    rightTop: Cartesian3.fromDegrees(
      this._boundingRect.maxLongitude,
      this._boundingRect.maxLatitude,
    ),
    rightBottom: Cartesian3.fromDegrees(
      this._boundingRect.maxLongitude,
      this._boundingRect.minLatitude,
    ),
  };

  this._xAxis = Cartesian3.subtract(
    this._boundingBox.rightTop,
    this._boundingBox.leftTop,
    new Cartesian3(),
  );
  this._xAxis = Cartesian3.normalize(this._xAxis, new Cartesian3());
  this._yAxis = Cartesian3.subtract(
    this._boundingBox.leftBottom,
    this._boundingBox.leftTop,
    new Cartesian3(),
  );
  this._yAxis = Cartesian3.normalize(this._yAxis, new Cartesian3());
  this._xAxisLength = Cartesian3.distance(
    this._boundingBox.rightTop,
    this._boundingBox.leftTop,
  );
  this._yAxisLength = Cartesian3.distance(
    this._boundingBox.leftBottom,
    this._boundingBox.leftTop,
  );
};

/**
 * 摧毁删除
 */
HeatMap.prototype.destroy = function () {
  const containerElement = document.getElementById(
    `heatmap-${this._instanceId}`,
  );
  if (containerElement) {
    containerElement.remove();
  }
  if (this._heatmapPrimitive) {
    this._viewer.scene.primitives.remove(this._heatmapPrimitive);
    this._heatmapPrimitive = undefined;
  }
};

export default HeatMap;
