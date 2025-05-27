import Cartesian3 from "../../Core/Cartesian3.js";
import ScreenSpaceEventType from "../../Core/ScreenSpaceEventType.js";
import CallbackProperty from "../../DataSources/CallbackProperty.js";
import Entity from "../../DataSources/Entity.js";
import TransformUtils from "../../Utils/TransformUtils.js";
import DrawBase from "./DrawBase.js";

/**
 * 绘制线
 * @param {Viewer} viewer
 * @param {ClampMode} clampMode
 * @param {DataSource} dataSource
 * @param {ScreenSpaceEventHandler} eventHandler
 * @param {function} callback
 * @private
 */
class DrawPolyline extends DrawBase {
  constructor(viewer, clampMode, dataSource, eventHandler, callback) {
    super(viewer, clampMode, dataSource, eventHandler, callback);
  }

  addEventHandler() {
    if (this.viewer.tooltip) {
      this.viewer.tooltip.content = "单击选择点位，右击结束";
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

    // 创建线实体
    const positions = [];
    const polylineEntity = new Entity({
      polyline: {
        positions: new CallbackProperty(() => {
          return [...positions, position];
        }, false),
        ...this.style,
      },
    });
    this.dataSource.entities.add(polylineEntity);

    // 鼠标移动
    this.eventHandler.setInputAction((event) => {
      position = this.pickPosition(event.endPosition);
    }, ScreenSpaceEventType.MOUSE_MOVE);

    // 鼠标点击增加点
    this.eventHandler.setInputAction((event) => {
      positions.push(this.pickPosition(event.position));
    }, ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标右击结束
    this.eventHandler.setInputAction(() => {
      this.callback(
        TransformUtils.transformCartesianArrayToWGS84Array(positions),
      );
    }, ScreenSpaceEventType.RIGHT_CLICK);
  }
}

export default DrawPolyline;
