/**
 * 根据色带取值
 * @param m 值
 * @param min 最小值
 * @param max 最大值
 * @param colorScale 色带
 * @returns {number}
 */
function indexFor(m, min, max, colorScale) {
  return Math.max(
    0,
    Math.min(
      colorScale.length - 1,
      Math.round(((m - min) / (max - min)) * (colorScale.length - 1)),
    ),
  );
}

/**
 * 风绘制图层
 * @param ctx
 * @param {object} options
 * @param {Field} field
 * @constructor
 *
 * @private
 */
function WindCanvas(ctx, options, field) {
  this.particles = [];
  this.generated = false;
  this.ctx = ctx;
  this.animate = this.animate.bind(this);
  this.setOptions(options);
  this.updateData(field);
}

WindCanvas.prototype.setOptions = function (options) {
  this.options = options;
  this.prerender();
};

WindCanvas.prototype.getOptions = function () {
  return this.options;
};

/**
 * 更新数据
 * @param {Field} field
 */
WindCanvas.prototype.updateData = function (field) {
  this.field = field;
  if (!this.generated) {
    return;
  }
  this.particles = this.prepareParticlePaths();
};

WindCanvas.prototype.moveParticles = function () {
  const width = this.ctx.canvas.width;
  const height = this.ctx.canvas.height;
  const particles = this.particles;
  const maxAge = this.options.maxAge;
  const velocityScale = this.options.velocityScale;
  const len = particles.length;
  for (let i = 0; i < len; i++) {
    const particle = particles[i];
    if (particle.age > maxAge) {
      particle.age = 0;
      // restart, on a random x,y
      this.field.randomize(particle, width, height, this.unproject);
    }
    const x = particle.x;
    const y = particle.y;
    const vector = this.field.interpolatedValueAt(x, y);
    if (vector === null) {
      particle.age = maxAge;
    } else {
      const xt = x + vector.u * velocityScale;
      const yt = y + vector.v * velocityScale;
      if (this.field.hasValueAt(xt, yt)) {
        // Path from (x,y) to (xt,yt) is visible, so add this particle to the appropriate draw bucket.
        particle.xt = xt;
        particle.yt = yt;
        particle.m = vector.m;
      } else {
        // Particle isn't visible, but it still moves through the field.
        particle.x = xt;
        particle.y = yt;
        particle.age = maxAge;
      }
    }
    particle.age++;
  }
};

WindCanvas.prototype.fadeIn = function () {
  const prev = this.ctx.globalCompositeOperation; // lighter
  this.ctx.globalCompositeOperation = "destination-in";
  this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  this.ctx.globalCompositeOperation = prev;
};

WindCanvas.prototype.drawParticles = function () {
  if (!this.particles || !this.particles.length) {
    return;
  }
  const particles = this.particles;
  this.fadeIn();
  this.ctx.globalAlpha = this.options.globalAlpha;
  this.ctx.fillStyle = `rgba(0, 0, 0, ${this.options.globalAlpha})`;
  this.ctx.lineWidth = this.options.lineWidth;
  this.ctx.strokeStyle = this.options.colorScale;
  const len = particles.length;
  if (len > 0) {
    let min;
    let max;
    // 如果配置了风速范围
    if (this.options.minVelocity && this.options.maxVelocity) {
      min = this.options.minVelocity;
      max = this.options.maxVelocity;
    } else {
      // 未配置风速范围取格点数据中的最大风速和最小风速
      const range = this.field.range;
      min = range[0];
      max = range[1];
    }
    for (let i = 0; i < len; i++) {
      this.drawCoordsParticle(particles[i], min, max);
    }
  }
};

/**
 * 用于绘制坐标粒子
 * @param particle
 * @param min
 * @param max
 */
WindCanvas.prototype.drawCoordsParticle = function (particle, min, max) {
  const source = [particle.x, particle.y];
  const target = [particle.xt, particle.yt];
  if (
    target &&
    source &&
    target[0] &&
    target[1] &&
    source[0] &&
    source[1] &&
    this.intersectsCoordinate(target) &&
    particle.age <= this.options.maxAge
  ) {
    const pointPrev = this.project(source);
    const pointNext = this.project(target);
    if (pointPrev && pointNext) {
      this.ctx.beginPath();
      this.ctx.moveTo(pointPrev[0], pointPrev[1]);
      this.ctx.lineTo(pointNext[0], pointNext[1]);
      particle.x = particle.xt;
      particle.y = particle.yt;
      if (typeof this.options.colorScale === "function") {
        this.ctx.strokeStyle = this.options.colorScale(particle.m);
      } else if (Array.isArray(this.options.colorScale)) {
        const colorIdx = indexFor(
          particle.m,
          min,
          max,
          this.options.colorScale,
        );
        this.ctx.strokeStyle = this.options.colorScale[colorIdx];
      }
      if (typeof this.options.lineWidth === "function") {
        this.ctx.lineWidth = this.options.lineWidth(particle.m);
      }
      this.ctx.stroke();
    }
  }
};

WindCanvas.prototype.prepareParticlePaths = function () {
  const width = this.ctx.canvas.width;
  const height = this.ctx.canvas.height;
  const particleCount = this.options.paths;
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(
      this.field.randomize(
        {
          age: this.randomize(),
        },
        width,
        height,
        this.unproject,
      ),
    );
  }
  return particles;
};

WindCanvas.prototype.randomize = function () {
  return Math.floor(Math.random() * this.options.maxAge); // 例如最大生成90帧插值粒子路径
};

WindCanvas.prototype.project = function () {
  throw new Error("project must be overriden");
};

WindCanvas.prototype.unproject = function () {
  throw new Error("unproject must be overriden");
};

WindCanvas.prototype.intersectsCoordinate = function (coordinates) {
  throw new Error("must be overriden");
};

WindCanvas.prototype.clearCanvas = function () {
  this.stop();
  this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  this.forceStop = false;
};

WindCanvas.prototype.start = function () {
  this.starting = true;
  this.forceStop = false;
  this._then = Date.now();
  this.animate();
};

WindCanvas.prototype.stop = function () {
  cancelAnimationFrame(this.animationLoop);
  this.starting = false;
  this.forceStop = true;
};

WindCanvas.prototype.animate = function () {
  if (this.animationLoop) {
    cancelAnimationFrame(this.animationLoop);
  }
  this.animationLoop = requestAnimationFrame(this.animate);
  const now = Date.now();
  const delta = now - this._then;
  if (delta > this.options.frameRate) {
    this._then = now - (delta % this.options.frameRate);
    this.render();
  }
};

/**
 * 渲染前处理
 */
WindCanvas.prototype.prerender = function () {
  this.generated = false;
  if (!this.field) {
    return;
  }
  this.particles = this.prepareParticlePaths();
  this.generated = true;
  if (!this.starting && !this.forceStop) {
    this.starting = true;
    this._then = Date.now();
    this.animate();
  }
};

/**
 * 开始渲染
 */
WindCanvas.prototype.render = function () {
  this.moveParticles();
  this.drawParticles();
};

export default WindCanvas;
