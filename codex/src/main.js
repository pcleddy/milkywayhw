class SceneModel {
  constructor(data) {
    this.meta = data.meta;
    this.camera = data.camera;
    this.views = data.views;
    this.landmarks = data.landmarks;
    this.arms = data.arms;
  }

  getView(id) {
    return this.views.find((view) => view.id === id) ?? this.views[0];
  }
}

class CameraRig {
  constructor(model) {
    this.model = model;
    this.current = { ...model.views[0] };
    this.from = { ...this.current };
    this.to = { ...this.current };
    this.transitionStart = 0;
    this.transitionMs = model.camera.defaultTransitionMs;
  }

  transitionTo(view, now) {
    this.from = { ...this.current };
    this.to = { ...view };
    this.transitionStart = now;
  }

  tick(now) {
    const elapsed = now - this.transitionStart;
    const raw = Math.min(1, elapsed / this.transitionMs);
    const eased = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;

    for (const key of Object.keys(this.to)) {
      if (typeof this.to[key] === "number") {
        const start = this.from[key] ?? 0;
        this.current[key] = start + (this.to[key] - start) * eased;
      } else {
        this.current[key] = raw >= 1 ? this.to[key] : this.from[key];
      }
    }
  }
}

class StarField {
  constructor(count) {
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.8 + 0.2,
      alpha: Math.random() * 0.75 + 0.1,
      depth: Math.random() * 0.8 + 0.2
    }));
  }

  draw(ctx, width, height, camera, time) {
    for (const star of this.stars) {
      const driftX = Math.sin(time * 0.00008 + star.depth * 12) * 14 * camera.zoom * star.depth;
      const driftY = Math.cos(time * 0.00006 + star.depth * 10) * 10 * camera.zoom * star.depth;
      const x = star.x * width + driftX;
      const y = star.y * height + driftY;

      ctx.beginPath();
      ctx.fillStyle = `rgba(237, 246, 255, ${star.alpha})`;
      ctx.arc(x, y, star.size * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

class GalaxyRenderer {
  constructor(canvas, model) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.model = model;
    this.camera = new CameraRig(model);
    this.starField = new StarField(model.camera.starCount);
    this.stageTitle = document.querySelector("#stage-title");
    this.stageDescription = document.querySelector("#stage-description");
    this.landmarkRoot = document.querySelector("#landmarks");
    this.buttonRoot = document.querySelector("#view-buttons");
    this.activeViewId = model.views[0].id;

    this.installUI();
    this.populateLandmarks();
    this.updateCopy(this.model.views[0]);
    this.resize();

    window.addEventListener("resize", () => this.resize());
  }

  installUI() {
    this.buttonRoot.innerHTML = "";
    for (const view of this.model.views) {
      const button = document.createElement("button");
      button.textContent = view.label;
      button.type = "button";
      button.setAttribute("aria-pressed", String(view.id === this.activeViewId));
      button.addEventListener("click", () => this.setView(view.id));
      this.buttonRoot.appendChild(button);
    }
  }

  populateLandmarks() {
    this.landmarkRoot.innerHTML = "";
    for (const landmark of this.model.landmarks) {
      const item = document.createElement("article");
      item.className = "landmark-item";
      item.innerHTML = `<strong>${landmark.name}</strong><p>${landmark.description}</p>`;
      this.landmarkRoot.appendChild(item);
    }
  }

  setView(id) {
    this.activeViewId = id;
    const view = this.model.getView(id);
    this.camera.transitionTo(view, performance.now());
    this.updateCopy(view);
    for (const button of this.buttonRoot.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.textContent === view.label));
    }
  }

  updateCopy(view) {
    this.stageTitle.textContent = view.title;
    this.stageDescription.textContent = view.description;
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
      this.camera.tick(time);
      this.draw(time);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  draw(time) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const ctx = this.ctx;
    const view = this.camera.current;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(
      width * 0.5,
      height * 0.48,
      width * 0.08,
      width * 0.5,
      height * 0.56,
      width * 0.7
    );
    gradient.addColorStop(0, "rgba(255, 214, 140, 0.08)");
    gradient.addColorStop(0.32, "rgba(67, 111, 159, 0.16)");
    gradient.addColorStop(1, "rgba(1, 4, 8, 0.98)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    this.starField.draw(ctx, width, height, view, time);
    this.drawMilkyWayBand(ctx, width, height, view, time);
    this.drawGrid(ctx, width, height, view);
    this.drawArms(ctx, width, height, view);
    this.drawLandmarks(ctx, width, height, view, time);
  }

  drawMilkyWayBand(ctx, width, height, view, time) {
    ctx.save();
    ctx.translate(width * view.offsetX, height * view.offsetY);
    ctx.rotate(-0.18);

    const pulse = Math.sin(time * 0.0003) * 0.03 + 1;
    const bandHeight = height * 0.22 * view.bandThickness * pulse;
    const y = height * 0.48;

    const glow = ctx.createLinearGradient(0, y - bandHeight, 0, y + bandHeight);
    glow.addColorStop(0, `rgba(108, 175, 255, ${0.02 * view.bandOpacity})`);
    glow.addColorStop(0.5, `rgba(255, 215, 132, ${0.18 * view.bandOpacity})`);
    glow.addColorStop(1, `rgba(108, 175, 255, ${0.02 * view.bandOpacity})`);

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, y, width * 0.56 * view.zoom, bandHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 6; i += 1) {
      const jitter = Math.sin(time * 0.00016 + i) * 8;
      ctx.strokeStyle = `rgba(255, 238, 196, ${0.06 * view.bandOpacity})`;
      ctx.lineWidth = 18 - i * 2;
      ctx.beginPath();
      ctx.moveTo(width * 0.06, y - bandHeight * 0.4 + jitter + i * 3);
      ctx.bezierCurveTo(
        width * 0.25,
        y - bandHeight * 1.1 + jitter,
        width * 0.72,
        y + bandHeight * 1.0 - jitter,
        width * 0.94,
        y + bandHeight * 0.2 - jitter
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  drawGrid(ctx, width, height, view) {
    if (view.gridOpacity <= 0.01) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = `rgba(157, 228, 255, ${0.18 * view.gridOpacity})`;
    ctx.lineWidth = 1;
    const cols = 8;
    const rows = 6;

    for (let col = 1; col < cols; col += 1) {
      const x = (width / cols) * col;
      ctx.beginPath();
      ctx.moveTo(x, height * 0.08);
      ctx.lineTo(x, height * 0.92);
      ctx.stroke();
    }

    for (let row = 1; row < rows; row += 1) {
      const y = (height / rows) * row;
      ctx.beginPath();
      ctx.moveTo(width * 0.08, y);
      ctx.lineTo(width * 0.92, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawArms(ctx, width, height, view) {
    if (view.armOpacity <= 0.01) {
      return;
    }

    ctx.save();
    ctx.globalAlpha = view.armOpacity;
    for (const arm of this.model.arms) {
      ctx.strokeStyle = arm.color;
      ctx.lineWidth = 7 * (1 / Math.max(view.zoom, 0.42));
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
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

    ctx.fillStyle = `rgba(255, 214, 140, ${0.26 * view.armOpacity})`;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.5, width * 0.065, height * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawLandmarks(ctx, width, height, view, time) {
    if (view.landmarkOpacity <= 0.01) {
      return;
    }

    ctx.save();
    ctx.globalAlpha = view.landmarkOpacity;

    for (const landmark of this.model.landmarks) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      const pulse = landmark.id === "sun" ? 1 + Math.sin(time * 0.0034) * 0.18 * view.sunPulse : 1;
      const radius = landmark.id === "core" ? 6 : 4;

      ctx.fillStyle = landmark.id === "sun" ? "#ffd36f" : "#9de4ff";
      ctx.beginPath();
      ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(237, 246, 255, ${0.45 * view.landmarkOpacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 10, y - 10);
      ctx.lineTo(x + 56, y - 28);
      ctx.stroke();

      ctx.fillStyle = "rgba(237, 246, 255, 0.92)";
      ctx.font = '500 13px "IBM Plex Mono", monospace';
      ctx.fillText(landmark.name, x + 62, y - 30);
    }

    ctx.restore();
  }
}

async function bootstrap() {
  const response = await fetch("./data/scene.json");
  const data = await response.json();
  const model = new SceneModel(data);
  const canvas = document.querySelector("#scene");
  const renderer = new GalaxyRenderer(canvas, model);
  renderer.start();
}

bootstrap().catch((error) => {
  console.error(error);
  document.querySelector("#stage-title").textContent = "Failed to load scene";
  document.querySelector("#stage-description").textContent = "Serve this folder over a local HTTP server so the JSON file can load.";
});
