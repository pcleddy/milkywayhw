class StoryModel {
  constructor(data) {
    this.meta = data.meta;
    this.camera = data.camera;
    this.stages = data.stages;
    this.landmarks = data.landmarks;
    this.arms = data.arms;
  }

  stageAt(progress) {
    if (progress <= this.stages[0].progress) {
      return this.stages[0];
    }
    if (progress >= this.stages[this.stages.length - 1].progress) {
      return this.stages[this.stages.length - 1];
    }
    for (let index = 0; index < this.stages.length - 1; index += 1) {
      const current = this.stages[index];
      const next = this.stages[index + 1];
      if (progress >= current.progress && progress <= next.progress) {
        return interpolateStage(current, next, progress);
      }
    }
    return this.stages[0];
  }
}

function interpolateStage(a, b, progress) {
  const span = b.progress - a.progress;
  const local = span === 0 ? 0 : (progress - a.progress) / span;
  const eased = local < 0.5 ? 4 * local * local * local : 1 - Math.pow(-2 * local + 2, 3) / 2;
  const stage = {};
  for (const key of Object.keys(a)) {
    if (typeof a[key] === "number" && typeof b[key] === "number") {
      stage[key] = a[key] + (b[key] - a[key]) * eased;
    } else {
      stage[key] = local < 0.5 ? a[key] : b[key];
    }
  }
  return stage;
}

class DriftField {
  constructor(count) {
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      alpha: Math.random() * 0.8 + 0.1,
      size: Math.random() * 1.9 + 0.2,
      depth: Math.random() * 0.9 + 0.1
    }));
  }

  draw(ctx, width, height, stage, time) {
    for (const star of this.stars) {
      const parallax = stage.zoom * (0.4 + star.depth);
      const x = star.x * width + Math.sin(time * 0.00008 + star.depth * 9) * 10 * parallax;
      const y = star.y * height + Math.cos(time * 0.00005 + star.depth * 12) * 8 * parallax;
      ctx.beginPath();
      ctx.fillStyle = `rgba(235, 245, 255, ${star.alpha})`;
      ctx.arc(x, y, star.size * stage.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

class CinematicRenderer {
  constructor(canvas, model) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.model = model;
    this.field = new DriftField(model.camera.starCount);
    this.progress = 0;
    this.playing = true;
    this.lastFrame = 0;
    this.timeline = document.querySelector("#timeline");
    this.playToggle = document.querySelector("#play-toggle");
    this.restart = document.querySelector("#restart");
    this.buttonRoot = document.querySelector("#stage-buttons");
    this.stageKicker = document.querySelector("#stage-kicker");
    this.stageTitle = document.querySelector("#stage-title");
    this.stageDescription = document.querySelector("#stage-description");
    this.scaleLabel = document.querySelector("#scale-label");
    this.storyLabel = document.querySelector("#story-label");

    this.installUI();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  installUI() {
    this.timeline.addEventListener("input", () => {
      this.progress = Number(this.timeline.value) / 1000;
      this.playing = false;
      this.playToggle.textContent = "Play Autoplay";
    });

    this.playToggle.addEventListener("click", () => {
      this.playing = !this.playing;
      this.playToggle.textContent = this.playing ? "Pause Autoplay" : "Play Autoplay";
    });

    this.restart.addEventListener("click", () => {
      this.progress = 0;
      this.playing = true;
      this.playToggle.textContent = "Pause Autoplay";
      this.timeline.value = "0";
    });

    this.buttonRoot.innerHTML = "";
    for (const stage of this.model.stages) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = stage.label;
      button.addEventListener("click", () => {
        this.progress = stage.progress;
        this.timeline.value = String(Math.round(stage.progress * 1000));
        this.playing = false;
        this.playToggle.textContent = "Play Autoplay";
      });
      this.buttonRoot.appendChild(button);
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    const frame = (time) => {
      if (this.lastFrame === 0) {
        this.lastFrame = time;
      }
      const dt = time - this.lastFrame;
      this.lastFrame = time;
      if (this.playing) {
        this.progress = Math.min(1, this.progress + dt * this.model.camera.autoplaySpeed);
        this.timeline.value = String(Math.round(this.progress * 1000));
      }
      const stage = this.model.stageAt(this.progress);
      this.paint(stage, time);
      this.updateCopy(stage);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  updateCopy(stage) {
    this.stageKicker.textContent = stage.label;
    this.stageTitle.textContent = stage.title;
    this.stageDescription.textContent = stage.description;
    this.scaleLabel.textContent = stage.scaleLabel;
    this.storyLabel.textContent = stage.story;
    for (const button of this.buttonRoot.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.textContent === stage.label));
    }
  }

  paint(stage, time) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createRadialGradient(width * 0.52, height * 0.5, width * 0.05, width * 0.52, height * 0.58, width * 0.78);
    bg.addColorStop(0, "rgba(255, 208, 120, 0.09)");
    bg.addColorStop(0.34, "rgba(66, 112, 158, 0.16)");
    bg.addColorStop(1, "rgba(1, 3, 7, 0.98)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    this.field.draw(ctx, width, height, stage, time);
    this.drawDust(ctx, width, height, stage, time);
    this.drawSkyBand(ctx, width, height, stage, time);
    this.drawMapGrid(ctx, width, height, stage);
    this.drawArms(ctx, width, height, stage);
    this.drawLandmarks(ctx, width, height, stage, time);
  }

  drawDust(ctx, width, height, stage, time) {
    ctx.save();
    ctx.globalAlpha = stage.dustOpacity;
    for (let index = 0; index < 9; index += 1) {
      const x = width * (0.18 + index * 0.08) + Math.sin(time * 0.0001 + index) * 14;
      const y = height * (0.35 + Math.sin(index * 0.7) * 0.11);
      const radius = width * (0.06 + index * 0.004) * stage.zoom;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, "rgba(255, 209, 121, 0.14)");
      grad.addColorStop(0.35, "rgba(115, 162, 214, 0.08)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawSkyBand(ctx, width, height, stage, time) {
    ctx.save();
    ctx.translate(width * 0.01, height * stage.pitch);
    ctx.rotate(-0.16);

    const bandHeight = height * 0.22 * stage.bandCurve;
    const grad = ctx.createLinearGradient(0, height * 0.5 - bandHeight, 0, height * 0.5 + bandHeight);
    grad.addColorStop(0, `rgba(119, 173, 248, ${0.02 * stage.bandOpacity})`);
    grad.addColorStop(0.5, `rgba(255, 214, 132, ${0.24 * stage.bandOpacity})`);
    grad.addColorStop(1, `rgba(119, 173, 248, ${0.02 * stage.bandOpacity})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.5, width * 0.62 * stage.zoom, bandHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let streak = 0; streak < 8; streak += 1) {
      const wobble = Math.sin(time * 0.00015 + streak) * 10;
      ctx.strokeStyle = `rgba(255, 239, 196, ${0.06 * stage.bandOpacity})`;
      ctx.lineWidth = 20 - streak * 2;
      ctx.beginPath();
      ctx.moveTo(width * 0.04, height * 0.49 - bandHeight * 0.35 + wobble + streak * 2);
      ctx.bezierCurveTo(width * 0.22, height * 0.25 + wobble, width * 0.72, height * 0.73 - wobble, width * 0.96, height * 0.5 - wobble);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawMapGrid(ctx, width, height, stage) {
    if (stage.gridOpacity <= 0.01) {
      return;
    }
    ctx.save();
    ctx.strokeStyle = `rgba(157, 228, 255, ${0.18 * stage.gridOpacity})`;
    for (let ring = 1; ring <= 4; ring += 1) {
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.5, width * 0.1 * ring, height * 0.08 * ring, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawArms(ctx, width, height, stage) {
    if (stage.armOpacity <= 0.01) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = stage.armOpacity;
    for (const arm of this.model.arms) {
      ctx.strokeStyle = arm.color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 8 * (1 / Math.max(stage.zoom, 0.42));
      ctx.beginPath();
      arm.points.forEach(([x, y], index) => {
        const px = x * width;
        const py = y * height;
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(255, 208, 120, ${0.18 + 0.15 * stage.mapOpacity})`;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.5, width * 0.07, height * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawLandmarks(ctx, width, height, stage, time) {
    if (stage.labelOpacity <= 0.01) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = stage.labelOpacity;
    for (const landmark of this.model.landmarks) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      const pulse = landmark.id === "sun" ? 1 + Math.sin(time * 0.003) * 0.18 : 1;
      ctx.fillStyle = landmark.id === "sun" ? "#ffd36f" : "#9de4ff";
      ctx.beginPath();
      ctx.arc(x, y, (landmark.id === "core" ? 6 : 4) * pulse, 0, Math.PI * 2);
      ctx.fill();

      if (landmark.id === "sun") {
        ctx.strokeStyle = `rgba(255, 211, 111, ${0.4 + 0.2 * stage.localHalo})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 16 + Math.sin(time * 0.002) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = `rgba(237, 246, 255, ${0.42 * stage.labelOpacity})`;
      ctx.beginPath();
      ctx.moveTo(x + 8, y - 8);
      ctx.lineTo(x + 54, y - 24);
      ctx.stroke();
      ctx.fillStyle = "rgba(237, 246, 255, 0.92)";
      ctx.font = '600 13px "Courier New", monospace';
      ctx.fillText(landmark.name, x + 58, y - 28);
    }
    ctx.restore();
  }
}

async function bootstrap() {
  const response = await fetch("./scene.json");
  const data = await response.json();
  const renderer = new CinematicRenderer(document.querySelector("#scene"), new StoryModel(data));
  renderer.start();
}

bootstrap().catch((error) => {
  console.error(error);
});
