const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const lineWidthPicker = document.getElementById('lineWidth');
const clearButton = document.getElementById('clearCanvas');

let isDrawing = false;

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

function draw(e) {
    if (!isDrawing) return;
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = lineWidthPicker.value;
    ctx.lineCap = 'round';
    ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
clearButton.addEventListener('click', clearCanvas);

const eraserButton = document.getElementById('eraserTool');
let isErasing = false;

function toggleEraser() {
    isErasing = !isErasing;
    eraserButton.classList.toggle('active');
}

function draw(e) {
    if (!isDrawing) return;
    if (isErasing) {
        ctx.strokeStyle = '#ffffff';
    } else {
        ctx.strokeStyle = colorPicker.value;
    }
    ctx.lineWidth = lineWidthPicker.value;
    ctx.lineCap = 'round';
    ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
}

eraserButton.addEventListener('click', toggleEraser);

const undoButton = document.getElementById('undoButton');
let drawingHistory = [];
let currentStep = -1;

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

undoButton.addEventListener('click', undo);

const brushShapeSelect = document.getElementById('brushShape');

function draw(e) {
    if (!isDrawing) return;
    const x = e.clientX - canvas.offsetLeft;
    const y = e.clientY - canvas.offsetTop;

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
        default:
            ctx.beginPath();
            ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
    }
}

const fillButton = document.getElementById('fillTool');
let isFilling = false;

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

canvas.addEventListener('click', (e) => {
    if (isFilling) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const fillColor = hexToRgb(colorPicker.value);
        floodFill(Math.floor(x), Math.floor(y), fillColor);
        saveDrawingState();
    }
});

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
}

fillButton.addEventListener('click', toggleFill);