/*==========================================================
    PRO IMAGE COMPRESSOR
    app.js
    PART 1
==========================================================*/

/* ================================
   DOM ELEMENTS
================================ */

const dropZone = document.getElementById("drop");
const fileInput = document.getElementById("file");
const selectBtn = document.getElementById("selectBtn");

const fileList = document.getElementById("fileList");
const fileCount = document.getElementById("fileCount");

const resultList = document.getElementById("list");
const resultCount = document.getElementById("resultCount");

const startBtn = document.getElementById("startBtn");
const zipBtn = document.getElementById("zipBtn");
const clearBtn = document.getElementById("clearAll");

const progressBar = document.getElementById("bar");
const progressText = document.getElementById("progressText");

const themeBtn = document.getElementById("themeBtn");

/* ================================
   GLOBAL VARIABLES
================================ */

let files = [];

let results = [];

let compressing = false;

let cancelled = false;

/* ================================
   INIT
================================ */

document.addEventListener("DOMContentLoaded", init);

function init(){

    loadTheme();

    bindEvents();

    updateCounters();

}

/* ================================
   EVENT LISTENERS
================================ */

function bindEvents(){

    /* Select Button */

    selectBtn.addEventListener("click",()=>{

        fileInput.click();

    });

    /* File Input */

    fileInput.addEventListener("change",(e)=>{

        addFiles(e.target.files);

        fileInput.value="";

    });

    /* Drag Over */

    dropZone.addEventListener("dragover",(e)=>{

        e.preventDefault();

        dropZone.classList.add("drag");

    });

    /* Drag Leave */

    dropZone.addEventListener("dragleave",()=>{

        dropZone.classList.remove("drag");

    });

    /* Drop */

    dropZone.addEventListener("drop",(e)=>{

        e.preventDefault();

        dropZone.classList.remove("drag");

        addFiles(e.dataTransfer.files);

    });

    /* Theme */

    themeBtn.addEventListener("click",toggleTheme);

}

/* ================================
   THEME
================================ */

function toggleTheme(){

    document.body.classList.toggle("dark");

    const dark=document.body.classList.contains("dark");

    localStorage.setItem("theme",dark?"dark":"light");

    updateThemeIcon();

}

function loadTheme(){

    const saved=localStorage.getItem("theme");

    if(saved==="dark"){

        document.body.classList.add("dark");

    }

    updateThemeIcon();

}

function updateThemeIcon(){

    if(document.body.classList.contains("dark")){

        themeBtn.innerHTML=`
        <i class="fa-solid fa-sun"></i>
        Light`;

    }else{

        themeBtn.innerHTML=`
        <i class="fa-regular fa-moon"></i>
        Dark`;

    }

}

/* ================================
   ADD FILES
================================ */

function addFiles(fileListObject){

    const list=[...fileListObject];

    const valid=list.filter(file=>{

        return file.type.startsWith("image/");

    });

    if(valid.length===0){

        toast("No valid image selected.","error");

        return;

    }

    valid.forEach(file=>{

        files.push({

            id:crypto.randomUUID(),

            file:file,

            target:Number(
                document.getElementById("globalTarget").value
            ),

            status:"Waiting",

            preview:null

        });

    });

    renderFiles();

}

/* ================================
   COUNTERS
================================ */

function updateCounters(){

    fileCount.textContent=`(${files.length})`;

    resultCount.textContent=`(${results.length})`;

}

/* ================================
   PROGRESS
================================ */

function setProgress(percent,text=""){

    progressBar.style.width=percent+"%";

    progressText.textContent=text || percent+"%";

}

/* ================================
   RESET
================================ */

function resetProgress(){

    setProgress(0,"Ready");

}

/* ================================
   PLACEHOLDERS
================================ */

/* These functions will be completed
   in Part 2 */

function renderFiles(){}

function toast(message,type="success"){

    console.log(type.toUpperCase(),message);

}
/*==========================================================
    PART 2
    FILE MANAGEMENT
==========================================================*/

/* ================================
   RENDER FILES
================================ */

function renderFiles(){

    fileList.innerHTML="";

    updateCounters();

    if(files.length===0){

        fileList.innerHTML=`
        <div class="empty">
            <i class="fa-regular fa-images"></i>
            <h3>No Images Added</h3>
            <p>Drag & Drop or Click Select Images</p>
        </div>`;

        return;

    }

    files.forEach(item=>{

        const card=createFileCard(item);

        fileList.appendChild(card);

    });

}

/* ================================
   CREATE FILE CARD
================================ */

function createFileCard(item){

    const div=document.createElement("div");

    div.className="fileItem fadeIn";

    const url=URL.createObjectURL(item.file);

    item.preview=url;

    div.innerHTML=`

    <div class="fileThumb">
        <img src="${url}">
    </div>

    <div class="fileInfo">

        <div class="fileName">
            ${item.file.name}
        </div>

        <div class="fileSize">
            ${formatSize(item.file.size)}
        </div>

        <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">

            <input
                type="number"
                class="targetInput"
                value="${item.target}"
                min="1"
                style="
                    width:80px;
                    height:36px;
                    text-align:center;
                ">

            <select
                class="targetUnit"
                style="height:36px;">

                <option>KB</option>
                <option>MB</option>

            </select>

        </div>

    </div>

    <div class="deleteBtn">
        <i class="fa-solid fa-trash"></i>
    </div>

    `;

    /* Delete */

    div.querySelector(".deleteBtn")
        .addEventListener("click",()=>{

            removeFile(item.id);

        });

    /* Target */

    div.querySelector(".targetInput")
        .addEventListener("input",(e)=>{

            item.target=
                Number(e.target.value)||1;

        });

    return div;

}

/* ================================
   REMOVE FILE
================================ */

function removeFile(id){

    const index=files.findIndex(f=>f.id===id);

    if(index<0) return;

    if(files[index].preview){

        URL.revokeObjectURL(files[index].preview);

    }

    files.splice(index,1);

    renderFiles();

}

/* ================================
   CLEAR ALL
================================ */

clearBtn.addEventListener("click",()=>{

    if(files.length===0) return;

    if(!confirm("Remove all images?"))
        return;

    files.forEach(f=>{

        if(f.preview){

            URL.revokeObjectURL(f.preview);

        }

    });

    files=[];

    results=[];

    resultList.innerHTML="";

    renderFiles();

    resetProgress();

    toast("All images removed.","success");

});

/* ================================
   APPLY GLOBAL TARGET
================================ */

const globalTarget=
document.getElementById("globalTarget");

globalTarget.addEventListener("input",()=>{

    const value=
    Number(globalTarget.value)||1;

    files.forEach(f=>{

        f.target=value;

    });

    renderFiles();

});

/* ================================
   FILE SIZE FORMAT
================================ */

function formatSize(bytes){

    if(bytes<1024){

        return bytes+" Bytes";

    }

    if(bytes<1024*1024){

        return (bytes/1024).toFixed(1)+" KB";

    }

    return (bytes/1024/1024).toFixed(2)+" MB";

}

/* ================================
   TOTAL ORIGINAL SIZE
================================ */

function getTotalOriginalSize(){

    let total=0;

    files.forEach(f=>{

        total+=f.file.size;

    });

    return total;

}

/* ================================
   TOTAL COMPRESSED SIZE
================================ */

function getTotalCompressedSize(){

    let total=0;

    results.forEach(r=>{

        total+=r.blob.size;

    });

    return total;

}

/* ================================
   SAVINGS
================================ */

function getSavingPercent(){

    const original=getTotalOriginalSize();

    const compressed=getTotalCompressedSize();

    if(original===0) return 0;

    return (

        (original-compressed)

        /

        original

        *

        100

    ).toFixed(1);

}
/*==========================================================
    PART 3
    COMPRESSION ENGINE
==========================================================*/

/* ================================
   START BUTTON
================================ */

startBtn.addEventListener("click", startCompression);



/*==========================================================
    START COMPRESSION
==========================================================*/

async function startCompression() {

    if (compressing) return;

    if (files.length === 0) {
        toast("Please add images first.", "error");
        return;
    }

    compressing = true;
    cancelled = false;

    startBtn.disabled = true;
    zipBtn.disabled = true;

    results = [];
    resultList.innerHTML = "";

    updateCounters();
    updateStatistics();

    setProgress(0, "Preparing...");

    const startTime = performance.now();

    try {

        const compressedResults = await compressBatch(

            files,

            (done, total) => {

                const percent = Math.round((done / total) * 100);

                setProgress(
                    percent,
                    `Compressing ${done} of ${total}`
                );

            }

        );

        if (cancelled) {

            toast("Compression cancelled.", "error");
            return;

        }

        results = compressedResults;

        resultList.innerHTML = "";

        results.forEach((result) => {

            const original = files.find(f => f.id === result.id);

            if (original) {

                showResult(result, original.file);

            }

        });

        updateCounters();
        updateStatistics();

        setProgress(100, "Completed");

        const seconds = (
            (performance.now() - startTime) / 1000
        ).toFixed(2);

        toast(
            `Successfully compressed ${results.length} image(s) in ${seconds} sec`,
            "success"
        );

    }
    catch (err) {

        console.error(err);

        toast(
            "Compression failed.",
            "error"
        );

    }
    finally {

        compressing = false;

        startBtn.disabled = false;

        zipBtn.disabled = results.length === 0;

    }

}

/* ================================
   CANCEL
================================ */

function cancelCompression(){

    cancelled=true;

}

/* ================================
   RESULT CARD
================================ */

function showResult(result,file){

    const url=URL.createObjectURL(result.blob);

    const saved=(
        (1-result.blob.size/file.size)
        *100
    ).toFixed(1);

    const div=document.createElement("div");

    div.className="resultCard fadeIn";

    div.innerHTML=`

    <div class="resultImage">

        <img src="${url}">

    </div>

    <div class="resultBody">

        <div class="resultTitle">

            ${result.name}

        </div>

        <div class="resultInfo">

            <span>Original</span>

            <span>

                ${formatSize(file.size)}

            </span>

        </div>

        <div class="resultInfo">

            <span>Compressed</span>

            <span>

                ${formatSize(result.blob.size)}

            </span>

        </div>

        <div class="resultInfo">

            <span>Saved</span>

            <span class="saved">

                ${saved}%

            </span>

        </div>

        <div class="resultButtons">

            <button class="primary downloadBtn">

                <i class="fa-solid fa-download"></i>

                Download

            </button>

            <button class="danger deleteResult">

                <i class="fa-solid fa-trash"></i>

            </button>

        </div>

    </div>

    `;

    /* Download */

    div.querySelector(".downloadBtn")
    .addEventListener("click",()=>{

        downloadBlob(
            result.blob,
            result.name
        );

    });

    /* Delete */

    div.querySelector(".deleteResult")
    .addEventListener("click",()=>{

        URL.revokeObjectURL(url);

        div.remove();

        results=results.filter(r=>r.id!==result.id);

        updateCounters();

        updateStatistics();

    });

    resultList.appendChild(div);

    updateCounters();

}

/* ================================
   DOWNLOAD
================================ */

function downloadBlob(blob,name){

    const a=document.createElement("a");

    a.href=URL.createObjectURL(blob);

    a.download=name;

    a.click();

    setTimeout(()=>{

        URL.revokeObjectURL(a.href);

    },500);

}

/* ================================
   ZIP DOWNLOAD
================================ */

zipBtn.addEventListener("click",downloadZIP);

async function downloadZIP(){

    if(results.length===0){

        toast("Nothing to download.","error");

        return;

    }

    const zip=new JSZip();

    results.forEach(r=>{

        zip.file(
            r.name,
            r.blob
        );

    });

    toast("Creating ZIP...");

    const blob=await zip.generateAsync({

        type:"blob",

        compression:"DEFLATE",

        compressionOptions:{
            level:6
        }

    });

    downloadBlob(
        blob,
        "Compressed Images.zip"
    );

}

/* ================================
   STATISTICS
================================ */

function updateStatistics(){

    const original=getTotalOriginalSize();

    const compressed=getTotalCompressedSize();

    console.log({

        original:formatSize(original),

        compressed:formatSize(compressed),

        saving:getSavingPercent()+"%"

    });

}
/*==========================================================
    PART 4
    UI UTILITIES
==========================================================*/

/* ================================
   TOAST NOTIFICATION
================================ */

let toastTimer = null;

function toast(message, type = "success") {

    let box = document.getElementById("toast");

    if (!box) {

        box = document.createElement("div");
        box.id = "toast";
        document.body.appendChild(box);

    }

    clearTimeout(toastTimer);

    box.className = "toast " + type;

    box.innerHTML = `
        <i class="fa-solid ${
            type === "success"
                ? "fa-circle-check"
                : type === "error"
                ? "fa-circle-xmark"
                : "fa-circle-info"
        }"></i>

        <span>${message}</span>
    `;

    box.classList.add("show");

    toastTimer = setTimeout(() => {

        box.classList.remove("show");

    }, 3000);

}

/* ================================
   IMAGE PREVIEW
================================ */

function previewImage(src, title = "") {

    let modal = document.getElementById("previewModal");

    if (!modal) {

        modal = document.createElement("div");

        modal.id = "previewModal";

        modal.innerHTML = `

        <div class="previewContent">

            <button id="closePreview">

                <i class="fa-solid fa-xmark"></i>

            </button>

            <img id="previewImg">

            <h3 id="previewTitle"></h3>

        </div>

        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", e => {

            if (e.target === modal)
                closePreview();

        });

        document
        .getElementById("closePreview")
        .onclick = closePreview;

    }

    document.getElementById("previewImg").src = src;

    document.getElementById("previewTitle").textContent = title;

    modal.classList.add("open");

}

function closePreview() {

    const modal = document.getElementById("previewModal");

    if (modal)
        modal.classList.remove("open");

}

/* ================================
   KEYBOARD SHORTCUTS
================================ */

document.addEventListener("keydown", e => {

    if (e.key === "Escape")
        closePreview();

    if (e.ctrlKey && e.key.toLowerCase() === "o") {

        e.preventDefault();

        fileInput.click();

    }

    if (e.ctrlKey && e.key.toLowerCase() === "d") {

        e.preventDefault();

        downloadZIP();

    }

});

/* ================================
   RESULT PREVIEW
================================ */

document.addEventListener("click", e => {

    const img = e.target.closest(".resultImage img");

    if (!img) return;

    previewImage(
        img.src,
        img.closest(".resultCard")
            .querySelector(".resultTitle")
            .textContent
    );

});

/* ================================
   MEMORY CLEANUP
================================ */

window.addEventListener("beforeunload", () => {

    files.forEach(f => {

        if (f.preview)
            URL.revokeObjectURL(f.preview);

    });

});

/* ================================
   LIVE STATS
================================ */

setInterval(() => {

    if (compressing)
        return;

    updateCounters();

}, 1000);

/* ================================
   DRAG HIGHLIGHT
================================ */

["dragenter","dragover"].forEach(evt => {

    document.addEventListener(evt, e => {

        e.preventDefault();

        dropZone.classList.add("drag");

    });

});

["dragleave","drop"].forEach(evt => {

    document.addEventListener(evt, e => {

        e.preventDefault();

        dropZone.classList.remove("drag");

    });

});

/* ================================
   READY
================================ */

console.log(
"%cPro Image Compressor Ready",
"color:#2563eb;font-size:18px;font-weight:bold;"
);

toast("Application Ready","success");