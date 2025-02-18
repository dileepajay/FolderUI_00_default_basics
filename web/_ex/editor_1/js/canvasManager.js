window.CanvasManager = {
  canvas: null,
  ctx: null,

  isMouseDown: false,
  dragMode: null, // 'move', 'resize-left', 'resize-right', 'resize-top', 'resize-bottom', 'resize-tl', 'resize-tr', 'resize-bl', 'resize-br'
  dragStartX: 0,
  dragStartY: 0,
  originalX: 0,
  originalY: 0,
  originalW: 0,
  originalH: 0,

  initCanvas(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error("Canvas not found:", canvasId);
      return;
    }
    this.ctx = this.canvas.getContext("2d");

    // Mouse events
    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    // Also consider 'mouseleave' or 'mouseout' to cancel drag if mouse leaves canvas
    this.canvas.addEventListener("mouseout", this.onMouseUp.bind(this));

    // If you want to change cursor while hovering (not dragging):
    this.canvas.addEventListener("mousemove", this.onHover.bind(this));
  },

  /** 
   * If not dragging, we still check which corner/edge is under the cursor
   * and update the cursor style (arrow, ns-resize, ew-resize, nwse-resize, etc.).
   */
  onHover(e) {
    if (this.isMouseDown) return; // We already set drag cursors

    const { offsetX, offsetY } = e;
    const topLayer = this.getTopmostLayerAt(offsetX, offsetY);
    if (!topLayer) {
      this.canvas.style.cursor = "default";
      return;
    }

    const handle = this.getEdgeOrCornerHit(topLayer, offsetX, offsetY);
    if (handle) {
      this.canvas.style.cursor = this.getCursorForHandle(handle);
    } else {
      // Inside bounding box but not on an edge/corner => move cursor or default
      this.canvas.style.cursor = "move";
    }
  },

  onMouseDown(e) {
    this.isMouseDown = true;
    const { offsetX, offsetY } = e;
    const clickedLayer = this.getTopmostLayerAt(offsetX, offsetY);

    if (clickedLayer) {
      // Make that layer selected
      UIController.selectedLayerId = clickedLayer.id;
      UIController.updateLayersListUI();

      // Which handle (edge or corner) did we click? (Or maybe inside the box?)
      const handle = this.getEdgeOrCornerHit(clickedLayer, offsetX, offsetY);
      if (handle) {
        // e.g. 'resize-tl', 'resize-left', etc.
        this.dragMode = handle;
      } else {
        this.dragMode = "move";
      }

      // Store starting info
      this.dragStartX = offsetX;
      this.dragStartY = offsetY;
      this.originalX = clickedLayer.x;
      this.originalY = clickedLayer.y;
      this.originalW = clickedLayer.width;
      this.originalH = clickedLayer.height;

      // Update cursor
      this.canvas.style.cursor = this.getCursorForHandle(this.dragMode) || "move";
    } else {
      // Clicked empty space
      this.dragMode = null;
      this.canvas.style.cursor = "default";
    }
  },

  onMouseMove(e) {
    if (!this.isMouseDown || !this.dragMode) return;

    const { offsetX, offsetY } = e;
    const layer = this.getSelectedLayer();
    if (!layer) return;

    const dx = offsetX - this.dragStartX;
    const dy = offsetY - this.dragStartY;

    // SHIFT => single dimension or free-scaling (depending on your preference)
    const shiftPressed = e.shiftKey;

    if (this.dragMode === "move") {
      layer.x = this.originalX + dx;
      layer.y = this.originalY + dy;
    } else {
      // We are resizing. Let's do the logic for each edge/corner.
      // We'll keep an aspect ratio by default, unless SHIFT is pressed.
      const aspectRatio = this.originalW / this.originalH;

      switch (this.dragMode) {
        case "resize-left":
          // newX => originalX + dx, newW => originalW - dx
          const newW_left = this.originalW - dx;
          if (shiftPressed) {
            // SHIFT => free horizontal only; no aspect
            layer.x = this.originalX + dx;
            layer.width = Math.max(10, newW_left);
          } else {
            // maintain aspect => height must scale too
            const scale = newW_left / this.originalW;
            layer.width = Math.max(10, newW_left);
            layer.height = Math.max(10, this.originalH * scale);
            layer.x = this.originalX + (this.originalW - layer.width);
          }
          break;

        case "resize-right":
          // newW => originalW + dx
          const newW_right = this.originalW + dx;
          if (shiftPressed) {
            // SHIFT => free horizontal
            layer.width = Math.max(10, newW_right);
          } else {
            // maintain aspect
            const scale = newW_right / this.originalW;
            layer.width = Math.max(10, newW_right);
            layer.height = Math.max(10, this.originalH * scale);
          }
          break;

        case "resize-top":
          // newH => originalH - dy
          const newH_top = this.originalH - dy;
          if (shiftPressed) {
            // SHIFT => free vertical
            layer.y = this.originalY + dy;
            layer.height = Math.max(10, newH_top);
          } else {
            // maintain aspect
            const scale = newH_top / this.originalH;
            layer.height = Math.max(10, newH_top);
            layer.width = Math.max(10, this.originalW * scale);
            // Move y so the bottom stays in the same place
            layer.y = this.originalY + (this.originalH - layer.height);
          }
          break;

        case "resize-bottom":
          // newH => originalH + dy
          const newH_bottom = this.originalH + dy;
          if (shiftPressed) {
            layer.height = Math.max(10, newH_bottom);
          } else {
            const scale = newH_bottom / this.originalH;
            layer.height = Math.max(10, newH_bottom);
            layer.width = Math.max(10, this.originalW * scale);
          }
          break;

        case "resize-tl":
        case "resize-tr":
        case "resize-bl":
        case "resize-br":
          // handle corners => both width & height can change
          let newW_corner, newH_corner;
          if (this.dragMode === "resize-tl") {
            newW_corner = this.originalW - dx;
            newH_corner = this.originalH - dy;
          } else if (this.dragMode === "resize-tr") {
            newW_corner = this.originalW + dx;
            newH_corner = this.originalH - dy;
          } else if (this.dragMode === "resize-bl") {
            newW_corner = this.originalW - dx;
            newH_corner = this.originalH + dy;
          } else {
            // 'resize-br'
            newW_corner = this.originalW + dx;
            newH_corner = this.originalH + dy;
          }

          // SHIFT => free resize or single dimension? 
          // The request said: "If SHIFT is selected, resize one side only." 
          // Let's interpret that as *no aspect ratio*. 
          if (shiftPressed) {
            // free corner scaling
            layer.width = Math.max(10, newW_corner);
            layer.height = Math.max(10, newH_corner);

            // If top or left edges are moving, adjust X or Y so the "opposite" corner stays put
            if (this.dragMode === "resize-tl") {
              layer.x = this.originalX + (this.originalW - layer.width);
              layer.y = this.originalY + (this.originalH - layer.height);
            } else if (this.dragMode === "resize-tr") {
              layer.y = this.originalY + (this.originalH - layer.height);
            } else if (this.dragMode === "resize-bl") {
              layer.x = this.originalX + (this.originalW - layer.width);
            }
          } else {
            // maintain aspect ratio
            // figure out which dimension changed more in proportion, use that for scale
            // or keep it consistent with the smaller scale for better feel
            // simpler approach: scale by width or height difference
            const scaleW = newW_corner / this.originalW;
            const scaleH = newH_corner / this.originalH;
            const scale = Math.min(scaleW, scaleH);

            layer.width = Math.max(10, this.originalW * scale);
            layer.height = Math.max(10, this.originalH * scale);

            if (this.dragMode === "resize-tl") {
              layer.x = this.originalX + (this.originalW - layer.width);
              layer.y = this.originalY + (this.originalH - layer.height);
            } else if (this.dragMode === "resize-tr") {
              // top-right => x doesn't move, but y does
              layer.y = this.originalY + (this.originalH - layer.height);
            } else if (this.dragMode === "resize-bl") {
              // bottom-left => y doesn't move, but x does
              layer.x = this.originalX + (this.originalW - layer.width);
            }
            // 'resize-br' => no x/y shift needed
          }
          break;
      }
    }

    // Re-draw
    this.redrawAll(LayersManager.layers);
  },

  onMouseUp(e) {
    this.isMouseDown = false;
    this.dragMode = null;
    this.canvas.style.cursor = "default";
  },

  /** Returns the selected layer (by UIController) */
  getSelectedLayer() {
    if (!UIController.selectedLayerId) return null;
    return LayersManager.layers.find(l => l.id === UIController.selectedLayerId);
  },

  /** Return the topmost visible layer under (x,y). */
  getTopmostLayerAt(x, y) {
    for (let i = LayersManager.layers.length - 1; i >= 0; i--) {
      const layer = LayersManager.layers[i];
      if (!layer.visible || !layer.image) continue;
      if (
        x >= layer.x && x <= layer.x + layer.width &&
        y >= layer.y && y <= layer.y + layer.height
      ) {
        return layer;
      }
    }
    return null;
  },

  /**
   * If the point is near a corner or edge, return e.g. "resize-left", "resize-br", etc.
   * Otherwise return null.
   */
  getEdgeOrCornerHit(layer, x, y) {
    const buffer = 8; // how close to edge/corner triggers resize
    const L = layer.x;
    const R = layer.x + layer.width;
    const T = layer.y;
    const B = layer.y + layer.height;

    // Check corners first:
    // top-left
    if (this.isNear(x, y, L, T, buffer)) return "resize-tl";
    // top-right
    if (this.isNear(x, y, R, T, buffer)) return "resize-tr";
    // bottom-left
    if (this.isNear(x, y, L, B, buffer)) return "resize-bl";
    // bottom-right
    if (this.isNear(x, y, R, B, buffer)) return "resize-br";

    // If not corners, check edges:
    // left edge
    if (this.isBetween(y, T, B) && Math.abs(x - L) <= buffer) return "resize-left";
    // right edge
    if (this.isBetween(y, T, B) && Math.abs(x - R) <= buffer) return "resize-right";
    // top edge
    if (this.isBetween(x, L, R) && Math.abs(y - T) <= buffer) return "resize-top";
    // bottom edge
    if (this.isBetween(x, L, R) && Math.abs(y - B) <= buffer) return "resize-bottom";

    return null;
  },

  isNear(x, y, targetX, targetY, distance) {
    return Math.abs(x - targetX) <= distance && Math.abs(y - targetY) <= distance;
  },
  isBetween(v, min, max) {
    return v >= min && v <= max;
  },

  /**
   * Return a CSS cursor value for a given handle (resize-left, resize-tl, etc.)
   */
  getCursorForHandle(handle) {
    switch (handle) {
      case "resize-left":
      case "resize-right":
        return "ew-resize";
      case "resize-top":
      case "resize-bottom":
        return "ns-resize";
      case "resize-tl":
      case "resize-br":
        // top-left corner or bottom-right corner => diagonal ↖↘
        return "nwse-resize";
      case "resize-tr":
      case "resize-bl":
        // top-right corner or bottom-left corner => diagonal ↗↙
        return "nesw-resize";
      default:
        return null;
    }
  },

  /**
   * Clear + draw all layers. Then draw a bounding box for the selected layer (if visible).
   */
  redrawAll(layers) {
    this.clearCanvas();
    const ctx = this.ctx;

    layers.forEach(layer => {
      if (!layer.visible || !layer.image) return;
      ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
    });

    // Outline selected layer
    const selLayer = this.getSelectedLayer();
    if (selLayer && selLayer.visible && selLayer.image) {
      this.drawBoundingBox(selLayer);
    }
  },

  drawBoundingBox(layer) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;
    ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

    // Optionally draw corner/edge handles
    // (like little squares or circles)
    const handleSize = 8;

    // corners
    this.drawHandle(ctx, layer.x, layer.y, handleSize); // tl
    this.drawHandle(ctx, layer.x + layer.width, layer.y, handleSize); // tr
    this.drawHandle(ctx, layer.x, layer.y + layer.height, handleSize); // bl
    this.drawHandle(ctx, layer.x + layer.width, layer.y + layer.height, handleSize); // br

    // edges
    this.drawHandle(ctx, layer.x + layer.width / 2, layer.y, handleSize); // top
    this.drawHandle(ctx, layer.x + layer.width / 2, layer.y + layer.height, handleSize); // bottom
    this.drawHandle(ctx, layer.x, layer.y + layer.height / 2, handleSize); // left
    this.drawHandle(ctx, layer.x + layer.width, layer.y + layer.height / 2, handleSize); // right

    ctx.restore();
  },

  drawHandle(ctx, x, y, size) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  },

  clearCanvas() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },
};
