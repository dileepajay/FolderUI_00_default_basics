window.UIController = {
  selectedLayerId: null,

  initUIController() {
    this.updateToolkitUI(ToolManager.activeTool);
    this.updateLayersListUI();
  },

  updateToolkitUI(tool) {
    const toolkitEl = document.getElementById("toolkit");
    if (!toolkitEl) return;
    toolkitEl.innerHTML = "";

    // For demonstration only
    if (tool === "pen") {
      toolkitEl.innerHTML = `
        <label>Pen Size: <input type="range" min="1" max="50" value="5"></label>
        <label>Color: <input type="color" value="#ff0000"></label>
      `;
    } else if (tool === "text") {
      toolkitEl.innerHTML = `
        <label>Font Size: <input type="number" value="24"></label>
        <label>Color: <input type="color" value="#000000"></label>
        <button>Insert Text</button>
      `;
    } else {
      toolkitEl.innerHTML = `No special settings for "${tool}".`;
    }
  },

  updateLayersListUI() {
    const layersListEl = document.getElementById("layers-list");
    if (!layersListEl) return;
    layersListEl.innerHTML = "";

    const layers = LayersManager.getLayers();
    layers.forEach(layer => {
      const layerDiv = document.createElement("div");
      layerDiv.className = "layer-item";
      if (this.selectedLayerId === layer.id) {
        layerDiv.classList.add("selected");
      }
      layerDiv.textContent = layer.name + (layer.visible ? "" : " (hidden)");

      layerDiv.addEventListener("click", () => {
        this.selectedLayerId = layer.id;
        this.updateLayersListUI();
        CanvasManager.redrawAll(layers);
      });

      // Build some quick controls (Hide, Up, Down)
      const btns = document.createElement("div");
      btns.style.marginLeft = "auto";

      const hideBtn = document.createElement("button");
      hideBtn.textContent = layer.visible ? "Hide" : "Show";
      hideBtn.onclick = (e) => {
        e.stopPropagation();
        LayersManager.toggleVisibility(layer.id);
        this.updateLayersListUI();
      };

      const upBtn = document.createElement("button");
      upBtn.textContent = "↑";
      upBtn.onclick = (e) => {
        e.stopPropagation();
        LayersManager.moveLayerUp(layer.id);
      };

      const downBtn = document.createElement("button");
      downBtn.textContent = "↓";
      downBtn.onclick = (e) => {
        e.stopPropagation();
        LayersManager.moveLayerDown(layer.id);
      };

      btns.appendChild(hideBtn);
      btns.appendChild(upBtn);
      btns.appendChild(downBtn);
      layerDiv.appendChild(btns);
      layersListEl.appendChild(layerDiv);
    });
  },

  addEmptyLayer() {
    LayersManager.addLayer({
      id: LayersManager.nextLayerId++,
      name: "Layer " + LayersManager.nextLayerId,
      visible: true,
      image: null,
      x: 0,
      y: 0,
      width: CanvasManager.canvas ? CanvasManager.canvas.width : 800,
      height: CanvasManager.canvas ? CanvasManager.canvas.height : 600
    });
    // Select the new layer
    this.selectedLayerId = LayersManager.layers[LayersManager.layers.length - 1].id;
    this.updateLayersListUI();
  },

  addImageLayer() {
    // Create a hidden file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = () => {
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const layerId = LayersManager.nextLayerId++;
            LayersManager.addLayer({
              id: layerId,
              name: file.name,
              visible: true,
              image: null,  // set later
              x: 0,
              y: 0,
              width: 0,
              height: 0,
            });

            // Scale + set image
            LayersManager.setLayerImage(layerId, img);

            // Select newly added layer
            this.selectedLayerId = layerId;
            this.updateLayersListUI();
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  },

  removeSelectedLayer() {
    if (!this.selectedLayerId) {
      alert("No layer selected.");
      return;
    }
    LayersManager.removeLayer(this.selectedLayerId);
  },
};
