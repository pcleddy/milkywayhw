class ExplorerModel {
  constructor(data) {
    this.meta = data.meta;
    this.camera = data.camera;
    this.stages = data.stages;
    this.landmarks = data.landmarks;
    this.arms = data.arms;
  }

  getStageForZoom(zoom) {
    return this.stages.find((stage) => zoom >= stage.min && zoom <= stage.max) ?? this.stages[this.stages.length - 1];
  }

  getLandmark(id) {
    return this.landmarks.find((landmark) => landmark.id === id);
  }
}

class InputController {
  constructor(canvas, state, model) {
    this.canvas = canvas;
    this.state = state;
    this.model = model;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.keys = {};

    this.bind();
  }

  bind() {
    this.canvas.addEventListener("mousedown", (event) => {
      this.dragging = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    });
    window.addEventListener("mouseup", () => {
      this.dragging = false;
    });
    window.addEventListener("mousemove", (event) => {
      if (!this.dragging) {
        return;
      }
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.state.offsetX += (dx / this.canvas.clientWidth) * 0.12;
      this.state.offsetY += (dy / this.canvas.clientHeight) * 0.12;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    });
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.09 : 0.09;
      this.state.targetZoom = clamp(this.state.targetZoom + delta, this.model.camera.minZoom, this.model.camera.maxZoom);
    }, { passive: false });
    window.addEventListener("keydown", (event) => {
      this.keys[event.key.toLowerCase()] = true;
    });
    window.addEventListener("keyup", (event) => {
      this.keys[event.key.toLowerCase()] = false;
    });
  }

  tick() {
    const speed = this.model.camera.panSpeed * (2 - this.state.zoom);
    if (this.keys.w) {
      this.state.offsetY -= speed;
    }
    if (this.keys.s) {
      this.state.offsetY += speed;
    }
    if (this.keys.a) {
      this.state.offsetX -= speed;
    }
    if (this.keys.d) {
      this.state.offsetX += speed;
    }
  }
}

class StarLayer {
  constructor(count) {
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      alpha: Math.random() * 0.7 + 0.1,
      size: Math.random() * 1.8 + 0.2,
      depth: Math.random() * 0.9 + 0.1
    }));
  }

  draw(ctx, width, height, state, time) {
    for (const star of this.stars) {
      const x = star.x * width + state.offsetX * width * star.depth + Math.sin(time * 0.00008 + star.depth * 11) * 10 * state.zoom;
      const y = star.y * height + state.offsetY * height * star.depth + Math.cos(time * 0.00006 + star.depth * 13) * 8 * state.zoom;
      ctx.beginPath();
      ctx.fillStyle = `rgba(236, 245, 255, ${star.alpha})`;
      ctx.arc(x, y, star.size * state.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

class ExplorerRenderer {
  constructor(canvas, minimap, model) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.minimap = minimap;
    this.minimapCtx = minimap.getContext("2d");
    this.model = model;
    this.stars = new StarLayer(model.camera.starCount);
    this.state = { zoom: 1.25, targetZoom: 1.25, offsetX: 0, offsetY: 0 };
    this.input = new InputController(canvas, this.state, model);
    this.zoomStage = document.querySelector("#zoom-stage");
    this.zoomCopy = document.querySelector("#zoom-copy");
    this.stageButtons = document.querySelector("#stage-buttons");
    this.landmarkButtons = document.querySelector("#landmark-buttons");

    this.installUI();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  installUI() {
    this.stageButtons.innerHTML = "";
    for (const stage of this.model.stages) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = stage.label;
      button.addEventListener("click", () => {
        this.state.targetZoom = clamp((stage.min + stage.max) * 0.5, this.model.camera.minZoom, this.model.camera.maxZoom);
      });
      this.stageButtons.appendChild(button);
    }

    this.landmarkButtons.innerHTML = "";
    for (const landmark of this.model.landmarks) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${landmark.name} · ${landmark.copy}`;
      button.addEventListener("click", () => {
        this.focusLandmark(landmark.id);
      });
      this.landmarkButtons.appendChild(button);
    }
  }

  focusLandmark(id) {
    const landmark = this.model.getLandmark(id);
    if (!landmark) {
      return;
    }
    this.state.offsetX = 0.5 - landmark.x;
    this.state.offsetY = 0.5 - landmark.y;
    if (id === "sun") {
      this.state.targetZoom = 0.96;
    }
    if (id === "core") {
      this.state.targetZoom = 0.58;
    }
    if (id === "orion") {
      this.state.targetZoom = 0.84;
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
      this.state.zoom += (this.state.targetZoom - this.state.zoom) * 0.08;
      this.input.tick();
      this.state.offsetX = clamp(this.state.offsetX, -0.24, 0.24);
      this.state.offsetY = clamp(this.state.offsetY, -0.2, 0.2);
      this.draw(time);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  draw(time) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const ctx = this.ctx;
    const stage = this.model.getStageForZoom(this.state.zoom);

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createRadialGradient(width * 0.55, height * 0.46, width * 0.04, width * 0.55, height * 0.55, width * 0.78);
    bg.addColorStop(0, "rgba(255, 207, 116, 0.09)");
    bg.addColorStop(0.32, "rgba(62, 108, 154, 0.16)");
    bg.addColorStop(1, "rgba(1, 3, 7, 0.98)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    this.stars.draw(ctx, width, height, this.state, time);
    this.drawBand(ctx, width, height, stage, time);
    this.drawGrid(ctx, width, height, stage);
    this.drawArms(ctx, width, height, stage);
    this.drawLandmarks(ctx, width, height, stage, time);
    this.drawMinimap();
    this.updateHUD(stage);
  }

  drawBand(ctx, width, height, stage, time) {
    const opacity = stage.id === "galaxy" ? 0.14 : stage.id === "local" ? 0.62 : 0.96;
    const thickness = stage.id === "galaxy" ? 0.58 : stage.id === "local" ? 0.82 : 1.18;
    ctx.save();
    ctx.translate(this.state.offsetX * width * 0.25, this.state.offsetY * height * 0.2);
    ctx.rotate(-0.16);
    const bandHeight = height * 0.2 * thickness;
    const grad = ctx.createLinearGradient(0, height * 0.5 - bandHeight, 0, height * 0.5 + bandHeight);
    grad.addColorStop(0, `rgba(113, 170, 249, ${0.02 * opacity})`);
    grad.addColorStop(0.5, `rgba(255, 214, 132, ${0.22 * opacity})`);
    grad.addColorStop(1, `rgba(113, 170, 249, ${0.02 * opacity})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.5, width * 0.58 * this.state.zoom, bandHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let streak = 0; streak < 7; streak += 1) {
      const wobble = Math.sin(time * 0.00015 + streak) * 8;
      ctx.strokeStyle = `rgba(255, 240, 197, ${0.055 * opacity})`;
      ctx.lineWidth = 19 - streak * 2;
      ctx.beginPath();
      ctx.moveTo(width * 0.05, height * 0.5 - bandHeight * 0.35 + wobble + streak * 2);
      ctx.bezierCurveTo(width * 0.22, height * 0.24 + wobble, width * 0.74, height * 0.75 - wobble, width * 0.96, height * 0.52 - wobble);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGrid(ctx, width, height, stage) {
    if (stage.id === "immersive") {
      return;
    }
    ctx.save();
    ctx.strokeStyle = `rgba(157, 228, 255, ${stage.id === "galaxy" ? 0.18 : 0.08})`;
    for (let ring = 1; ring <= 4; ring += 1) {
      ctx.beginPath();
      ctx.ellipse(width * 0.5 + this.state.offsetX * width * 0.3, height * 0.5 + this.state.offsetY * height * 0.3, width * 0.1 * ring, height * 0.08 * ring, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawArms(ctx, width, height, stage) {
    const opacity = stage.id === "galaxy" ? 0.96 : stage.id === "local" ? 0.42 : 0.0;
    if (opacity <= 0.01) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = opacity;
    const shiftX = this.state.offsetX * width * 0.55;
    const shiftY = this.state.offsetY * height * 0.55;
    for (const arm of this.model.arms) {
      ctx.strokeStyle = arm.color;
      ctx.lineWidth = 8 * (1 / Math.max(this.state.zoom, 0.42));
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      arm.points.forEach(([x, y], index) => {
        const px = x * width + shiftX;
        const py = y * height + shiftY;
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(255, 208, 120, ${stage.id === "galaxy" ? 0.26 : 0.14})`;
    ctx.beginPath();
    ctx.ellipse(width * 0.5 + shiftX, height * 0.5 + shiftY, width * 0.07, height * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawLandmarks(ctx, width, height, stage, time) {
    const opacity = stage.id === "immersive" ? 0.18 : 1;
    const shiftX = this.state.offsetX * width * 0.55;
    const shiftY = this.state.offsetY * height * 0.55;
    ctx.save();
    ctx.globalAlpha = opacity;
    for (const landmark of this.model.landmarks) {
      const x = landmark.x * width + shiftX;
      const y = landmark.y * height + shiftY;
      const pulse = landmark.id === "sun" ? 1 + Math.sin(time * 0.003) * 0.16 : 1;
      ctx.fillStyle = landmark.id === "sun" ? "#ffd36f" : "#9de4ff";
      ctx.beginPath();
      ctx.arc(x, y, (landmark.id === "core" ? 6 : 4) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(237, 246, 255, ${0.42 * opacity})`;
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

  drawMinimap() {
    const ctx = this.minimapCtx;
    ctx.clearRect(0, 0, 140, 140);
    ctx.fillStyle = "rgba(8, 15, 24, 0.94)";
    ctx.fillRect(0, 0, 140, 140);
    ctx.strokeStyle = "rgba(157, 228, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(70, 70, 54, 0, Math.PI * 2);
    ctx.stroke();
    for (const arm of this.model.arms) {
      ctx.strokeStyle = arm.color;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      arm.points.forEach(([x, y], index) => {
        const px = 16 + x * 108;
        const py = 16 + y * 108;
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const focusX = 70 + this.state.offsetX * 68;
    const focusY = 70 + this.state.offsetY * 68;
    ctx.strokeStyle = "#9de4ff";
    ctx.beginPath();
    ctx.arc(focusX, focusY, 8, 0, Math.PI * 2);
    ctx.stroke();
    const sun = this.model.getLandmark("sun");
    ctx.fillStyle = "#ffd36f";
    ctx.beginPath();
    ctx.arc(16 + sun.x * 108, 16 + sun.y * 108, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  updateHUD(stage) {
    this.zoomStage.textContent = `${stage.label} · zoom ${this.state.zoom.toFixed(2)}`;
    this.zoomCopy.textContent = stage.copy;
    for (const button of this.stageButtons.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.textContent === stage.label));
    }
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function bootstrap() {
  const response = await fetch("./scene.json");
  const data = await response.json();
  const renderer = new ExplorerRenderer(
    document.querySelector("#scene"),
    document.querySelector("#minimap"),
    new ExplorerModel(data)
  );
  renderer.start();
}

bootstrap().catch((error) => {
  console.error(error);
});
