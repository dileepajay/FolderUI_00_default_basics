window.LayersManager = {
  layers: [],
  nextLayerId: 1,

  initLayersManager() {
    // Create an empty background layer
    this.addLayer({
      id: this.nextLayerId++,
      name: "Background",
      visible: true,
      image: null,
      x: 0,
      y: 0,
      width: CanvasManager.canvas ? CanvasManager.canvas.width : 800,
      height: CanvasManager.canvas ? CanvasManager.canvas.height : 600
    });
  },

  addLayer(layerData) {
    this.layers.push(layerData);
    UIController.updateLayersListUI();
    CanvasManager.redrawAll(this.layers);
  },

  removeLayer(layerId) {
    // Keep at least 1 layer
    if (this.layers.length === 1) {
      alert("Cannot remove the last layer.");
      return;
    }
    this.layers = this.layers.filter(l => l.id !== layerId);
    if (UIController.selectedLayerId === layerId) {
      UIController.selectedLayerId = null;
    }
    UIController.updateLayersListUI();
    CanvasManager.redrawAll(this.layers);
  },

  toggleVisibility(layerId) {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.visible = !layer.visible;
      CanvasManager.redrawAll(this.layers);
    }
  },

  moveLayerUp(layerId) {
    const idx = this.layers.findIndex(l => l.id === layerId);
    if (idx < 0 || idx === this.layers.length - 1) return; // top already
    [this.layers[idx], this.layers[idx + 1]] = [this.layers[idx + 1], this.layers[idx]];
    UIController.updateLayersListUI();
    CanvasManager.redrawAll(this.layers);
  },

  moveLayerDown(layerId) {
    const idx = this.layers.findIndex(l => l.id === layerId);
    if (idx <= 0) return; // bottom already
    [this.layers[idx], this.layers[idx - 1]] = [this.layers[idx - 1], this.layers[idx]];
    UIController.updateLayersListUI();
    CanvasManager.redrawAll(this.layers);
  },

  /**
   * Sets layer.image plus x,y,width,height (scaled if needed).
   */
  setLayerImage(layerId, img) {
    const layer = this.layers.find(l => l.id === layerId);
    if (!layer) return;

    layer.image = img;

    // If bigger than canvas, scale down
    const canvasW = CanvasManager.canvas.width;
    const canvasH = CanvasManager.canvas.height;

    let w = img.width;
    let h = img.height;

    // Scale if too big for canvas
    const scaleW = canvasW / w;
    const scaleH = canvasH / h;
    const scaleFactor = Math.min(scaleW, scaleH, 1); // only shrink if bigger

    layer.width = w * scaleFactor;
    layer.height = h * scaleFactor;
    layer.x = 0;  // Start in top-left corner
    layer.y = 0;

    CanvasManager.redrawAll(this.layers);
  },

  getLayers() {
    return this.layers;
  }
};
