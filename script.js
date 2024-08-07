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
        img.onload = function() {
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