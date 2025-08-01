import {
  BoundingRectangle,
  BoundingSphere,
  Cartesian2,
  Cartesian3,
  Cartographic,
  CesiumTerrainProvider,
  Color,
  createGuid,
  DistanceDisplayCondition,
  Globe,
  Math as CesiumMath,
  NearFarScalar,
  OrthographicOffCenterFrustum,
  PerspectiveFrustum,
  Rectangle,
  Resource,
  Billboard,
  BillboardCollection,
  BlendOption,
  HeightReference,
  HorizontalOrigin,
  TextureAtlas,
  VerticalOrigin,
  SplitDirection,
} from "../../index.js";

import createScene from "../../../../Specs/createScene.js";
import pollToPromise from "../../../../Specs/pollToPromise.js";

describe("Scene/BillboardCollection", function () {
  let billboards;

  beforeEach(function () {
    billboards = new BillboardCollection();
  });

  it("constructs a default billboard", function () {
    const b = billboards.add();
    expect(b.show).toEqual(true);
    expect(b.position).toEqual(Cartesian3.ZERO);
    expect(b.pixelOffset).toEqual(Cartesian2.ZERO);
    expect(b.eyeOffset).toEqual(Cartesian3.ZERO);
    expect(b.horizontalOrigin).toEqual(HorizontalOrigin.CENTER);
    expect(b.verticalOrigin).toEqual(VerticalOrigin.CENTER);
    expect(b.scale).toEqual(1.0);
    expect(b.image).toBeUndefined();
    expect(b.color.red).toEqual(1.0);
    expect(b.color.green).toEqual(1.0);
    expect(b.color.blue).toEqual(1.0);
    expect(b.color.alpha).toEqual(1.0);
    expect(b.rotation).toEqual(0.0);
    expect(b.alignedAxis).toEqual(Cartesian3.ZERO);
    expect(b.scaleByDistance).toBeUndefined();
    expect(b.translucencyByDistance).toBeUndefined();
    expect(b.pixelOffsetScaleByDistance).toBeUndefined();
    expect(b.width).toBeUndefined();
    expect(b.height).toBeUndefined();
    expect(b.id).toBeUndefined();
    expect(b.heightReference).toEqual(HeightReference.NONE);
    expect(b.sizeInMeters).toEqual(false);
    expect(b.distanceDisplayCondition).toBeUndefined();
    expect(b.disableDepthTestDistance).toBeUndefined();
    expect(b.splitDirection).toEqual(SplitDirection.NONE);
  });

  it("explicitly constructs a billboard", function () {
    const b = billboards.add({
      show: false,
      position: new Cartesian3(1.0, 2.0, 3.0),
      pixelOffset: new Cartesian2(1.0, 2.0),
      eyeOffset: new Cartesian3(1.0, 2.0, 3.0),
      horizontalOrigin: HorizontalOrigin.LEFT,
      verticalOrigin: VerticalOrigin.BOTTOM,
      scale: 2.0,
      image: new Image(),
      color: {
        red: 1.0,
        green: 2.0,
        blue: 3.0,
        alpha: 4.0,
      },
      rotation: 1.0,
      alignedAxis: Cartesian3.UNIT_Z,
      scaleByDistance: new NearFarScalar(1.0, 3.0, 1.0e6, 0.0),
      translucencyByDistance: new NearFarScalar(1.0, 1.0, 1.0e6, 0.0),
      pixelOffsetScaleByDistance: new NearFarScalar(1.0, 1.0, 1.0e6, 0.0),
      width: 300.0,
      height: 200.0,
      sizeInMeters: true,
      distanceDisplayCondition: new DistanceDisplayCondition(10.0, 100.0),
      disableDepthTestDistance: 10.0,
      id: "id",
      splitDirection: SplitDirection.LEFT,
    });

    expect(b.show).toEqual(false);
    expect(b.position).toEqual(new Cartesian3(1.0, 2.0, 3.0));
    expect(b.pixelOffset).toEqual(new Cartesian2(1.0, 2.0));
    expect(b.eyeOffset).toEqual(new Cartesian3(1.0, 2.0, 3.0));
    expect(b.horizontalOrigin).toEqual(HorizontalOrigin.LEFT);
    expect(b.verticalOrigin).toEqual(VerticalOrigin.BOTTOM);
    expect(b.scale).toEqual(2.0);
    expect(b.image).toEqual(b._imageTexture.id);
    expect(b.color.red).toEqual(1.0);
    expect(b.color.green).toEqual(2.0);
    expect(b.color.blue).toEqual(3.0);
    expect(b.color.alpha).toEqual(4.0);
    expect(b.rotation).toEqual(1.0);
    expect(b.alignedAxis).toEqual(Cartesian3.UNIT_Z);
    expect(b.scaleByDistance).toEqual(new NearFarScalar(1.0, 3.0, 1.0e6, 0.0));
    expect(b.translucencyByDistance).toEqual(
      new NearFarScalar(1.0, 1.0, 1.0e6, 0.0),
    );
    expect(b.pixelOffsetScaleByDistance).toEqual(
      new NearFarScalar(1.0, 1.0, 1.0e6, 0.0),
    );
    expect(b.width).toEqual(300.0);
    expect(b.height).toEqual(200.0);
    expect(b.sizeInMeters).toEqual(true);
    expect(b.distanceDisplayCondition).toEqual(
      new DistanceDisplayCondition(10.0, 100.0),
    );
    expect(b.disableDepthTestDistance).toEqual(10.0);
    expect(b.id).toEqual("id");
    expect(b.splitDirection).toEqual(SplitDirection.LEFT);
  });

  it("sets billboard properties", function () {
    const b = billboards.add();
    b.show = false;
    b.position = new Cartesian3(1.0, 2.0, 3.0);
    b.pixelOffset = new Cartesian2(1.0, 2.0);
    b.eyeOffset = new Cartesian3(1.0, 2.0, 3.0);
    b.horizontalOrigin = HorizontalOrigin.LEFT;
    b.verticalOrigin = VerticalOrigin.BOTTOM;
    b.scale = 2.0;
    b.image = new Image();
    b.color = new Color(1.0, 2.0, 3.0, 4.0);
    b.rotation = 1.0;
    b.alignedAxis = Cartesian3.UNIT_Z;
    b.width = 300.0;
    b.height = 200.0;
    b.scaleByDistance = new NearFarScalar(1.0e6, 3.0, 1.0e8, 0.0);
    b.translucencyByDistance = new NearFarScalar(1.0e6, 1.0, 1.0e8, 0.0);
    b.pixelOffsetScaleByDistance = new NearFarScalar(1.0e6, 3.0, 1.0e8, 0.0);
    b.sizeInMeters = true;
    b.distanceDisplayCondition = new DistanceDisplayCondition(10.0, 100.0);
    b.disableDepthTestDistance = 10.0;
    b.splitDirection = SplitDirection.LEFT;

    expect(b.show).toEqual(false);
    expect(b.position).toEqual(new Cartesian3(1.0, 2.0, 3.0));
    expect(b.pixelOffset).toEqual(new Cartesian2(1.0, 2.0));
    expect(b.eyeOffset).toEqual(new Cartesian3(1.0, 2.0, 3.0));
    expect(b.horizontalOrigin).toEqual(HorizontalOrigin.LEFT);
    expect(b.verticalOrigin).toEqual(VerticalOrigin.BOTTOM);
    expect(b.scale).toEqual(2.0);
    expect(b.image).toEqual(b._imageTexture.id);
    expect(b.color.red).toEqual(1.0);
    expect(b.color.green).toEqual(2.0);
    expect(b.color.blue).toEqual(3.0);
    expect(b.color.alpha).toEqual(4.0);
    expect(b.rotation).toEqual(1.0);
    expect(b.alignedAxis).toEqual(Cartesian3.UNIT_Z);
    expect(b.scaleByDistance).toEqual(
      new NearFarScalar(1.0e6, 3.0, 1.0e8, 0.0),
    );
    expect(b.translucencyByDistance).toEqual(
      new NearFarScalar(1.0e6, 1.0, 1.0e8, 0.0),
    );
    expect(b.pixelOffsetScaleByDistance).toEqual(
      new NearFarScalar(1.0e6, 3.0, 1.0e8, 0.0),
    );
    expect(b.width).toEqual(300.0);
    expect(b.height).toEqual(200.0);
    expect(b.sizeInMeters).toEqual(true);
    expect(b.distanceDisplayCondition).toEqual(
      new DistanceDisplayCondition(10.0, 100.0),
    );
    expect(b.disableDepthTestDistance).toEqual(10.0);
    expect(b.splitDirection).toEqual(SplitDirection.LEFT);
  });

  it("required properties throw for undefined", function () {
    const b = billboards.add();
    b.show = false;
    b.position = new Cartesian3(1.0, 2.0, 3.0);
    b.pixelOffset = new Cartesian2(1.0, 2.0);
    b.eyeOffset = new Cartesian3(1.0, 2.0, 3.0);
    b.horizontalOrigin = HorizontalOrigin.LEFT;
    b.verticalOrigin = VerticalOrigin.BOTTOM;
    b.scale = 2.0;
    b.color = new Color(1.0, 2.0, 3.0, 4.0);
    b.rotation = 1.0;
    b.alignedAxis = Cartesian3.UNIT_Z;
    b.sizeInMeters = true;

    expect(function () {
      b.show = undefined;
    }).toThrowDeveloperError();
    expect(function () {
      b.position = undefined;
    }).toThrowDeveloperError();
    expect(function () {
      b.pixelOffset = undefined;
    }).toThrowDeveloperError();
    expect(function () {
      b.eyeOffset = undefined;
    }).toThrowDeveloperError();
    expect(function () {
      b.horizontalOrigin = undefined;
    }).toThrowDeveloperError();
    expect(function () {
      b.verticalOrigin = undefined;
    }).toThrowDeveloperError();
    expect(function () {
      b.scale = undefined;
    }).toThrowDeveloperError();
    expect(function () {
      b.color = undefined;
    }).toThrowDeveloperError();
    expect(function () {
      b.rotation = undefined;
    }).toThrowDeveloperError();
    expect(function () {
      b.alignedAxis = undefined;
    }).toThrowDeveloperError();
    expect(function () {
      b.sizeInMeters = undefined;
    }).toThrowDeveloperError();
  });

  it("optional properties handle undefined gracefully", function () {
    const b = billboards.add();
    b.image = new Image();
    b.width = 300.0;
    b.height = 200.0;
    b.scaleByDistance = new NearFarScalar(1.0e6, 3.0, 1.0e8, 0.0);
    b.translucencyByDistance = new NearFarScalar(1.0e6, 1.0, 1.0e8, 0.0);
    b.pixelOffsetScaleByDistance = new NearFarScalar(1.0e6, 3.0, 1.0e8, 0.0);
    b.distanceDisplayCondition = new DistanceDisplayCondition(10.0, 100.0);
    b.disableDepthTestDistance = 10.0;

    b.image = undefined;
    b.width = undefined;
    b.height = undefined;
    b.scaleByDistance = undefined;
    b.translucencyByDistance = undefined;
    b.pixelOffsetScaleByDistance = undefined;
    b.distanceDisplayCondition = undefined;
    b.disableDepthTestDistance = undefined;

    expect(b.image).not.toBeDefined();
    expect(b.width).not.toBeDefined();
    expect(b.height).not.toBeDefined();
    expect(b.scaleByDistance).not.toBeDefined();
    expect(b.translucencyByDistance).not.toBeDefined();
    expect(b.pixelOffsetScaleByDistance).not.toBeDefined();
    expect(b.distanceDisplayCondition).not.toBeDefined();
    expect(b.disableDepthTestDistance).not.toBeDefined();
  });

  it("properties throw for incorrect types", function () {
    const b = billboards.add();
    b.show = false;
    b.position = new Cartesian3(1.0, 2.0, 3.0);
    b.pixelOffset = new Cartesian2(1.0, 2.0);
    b.eyeOffset = new Cartesian3(1.0, 2.0, 3.0);
    b.horizontalOrigin = HorizontalOrigin.LEFT;
    b.verticalOrigin = VerticalOrigin.BOTTOM;
    b.scale = 2.0;
    b.color = new Color(1.0, 2.0, 3.0, 4.0);
    b.rotation = 1.0;
    b.alignedAxis = Cartesian3.UNIT_Z;
    b.width = 300.0;
    b.height = 200.0;
    b.scaleByDistance = new NearFarScalar(1.0e6, 3.0, 1.0e8, 0.0);
    b.translucencyByDistance = new NearFarScalar(1.0e6, 1.0, 1.0e8, 0.0);
    b.pixelOffsetScaleByDistance = new NearFarScalar(1.0e6, 3.0, 1.0e8, 0.0);
    b.sizeInMeters = true;
    b.distanceDisplayCondition = new DistanceDisplayCondition(10.0, 100.0);
    b.disableDepthTestDistance = 10.0;

    expect(function () {
      b.show = 10;
    }).toThrowDeveloperError();
    expect(function () {
      b.position = 10;
    }).toThrowDeveloperError();
    expect(function () {
      b.pixelOffset = 10;
    }).toThrowDeveloperError();
    expect(function () {
      b.eyeOffset = 10;
    }).toThrowDeveloperError();
    expect(function () {
      b.horizontalOrigin = "left";
    }).toThrowDeveloperError();
    expect(function () {
      b.verticalOrigin = "bottom";
    }).toThrowDeveloperError();
    expect(function () {
      b.scale = "scale";
    }).toThrowDeveloperError();
    expect(function () {
      b.color = 10;
    }).toThrowDeveloperError();
    expect(function () {
      b.rotation = "rotation";
    }).toThrowDeveloperError();
    expect(function () {
      b.alignedAxis = 10;
    }).toThrowDeveloperError();
    expect(function () {
      b.width = "100px";
    }).toThrowDeveloperError();
    expect(function () {
      b.height = "300px";
    }).toThrowDeveloperError();
    expect(function () {
      b.scaleByDistance = 10;
    }).toThrowDeveloperError();
    expect(function () {
      b.translucencyByDistance = 10;
    }).toThrowDeveloperError();
    expect(function () {
      b.pixelOffsetScaleByDistance = 10;
    }).toThrowDeveloperError();
    expect(function () {
      b.sizeInMeters = 10;
    }).toThrowDeveloperError();
    expect(function () {
      b.distanceDisplayCondition = 10;
    }).toThrowDeveloperError();
    expect(function () {
      b.disableDepthTestDistance = "far";
    }).toThrowDeveloperError();
  });

  it("image property setter creates image with GUID for non-uris", function () {
    const b = billboards.add();
    b.image = 42;
    expect(b.image).not.toBe(42);
    expect(b.image).toEqual(jasmine.any(String));
    const guidLength = 36; // 32 hex digits + 4 dashes
    expect(b.image.length).toBe(guidLength);
  });

  it("is not destroyed", function () {
    expect(billboards.isDestroyed()).toEqual(false);
  });

  it("disables billboard scaleByDistance", function () {
    const b = billboards.add({
      scaleByDistance: new NearFarScalar(1.0, 3.0, 1.0e6, 0.0),
    });
    b.scaleByDistance = undefined;
    expect(b.scaleByDistance).toBeUndefined();
  });

  it("disables billboard translucencyByDistance", function () {
    const b = billboards.add({
      translucencyByDistance: new NearFarScalar(1.0, 1.0, 1.0e6, 0.0),
    });
    b.translucencyByDistance = undefined;
    expect(b.translucencyByDistance).toBeUndefined();
  });

  it("disables billboard pixelOffsetScaleByDistance", function () {
    const b = billboards.add({
      pixelOffsetScaleByDistance: new NearFarScalar(1.0, 1.0, 1.0e6, 0.0),
    });
    b.pixelOffsetScaleByDistance = undefined;
    expect(b.pixelOffsetScaleByDistance).toBeUndefined();
  });

  it("throws scaleByDistance with nearDistance === farDistance", function () {
    const b = billboards.add();
    const scale = new NearFarScalar(2.0e5, 1.0, 2.0e5, 0.0);
    expect(function () {
      b.scaleByDistance = scale;
    }).toThrowDeveloperError();
  });

  it("throws new billboard with invalid scaleByDistance (nearDistance === farDistance)", function () {
    const scale = new NearFarScalar(2.0e5, 1.0, 2.0e5, 0.0);
    expect(function () {
      billboards.add({
        scaleByDistance: scale,
      });
    }).toThrowDeveloperError();
  });

  it("throws scaleByDistance with nearDistance > farDistance", function () {
    const b = billboards.add();
    const scale = new NearFarScalar(1.0e9, 1.0, 1.0e5, 1.0);
    expect(function () {
      b.scaleByDistance = scale;
    }).toThrowDeveloperError();
  });

  it("throws pixelOffsetScaleByDistance with nearDistance === farDistance", function () {
    const b = billboards.add();
    const scale = new NearFarScalar(2.0e5, 1.0, 2.0e5, 0.0);
    expect(function () {
      b.pixelOffsetScaleByDistance = scale;
    }).toThrowDeveloperError();
  });

  it("throws new billboard with invalid pixelOffsetScaleByDistance (nearDistance === farDistance)", function () {
    const scale = new NearFarScalar(2.0e5, 1.0, 2.0e5, 0.0);
    expect(function () {
      billboards.add({
        pixelOffsetScaleByDistance: scale,
      });
    }).toThrowDeveloperError();
  });

  it("throws pixelOffsetScaleByDistance with nearDistance > farDistance", function () {
    const b = billboards.add();
    const scale = new NearFarScalar(1.0e9, 1.0, 1.0e5, 1.0);
    expect(function () {
      b.pixelOffsetScaleByDistance = scale;
    }).toThrowDeveloperError();
  });

  it("throws translucencyByDistance with nearDistance === farDistance", function () {
    const b = billboards.add();
    const translucency = new NearFarScalar(2.0e5, 1.0, 2.0e5, 0.0);
    expect(function () {
      b.translucencyByDistance = translucency;
    }).toThrowDeveloperError();
  });

  it("throws new billboard with invalid translucencyByDistance (nearDistance === farDistance)", function () {
    const translucency = new NearFarScalar(2.0e5, 1.0, 2.0e5, 0.0);
    expect(function () {
      billboards.add({
        translucencyByDistance: translucency,
      });
    }).toThrowDeveloperError();
  });

  it("throws translucencyByDistance with nearDistance > farDistance", function () {
    const b = billboards.add();
    const translucency = new NearFarScalar(1.0e9, 1.0, 1.0e5, 1.0);
    expect(function () {
      b.translucencyByDistance = translucency;
    }).toThrowDeveloperError();
  });

  it("throws new billboard with invalid distanceDisplayCondition (near >= far)", function () {
    const dc = new DistanceDisplayCondition(100.0, 10.0);
    expect(function () {
      billboards.add({
        distanceDisplayCondition: dc,
      });
    }).toThrowDeveloperError();
  });

  it("throws distanceDisplayCondition with near >= far", function () {
    const b = billboards.add();
    const dc = new DistanceDisplayCondition(100.0, 10.0);
    expect(function () {
      b.distanceDisplayCondition = dc;
    }).toThrowDeveloperError();
  });

  it("throws with new billboard with disableDepthTestDistance less than 0.0", function () {
    expect(function () {
      billboards.add({
        disableDepthTestDistance: -1.0,
      });
    }).toThrowDeveloperError();
  });

  it("throws with disableDepthTestDistance set less than 0.0", function () {
    const b = billboards.add();
    expect(function () {
      b.disableDepthTestDistance = -1.0;
    }).toThrowDeveloperError();
  });

  it("sets a removed billboard property", function () {
    const b = billboards.add();
    billboards.remove(b);
    b.show = false;
    expect(b.show).toEqual(false);
  });

  it("has zero billboards when constructed", function () {
    expect(billboards.length).toEqual(0);
  });

  it("adds a billboard", function () {
    const b = billboards.add({
      position: new Cartesian3(1.0, 2.0, 3.0),
    });

    expect(billboards.length).toEqual(1);
    expect(billboards.get(0)).toEqual(b);
  });

  it("removes the first billboard", function () {
    const one = billboards.add({
      position: new Cartesian3(1.0, 2.0, 3.0),
    });
    const two = billboards.add({
      position: new Cartesian3(4.0, 5.0, 6.0),
    });

    expect(billboards.length).toEqual(2);

    expect(billboards.remove(one)).toEqual(true);

    expect(billboards.length).toEqual(1);
    expect(billboards.get(0)).toEqual(two);
  });

  it("removes the last billboard", function () {
    const one = billboards.add({
      position: new Cartesian3(1.0, 2.0, 3.0),
    });
    const two = billboards.add({
      position: new Cartesian3(4.0, 5.0, 6.0),
    });

    expect(billboards.length).toEqual(2);

    expect(billboards.remove(two)).toEqual(true);

    expect(billboards.length).toEqual(1);
    expect(billboards.get(0)).toEqual(one);
  });

  it("removes the same billboard twice", function () {
    const b = billboards.add({
      position: new Cartesian3(1.0, 2.0, 3.0),
    });
    expect(billboards.length).toEqual(1);

    expect(billboards.remove(b)).toEqual(true);
    expect(billboards.length).toEqual(0);

    expect(billboards.remove(b)).toEqual(false);
    expect(billboards.length).toEqual(0);
  });

  it("returns false when removing undefined", function () {
    billboards.add({
      position: new Cartesian3(1.0, 2.0, 3.0),
    });
    expect(billboards.length).toEqual(1);

    expect(billboards.remove(undefined)).toEqual(false);
    expect(billboards.length).toEqual(1);
  });

  it("adds and removes billboards", function () {
    const one = billboards.add({
      position: new Cartesian3(1.0, 2.0, 3.0),
    });
    const two = billboards.add({
      position: new Cartesian3(4.0, 5.0, 6.0),
    });
    expect(billboards.length).toEqual(2);
    expect(billboards.get(0)).toEqual(one);
    expect(billboards.get(1)).toEqual(two);

    expect(billboards.remove(two)).toEqual(true);
    const three = billboards.add({
      position: new Cartesian3(7.0, 8.0, 9.0),
    });
    expect(billboards.length).toEqual(2);
    expect(billboards.get(0)).toEqual(one);
    expect(billboards.get(1)).toEqual(three);
  });

  it("removes all billboards", function () {
    billboards.add({
      position: new Cartesian3(1.0, 2.0, 3.0),
    });
    billboards.add({
      position: new Cartesian3(4.0, 5.0, 6.0),
    });
    expect(billboards.length).toEqual(2);

    billboards.removeAll();
    expect(billboards.length).toEqual(0);
  });

  it("can check if it contains a billboard", function () {
    const billboard = billboards.add();

    expect(billboards.contains(billboard)).toEqual(true);
  });

  it("returns false when checking if it contains a billboard it does not contain", function () {
    const billboard = billboards.add();
    billboards.remove(billboard);

    expect(billboards.contains(billboard)).toEqual(false);
  });

  it("does not contain undefined", function () {
    expect(billboards.contains(undefined)).toEqual(false);
  });

  it("does not contain random other objects", function () {
    expect(billboards.contains({})).toEqual(false);
    expect(billboards.contains(new Cartesian2())).toEqual(false);
  });

  it("sets and gets a texture atlas", function () {
    const originalAtlas = billboards.textureAtlas;
    expect(originalAtlas).toBeDefined();

    const atlas = new TextureAtlas();
    billboards.textureAtlas = atlas;

    expect(billboards.textureAtlas).toEqual(atlas);
    expect(originalAtlas.isDestroyed()).toBeTrue();
  });

  it("destroys texture atlas on destroy when destroyTextureAtlas is true", function () {
    let b = new BillboardCollection();
    expect(b.destroyTextureAtlas).toEqual(true);

    const atlas = b.textureAtlas;
    b.textureAtlas = atlas;
    b = b.destroy();

    expect(atlas.isDestroyed()).toEqual(true);
  });

  it("does not destroy texture atlas on destroy when destroyTextureAtlas ", function () {
    let b = new BillboardCollection();
    b.destroyTextureAtlas = false;

    let atlas = b.textureAtlas;
    b.textureAtlas = new TextureAtlas();

    expect(atlas.isDestroyed()).toEqual(false);
    atlas.destroy();

    atlas = b.textureAtlas;
    b = b.destroy();

    expect(atlas.isDestroyed()).toEqual(false);
    atlas.destroy();
  });

  it("equals another billboard", function () {
    const b = billboards.add({
      position: new Cartesian3(1.0, 2.0, 3.0),
      color: {
        red: 1.0,
        green: 0.0,
        blue: 0.0,
        alpha: 1.0,
      },
    });
    const b2 = billboards.add({
      position: new Cartesian3(1.0, 2.0, 3.0),
      color: {
        red: 1.0,
        green: 0.0,
        blue: 0.0,
        alpha: 1.0,
      },
    });

    // This tests the `BillboardCollection.equals` function itself, not simple equality.
    expect(b.equals(b2)).toEqual(true);
  });

  it("does not equal another billboard", function () {
    const b = billboards.add({
      position: new Cartesian3(1.0, 2.0, 3.0),
    });
    const b2 = billboards.add({
      position: new Cartesian3(4.0, 5.0, 6.0),
    });

    // This tests the `BillboardCollection.equals` function itself, not simple equality.
    expect(b.equals(b2)).toEqual(false);
  });

  it("does not equal undefined", function () {
    // This tests the `BillboardCollection.equals` function itself, not simple equality.
    const billboard = billboards.add();
    expect(billboard.equals(undefined)).toEqual(false);
  });

  it("throws when accessing without an index", function () {
    expect(function () {
      billboards.get();
    }).toThrowDeveloperError();
  });

  it("setImage throws without an id", function () {
    const b = billboards.add();
    expect(function () {
      b.setImage(undefined, {});
    }).toThrowDeveloperError();
  });

  it("setImage throws without an inmage", function () {
    const b = billboards.add();
    expect(function () {
      b.setImage("", undefined);
    }).toThrowDeveloperError();
  });

  it("setImageSubRegion throws without an id", function () {
    const b = billboards.add();
    expect(function () {
      b.setImage(undefined, {});
    }).toThrowDeveloperError();
  });

  it("setImageSubRegion throws without a sub-region", function () {
    const b = billboards.add();
    expect(function () {
      b.setImage("", undefined);
    }).toThrowDeveloperError();
  });

  describe(
    "with WebGL context",
    function () {
      let scene;
      let context;
      let camera;

      let greenImage;
      let blueImage;
      let whiteImage;
      let largeBlueImage;

      beforeAll(function () {
        scene = createScene();
        context = scene.context;
        camera = scene.camera;

        return Promise.all([
          Resource.fetchImage("./Data/Images/Green2x2.png").then(
            function (result) {
              greenImage = result;
            },
          ),
          Resource.fetchImage("./Data/Images/Blue2x2.png").then(
            function (result) {
              blueImage = result;
            },
          ),
          Resource.fetchImage("./Data/Images/White2x2.png").then(
            function (result) {
              whiteImage = result;
            },
          ),
          Resource.fetchImage("./Data/Images/Blue10x10.png").then(
            function (result) {
              largeBlueImage = result;
            },
          ),
        ]);
      });

      afterAll(function () {
        scene.destroyForSpecs();
      });

      beforeEach(function () {
        scene.morphTo3D(0);

        camera.position = new Cartesian3(10.0, 0.0, 0.0);
        camera.direction = Cartesian3.negate(
          Cartesian3.UNIT_X,
          new Cartesian3(),
        );
        camera.up = Cartesian3.clone(Cartesian3.UNIT_Z);

        camera.frustum = new PerspectiveFrustum();
        camera.frustum.aspectRatio =
          scene.drawingBufferWidth / scene.drawingBufferHeight;
        camera.frustum.fov = CesiumMath.toRadians(60.0);

        scene.primitives.add(billboards);
      });

      afterEach(function () {
        // billboards are destroyed by removeAll().
        scene.primitives.removeAll();
      });

      it("does not render when constructed", function () {
        expect(scene).toRender([0, 0, 0, 255]);
      });

      it("can add and remove before first update.", function () {
        const b = billboards.add();
        billboards.remove(b);
        scene.renderForSpecs();
      });

      it("loads a billboard", async function () {
        const billboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });
        camera.position = new Cartesian3(2.0, 0.0, 0.0);

        await pollToPromise(() => {
          scene.renderForSpecs();
          return billboard.ready;
        });

        expect(billboard.width).toEqual(2);
        expect(billboard.height).toEqual(2);
      });

      it("adds and renders a billboard", async function () {
        const billboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return billboard.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("adds and renders multiple billboard", async function () {
        const greenBillboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        const blueBillboard = billboards.add({
          position: new Cartesian3(0.5, 0.0, 0.0), // Closer to camera
          image: blueImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return greenBillboard.ready && blueBillboard.ready;
        });

        expect(scene).toRender([0, 0, 255, 255]);
      });

      it("can add a billboard without a globe", function () {
        scene.globe = undefined;

        const billboardsWithoutGlobe = new BillboardCollection({
          scene: scene,
        });

        const position = Cartesian3.fromDegrees(-73.0, 40.0);
        const b = billboardsWithoutGlobe.add({
          position: position,
        });

        scene.renderForSpecs();

        expect(b.position).toEqual(position);
        expect(b._actualClampedPosition).toBeUndefined();
      });

      it("can create a billboard using a URL", async function () {
        const one = billboards.add({
          image: "./Data/Images/Green2x2.png",
        });

        expect(one.ready).toEqual(false);
        expect(one.image).toEqual("./Data/Images/Green2x2.png");

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("does not reload when a billboard is set to the same URL", async function () {
        const one = billboards.add({
          image: "./Data/Images/Green2x2.png",
        });

        expect(one.ready).toEqual(false);
        expect(one.image).toEqual("./Data/Images/Green2x2.png");

        const addImageSpy = spyOn(billboards._textureAtlas, "addImage");

        one.image = "./Data/Images/Green2x2.png";

        expect(addImageSpy).not.toHaveBeenCalled();

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("handles set image when value is equal to the current value after load", async function () {
        const one = billboards.add({
          image: "./Data/Images/Green2x2.png",
        });

        expect(one.ready).toEqual(false);
        expect(one.image).toEqual("./Data/Images/Green2x2.png");

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        one.image = "./Data/Images/Green2x2.png";
        expect(one.ready).toEqual(true);

        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("handles calls to setImage when value is equal to the current value after load", async function () {
        const one = billboards.add({
          image: "./Data/Images/Green2x2.png",
        });

        expect(one.ready).toEqual(false);
        expect(one.image).toEqual("./Data/Images/Green2x2.png");

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        one.setImage("./Data/Images/Green2x2.png", new Image());

        expect(one.ready).toEqual(true);
        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("can create a billboard using a function", async function () {
        const one = billboards.add({
          image: function () {
            return greenImage;
          },
        });

        // the image property will be an autogenerated id if not provided
        expect(one.image).toEqual(jasmine.any(String));

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("can create a billboard using a function and id", async function () {
        const one = billboards.add({
          imageId: "Foo",
          image: function () {
            return greenImage;
          },
        });

        expect(one.image).toEqual("Foo");

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("can create a billboard using another billboard image", async function () {
        const createImage = jasmine
          .createSpy("createImage")
          .and.returnValue(greenImage);

        const one = billboards.add({
          image: createImage,
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(createImage.calls.count()).toEqual(1);

        const two = billboards.add({
          image: one.image,
        });

        scene.renderForSpecs();
        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(two.image).toEqual(one.image);
        expect(createImage.calls.count()).toEqual(1);
        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("can create a billboard using a subregion of an image", async function () {
        const one = billboards.add({
          image: "./Data/Images/BlueOverRed.png",
          imageSubRegion: new BoundingRectangle(0.0, 0.0, 1.0, 1.0),
        });

        expect(one.ready).toEqual(false);

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        // Due to attribute compression there is some error for 1x1 billboards
        expect(scene).toRenderAndCall((rgba) => {
          expect(rgba[0]).toBeGreaterThan(250);
          expect(rgba[1]).toBe(0);
          expect(rgba[2]).toBeLessThan(5);
          expect(rgba[3]).toBe(255);
        });
      });

      it("sets billboard width and height based on subregion width and height", async function () {
        const one = billboards.add({
          image: "./Data/Images/BlueOverRed.png",
          imageSubRegion: new BoundingRectangle(0.0, 1.0, 1.0, 1.0),
        });

        expect(one.width).toBeUndefined();
        expect(one.height).toBeUndefined();

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(one.width).toEqual(1);
        expect(one.height).toEqual(1);
      });

      it("can change image while an image is loading", async function () {
        const one = billboards.add({
          image: "./Data/Images/Green2x2.png",
        });

        expect(one.ready).toEqual(false);
        expect(one.image).toEqual("./Data/Images/Green2x2.png");

        // switch to blue while green is in-flight
        one.image = "./Data/Images/Blue10x10.png";

        expect(one.ready).toEqual(false);
        expect(one.image).toEqual("./Data/Images/Blue10x10.png");

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(scene).toRender([0, 0, 255, 255]);

        // Check a few additional times to make sure the green doesn't override the blue

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });
        expect(scene).toRender([0, 0, 255, 255]);

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });
        expect(scene).toRender([0, 0, 255, 255]);

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });
        expect(scene).toRender([0, 0, 255, 255]);

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });
        expect(scene).toRender([0, 0, 255, 255]);
      });

      it("can set image to undefined", async function () {
        const one = billboards.add({
          image: "./Data/Images/Green2x2.png",
        });

        expect(one.ready).toEqual(false);
        expect(one._imageTexture.hasImage).toEqual(true);
        expect(one.image).toEqual("./Data/Images/Green2x2.png");

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        // switch to undefined while green is in-flight

        one.image = undefined;

        expect(one.ready).toEqual(false);
        expect(one._imageTexture.hasImage).toEqual(false);
        expect(one.image).toBeUndefined();

        scene.renderForSpecs();
        await Promise.resolve();
        expect(scene).toRender([0, 0, 0, 255]);
      });

      it("can set image to undefined while an image is loading", async function () {
        const one = billboards.add({
          image: "./Data/Images/Green2x2.png",
        });

        expect(one.ready).toEqual(false);
        expect(one._imageTexture.hasImage).toEqual(true);
        expect(one.image).toEqual("./Data/Images/Green2x2.png");

        // switch to undefined while green is in-flight

        one.image = undefined;

        expect(one.ready).toEqual(false);
        expect(one._imageTexture.hasImage).toEqual(false);
        expect(one.image).toBeUndefined();

        scene.renderForSpecs();
        await Promise.resolve();
        expect(scene).toRender([0, 0, 0, 255]);

        // Check a few additional times to make sure the image never loads in

        scene.renderForSpecs();
        await Promise.resolve();
        expect(scene).toRender([0, 0, 0, 255]);

        scene.renderForSpecs();
        await Promise.resolve();
        expect(scene).toRender([0, 0, 0, 255]);

        scene.renderForSpecs();
        await Promise.resolve();
        expect(scene).toRender([0, 0, 0, 255]);

        scene.renderForSpecs();
        await Promise.resolve();
        expect(scene).toRender([0, 0, 0, 255]);
      });

      it("sets billboard width and height based on loaded image width and height", async function () {
        const one = billboards.add({
          image: "./Data/Images/Green1x4.png",
        });

        expect(one.width).toBeUndefined();
        expect(one.height).toBeUndefined();

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(one.width).toEqual(1);
        expect(one.height).toEqual(4);

        one.image = "./Data/Images/Blue10x10.png";

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready;
        });

        expect(one.width).toEqual(10);
        expect(one.height).toEqual(10);
      });

      it("renders using billboard image property", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        b.image = largeBlueImage;

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).toRender([0, 0, 255, 255]);
      });

      it("renders using billboard setImage function", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        b.setImage(createGuid(), largeBlueImage);

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).toRender([0, 0, 255, 255]);
      });

      it("renders using billboard setImageSubRegion function", async function () {
        const b = billboards.add({
          image: "./Data/Images/BlueOverRed.png",
          imageSubRegion: new BoundingRectangle(0.0, 1.0, 1.0, 1.0),
        });

        expect(b.ready).toEqual(false);

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        // Due to attribute compression there is some error for 1x1 billboards
        expect(scene).toRenderAndCall((rgba) => {
          expect(rgba[0]).toBeLessThan(5);
          expect(rgba[1]).toBe(0);
          expect(rgba[2]).toBeGreaterThan(250);
          expect(rgba[3]).toBe(255);
        });

        b.setImageSubRegion(
          "./Data/Images/BlueOverRed.png",
          new BoundingRectangle(0.0, 0.0, 1.0, 1.0),
        );

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        // Due to attribute compression there is some error for 1x1 billboards
        expect(scene).toRenderAndCall((rgba) => {
          expect(rgba[0]).toBeGreaterThan(250);
          expect(rgba[1]).toBe(0);
          expect(rgba[2]).toBeLessThan(5);
          expect(rgba[3]).toBe(255);
        });
      });

      it("renders billboard in multiple passes", async function () {
        const billboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });
        camera.position = new Cartesian3(2.0, 0.0, 0.0);

        await pollToPromise(() => {
          scene.renderForSpecs();
          return billboard.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        const frameState = scene.frameState;
        frameState.commandList.length = 0;
        billboards.blendOption = BlendOption.OPAQUE_AND_TRANSLUCENT;
        billboards.update(frameState);
        expect(frameState.commandList.length).toEqual(2);

        frameState.commandList.length = 0;
        billboards.blendOption = BlendOption.OPAQUE;
        billboards.update(frameState);
        expect(frameState.commandList.length).toEqual(1);

        frameState.commandList.length = 0;
        billboards.blendOption = BlendOption.TRANSLUCENT;
        billboards.update(frameState);
        expect(frameState.commandList.length).toEqual(1);
      });

      it("renders billboard with sizeInMeters", async function () {
        const billboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
          width: 2.0,
          height: 2.0,
          sizeInMeters: true,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return billboard.ready;
        });

        camera.position = new Cartesian3(2.0, 0.0, 0.0);
        expect(scene).toRender([0, 255, 0, 255]);

        camera.position = new Cartesian3(1e6, 0.0, 0.0);
        expect(scene).toRender([0, 0, 0, 255]);
      });

      it("renders billboard with scaleByDistance", async function () {
        const billboard = billboards.add({
          position: Cartesian3.ZERO,
          scaleByDistance: new NearFarScalar(2.0, 1.0, 4.0, 0.0),
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return billboard.ready;
        });

        camera.position = new Cartesian3(2.0, 0.0, 0.0);
        expect(scene).toRender([0, 255, 0, 255]);

        camera.position = new Cartesian3(4.0, 0.0, 0.0);
        expect(scene).toRender([0, 0, 0, 255]);
      });

      it("renders billboard with translucencyByDistance", async function () {
        const billboard = billboards.add({
          position: Cartesian3.ZERO,
          translucencyByDistance: new NearFarScalar(2.0, 1.0, 4.0, 0.0),
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return billboard.ready;
        });

        camera.position = new Cartesian3(2.0, 0.0, 0.0);
        expect(scene).toRender([0, 255, 0, 255]);

        camera.position = new Cartesian3(4.0, 0.0, 0.0);
        expect(scene).toRender([0, 0, 0, 255]);
      });

      it("renders billboard with pixelOffsetScaleByDistance", async function () {
        const billboard = billboards.add({
          position: Cartesian3.ZERO,
          pixelOffset: new Cartesian2(1.0, 0.0),
          pixelOffsetScaleByDistance: new NearFarScalar(2.0, 0.0, 4.0, 1000.0),
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return billboard.ready;
        });

        camera.position = new Cartesian3(2.0, 0.0, 0.0);
        expect(scene).toRender([0, 255, 0, 255]);

        camera.position = new Cartesian3(4.0, 0.0, 0.0);
        expect(scene).toRender([0, 0, 0, 255]);
      });

      it("does not render billboard if show is false", async function () {
        const billboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
          width: 2.0,
          height: 2.0,
          sizeInMeters: true,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return billboard.ready;
        });

        camera.position = new Cartesian3(2.0, 0.0, 0.0);
        expect(scene).toRender([0, 255, 0, 255]);

        billboards.show = false;
        expect(scene).toRender([0, 0, 0, 255]);
      });

      it("renders billboard with distanceDisplayCondition", async function () {
        const billboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
          distanceDisplayCondition: new DistanceDisplayCondition(10.0, 100.0),
        });

        scene.renderForSpecs();

        await pollToPromise(() => {
          scene.renderForSpecs();
          return billboard.ready;
        });

        camera.position = new Cartesian3(200.0, 0.0, 0.0);
        expect(scene).toRender([0, 0, 0, 255]);

        camera.position = new Cartesian3(50.0, 0.0, 0.0);
        expect(scene).toRender([0, 255, 0, 255]);

        camera.position = new Cartesian3(5.0, 0.0, 0.0);
        expect(scene).toRender([0, 0, 0, 255]);
      });

      it("renders with disableDepthTestDistance", async function () {
        const b = billboards.add({
          position: new Cartesian3(-1.0, 0.0, 0.0),
          image: greenImage,
        });
        const blue = billboards.add({
          position: Cartesian3.ZERO,
          image: blueImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready && blue.ready;
        });

        expect(scene).toRender([0, 0, 255, 255]);

        b.disableDepthTestDistance = Number.POSITIVE_INFINITY;
        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("adds and renders multiple billboards", async function () {
        const greenBillboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return greenBillboard.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        const blueBillboard = billboards.add({
          position: new Cartesian3(1.0, 0.0, 0.0), // Closer to camera
          image: largeBlueImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return blueBillboard.ready;
        });

        expect(scene).toRender([0, 0, 255, 255]);
      });

      it("removes and renders a billboard", async function () {
        const greenBillboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });
        const blueBillboard = billboards.add({
          position: new Cartesian3(1.0, 0.0, 0.0), // Closer to camera
          image: largeBlueImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return greenBillboard.ready && blueBillboard.ready;
        });

        expect(scene).toRender([0, 0, 255, 255]);

        billboards.remove(blueBillboard);
        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("does not crash when removing a billboard that is loading", async function () {
        let resolveAddImage;

        spyOn(billboards.textureAtlas, "addImage").and.returnValue(
          new Promise((resolve) => {
            resolveAddImage = resolve;
          }),
        );

        const greenBillboard = billboards.add({
          image: greenImage,
        });

        scene.renderForSpecs();

        expect(greenBillboard.ready).toBeFalse();
        expect(greenBillboard._imageTexture.hasImage).toBeTrue();

        billboards.remove(greenBillboard);

        resolveAddImage(-1);

        expect(greenBillboard.ready).toBeFalse();
        expect(greenBillboard._imageTexture.hasImage).toBeFalse();

        scene.renderForSpecs();
      });

      it("modifies and removes a billboard, then renders", async function () {
        const greenBillboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });
        const blueBillboard = billboards.add({
          position: new Cartesian3(-1.0, 0.0, 0.0),
          image: largeBlueImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return greenBillboard.ready && blueBillboard.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        greenBillboard.scale = 2.0;
        billboards.remove(greenBillboard);
        expect(scene).toRender([0, 0, 255, 255]);
      });

      it("removes all billboards and renders", async function () {
        const billboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return billboard.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        billboards.removeAll();
        expect(scene).toRender([0, 0, 0, 255]);
      });

      it("removes all billboards, adds a billboard, and renders", async function () {
        const greenBillboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return greenBillboard.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        billboards.removeAll();

        const blueBillboard = billboards.add({
          position: Cartesian3.ZERO,
          image: largeBlueImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return blueBillboard.ready;
        });

        expect(scene).toRender([0, 0, 255, 255]);
      });

      it("renders using billboard show property", async function () {
        const greenBillboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });
        const blueBillboard = billboards.add({
          show: false,
          position: Cartesian3.ZERO,
          image: largeBlueImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return greenBillboard.ready && blueBillboard.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        greenBillboard.show = false;
        blueBillboard.show = true;

        expect(scene).toRender([0, 0, 255, 255]);
      });

      it("renders using billboard position property", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        b.position = new Cartesian3(20.0, 0.0, 0.0); // Behind camera
        expect(scene).toRender([0, 0, 0, 255]);

        b.position = new Cartesian3(1.0, 0.0, 0.0); // Back in front of camera
        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("renders using billboard scale property", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        b.scale = 0.0;
        expect(scene).toRender([0, 0, 0, 255]);

        b.scale = 2.0;
        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("renders using billboard color property", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: whiteImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).toRender([255, 255, 255, 255]);

        b.color = new Color(1.0, 0.0, 1.0, 1.0);
        expect(scene).toRender([255, 0, 255, 255]);

        // Update a second time since it goes through a different vertex array update path
        b.color = new Color(0.0, 1.0, 0.0, 1.0);
        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("renders using billboard rotation property", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        b.rotation = CesiumMath.PI_OVER_TWO;
        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("renders using billboard aligned axis property", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        b.alignedAxis = Cartesian3.UNIT_X;
        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("renders using billboard custom width property", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        b.width = 300.0;
        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("renders using billboard custom height property", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        b.height = 300.0;
        expect(scene).toRender([0, 255, 0, 255]);
      });

      it("renders bounding volume with debugShowBoundingVolume", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
          scale: 0.5, // bring bounding volume in view
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        billboards.debugShowBoundingVolume = true;

        expect(scene).notToRender([0, 0, 0, 255]);
      });

      it("renders billboards when instancing is disabled", async function () {
        // disable extension
        const instancedArrays = context._instancedArrays;
        context._instancedArrays = undefined;

        expect(scene).toRender([0, 0, 0, 255]);

        const greenBillboard = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return greenBillboard.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        const blueBillboard = billboards.add({
          position: new Cartesian3(1.0, 0.0, 0.0), // Closer to camera
          image: largeBlueImage,
        });
        scene.renderForSpecs();

        await pollToPromise(() => {
          scene.renderForSpecs();
          return blueBillboard.ready;
        });

        expect(scene).toRender([0, 0, 255, 255]);

        billboards.remove(blueBillboard);
        expect(scene).toRender([0, 255, 0, 255]);

        billboards.remove(greenBillboard);
        expect(scene).toRender([0, 0, 0, 255]);

        context._instancedArrays = instancedArrays;
      });

      it("renders with a different texture atlas", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).toRender([0, 255, 0, 255]);

        billboards.textureAtlas = new TextureAtlas();
        b.image = blueImage;

        await pollToPromise(() => {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).toRender([0, 0, 255, 255]);
      });

      it("updates 10% of billboards", async function () {
        for (let i = 0; i < 10; ++i) {
          billboards.add({
            position: Cartesian3.ZERO,
            image: whiteImage,
            show: i === 3,
          });
        }

        await pollToPromise(function () {
          scene.renderForSpecs();
          return billboards.get(3).ready;
        });

        // First render - default billboard color is white.
        expect(scene).toRender([255, 255, 255, 255]);

        billboards.get(3).color = new Color(0.0, 1.0, 0.0, 1.0);

        // Second render - billboard is green
        expect(scene).toRender([0, 255, 0, 255]);

        billboards.get(3).color = new Color(1.0, 0.0, 0.0, 1.0);

        // Third render - update goes through a different vertex array update path
        expect(scene).toRender([255, 0, 0, 255]);
      });

      it("renders more than 16K billboards", async function () {
        for (let i = 0; i < 16 * 1024; ++i) {
          billboards.add({
            position: Cartesian3.ZERO,
            image: whiteImage,
            color: {
              alpha: 0.0,
            },
          });
        }

        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: whiteImage,
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).toRender([255, 255, 255, 255]);
      });

      it("computes bounding sphere in 3D", async function () {
        const one = billboards.add({
          image: greenImage,
          position: Cartesian3.fromDegrees(-50.0, -50.0),
        });
        const two = billboards.add({
          image: greenImage,
          position: Cartesian3.fromDegrees(-50.0, 50.0),
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready && two.ready;
        });

        billboards.update(scene.frameState);
        const actual = scene.frameState.commandList[0].boundingVolume;

        const positions = [one.position, two.position];
        const expected = BoundingSphere.fromPoints(positions);
        expect(actual.center).toEqual(expected.center);
        expect(actual.radius).toEqual(expected.radius);
      });

      it("computes bounding sphere in Columbus view", async function () {
        const projection = scene.mapProjection;
        const ellipsoid = projection.ellipsoid;

        const one = billboards.add({
          image: greenImage,
          position: Cartesian3.fromDegrees(-50.0, -50.0),
        });
        const two = billboards.add({
          image: greenImage,
          position: Cartesian3.fromDegrees(-50.0, 50.0),
        });

        // Update scene state
        scene.morphToColumbusView(0);
        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready && two.ready;
        });

        billboards.update(scene.frameState);
        const actual = scene.frameState.commandList[0].boundingVolume;

        const projectedPositions = [
          projection.project(ellipsoid.cartesianToCartographic(one.position)),
          projection.project(ellipsoid.cartesianToCartographic(two.position)),
        ];
        const expected = BoundingSphere.fromPoints(projectedPositions);
        expected.center = new Cartesian3(
          0.0,
          expected.center.x,
          expected.center.y,
        );
        expect(actual.center).toEqualEpsilon(
          expected.center,
          CesiumMath.EPSILON8,
        );
        expect(actual.radius).toBeGreaterThanOrEqual(expected.radius);
      });

      it("computes bounding sphere in 2D", async function () {
        const projection = scene.mapProjection;
        const ellipsoid = projection.ellipsoid;

        const one = billboards.add({
          image: greenImage,
          position: Cartesian3.fromDegrees(-50.0, -50.0),
        });
        const two = billboards.add({
          image: greenImage,
          position: Cartesian3.fromDegrees(-50.0, 50.0),
        });

        const maxRadii = ellipsoid.maximumRadius;
        const orthoFrustum = new OrthographicOffCenterFrustum();
        orthoFrustum.right = maxRadii * Math.PI;
        orthoFrustum.left = -orthoFrustum.right;
        orthoFrustum.top = orthoFrustum.right;
        orthoFrustum.bottom = -orthoFrustum.top;
        orthoFrustum.near = 0.01 * maxRadii;
        orthoFrustum.far = 60.0 * maxRadii;

        camera.setView({
          destination: Rectangle.fromDegrees(-60.0, -60.0, -40.0, 60.0),
        });

        // Update scene state
        scene.morphTo2D(0);
        camera.frustum = orthoFrustum;

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready && two.ready;
        });

        billboards.update(scene.frameState);
        const actual = scene.frameState.commandList[0].boundingVolume;

        const projectedPositions = [
          projection.project(ellipsoid.cartesianToCartographic(one.position)),
          projection.project(ellipsoid.cartesianToCartographic(two.position)),
        ];
        const expected = BoundingSphere.fromPoints(projectedPositions);
        expected.center = new Cartesian3(
          0.0,
          expected.center.x,
          expected.center.y,
        );
        expect(actual.center).toEqualEpsilon(
          expected.center,
          CesiumMath.EPSILON8,
        );
        expect(actual.radius).toBeGreaterThan(expected.radius);
      });

      it("computes bounding sphere with pixel offset", async function () {
        const one = billboards.add({
          image: greenImage,
          position: Cartesian3.fromDegrees(-50.0, -50.0),
          pixelOffset: new Cartesian2(0.0, 200.0),
        });
        const two = billboards.add({
          image: greenImage,
          position: Cartesian3.fromDegrees(-50.0, 50.0),
          pixelOffset: new Cartesian2(0.0, 200.0),
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return one.ready && two.ready;
        });

        billboards.update(scene.frameState);
        const actual = scene.frameState.commandList[0].boundingVolume;

        const positions = [one.position, two.position];
        const bs = BoundingSphere.fromPoints(positions);

        const dimensions = new Cartesian2(1.0, 1.0);
        const diff = Cartesian3.subtract(
          actual.center,
          camera.position,
          new Cartesian3(),
        );
        const vectorProjection = Cartesian3.multiplyByScalar(
          camera.direction,
          Cartesian3.dot(diff, camera.direction),
          new Cartesian3(),
        );
        const distance = Math.max(
          0.0,
          Cartesian3.magnitude(vectorProjection) - bs.radius,
        );

        const pixelSize = camera.frustum.getPixelDimensions(
          dimensions.x,
          dimensions.y,
          distance,
          scene.pixelRatio,
          new Cartesian2(),
        );
        bs.radius +=
          pixelSize.y * 0.25 * Math.max(greenImage.width, greenImage.height) +
          pixelSize.y * one.pixelOffset.y;

        expect(actual.center).toEqual(bs.center);
        expect(actual.radius).toEqual(bs.radius);
      });

      it("computes bounding sphere with non-centered origin", async function () {
        let b = billboards.add({
          image: greenImage,
          position: Cartesian3.fromDegrees(-50.0, -50.0),
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        billboards.update(scene.frameState);

        const centeredRadius =
          scene.frameState.commandList[0].boundingVolume.radius;
        billboards.removeAll();

        b = billboards.add({
          image: greenImage,
          position: Cartesian3.fromDegrees(-50.0, -50.0),
          verticalOrigin: VerticalOrigin.TOP,
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        billboards.update(scene.frameState);
        const verticalRadius =
          scene.frameState.commandList[0].boundingVolume.radius;
        billboards.removeAll();

        b = billboards.add({
          image: greenImage,
          position: Cartesian3.fromDegrees(-50.0, -50.0),
          horizontalOrigin: HorizontalOrigin.LEFT,
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        billboards.update(scene.frameState);
        const horizontalRadius =
          scene.frameState.commandList[0].boundingVolume.radius;

        expect(verticalRadius).toEqual(2 * centeredRadius);
        expect(horizontalRadius).toEqual(2 * centeredRadius);
      });

      it("computes screen space position", function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
        });
        scene.renderForSpecs();
        expect(b.computeScreenSpacePosition(scene)).toEqualEpsilon(
          new Cartesian2(0.5, 0.5),
          CesiumMath.EPSILON1,
        );
      });

      it("stores screen space position in a result", function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
        });
        const result = new Cartesian2();
        scene.renderForSpecs();
        const actual = b.computeScreenSpacePosition(scene, result);
        expect(actual).toEqual(result);
        expect(result).toEqualEpsilon(
          new Cartesian2(0.5, 0.5),
          CesiumMath.EPSILON1,
        );
      });

      it("computes screen space position with pixelOffset", function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          pixelOffset: new Cartesian2(0.5, 0.5),
        });
        scene.renderForSpecs();
        expect(b.computeScreenSpacePosition(scene)).toEqualEpsilon(
          new Cartesian2(1, 1.0),
          CesiumMath.EPSILON1,
        );
      });

      it("computes screen space position with eyeOffset", function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          eyeOffset: new Cartesian3(1.0, 1.0, 0.0),
        });
        scene.renderForSpecs();
        expect(b.computeScreenSpacePosition(scene)).toEqualEpsilon(
          new Cartesian2(0.5, 0.5),
          CesiumMath.EPSILON1,
        );
      });

      it("computes screen space position in Columbus view", function () {
        const b = billboards.add({
          position: Cartesian3.fromDegrees(0.0, 0.0, 10.0),
        });
        scene.morphToColumbusView(0.0);
        scene.camera.setView({ destination: Rectangle.MAX_VALUE });
        scene.renderForSpecs();
        expect(b.computeScreenSpacePosition(scene)).toEqualEpsilon(
          new Cartesian2(0.5, 0.5),
          CesiumMath.EPSILON1,
        );
      });

      it("computes screen space position in 2D", function () {
        const b = billboards.add({
          position: Cartesian3.fromDegrees(0.0, 0.0, 10.0),
        });
        scene.morphTo2D(0.0);
        scene.camera.setView({ destination: Rectangle.MAX_VALUE });
        scene.renderForSpecs();
        expect(b.computeScreenSpacePosition(scene)).toEqualEpsilon(
          new Cartesian2(0.5, 0.5),
          CesiumMath.EPSILON1,
        );
      });

      it("throws when computing screen space position when not in a collection", function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
        });
        billboards.remove(b);
        expect(function () {
          b.computeScreenSpacePosition(scene);
        }).toThrowDeveloperError();
      });

      it("throws when computing screen space position without scene", function () {
        const b = billboards.add();

        expect(function () {
          b.computeScreenSpacePosition();
        }).toThrowDeveloperError();
      });

      it("computes screen space bounding box", function () {
        let width = 10;
        let height = 15;
        const scale = 1.5;

        const b = billboards.add({
          width: width,
          height: height,
          scale: scale,
        });

        const halfWidth = width * scale * 0.5;
        const halfHeight = height * scale * 0.5;
        width = width * scale;
        height = height * scale;

        const bbox = Billboard.getScreenSpaceBoundingBox(b, Cartesian2.ZERO);
        expect(bbox.x).toEqual(-halfWidth);
        expect(bbox.y).toEqual(-halfHeight);
        expect(bbox.width).toEqual(width);
        expect(bbox.height).toEqual(height);
      });

      it("computes screen space bounding box with result", function () {
        let width = 10;
        let height = 15;
        const scale = 1.5;

        const b = billboards.add({
          width: width,
          height: height,
          scale: scale,
        });

        const halfWidth = width * scale * 0.5;
        const halfHeight = height * scale * 0.5;
        width = width * scale;
        height = height * scale;

        const result = new BoundingRectangle();
        const bbox = Billboard.getScreenSpaceBoundingBox(
          b,
          Cartesian2.ZERO,
          result,
        );
        expect(bbox.x).toEqual(-halfWidth);
        expect(bbox.y).toEqual(-halfHeight);
        expect(bbox.width).toEqual(width);
        expect(bbox.height).toEqual(height);
        expect(bbox).toBe(result);
      });

      it("computes screen space bounding box with vertical origin", function () {
        let width = 10;
        let height = 15;
        const scale = 1.5;

        const b = billboards.add({
          width: width,
          height: height,
          scale: scale,
          verticalOrigin: VerticalOrigin.BOTTOM,
        });

        const halfWidth = width * scale * 0.5;
        width = width * scale;
        height = height * scale;

        let bbox = Billboard.getScreenSpaceBoundingBox(b, Cartesian2.ZERO);
        expect(bbox.x).toEqual(-halfWidth);
        expect(bbox.y).toEqual(-height);
        expect(bbox.width).toEqual(width);
        expect(bbox.height).toEqual(height);

        b.verticalOrigin = VerticalOrigin.TOP;
        bbox = Billboard.getScreenSpaceBoundingBox(b, Cartesian2.ZERO);
        expect(bbox.x).toEqual(-halfWidth);
        expect(bbox.y).toEqual(0);
        expect(bbox.width).toEqual(width);
        expect(bbox.height).toEqual(height);
      });

      it("computes screen space bounding box with horizontal origin", function () {
        let width = 10;
        let height = 15;
        const scale = 1.5;

        const b = billboards.add({
          width: width,
          height: height,
          scale: scale,
          horizontalOrigin: HorizontalOrigin.LEFT,
        });

        const halfHeight = height * scale * 0.5;
        height = height * scale;
        width = width * scale;

        let bbox = Billboard.getScreenSpaceBoundingBox(b, Cartesian2.ZERO);
        expect(bbox.x).toEqual(0);
        expect(bbox.y).toEqual(-halfHeight);
        expect(bbox.width).toEqual(width);
        expect(bbox.height).toEqual(height);

        b.horizontalOrigin = HorizontalOrigin.RIGHT;
        bbox = Billboard.getScreenSpaceBoundingBox(b, Cartesian2.ZERO);
        expect(bbox.x).toEqual(-width);
        expect(bbox.y).toEqual(-halfHeight);
        expect(bbox.width).toEqual(width);
        expect(bbox.height).toEqual(height);
      });

      it("is picked", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: whiteImage,
          id: "id",
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });
        expect(scene).toPickAndCall(function (result) {
          expect(result.primitive).toEqual(b);
          expect(result.id).toEqual("id");
        });
      });

      it("can change pick id", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: whiteImage,
          id: "id",
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).toPickAndCall(function (result) {
          expect(result.primitive).toEqual(b);
          expect(result.id).toEqual("id");
        });

        b.id = "id2";

        expect(scene).toPickAndCall(function (result) {
          expect(result.primitive).toEqual(b);
          expect(result.id).toEqual("id2");
        });
      });

      it("is not picked if show is false", async function () {
        const b = billboards.add({
          show: false,
          position: Cartesian3.ZERO,
          image: whiteImage,
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        expect(scene).notToPick();
      });

      it("is not picked if show is set to false", async function () {
        const b = billboards.add({
          show: true,
          position: Cartesian3.ZERO,
          image: whiteImage,
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        b.show = false;

        expect(scene).notToPick();
      });

      it("picks a billboard using scaleByDistance", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: whiteImage,
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        const scaleByDistance = new NearFarScalar(1.0, 4.0, 3.0e9, 2.0);
        b.scaleByDistance = scaleByDistance;

        expect(scene).toPickPrimitive(b);

        scaleByDistance.nearValue = 0.0;
        scaleByDistance.farValue = 0.0;
        b.scaleByDistance = scaleByDistance;

        expect(scene).notToPick();
      });

      it("picks a billboard using translucencyByDistance", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: whiteImage,
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        const translucency = new NearFarScalar(1.0, 0.9, 3.0e9, 0.8);
        b.translucencyByDistance = translucency;

        expect(scene).toPickPrimitive(b);

        translucency.nearValue = 0.0;
        translucency.farValue = 0.0;
        b.translucencyByDistance = translucency;

        expect(scene).notToPick();
      });

      it("picks a billboard using pixelOffsetScaleByDistance", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          pixelOffset: new Cartesian2(0.0, 100.0),
          image: whiteImage,
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        const pixelOffsetScale = new NearFarScalar(1.0, 0.0, 3.0e9, 0.0);
        b.pixelOffsetScaleByDistance = pixelOffsetScale;

        expect(scene).toPickPrimitive(b);

        pixelOffsetScale.nearValue = 10.0;
        pixelOffsetScale.farValue = 10.0;
        b.pixelOffsetScaleByDistance = pixelOffsetScale;

        expect(scene).notToPick();
      });

      it("can pick a billboard using the rotation property", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        b.rotation = CesiumMath.PI_OVER_TWO;
        expect(scene).toPickPrimitive(b);
      });

      it("can pick a billboard using the aligned axis property", async function () {
        const b = billboards.add({
          position: Cartesian3.ZERO,
          image: greenImage,
        });

        await pollToPromise(function () {
          scene.renderForSpecs();
          return b.ready;
        });

        b.alignedAxis = Cartesian3.UNIT_X;
        expect(scene).toPickPrimitive(b);
      });

      it("renders translucency correctly independently of image width", async function () {
        // This test effectively probes at writeCompressedAttrib1, which packs together imageWidth and translucencyByDistance.
        // In a previous regression, imageWidth was not being rounded, and was being packed incorrectly as a result of being treated as an incorrect type (float vs int).
        const narrowBillboard = billboards.add({
          position: Cartesian3.ZERO,
          image: whiteImage,
          width: 230.23,
          translucencyByDistance: new NearFarScalar(2.0, 1.0, 4.0, 0.0),
        });

        const wideBillboard = billboards.add({
          position: Cartesian3.ZERO,
          image: whiteImage,
          width: 300.355,
          translucencyByDistance: new NearFarScalar(2.0, 1.0, 4.0, 0.0),
        });

        // Position the camera in the middle of the translucency range
        camera.position = new Cartesian3(3.0, 0.0, 0.0);

        await pollToPromise(() => {
          scene.renderForSpecs();
          return narrowBillboard.ready && wideBillboard.ready;
        });

        wideBillboard.show = false;
        narrowBillboard.show = true;
        let narrowBillboardColor;
        expect(scene).toRenderAndCall(([r, g, b, a]) => {
          expect([r, g, b]).not.toEqual([0, 0, 0]);
          narrowBillboardColor = [r, g, b, a];
        });

        wideBillboard.show = true;
        narrowBillboard.show = false;
        let wideBillboardColor;
        expect(scene).toRenderAndCall(([r, g, b, a]) => {
          expect([r, g, b]).not.toEqual([0, 0, 0]);
          wideBillboardColor = [r, g, b, a];
        });

        expect(narrowBillboardColor).toEqual(wideBillboardColor);
      });

      describe("height referenced billboards", function () {
        let billboardsWithHeight;
        beforeEach(function () {
          scene.globe = new Globe();
          billboardsWithHeight = new BillboardCollection({
            scene: scene,
          });
          scene.primitives.add(billboardsWithHeight);
        });

        it("explicitly constructs a billboard with height reference", function () {
          const b = billboardsWithHeight.add({
            heightReference: HeightReference.CLAMP_TO_GROUND,
          });

          expect(b.heightReference).toEqual(HeightReference.CLAMP_TO_GROUND);
        });

        it("set billboard height reference property", function () {
          const b = billboardsWithHeight.add();
          b.heightReference = HeightReference.CLAMP_TO_GROUND;

          expect(b.heightReference).toEqual(HeightReference.CLAMP_TO_GROUND);
        });

        it("creating with a height reference creates a height update callback", function () {
          spyOn(scene, "updateHeight");

          const position = Cartesian3.fromDegrees(-72.0, 40.0);
          billboardsWithHeight.add({
            heightReference: HeightReference.CLAMP_TO_GROUND,
            position: position,
          });

          expect(scene.updateHeight).toHaveBeenCalledWith(
            Cartographic.fromCartesian(position),
            jasmine.any(Function),
            HeightReference.CLAMP_TO_GROUND,
          );
        });

        it("set height reference property creates a height update callback", function () {
          spyOn(scene, "updateHeight");

          const position = Cartesian3.fromDegrees(-72.0, 40.0);
          const b = billboardsWithHeight.add({
            position: position,
          });
          b.heightReference = HeightReference.CLAMP_TO_GROUND;

          expect(scene.updateHeight).toHaveBeenCalledWith(
            Cartographic.fromCartesian(position),
            jasmine.any(Function),
            HeightReference.CLAMP_TO_GROUND,
          );
        });

        it("updates the callback when the height reference changes", function () {
          spyOn(scene, "updateHeight");

          const position = Cartesian3.fromDegrees(-72.0, 40.0);
          const b = billboardsWithHeight.add({
            heightReference: HeightReference.CLAMP_TO_GROUND,
            position: position,
          });

          expect(scene.updateHeight).toHaveBeenCalledWith(
            Cartographic.fromCartesian(position),
            jasmine.any(Function),
            HeightReference.CLAMP_TO_GROUND,
          );

          b.heightReference = HeightReference.RELATIVE_TO_GROUND;

          expect(scene.updateHeight).toHaveBeenCalledWith(
            Cartographic.fromCartesian(position),
            jasmine.any(Function),
            HeightReference.RELATIVE_TO_GROUND,
          );
        });

        it("removes the callback when the height reference changes", function () {
          const removeCallback = jasmine.createSpy();
          spyOn(scene, "updateHeight").and.returnValue(removeCallback);

          const position = Cartesian3.fromDegrees(-72.0, 40.0);
          const b = billboardsWithHeight.add({
            heightReference: HeightReference.CLAMP_TO_GROUND,
            position: position,
          });

          b.heightReference = HeightReference.NONE;
          expect(removeCallback).toHaveBeenCalled();
        });

        it("changing the position updates the callback", function () {
          const removeCallback = jasmine.createSpy();
          spyOn(scene, "updateHeight").and.returnValue(removeCallback);

          let position = Cartesian3.fromDegrees(-72.0, 40.0);
          const b = billboardsWithHeight.add({
            heightReference: HeightReference.CLAMP_TO_GROUND,
            position: position,
          });

          expect(scene.updateHeight).toHaveBeenCalledWith(
            Cartographic.fromCartesian(position),
            jasmine.any(Function),
            HeightReference.CLAMP_TO_GROUND,
          );

          position = b.position = Cartesian3.fromDegrees(-73.0, 40.0);

          expect(removeCallback).toHaveBeenCalled();
          expect(scene.updateHeight).toHaveBeenCalledWith(
            Cartographic.fromCartesian(position),
            jasmine.any(Function),
            HeightReference.CLAMP_TO_GROUND,
          );
        });

        it("callback updates the position", function () {
          let invokeCallback;
          spyOn(scene, "updateHeight").and.callFake(
            (cartographic, updateCallback) => {
              invokeCallback = (height) => {
                cartographic.height = height;
                updateCallback(cartographic);
              };
            },
          );

          const position = Cartesian3.fromDegrees(-72.0, 40.0);
          const b = billboardsWithHeight.add({
            heightReference: HeightReference.CLAMP_TO_GROUND,
            position: position,
          });

          expect(scene.updateHeight).toHaveBeenCalled();

          let cartographic = scene.globe.ellipsoid.cartesianToCartographic(
            b._clampedPosition,
          );
          expect(cartographic.height).toEqual(0.0);

          invokeCallback(100.0);

          cartographic = scene.globe.ellipsoid.cartesianToCartographic(
            b._clampedPosition,
          );
          expect(cartographic.height).toEqualEpsilon(
            100.0,
            CesiumMath.EPSILON9,
          );

          //Setting position to zero should clear the clamped position.
          b.position = Cartesian3.ZERO;
          expect(b._clampedPosition).toBeUndefined();
        });

        it("removes callback after disableDepthTest", function () {
          const removeCallback = jasmine.createSpy();
          spyOn(scene, "updateHeight").and.returnValue(removeCallback);

          const b = billboardsWithHeight.add({
            heightReference: HeightReference.CLAMP_TO_GROUND,
            position: Cartesian3.fromDegrees(-122, 46.0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          });
          scene.renderForSpecs();
          expect(b._clampedPosition).toBeDefined();

          //After changing disableDepthTestDistance and heightReference, the callback should be undefined
          b.disableDepthTestDistance = undefined;
          b.heightReference = HeightReference.NONE;

          scene.renderForSpecs();
          expect(b._clampedPosition).toBeUndefined();
          expect(removeCallback).toHaveBeenCalled();
        });

        it("updates the callback when the terrain provider is changed", async function () {
          const removeCallback = jasmine.createSpy();
          spyOn(scene, "updateHeight").and.returnValue(removeCallback);

          const position = Cartesian3.fromDegrees(-72.0, 40.0);
          billboardsWithHeight.add({
            heightReference: HeightReference.CLAMP_TO_GROUND,
            position: position,
          });
          expect(scene.updateHeight).toHaveBeenCalledWith(
            Cartographic.fromCartesian(position),
            jasmine.any(Function),
            HeightReference.CLAMP_TO_GROUND,
          );

          const terrainProvider = await CesiumTerrainProvider.fromUrl(
            "made/up/url",
            {
              requestVertexNormals: true,
            },
          );

          scene.terrainProvider = terrainProvider;

          expect(scene.updateHeight).toHaveBeenCalledWith(
            Cartographic.fromCartesian(position),
            jasmine.any(Function),
            HeightReference.CLAMP_TO_GROUND,
          );
          expect(removeCallback).toHaveBeenCalled();
        });

        it("height reference without a scene rejects", function () {
          expect(function () {
            return billboards.add({
              heightReference: HeightReference.CLAMP_TO_GROUND,
              position: Cartesian3.fromDegrees(-72.0, 40.0),
            });
          }).toThrowDeveloperError();
        });

        it("changing height reference without a scene throws DeveloperError", function () {
          const b = billboards.add({
            position: Cartesian3.fromDegrees(-72.0, 40.0),
          });

          expect(function () {
            b.heightReference = HeightReference.CLAMP_TO_GROUND;
          }).toThrowDeveloperError();
        });

        it("height reference without a globe works", function () {
          scene.globe = undefined;

          expect(function () {
            billboardsWithHeight.add({
              heightReference: HeightReference.CLAMP_TO_GROUND,
              position: Cartesian3.fromDegrees(-72.0, 40.0),
            });

            scene.renderForSpecs();
          }).not.toThrowError();
        });

        it("changing height reference without a globe throws DeveloperError", function () {
          const b = billboardsWithHeight.add({
            position: Cartesian3.fromDegrees(-72.0, 40.0),
          });

          scene.globe = undefined;

          expect(function () {
            b.heightReference = HeightReference.CLAMP_TO_GROUND;
            scene.renderForSpecs();
          }).not.toThrowDeveloperError();
        });
      });
    },
    "WebGL",
  );
});
