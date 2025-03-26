import Color from "../Core/Color.js";
import HeightReference from "../Scene/HeightReference.js";
import ClampMode from "./ClampMode.js";

/**
 * 默认样式
 */
const DEF_STYLE = {
  pixelSize: 8,
  heightReference: HeightReference.NONE,
  color: Color.RED,
  outlineColor: Color.WHITE,
  outlineWidth: 1,
  width: 3,
  material: Color.YELLOW.withAlpha(0.6),
  depthFailMaterial: Color.YELLOW.withAlpha(0.6),
  clampToGround: false,
  disableDepthTestDistance: Number.POSITIVE_INFINITY,
};

class DrawBase {
  constructor(viewer, clampMode, dataSource, eventHandler, callback) {
    this.viewer = viewer;
    this.clampMode = clampMode;
    this.dataSource = dataSource;
    this.eventHandler = eventHandler;
    this.callback = callback;

    DEF_STYLE.heightReference =
      clampMode === ClampMode.GROUND
        ? HeightReference.CLAMP_TO_GROUND
        : clampMode === ClampMode.TILES
          ? HeightReference.CLAMP_TO_3D_TILE
          : HeightReference.NONE;

    DEF_STYLE.clampToGround = clampMode === ClampMode.GROUND;

    this.style = DEF_STYLE;
  }

  /**
   * 拾取坐标
   * @param {Cartesian2} position
   * @returns {Cartesian3}
   */
  pickPosition(position) {
    if (this.clampMode === ClampMode.TILES) {
      return this.viewer.scene.pickPosition(position);
    }
    const ray = this.viewer.scene.camera.getPickRay(position);
    return this.viewer.scene.globe.pick(ray, this.viewer.scene);
  }
}

export default DrawBase;
