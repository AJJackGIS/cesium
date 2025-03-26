import Cartesian3 from "../Core/Cartesian3.js";
import ScreenSpaceEventType from "../Core/ScreenSpaceEventType.js";
import CallbackProperty from "../DataSources/CallbackProperty.js";
import Entity from "../DataSources/Entity.js";
import MathUtils from "../Utils/MathUtils.js";
import TransformUtils from "../Utils/TransformUtils.js";
import DrawBase from "./DrawBase.js";

/**
 * 绘制圆形
 * @param {Viewer} viewer
 * @param {ClampMode} clampMode
 * @param {DataSource} dataSource
 * @param {ScreenSpaceEventHandler} eventHandler
 * @param {function} callback
 * @private
 */
class DrawCircle extends DrawBase {
  constructor(viewer, clampMode, dataSource, eventHandler, callback) {
    super(viewer, clampMode, dataSource, eventHandler, callback);
  }

  addEventHandler() {
    if (this.viewer.tooltip) {
      this.viewer.tooltip.content = "单击选择点位";
    }
    // 创建鼠标跟随点
    let position = Cartesian3.ZERO;
    const moveEntity = new Entity({
      position: new CallbackProperty(() => {
        return position;
      }, false),
      point: { ...this.style },
    });
    this.dataSource.entities.add(moveEntity);

    // 圆心点
    let centerPosition;

    // 鼠标移动
    this.eventHandler.setInputAction((event) => {
      position = this.pickPosition(event.endPosition);
    }, ScreenSpaceEventType.MOUSE_MOVE);

    // 鼠标点击设置中点
    this.eventHandler.setInputAction((event) => {
      if (centerPosition) {
        const point = this.pickPosition(event.position);
        const distance = MathUtils.distance([centerPosition, point]);
        this.callback({
          center: TransformUtils.transformCartesianToWGS84(centerPosition),
          radius: distance,
        });
      } else {
        centerPosition = this.pickPosition(event.position);
        setTimeout(() => {
          // 添加圆形实体
          const circleEntity = new Entity({
            position: centerPosition,
            ellipse: {
              semiMajorAxis: new CallbackProperty(() => {
                return MathUtils.distance([centerPosition, position]);
              }, false),
              semiMinorAxis: new CallbackProperty(() => {
                return MathUtils.distance([centerPosition, position]);
              }, false),
              ...this.style,
            },
          });
          this.dataSource.entities.add(circleEntity);
        }, 100);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
  }
}

export default DrawCircle;
