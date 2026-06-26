const imageInput = document.getElementById("imageInput");

const rowsSlider = document.getElementById("rows");
const colsSlider = document.getElementById("cols");

const rowsValue = document.getElementById("rowsValue");
const colsValue = document.getElementById("colsValue");
const cropSlider = document.getElementById("cropPercent");
const cropValue = document.getElementById("cropValue");

const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");

const results = document.getElementById("results");
const saveBtn = document.getElementById("saveBtn");

let currentImage = null;

let generatedTiles = [];

rowsSlider.addEventListener("input", () => {
    rowsValue.textContent = rowsSlider.value;
    drawPreview();
    if (results.innerHTML !== "") {
        splitImage();
    }
});

colsSlider.addEventListener("input", () => {
    colsValue.textContent = colsSlider.value;
    drawPreview();
    if (results.innerHTML !== "") {
        splitImage();
    }
});

cropSlider.addEventListener("input", () => {
    cropValue.textContent = cropSlider.value;
    if (results.innerHTML !== "") {
        splitImage();
    }
});

imageInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (!file) return;

    const img = new Image();

    img.onload = () => {

        currentImage = img;

        canvas.width = img.width;
        canvas.height = img.height;

        drawPreview();
    };

    img.src = URL.createObjectURL(file);
});

function drawPreview(){

    if(!currentImage) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.drawImage(
        currentImage,
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawGrid();
}

function drawGrid(){

    const rows = parseInt(rowsSlider.value);
    const cols = parseInt(colsSlider.value);

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    for(let i = 1; i < cols; i++){

        const x = i * cellWidth;

        ctx.beginPath();
        ctx.moveTo(x,0);
        ctx.lineTo(x,canvas.height);
        ctx.stroke();
    }

    for(let i = 1; i < rows; i++){

        const y = i * cellHeight;

        ctx.beginPath();
        ctx.moveTo(0,y);
        ctx.lineTo(canvas.width,y);
        ctx.stroke();
    }
}

const splitBtn = document.getElementById("splitBtn");

splitBtn.addEventListener("click", splitImage);

function splitImage(){

    if(!currentImage) return;
    
    const rows = parseInt(rowsSlider.value);
    const cols = parseInt(colsSlider.value);
    
    results.style.gridTemplateColumns =
    `repeat(${cols}, minmax(0, 1fr))`;
    
    console.log(cols);
    console.log(results.style.gridTemplateColumns);
    
    results.innerHTML = "";

    const tileWidth = currentImage.width / cols;
    const tileHeight = currentImage.height / rows;

    const cropPercentVal = parseFloat(cropSlider.value) / 100;
    const cropX = tileWidth * cropPercentVal;
    const cropY = tileHeight * cropPercentVal;

    let tileNumber = 1;

    for(let row=0; row<rows; row++){

        for(let col=0; col<cols; col++){

            const tileCanvas =
                document.createElement("canvas");

            const sx = col * tileWidth + cropX;
            const sy = row * tileHeight + cropY;
            const sWidth = tileWidth - (cropX * 2);
            const sHeight = tileHeight - (cropY * 2);

            tileCanvas.width = sWidth;
            tileCanvas.height = sHeight;

            const tileCtx =
                tileCanvas.getContext("2d");

            tileCtx.drawImage(
                currentImage,

                sx,
                sy,

                sWidth,
                sHeight,

                0,
                0,

                sWidth,
                sHeight
            );

            const img =
                document.createElement("img");

            img.src = tileCanvas.toDataURL();

            img.className = "tile-preview";

            img.title =
                `Tile ${tileNumber}`;

            results.appendChild(img);

            tileNumber++;
        }
    }
}

async function saveTiles(){
    if(!currentImage) return;
    const rows = parseInt(rowsSlider.value);
    const cols = parseInt(colsSlider.value);
    const tileWidth = currentImage.width / cols;
    const tileHeight = currentImage.height / rows;
    const cropPercentVal = parseFloat(cropSlider.value) / 100;
    const cropX = tileWidth * cropPercentVal;
    const cropY = tileHeight * cropPercentVal;
    
    generatedTiles = [];
    const tilePromises = [];
    let tileNumber = 1;
    for(let row=0; row<rows; row++){
        for(let col=0; col<cols; col++){
            const tileCanvas = document.createElement("canvas");
            const sx = col * tileWidth + cropX;
            const sy = row * tileHeight + cropY;
            const sWidth = tileWidth - (cropX * 2);
            const sHeight = tileHeight - (cropY * 2);

            tileCanvas.width = sWidth;
            tileCanvas.height = sHeight;
            const tileCtx = tileCanvas.getContext("2d");
            tileCtx.drawImage(currentImage,
                sx,
                sy,
                sWidth,
                sHeight,
                0,0,
                sWidth,
                sHeight);
            const promise = new Promise((resolve) => {
                tileCanvas.toBlob((blob) => {
                    generatedTiles.push({name: `tile-${tileNumber}.png`, blob});
                    tileNumber++;
                    resolve();
                }, "image/png");
            });
            tilePromises.push(promise);
        }
    }
    await Promise.all(tilePromises);
}

saveBtn.addEventListener("click", async () => {
    await saveTiles();
    if(generatedTiles.length === 0) return;
    const zip = new JSZip();
    generatedTiles.forEach(t => zip.file(t.name, t.blob));
    zip.generateAsync({type:"blob"}).then(content => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = "tiles.zip";
        a.click();
    });
});
