const brushPresets = document.getElementById('brushPresets');
const createCustomBrushBtn = document.getElementById('createCustomBrush');
const customBrushModal = document.getElementById('customBrushModal');
const customBrushCanvas = document.getElementById('customBrushCanvas');
const saveCustomBrushBtn = document.getElementById('saveCustomBrush');
const cancelCustomBrushBtn = document.getElementById('cancelCustomBrush');
let customBrushCtx = customBrushCanvas.getContext('2d');
let customBrushPattern = null;

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const lineWidthPicker = document.getElementById('lineWidth');
const clearButton = document.getElementById('clearCanvas');
const eraserButton = document.getElementById('eraserTool');
const undoButton = document.getElementById('undoButton');
const brushShapeSelect = document.getElementById('brushShape');
const fillButton = document.getElementById('fillTool');
const textButton = document.getElementById('textTool');
const textInput = document.getElementById('textInput');
const fontSelect = document.getElementById('fontSelect');
const imageUpload = document.getElementById('imageUpload');
const resizeCanvasBtn = document.getElementById('resizeCanvasBtn');
const resizeModal = document.getElementById('resizeModal');
const applyResizeBtn = document.getElementById('applyResizeBtn');
const cancelResizeBtn = document.getElementById('cancelResizeBtn');
const canvasWidthInput = document.getElementById('canvasWidth');
const canvasHeightInput = document.getElementById('canvasHeight');
const gradientTool = document.getElementById('gradientTool');
const gradientType = document.getElementById('gradientType');
const gradientColor1 = document.getElementById('gradientColor1');
const gradientColor2 = document.getElementById('gradientColor2');
const layersList = document.getElementById('layersList');
const addLayerBtn = document.getElementById('addLayerBtn');
const layerOpacity = document.getElementById('layerOpacity');
const blendMode = document.getElementById('blendMode');

let isDrawing = false;
let isErasing = false;
let isFilling = false;
let isTextMode = false;
let isGradientMode = false;
let gradientStartPoint = null;
let drawingHistory = [];
let currentStep = -1;
let layers = [];
let activeLayer = null;

function startDrawing(e) {
    isDrawing = true;
    draw(e);
    saveDrawingState();
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        ctx.beginPath();
        saveDrawingState();
    }
}

function draw(e) {
    if (!isDrawing) return;
    if (isGradientMode) {
        createGradient(e);
        return;
    }

    const x = e.clientX - canvas.offsetLeft;
    const y = e.clientY - canvas.offsetTop;

    ctx.globalAlpha = layerOpacity.value;
    ctx.globalCompositeOperation = blendMode.value;
    ctx.strokeStyle = isErasing ? '#ffffff' : colorPicker.value;
    ctx.lineWidth = lineWidthPicker.value;

    switch (brushShapeSelect.value) {
        case 'square':
            ctx.fillRect(x - ctx.lineWidth / 2, y - ctx.lineWidth / 2, ctx.lineWidth, ctx.lineWidth);
            break;
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(x, y - ctx.lineWidth / 2);
            ctx.lineTo(x - ctx.lineWidth / 2, y + ctx.lineWidth / 2);
            ctx.lineTo(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2);
            ctx.closePath();
            ctx.fill();
            break;
        case 'custom':
            if (customBrushPattern) {
                ctx.fillStyle = customBrushPattern;
                ctx.fillRect(x - ctx.lineWidth / 2, y - ctx.lineWidth / 2, ctx.lineWidth, ctx.lineWidth);
            }
            break;
        default:
            ctx.beginPath();
            ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function toggleEraser() {
    isErasing = !isErasing;
    eraserButton.classList.toggle('active');
}

function saveDrawingState() {
    currentStep++;
    if (currentStep < drawingHistory.length) {
        drawingHistory.length = currentStep;
    }
    drawingHistory.push(canvas.toDataURL());
}

function undo() {
    if (currentStep > 0) {
        currentStep--;
        const img = new Image();
        img.src = drawingHistory[currentStep];
        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        }
    }
}

function toggleFill() {
    isFilling = !isFilling;
    fillButton.classList.toggle('active');
}

function floodFill(x, y, fillColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const targetColor = getPixelColor(imageData, x, y);
    const stack = [[x, y]];

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
        if (colorMatch(getPixelColor(imageData, x, y), targetColor)) {
            setPixelColor(imageData, x, y, fillColor);
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function getPixelColor(imageData, x, y) {
    const index = (y * imageData.width + x) * 4;
    return [
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
        imageData.data[index + 3]
    ];
}

function setPixelColor(imageData, x, y, color) {
    const index = (y * imageData.width + x) * 4;
    imageData.data[index] = color[0];
    imageData.data[index + 1] = color[1];
    imageData.data[index + 2] = color[2];
    imageData.data[index + 3] = color[3];
}

function colorMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function toggleTextMode() {
    isTextMode = !isTextMode;
    textButton.classList.toggle('active');
}

function addText(e) {
    if (!isTextMode) return;

    const x = e.clientX - canvas.offsetLeft;
    const y = e.clientY - canvas.offsetTop;
    const text = textInput.value;

    ctx.font = `20px ${fontSelect.value}`;
    ctx.fillStyle = colorPicker.value;
    ctx.fillText(text, x, y);
    saveDrawingState();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            saveDrawingState();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
}

function toggleResizeModal() {
    resizeModal.style.display = resizeModal.style.display === 'block' ? 'none' : 'block';
}

function applyCanvasResize() {
    const newWidth = parseInt(canvasWidthInput.value);
    const newHeight = parseInt(canvasHeightInput.value);

    if (newWidth && newHeight) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.putImageData(imageData, 0, 0);
        saveDrawingState();
        toggleResizeModal();
    }
}

function createGradient(e) {
    const x = e.clientX - canvas.offsetLeft;
    const y = e.clientY - canvas.offsetTop;

    if (!gradientStartPoint) {
        gradientStartPoint = { x, y };
        return;
    }

    const gradientEndPoint = { x, y };
    const grd = gradientType.value === 'linear' ?
        ctx.createLinearGradient(gradientStartPoint.x, gradientStartPoint.y, gradientEndPoint.x, gradientEndPoint.y) :
        ctx.createRadialGradient(gradientStartPoint.x, gradientStartPoint.y, 5, gradientEndPoint.x, gradientEndPoint.y, Math.max(canvas.width, canvas.height));

    grd.addColorStop(0, gradientColor1.value);
    grd.addColorStop(1, gradientColor2.value);

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    gradientStartPoint = null;
    isGradientMode = false;
    gradientTool.classList.remove('active');
    saveDrawingState();
}

function toggleGradientMode() {
    isGradientMode = !isGradientMode;
    gradientTool.classList.toggle('active');
    gradientStartPoint = null;
}

function addLayer() {
    const newLayer = document.createElement('li');
    newLayer.textContent = `Layer ${layers.length + 1}`;
    newLayer.dataset.index = layers.length;
    newLayer.addEventListener('click', () => setActiveLayer(newLayer));
    layersList.appendChild(newLayer);
    layers.push(newLayer);
    setActiveLayer(newLayer);
}

function setActiveLayer(layer) {
    layers.forEach(l => l.classList.remove('active'));
    layer.classList.add('active');
    activeLayer = layer.dataset.index;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(layers[activeLayer].canvas, 0, 0);
    saveDrawingState();
}

function openCustomBrushModal() {
    customBrushModal.style.display = 'block';
    customBrushCtx.clearRect(0, 0, customBrushCanvas.width, customBrushCanvas.height);
}

function closeCustomBrushModal() {
    customBrushModal.style.display = 'none';
}

function saveCustomBrush() {
    customBrushPattern = ctx.createPattern(customBrushCanvas, 'repeat');
    brushPresets.value = 'custom';
    closeCustomBrushModal();
}

createCustomBrushBtn.addEventListener('click', openCustomBrushModal);
saveCustomBrushBtn.addEventListener('click', saveCustomBrush);
cancelCustomBrushBtn.addEventListener('click', closeCustomBrushModal);

customBrushCanvas.addEventListener('mousedown', startDrawing);
customBrushCanvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        const rect = customBrushCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        customBrushCtx.fillStyle = colorPicker.value;
        customBrushCtx.beginPath();
        customBrushCtx.arc(x, y, 2, 0, Math.PI * 2);
        customBrushCtx.fill();
    }
});
customBrushCanvas.addEventListener('mouseup', stopDrawing);
customBrushCanvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);
clearButton.addEventListener('click', clearCanvas);
eraserButton.addEventListener('click', toggleEraser);
undoButton.addEventListener('click', undo);
fillButton.addEventListener('click', toggleFill);
textButton.addEventListener('click', toggleTextMode);
canvas.addEventListener('click', addText);
imageUpload.addEventListener('change', handleImageUpload);
resizeCanvasBtn.addEventListener('click', toggleResizeModal);
applyResizeBtn.addEventListener('click', applyCanvasResize);
cancelResizeBtn.addEventListener('click', toggleResizeModal);
gradientTool.addEventListener('click', toggleGradientMode);
addLayerBtn.addEventListener('click', addLayer);
layerOpacity.addEventListener('input', updateLayerOpacity);
blendMode.addEventListener('change', updateBlendMode);

addLayer();
