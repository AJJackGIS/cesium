/**
 * 标绘类型
 * @enum {number}
 */
const DrawType = {
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

  /**
   * 文字
   * @type {number}
   * @constant
   */
  LABEL: 5,

  /**
   * 图片
   * @type {number}
   * @constant
   */
  IMAGE: 6,
};

export default Object.freeze(DrawType);
