
plugin_script = {
    process_data: null,
    currentIndex: 0,
    files: [],
    container: null,
    isFullscreen: false,
    scale: 1,
    dragStart: { x: 0, y: 0 },
    translate: { x: 0, y: 0 },
    isDragging: false,

    init(process_data) {
        this.process_data = process_data;
        console.log(this.process_data);

        process_data.parameters.forEach(para => {
            para.file.forEach(file => {
                this.files.push({
                    path: file.path + '/' + file.name,
                    name: file.name,
                    type: file.name.split('.').pop().toLowerCase()
                });
            });
        });

        console.log(this.files);
        console.log(this.files.length);

        this.container = this.getParentElement();

        if (process_data.name === 'open') {
            if (!this.container || this.files.length === 0) {
                console.error("Error: No valid container or files found.");
                return;
            }

            this.renderFileViewer();
            this.setupKeyboardNavigation();
        } else if (process_data.name === 'delete') {
            this.handleDeletePlugin();
        }
    },

    getParentElement() {
        console.log(`FINDING:view_${this.process_data.key_id}`);
        return document.getElementById(`view_${this.process_data.key_id}`);
    },

    renderFileViewer() {
        const pluginKey = this.process_data.key_id;
        const viewer = document.createElement("div");
        viewer.classList.add(`${pluginKey}_viewer`, "File_open_viewer");

        this.displayFile(viewer);

        const prevBtn = document.createElement("button");
        prevBtn.classList.add(`${pluginKey}_prev_btn`, "File_open_prev_btn");
        prevBtn.innerHTML = "&#10094;";
        prevBtn.onclick = () => this.showPreviousFile(viewer);

        const nextBtn = document.createElement("button");
        nextBtn.classList.add(`${pluginKey}_next_btn`, "File_open_next_btn");
        nextBtn.innerHTML = "&#10095;";
        nextBtn.onclick = () => this.showNextFile(viewer);

        viewer.appendChild(prevBtn);
        viewer.appendChild(nextBtn);
        this.container.appendChild(viewer);
    },

    displayFile(viewer) {
        // Remove previous file content but keep navigation buttons
        const fileContent = viewer.querySelector(".file-content");
        if (fileContent) viewer.removeChild(fileContent);

        const file = this.files[this.currentIndex];
        const fileType = file.type;
        const filePath = `workspace/${file.path}`.replaceAll('//', '/');
        console.log(filePath);
        const contentContainer = document.createElement("div");
        contentContainer.classList.add("file-content"); // Container for file content

        if (fileType === "glb" || fileType === "gltf") {
            const iframe = document.createElement('iframe');
            iframe.src = `plugins/_default_basic/open/glbview.html?action=webview&file=${encodeURIComponent(filePath)}`;
            iframe.style.width = '720px';
            iframe.style.height = '500px';
            iframe.style.border = 'none';
            contentContainer.appendChild(iframe);
            /*
                            import('three').then(THREE => {
                                import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
                                    const loader = new GLTFLoader(); // No need to pass THREE manually here.
                                    this.loadGLBFile(contentContainer, '/workspace/white_mesh.glb', loader);
                                }).catch(error => console.error('Failed to load GLTFLoader:', error));
                            }).catch(error => console.error('Failed to load three.js:', error));
                     */

        } else if (["png", "jpg", "jpeg", "gif", "bmp", "webp"].includes(fileType)) {
            const img = document.createElement("img");
            img.classList.add("File_open_image");
            img.src = filePath;
            img.alt = "Image Viewer";
            img.style.transformOrigin = "center center";

            img.addEventListener("wheel", (event) => this.zoomImage(event, img, viewer));
            img.addEventListener("mousedown", (event) => this.startDragging(event, img, viewer));
            img.addEventListener("mousemove", (event) => this.dragImage(event, img, viewer));
            img.addEventListener("mouseup", () => this.stopDragging());
            img.addEventListener("mouseleave", () => this.stopDragging());

            contentContainer.appendChild(img);
        }
        else if (["txt", "json", "csv"].includes(fileType)) {
            const textArea = document.createElement("textarea");
            textArea.classList.add("File_open_text");
            textArea.readOnly = true;


            fetch(filePath)
                .then(response => {
                    if (!response.ok) throw new Error("Network response was not ok");
                    return response.text();
                })
                .then(text => {
                    textArea.value = text;
                })
                .catch(err => {
                    console.error("Error loading file:", err);
                    textArea.value = "Error loading file content.";
                });

            contentContainer.appendChild(textArea);
        }
        else {
            const message = document.createElement("p");
            message.innerText = "Unsupported file type.";
            contentContainer.appendChild(message);
        }

        viewer.appendChild(contentContainer);
    }
    , loadGLBFile(container, path) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const light = new THREE.AmbientLight(0xffffff, 1);
        scene.add(light);

        const loader = new GLTFLoader();
        loader.load(
            path,
            (gltf) => {
                scene.add(gltf.scene);
                camera.position.z = 2;
                const animate = () => {
                    requestAnimationFrame(animate);
                    gltf.scene.rotation.y += 0.01;
                    renderer.render(scene, camera);
                };
                animate();
            },
            undefined,
            (error) => console.error("Error loading GLB file:", error)
        );
    },

    showNextFile(viewer) {
        this.currentIndex = (this.currentIndex + 1) % this.files.length;
        this.displayFile(viewer);
    },

    showPreviousFile(viewer) {
        this.currentIndex = (this.currentIndex - 1 + this.files.length) % this.files.length;
        this.displayFile(viewer);
    },

    setupKeyboardNavigation() {
        document.addEventListener("keydown", (event) => {
            if (event.key === "ArrowRight") {
                this.showNextFile(this.container);
            } else if (event.key === "ArrowLeft") {
                this.showPreviousFile(this.container);
            } else if (event.key === "Escape" && this.isFullscreen) {
                this.exitFullscreen();
            }
        });
    },

    zoomImage(event, img, viewer) {
        event.preventDefault();
        const zoomFactor = 0.1;
        this.scale += event.deltaY < 0 ? zoomFactor : -zoomFactor;
        this.scale = Math.max(0.5, Math.min(this.scale, 3));

        img.style.transform = `scale(${this.scale}) translate(${this.translate.x}px, ${this.translate.y}px)`;
        this.constrainImageToViewer(img, viewer);
    },

    startDragging(event, img, viewer) {
        event.preventDefault();
        this.isDragging = true;
        this.dragStart = { x: event.clientX - this.translate.x, y: event.clientY - this.translate.y };
        img.style.cursor = "grabbing";
    },

    dragImage(event, img, viewer) {
        if (!this.isDragging) return;

        this.translate.x = event.clientX - this.dragStart.x;
        this.translate.y = event.clientY - this.dragStart.y;

        img.style.transform = `scale(${this.scale}) translate(${this.translate.x}px, ${this.translate.y}px)`;
        this.constrainImageToViewer(img, viewer);
    },

    stopDragging() {
        this.isDragging = false;
    },

    constrainImageToViewer(img, viewer) {
        const imgRect = img.getBoundingClientRect();
        const viewerRect = viewer.getBoundingClientRect();

        const maxX = (imgRect.width * this.scale - viewerRect.width) / 2;
        const maxY = (imgRect.height * this.scale - viewerRect.height) / 2;

        this.translate.x = Math.max(-maxX, Math.min(maxX, this.translate.x));
        this.translate.y = Math.max(-maxY, Math.min(maxY, this.translate.y));

        img.style.transform = `scale(${this.scale}) translate(${this.translate.x}px, ${this.translate.y}px)`;
    }
};
