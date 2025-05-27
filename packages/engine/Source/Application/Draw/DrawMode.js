/**
 * 标绘类型
 * @enum {number}
 */
const DrawMode = {
  /**
   * 点
   * @type {number}
   * @constant
   */
  POINT: 0,

  /**
   * 线
   * @type {number}
   * @constant
   */
  POLYLINE: 1,

  /**
   * 面
   * @type {number}
   * @constant
   */
  POLYGON: 2,

  /**
   * 圆形
   * @type {number}
   * @constant
   */
  CIRCLE: 3,

  /**
   * 矩形
   * @type {number}
   * @constant
   */
  RECTANGLE: 4,
};

export default Object.freeze(DrawMode);
