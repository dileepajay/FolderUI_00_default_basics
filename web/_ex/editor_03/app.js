import PhotoEditor from "./canvas.js";

document.addEventListener("DOMContentLoaded", () => {
    const editor = new PhotoEditor();
    editor.init(
        document.getElementById("editor-container"),
        800,
        600,
        myImages,
        handleEditedImage
    );
});