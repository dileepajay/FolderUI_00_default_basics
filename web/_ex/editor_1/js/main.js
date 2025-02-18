import { initCanvas } from './canvasManager.js';
import { initToolManager } from './toolManager.js';
import { initUIController } from './uiController.js';
import { initLayersManager } from './layersManager.js';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize the canvas
  initCanvas('editor-canvas');
  
  // 2. Initialize the layers manager
  initLayersManager();
  
  // 3. Initialize the UI controller (sets up DOM event listeners, etc.)
  initUIController();
  
  // 4. Initialize tool manager (connect it to canvas + layers)
  initToolManager();
});
