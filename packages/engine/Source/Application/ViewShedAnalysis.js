import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Color from "../Core/Color.js";
import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import Frozen from "../Core/Frozen.js";
import FrustumOutlineGeometry from "../Core/FrustumOutlineGeometry.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import HeadingPitchRoll from "../Core/HeadingPitchRoll.js";
import CesiumMath from "../Core/Math.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import Quaternion from "../Core/Quaternion.js";
import ScreenSpaceEventHandler from "../Core/ScreenSpaceEventHandler.js";
import ScreenSpaceEventType from "../Core/ScreenSpaceEventType.js";
import ShowGeometryInstanceAttribute from "../Core/ShowGeometryInstanceAttribute.js";
import Transforms from "../Core/Transforms.js";
import CallbackProperty from "../DataSources/CallbackProperty.js";
import Camera from "../Scene/Camera.js";
import PerInstanceColorAppearance from "../Scene/PerInstanceColorAppearance.js";
import PostProcessStage from "../Scene/PostProcessStage.js";
import Primitive from "../Scene/Primitive.js";
import ShadowMap from "../Scene/ShadowMap.js";

/**
 * 可视域分析
 * @constructor
 *
 * @param {Viewer} viewer
 */
export default class ViewShedAnalysis {
  constructor(viewer) {
    this.viewer = viewer;
    this.viewPosition = null;
    this.viewPositionEnd = null;
    this.startPoint = null;
    this.eventHandler = new ScreenSpaceEventHandler(this.viewer.canvas);
  }

  /**
   * 开始分析
   */
  start() {
    this.viewer.canvas.style.cursor = "crosshair";

    const clickFunc = (e) => {
      this.clear();
      this.viewPosition = this.viewer.scene.pickPosition(e.position);
      this.startPoint = this.addPoint(this.viewPosition);
    };

    const mouseMoveFunc = (e) => {
      if (!this.viewPosition) {
        return;
      }

      const position = this.viewer.scene.pickPosition(e.endPosition);
      if (!position) {
        return;
      }

      if (!this.viewPositionEnd) {
        this.viewPositionEnd = position.clone();
        this.initViewShed();
      } else {
        this.viewPositionEnd = position.clone();
        this.updateViewShed();
      }
    };

    const rightClickFunc = (e) => {
      if (!this.viewPosition) {
        return;
      }

      const position = this.viewer.scene.pickPosition(e.position);
      if (!position) {
        return;
      }
      this.viewPositionEnd = position.clone();
      this.updateViewShed();
      this.viewer.canvas.style.cursor = "default";
      this.eventHandler.destroy();
    };

    this.eventHandler.setInputAction(
      clickFunc,
      ScreenSpaceEventType.LEFT_CLICK,
    );
    this.eventHandler.setInputAction(
      mouseMoveFunc,
      ScreenSpaceEventType.MOUSE_MOVE,
    );
    this.eventHandler.setInputAction(
      rightClickFunc,
      ScreenSpaceEventType.RIGHT_CLICK,
    );
  }

  /**
   * 添加点
   * @param {Cartesian3} cartesian 笛卡尔坐标
   */
  addPoint(cartesian) {
    return this.viewer.entities.add({
      position: cartesian,
      point: {
        color: Color.WHITE,
        pixelSize: 9,
        outlineColor: Color.ALICEBLUE,
        outlineWidth: 0,
        disableDepthTestDistance: 50000,
      },
    });
  }

  /**
   * 清除
   */
  clear() {
    if (this.startPoint) {
      this.viewer.entities.remove(this.startPoint);
      this.startPoint = null;
    }

    this.viewPosition = null;
    this.viewPositionEnd = null;
    this.removeViewShed();
    this.viewer.canvas.style.cursor = "default";
  }

  /**
   * 删除可视域
   */
  removeViewShed() {
    if (this.sketch) {
      this.viewer.entities.remove(this.sketch);
      this.sketch = null;
    }
    if (this.frustumOutline) {
      this.viewer.scene.primitives.remove(this.frustumOutline);
      this.frustumOutline = null;
    }
    if (this.postStage) {
      this.viewer.scene.postProcessStages.remove(this.postStage);
      this.postStage = null;
    }
  }

  /**
   * 初始化可视域
   */
  initViewShed() {
    this.initOptions();
    if (this.viewDistance > 1) {
      this.createLightCamera();
      this.createShadowMap();
      this.createPostStage();
      this.drawFrustumOutline();
      this.drawSketch();
    }
  }

  /**
   * 更新可视域
   */
  updateViewShed() {
    this.initOptions();
    this.shadowMap = null;
    this.lightCamera = null;
    this.removeViewShed();
    if (this.viewDistance > 1) {
      this.createLightCamera();
      this.createShadowMap();
      this.createPostStage();
      this.drawFrustumOutline();
      this.drawSketch();
    }
  }

  /**
   * 初始化参数
   * @param {Object} options
   */
  initOptions(options) {
    options = options ?? Frozen.EMPTY_OBJECT;
    this.viewDistance = this.viewPositionEnd
      ? Cartesian3.distance(this.viewPosition, this.viewPositionEnd)
      : (options.viewDistance ?? 100.0);
    this.viewHeading = this.viewPositionEnd
      ? this.getHeading(this.viewPosition, this.viewPositionEnd)
      : (options.viewHeading ?? 0.0);
    this.viewPitch = this.viewPositionEnd
      ? this.getPitch(this.viewPosition, this.viewPositionEnd)
      : (options.viewHeading ?? 0.0);
    this.horizontalViewAngle = options.horizontalViewAngle ?? 90.0;
    this.verticalViewAngle = options.verticalViewAngle ?? 60.0;
    this.visibleAreaColor = options.visibleAreaColor ?? Color.GREEN;
    this.invisibleAreaColor = options.invisibleAreaColor || Color.RED;
    this.enabled =
      typeof options.enabled === "boolean" ? options.enabled : true;
    this.softShadows =
      typeof options.softShadows === "boolean" ? options.softShadows : true;
    this.size = options.size || 2048;
  }

  /**
   * 创建相机
   */
  createLightCamera() {
    this.lightCamera = new Camera(this.viewer.scene);
    this.lightCamera.position = this.viewPosition;
    this.lightCamera.frustum.near = this.viewDistance * 0.001;
    this.lightCamera.frustum.far = this.viewDistance;
    const hr = CesiumMath.toRadians(this.horizontalViewAngle);
    const vr = CesiumMath.toRadians(this.verticalViewAngle);
    const aspectRatio =
      (this.viewDistance * Math.tan(hr / 2) * 2) /
      (this.viewDistance * Math.tan(vr / 2) * 2);
    this.lightCamera.frustum.aspectRatio = aspectRatio;
    if (hr > vr) {
      this.lightCamera.frustum.fov = hr;
    } else {
      this.lightCamera.frustum.fov = vr;
    }
    this.lightCamera.setView({
      destination: this.viewPosition,
      orientation: {
        heading: CesiumMath.toRadians(this.viewHeading || 0),
        pitch: CesiumMath.toRadians(this.viewPitch || 0),
        roll: 0,
      },
    });
  }

  /**
   * 创建阴影贴图
   */
  createShadowMap() {
    this.shadowMap = new ShadowMap({
      context: this.viewer.scene.context,
      lightCamera: this.lightCamera,
      enabled: this.enabled,
      isPointLight: true,
      pointLightRadius: this.viewDistance,
      cascadesEnabled: false,
      size: this.size,
      softShadows: this.softShadows,
      normalOffset: false,
      fromLightSource: false,
    });
    this.viewer.scene.shadowMap = this.shadowMap;
  }

  /**
   * 创建PostStage
   */
  createPostStage() {
    const fs = `
    #define USE_CUBE_MAP_SHADOW true
    uniform sampler2D colorTexture;
    uniform sampler2D depthTexture;
    in vec2 v_textureCoordinates;
    uniform mat4 camera_projection_matrix;
    uniform mat4 camera_view_matrix;
    uniform samplerCube shadowMap_textureCube;
    uniform mat4 shadowMap_matrix;
    uniform vec4 shadowMap_lightPositionEC;
    uniform vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness;
    uniform vec4 shadowMap_texelSizeDepthBiasAndNormalShadingSmooth;
    uniform float helsing_viewDistance;
    uniform vec4 helsing_visibleAreaColor;
    uniform vec4 helsing_invisibleAreaColor;

    struct zx_shadowParameters
    {
        vec3 texCoords;
        float depthBias;
        float depth;
        float nDotL;
        vec2 texelStepSize;
        float normalShadingSmooth;
        float darkness;
    };

    float czm_shadowVisibility(samplerCube shadowMap, zx_shadowParameters shadowParameters)
    {
        float depthBias = shadowParameters.depthBias;
        float depth = shadowParameters.depth;
        float nDotL = shadowParameters.nDotL;
        float normalShadingSmooth = shadowParameters.normalShadingSmooth;
        float darkness = shadowParameters.darkness;
        vec3 uvw = shadowParameters.texCoords;
        depth -= depthBias;
        float visibility = czm_shadowDepthCompare(shadowMap, uvw, depth);
        return czm_private_shadowVisibility(visibility, nDotL, normalShadingSmooth, darkness);
    }

    vec4 getPositionEC(){
        return czm_windowToEyeCoordinates(gl_FragCoord);
    }

    vec3 getNormalEC(){
        return vec3(1.);
    }

    vec4 toEye(in vec2 uv,in float depth){
        vec2 xy=vec2((uv.x*2.-1.),(uv.y*2.-1.));
        vec4 posInCamera=czm_inverseProjection*vec4(xy,depth,1.);
        posInCamera=posInCamera/posInCamera.w;
        return posInCamera;
    }

    vec3 pointProjectOnPlane(in vec3 planeNormal,in vec3 planeOrigin,in vec3 point){
        vec3 v01=point-planeOrigin;
        float d=dot(planeNormal,v01);
        return(point-planeNormal*d);
    }

    float getDepth(in vec4 depth){
        float z_window=czm_unpackDepth(depth);
        z_window=czm_reverseLogDepth(z_window);
        float n_range=czm_depthRange.near;
        float f_range=czm_depthRange.far;
        return(2.*z_window-n_range-f_range)/(f_range-n_range);
    }

    float shadow(in vec4 positionEC){
        vec3 normalEC=getNormalEC();
        zx_shadowParameters shadowParameters;
        shadowParameters.texelStepSize=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.xy;
        shadowParameters.depthBias=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.z;
        shadowParameters.normalShadingSmooth=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.w;
        shadowParameters.darkness=shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.w;
        vec3 directionEC=positionEC.xyz-shadowMap_lightPositionEC.xyz;
        float distance=length(directionEC);
        directionEC=normalize(directionEC);
        float radius=shadowMap_lightPositionEC.w;
        if(distance>radius)
        {
            return 2.0;
        }
        vec3 directionWC=czm_inverseViewRotation*directionEC;
        shadowParameters.depth=distance/radius-0.0003;
        shadowParameters.nDotL=clamp(dot(normalEC,-directionEC),0.,1.);
        shadowParameters.texCoords=directionWC;
        float visibility=czm_shadowVisibility(shadowMap_textureCube,shadowParameters);
        return visibility;
    }

    bool visible(in vec4 result)
    {
        result.x/=result.w;
        result.y/=result.w;
        result.z/=result.w;
        return result.x>=-1.&&result.x<=1.
        &&result.y>=-1.&&result.y<=1.
        &&result.z>=-1.&&result.z<=1.;
    }

    out vec4 fragColor;
    void main(){
        // 釉色 = 结构二维(颜色纹理, 纹理坐标)
        fragColor = texture(colorTexture, v_textureCoordinates);
        // 深度 = 获取深度(结构二维(深度纹理, 纹理坐标))
        float depth = getDepth(texture(depthTexture, v_textureCoordinates));
        // 视角 = (纹理坐标, 深度)
        vec4 viewPos = toEye(v_textureCoordinates, depth);
        // 世界坐标
        vec4 wordPos = czm_inverseView * viewPos;
        // 虚拟相机中坐标
        vec4 vcPos = camera_view_matrix * wordPos;
        float near = .001 * helsing_viewDistance;
        float dis = length(vcPos.xyz);
        if(dis > near && dis < helsing_viewDistance){
            // 透视投影
            vec4 posInEye = camera_projection_matrix * vcPos;
            // 可视区颜色
            // vec4 helsing_visibleAreaColor=vec4(0.,1.,0.,.5);
            // vec4 helsing_invisibleAreaColor=vec4(1.,0.,0.,.5);
            if(visible(posInEye)){
                float vis = shadow(viewPos);
                if(vis > 0.3){
                  fragColor = mix(fragColor,helsing_visibleAreaColor,.5);
                } else{
                  fragColor = mix(fragColor,helsing_invisibleAreaColor,.5);
                }
            }
        }
    }`;
    const postStage = new PostProcessStage({
      fragmentShader: fs,
      uniforms: {
        shadowMap_textureCube: () => {
          this.shadowMap.update(Reflect.get(this.viewer.scene, "_frameState"));
          return Reflect.get(this.shadowMap, "_shadowMapTexture");
        },
        shadowMap_matrix: () => {
          this.shadowMap.update(Reflect.get(this.viewer.scene, "_frameState"));
          return Reflect.get(this.shadowMap, "_shadowMapMatrix");
        },
        shadowMap_lightPositionEC: () => {
          this.shadowMap.update(Reflect.get(this.viewer.scene, "_frameState"));
          return Reflect.get(this.shadowMap, "_lightPositionEC");
        },
        shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: () => {
          this.shadowMap.update(Reflect.get(this.viewer.scene, "_frameState"));
          const bias = this.shadowMap._pointBias;
          return Cartesian4.fromElements(
            bias.normalOffsetScale,
            this.shadowMap._distance,
            this.shadowMap.maximumDistance,
            0.0,
            new Cartesian4(),
          );
        },
        shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: () => {
          this.shadowMap.update(Reflect.get(this.viewer.scene, "_frameState"));
          const bias = this.shadowMap._pointBias;
          const texelStepSize = new Cartesian2();
          texelStepSize.x = 1.0 / this.shadowMap._textureSize.x;
          texelStepSize.y = 1.0 / this.shadowMap._textureSize.y;

          return Cartesian4.fromElements(
            texelStepSize.x,
            texelStepSize.y,
            bias.depthBias,
            bias.normalShadingSmooth,
            new Cartesian4(),
          );
        },
        camera_projection_matrix: this.lightCamera.frustum.projectionMatrix,
        camera_view_matrix: this.lightCamera.viewMatrix,
        helsing_viewDistance: () => {
          return this.viewDistance;
        },
        helsing_visibleAreaColor: this.visibleAreaColor,
        helsing_invisibleAreaColor: this.invisibleAreaColor,
      },
    });
    this.postStage = this.viewer.scene.postProcessStages.add(postStage);
  }

  /**
   * 创建视锥线
   */
  drawFrustumOutline() {
    const scratchRight = new Cartesian3();
    const scratchRotation = new Matrix3();
    const scratchOrientation = new Quaternion();
    const direction = this.lightCamera.directionWC;
    const up = this.lightCamera.upWC;
    let right = this.lightCamera.rightWC;
    right = Cartesian3.negate(right, scratchRight);
    const rotation = scratchRotation;
    Matrix3.setColumn(rotation, 0, right, rotation);
    Matrix3.setColumn(rotation, 1, up, rotation);
    Matrix3.setColumn(rotation, 2, direction, rotation);
    const orientation = Quaternion.fromRotationMatrix(
      rotation,
      scratchOrientation,
    );
    const instance = new GeometryInstance({
      geometry: new FrustumOutlineGeometry({
        frustum: this.lightCamera.frustum,
        origin: this.viewPosition,
        orientation: orientation,
      }),
      attributes: {
        color: ColorGeometryInstanceAttribute.fromColor(Color.WHITE),
        show: new ShowGeometryInstanceAttribute(true),
      },
    });

    this.frustumOutline = this.viewer.scene.primitives.add(
      new Primitive({
        geometryInstances: [instance],
        appearance: new PerInstanceColorAppearance({
          flat: true,
          translucent: false,
        }),
      }),
    );
  }

  /**
   * 创建视网
   */
  drawSketch() {
    const update = () => {
      return Transforms.headingPitchRollQuaternion(
        this.viewPosition,
        HeadingPitchRoll.fromDegrees(
          this.viewHeading - this.horizontalViewAngle,
          this.viewPitch,
          0.0,
        ),
      );
    };
    this.sketch = this.viewer.entities.add({
      position: this.viewPosition,
      orientation: new CallbackProperty(update, false),
      ellipsoid: {
        radii: new CallbackProperty(() => {
          return new Cartesian3(
            this.viewDistance,
            this.viewDistance,
            this.viewDistance,
          );
        }, false),
        minimumClock: CesiumMath.toRadians(-this.horizontalViewAngle / 2),
        maximumClock: CesiumMath.toRadians(this.horizontalViewAngle / 2),
        minimumCone: CesiumMath.toRadians(this.verticalViewAngle + 7.75),
        maximumCone: CesiumMath.toRadians(180 - this.verticalViewAngle - 7.75),
        fill: false,
        outline: true,
        subdivisions: 256,
        stackPartitions: 64,
        slicePartitions: 64,
        outlineColor: Color.WHITE,
      },
    });
  }

  /**
   * 获取偏航角
   * @param {Cartesian3} fromPosition
   * @param {Cartesian3} toPosition
   * @returns {Number} 偏航角
   */
  getHeading(fromPosition, toPosition) {
    const finalPosition = new Cartesian3();
    const matrix4 = Transforms.eastNorthUpToFixedFrame(fromPosition);
    Matrix4.inverse(matrix4, matrix4);
    Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition);
    Cartesian3.normalize(finalPosition, finalPosition);
    return CesiumMath.toDegrees(Math.atan2(finalPosition.x, finalPosition.y));
  }

  /**
   * 获取俯仰角
   * @param {Cartesian3} fromPosition
   * @param {Cartesian3} toPosition
   * @returns {Number} 俯仰角
   */
  getPitch(fromPosition, toPosition) {
    const finalPosition = new Cartesian3();
    const matrix4 = Transforms.eastNorthUpToFixedFrame(fromPosition);
    Matrix4.inverse(matrix4, matrix4);
    Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition);
    Cartesian3.normalize(finalPosition, finalPosition);
    return CesiumMath.toDegrees(Math.asin(finalPosition.z));
  }
}
