import Transform from "../transform/Transform.js";
import Cartesian3 from "../../Core/Cartesian3.js";

/**
 * Position 类型
 * @param lng
 * @param lat
 * @param alt
 * @param heading
 * @param pitch
 * @param roll
 * @constructor
 */
class Position {
  constructor(lng, lat, alt, heading, pitch, roll) {
    this._lng = +lng || 0;
    this._lat = +lat || 0;
    this._alt = +alt || 0;
    this._heading = +heading || 0;
    this._pitch = +pitch || 0;
    this._roll = +roll || 0;
  }

  get lng() {
    return this._lng;
  }

  set lng(lng) {
    this._lng = +lng;
  }

  get lat() {
    return this._lat;
  }

  set lat(lat) {
    this._lat = +lat;
  }

  get alt() {
    return this._alt;
  }

  set alt(alt) {
    this._alt = +alt;
  }

  get heading() {
    return this._heading;
  }

  set heading(heading) {
    this._heading = +heading;
  }

  get pitch() {
    return this._pitch;
  }

  set pitch(pitch) {
    this._pitch = +pitch;
  }

  get roll() {
    return this._roll;
  }

  set roll(roll) {
    this._roll = +roll;
  }

  /**
   * fromArray
   * @param arr {number[]}
   * @returns {Position}
   */
  static fromArray(arr) {
    const position = new Position();
    if (Array.isArray(arr)) {
      position.lng = arr[0] || 0;
      position.lat = arr[1] || 0;
      position.alt = arr[2] || 0;
      position.heading = arr[3] || 0;
      position.pitch = arr[4] || 0;
      position.roll = arr[5] || 0;
    }
    return position;
  }

  /**
   * fromString
   * @param str {string}
   * @returns {Position}
   */
  static fromString(str) {
    let position = new Position();
    if (str && typeof str === "string") {
      const arr = str.split(",");
      position = this.fromArray(arr);
    }
    return position;
  }

  /**
   * fromObject
   * @param obj {Position}
   * @returns {Position}
   */
  static fromObject(obj) {
    return new Position(
      obj.lng,
      obj.lat,
      obj.alt,
      obj.heading,
      obj.pitch,
      obj.roll,
    );
  }

  /**
   * Deserialize
   * @param valStr {string}
   * @returns {Position}
   */
  static deserialize(valStr) {
    const position = new Position();
    const obj = JSON.parse(valStr);
    if (obj) {
      position.lng = obj.lng || 0;
      position.lat = obj.lat || 0;
      position.alt = obj.alt || 0;
      position.heading = obj.heading || 0;
      position.pitch = obj.pitch || 0;
      position.roll = obj.roll || 0;
    }
    return position;
  }

  /**
   * serialize
   * @returns {string}
   */
  serialize() {
    const position = new Position(
      this._lng,
      this._lat,
      this._alt,
      this._heading,
      this._pitch,
      this._roll,
    );
    return JSON.stringify(position);
  }

  /**
   * Calculate the distance between two positions
   * @param target {Position}
   * @returns {number}
   */
  distance(target) {
    if (!target || !(target instanceof Position)) {
      return 0;
    }
    return Cartesian3.distance(
      Transform.transformWGS84ToCartesian(this),
      Transform.transformWGS84ToCartesian(target),
    );
  }

  /**
   * clone a position
   * @returns {Position}
   */
  clone() {
    const position = new Position();
    position.lng = this.lng || 0;
    position.lat = this.lat || 0;
    position.alt = this.alt || 0;
    position.heading = this.heading || 0;
    position.pitch = this.pitch || 0;
    position.roll = this.roll || 0;
    return position;
  }

  /**
   * clone a position
   * @deprecated
   * @returns {Position}
   */
  copy() {
    return this.clone();
  }

  /**
   *
   * @returns {number[]}
   */
  toArray() {
    return [this.lng, this.lat, this.alt, this.heading, this.pitch, this.roll];
  }

  /**
   *
   * @returns {string}
   */
  toString() {
    return `${this.lng},${this.lat},${this.alt},${this.heading},${this.pitch},${this.roll}`;
  }

  /**
   *
   * @returns {{lng, heading, alt, roll, pitch, lat}}
   */
  toObject() {
    return {
      lng: this.lng,
      lat: this.lat,
      alt: this.alt,
      heading: this.heading,
      pitch: this.pitch,
      roll: this.roll,
    };
  }
}

export default Position;
