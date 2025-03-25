/**
 * 绘制、量算的几何对象的风格
 * @enum {number}
 */
const ClampMode = {
  /**
   * 贴地模式
   * @type {number}
   * @constant
   */
  GROUND: 0,

  /**
   * 空间模式
   * @type {number}
   * @constant
   */
  SPACE: 1,

  /**
   * 贴模型
   * @type {number}
   * @constant
   */
  TILES: 2,
};

export default ClampMode;
