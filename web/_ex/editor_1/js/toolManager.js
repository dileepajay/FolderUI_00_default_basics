window.ToolManager = {
  activeTool: "hand",

  initToolManager() {
    console.log("ToolManager initialized. Default tool =", this.activeTool);
  },

  setActiveTool(toolName) {
    this.activeTool = toolName;
    console.log("Active tool is now", toolName);
    UIController.updateToolkitUI(toolName);

    // (Optional) If you only want to allow drag/resize in certain tool states,
    // you'd do a check in CanvasManager: e.g. "if ToolManager.activeTool === 'select' then handle drag/resize"
  },
};
