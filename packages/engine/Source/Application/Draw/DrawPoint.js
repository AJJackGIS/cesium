import Cartesian3 from "../../Core/Cartesian3.js";
import ScreenSpaceEventType from "../../Core/ScreenSpaceEventType.js";
import CallbackProperty from "../../DataSources/CallbackProperty.js";
import Entity from "../../DataSources/Entity.js";
import TransformUtils from "../../Utils/TransformUtils.js";
import DrawBase from "./DrawBase.js";

/**
 * 绘制点
 * @param {Viewer} viewer
 * @param {ClampMode} clampMode
 * @param {DataSource} dataSource
 * @param {ScreenSpaceEventHandler} eventHandler
 * @param {function} callback
 * @private
 */
class DrawPoint extends DrawBase {
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

    // 鼠标移动
    this.eventHandler.setInputAction((event) => {
      position = this.pickPosition(event.endPosition);
    }, ScreenSpaceEventType.MOUSE_MOVE);

    // 鼠标点击结束
    this.eventHandler.setInputAction((event) => {
      position = this.pickPosition(event.position);
      this.callback(TransformUtils.transformCartesianToWGS84(position));
    }, ScreenSpaceEventType.LEFT_CLICK);
  }
}

export default DrawPoint;
