/*==========================================================
    PRO IMAGE COMPRESSOR
    compressor.js
    PART 1
==========================================================*/

"use strict";

/* ==========================================================
   CONFIG
========================================================== */

const MAX_DIMENSION = 5000;

const MAX_BINARY_ITERATIONS = 40;

const QUALITY_TOLERANCE = 0.5; // KB

/* ==========================================================
   LOAD IMAGE
========================================================== */

function loadImage(file){

    return new Promise((resolve,reject)=>{

        const img=new Image();

        img.onload=()=>resolve(img);

        img.onerror=reject;

        img.src=URL.createObjectURL(file);

    });

}

/* ==========================================================
   GET EXIF ORIENTATION
========================================================== */

function getOrientation(file){

    return new Promise(resolve=>{

        if(typeof EXIF==="undefined"){

            resolve(1);

            return;

        }

        EXIF.getData(file,function(){

            resolve(

                EXIF.getTag(this,"Orientation") || 1

            );

        });

    });

}

/* ==========================================================
   CREATE CANVAS
========================================================== */

function createCanvas(width,height){

    const canvas=document.createElement("canvas");

    canvas.width=Math.round(width);

    canvas.height=Math.round(height);

    return canvas;

}

/* ==========================================================
   APPLY EXIF ROTATION
========================================================== */

function applyOrientation(ctx,orientation,width,height){

    ctx.setTransform(1,0,0,1,0,0);

    switch(orientation){

        case 2:
            ctx.translate(width,0);
            ctx.scale(-1,1);
            break;

        case 3:
            ctx.translate(width,height);
            ctx.rotate(Math.PI);
            break;

        case 4:
            ctx.translate(0,height);
            ctx.scale(1,-1);
            break;

        case 5:
            ctx.rotate(0.5*Math.PI);
            ctx.scale(1,-1);
            break;

        case 6:
            ctx.rotate(0.5*Math.PI);
            ctx.translate(0,-height);
            break;

        case 7:
            ctx.rotate(0.5*Math.PI);
            ctx.translate(width,-height);
            ctx.scale(-1,1);
            break;

        case 8:
            ctx.rotate(-0.5*Math.PI);
            ctx.translate(-width,0);
            break;

    }

}

/* ==========================================================
   DRAW IMAGE
========================================================== */

function drawImage(canvas,img,width,height,orientation){

    const ctx=canvas.getContext("2d",{

        alpha:false,

        willReadFrequently:false

    });

    ctx.fillStyle="#ffffff";

    ctx.fillRect(0,0,canvas.width,canvas.height);

    applyOrientation(

        ctx,

        orientation,

        canvas.width,

        canvas.height

    );

    ctx.drawImage(

        img,

        0,

        0,

        width,

        height

    );

}

/* ==========================================================
   CANVAS TO BLOB
========================================================== */

function canvasToBlob(canvas,mime,quality){

    return new Promise(resolve=>{

        canvas.toBlob(

            blob=>resolve(blob),

            mime,

            quality

        );

    });

}

/* ==========================================================
   CALCULATE RESIZE
========================================================== */

function calculateResize(width,height){

    const mode=document.getElementById("resizeMode").value;

    const value=Number(

        document.getElementById("resizeValue").value

    );

    const rw=Number(

        document.getElementById("resizeWidth").value

    );

    const rh=Number(

        document.getElementById("resizeHeight").value

    );

    const lock=document.getElementById("lockRatio").checked;

    switch(mode){

        case "percent":

            if(value>0){

                return{

                    width:width*value/100,

                    height:height*value/100

                };

            }

            break;

        case "pixel":

            if(value>0){

                if(lock){

                    return{

                        width:value,

                        height:height*(value/width)

                    };

                }

                return{

                    width:value,

                    height:height

                };

            }

            break;

        case "wh":

            if(lock){

                if(rw){

                    return{

                        width:rw,

                        height:height*(rw/width)

                    };

                }

                if(rh){

                    return{

                        width:width*(rh/height),

                        height:rh

                    };

                }

            }

            return{

                width:rw||width,

                height:rh||height

            };

    }

    return{

        width,

        height

    };

}

/* ==========================================================
   LIMIT MAX DIMENSION
========================================================== */

function limitSize(width,height){

    if(

        width<=MAX_DIMENSION &&

        height<=MAX_DIMENSION

    ){

        return{

            width,

            height

        };

    }

    const ratio=Math.min(

        MAX_DIMENSION/width,

        MAX_DIMENSION/height

    );

    return{

        width:width*ratio,

        height:height*ratio

    };

}

/* ==========================================================
   FORMAT TARGET SIZE
========================================================== */

function getTargetKB(item){

    const mode=document.getElementById("sizeMode").value;

    const unit=document.getElementById("unit").value;

    if(mode==="ratio"){

        return (

            item.file.size/1024

        )*(item.target/100);

    }

    let size=Number(

        document.getElementById("globalTarget").value

    );

    if(unit==="MB")

        size*=1024;

    return size;

}

/* ==========================================================
   MIME TYPE
========================================================== */

function getOutputMime(file){

    const keepPNG=

        document.getElementById("compressMode").value==="png";

    if(

        keepPNG &&

        file.type==="image/png"

    ){

        return "image/png";

    }

    return "image/jpeg";

}

/* ==========================================================
   MEMORY CLEANUP
========================================================== */

function revokeImage(img){

    if(img.src){

        URL.revokeObjectURL(img.src);

    }

}

/* ==========================================================
   READY
========================================================== */

console.log(

    "compressor.js Part 1 loaded."

);
/*==========================================================
    PART 2
    EXACT SIZE COMPRESSION ENGINE
==========================================================*/

async function compressImage(item){

    const file = item.file;

    const targetKB = getTargetKB(item);

    const mime = getOutputMime(file);

    const img = await loadImage(file);

    const orientation = await getOrientation(file);

    let size = calculateResize(img.width, img.height);

    size = limitSize(size.width, size.height);

    let width = size.width;
    let height = size.height;

    let bestBlob = null;
    let bestDiff = Number.MAX_VALUE;

    while(true){

        const canvas = createCanvas(width,height);

        drawImage(
            canvas,
            img,
            width,
            height,
            orientation
        );

        /* ----------------------------------
           KEEP PNG
        -----------------------------------*/

        if(mime==="image/png"){

            const blob = await canvasToBlob(
                canvas,
                "image/png",
                1
            );

            revokeImage(img);

            return{

                id:item.id,

                name:file.name,

                blob,

                size:(blob.size/1024).toFixed(1)

            };

        }

        /* ----------------------------------
           JPEG Binary Search
        -----------------------------------*/

        let low = 0.02;

        let high = 0.98;

        let localBlob = null;

        let localDiff = Number.MAX_VALUE;

        let localSize = 0;

        for(
            let i=0;
            i<MAX_BINARY_ITERATIONS;
            i++
        ){

            const quality=(low+high)/2;

            const blob=await canvasToBlob(

                canvas,

                "image/jpeg",

                quality

            );

            const sizeKB=blob.size/1024;

            const diff=Math.abs(

                sizeKB-targetKB

            );

            if(diff<localDiff){

                localDiff=diff;

                localBlob=blob;

                localSize=sizeKB;

            }

            /* Exact */

            if(

                localDiff<=QUALITY_TOLERANCE

            ){

                break;

            }

            /* Too Large */

            if(sizeKB>targetKB){

                high=quality;

            }

            /* Too Small */

            else{

                low=quality;

            }

        }

        if(localDiff<bestDiff){

            bestDiff=localDiff;

            bestBlob=localBlob;

        }

        /* ===============================
           STOP CONDITIONS
        =============================== */

        if(

            document
            .getElementById("sizeMode")
            .value==="exact"

        ){

            if(bestDiff<=QUALITY_TOLERANCE)

                break;

        }

        if(

            document
            .getElementById("sizeMode")
            .value==="max"

        ){

            if(localSize<=targetKB)

                break;

        }

        /* ===============================
           Reduce Dimensions
        =============================== */

        width*=0.95;

        height*=0.95;

        if(

            width<120 ||

            height<120

        ){

            break;

        }

    }

    revokeImage(img);

    return{

        id:item.id,

        name:file.name.replace(

            /\.\w+$/,

            ".jpg"

        ),

        blob:bestBlob,

        size:(bestBlob.size/1024).toFixed(1)

    };

}
/*==========================================================
    PART 3
    PERFORMANCE & BATCH UTILITIES
==========================================================*/

/* ==========================================================
   GLOBAL SETTINGS
========================================================== */

const Compressor = {

    parallelJobs: Math.max(
        2,
        Math.min(
            navigator.hardwareConcurrency || 4,
            4
        )
    ),

    cancelled: false

};

/* ==========================================================
   CANCEL
========================================================== */

function cancelCompression(){

    Compressor.cancelled = true;

}

function resetCompression(){

    Compressor.cancelled = false;

}

/* ==========================================================
   PARALLEL BATCH COMPRESSION
========================================================== */

async function compressBatch(items,onProgress){

    resetCompression();

    const output=[];

    let completed=0;

    const queue=[...items];

    async function worker(){

        while(queue.length){

            if(Compressor.cancelled)
                break;

            const item=queue.shift();

            try{

                const result=await compressImage(item);

                output.push(result);

            }

            catch(err){

                console.error(err);

            }

            completed++;

            if(onProgress){

                onProgress(
                    completed,
                    items.length
                );

            }

        }

    }

    const workers=[];

    for(
        let i=0;
        i<Compressor.parallelJobs;
        i++
    ){

        workers.push(worker());

    }

    await Promise.all(workers);

    return output;

}

/* ==========================================================
   SMART QUALITY ESTIMATE
========================================================== */

function estimateInitialQuality(file,targetKB){

    const current=file.size/1024;

    const ratio=targetKB/current;

    if(ratio>0.90) return 0.95;

    if(ratio>0.70) return 0.88;

    if(ratio>0.50) return 0.80;

    if(ratio>0.35) return 0.68;

    if(ratio>0.20) return 0.55;

    return 0.40;

}

/* ==========================================================
   IMAGE SAVING
========================================================== */

function savingPercent(original,compressed){

    return (

        (original-compressed)

        /

        original

        *

        100

    ).toFixed(1);

}

/* ==========================================================
   HUMAN SIZE
========================================================== */

function humanSize(bytes){

    if(bytes<1024)

        return bytes+" B";

    if(bytes<1024*1024)

        return (bytes/1024).toFixed(1)+" KB";

    return (bytes/1024/1024).toFixed(2)+" MB";

}

/* ==========================================================
   TOTAL STATS
========================================================== */

function calculateBatchStats(results,originalFiles){

    let original=0;

    let compressed=0;

    originalFiles.forEach(f=>{

        original+=f.file.size;

    });

    results.forEach(r=>{

        compressed+=r.blob.size;

    });

    return{

        originalBytes:original,

        compressedBytes:compressed,

        original:humanSize(original),

        compressed:humanSize(compressed),

        saving:savingPercent(
            original,
            compressed
        )

    };

}

/* ==========================================================
   MEMORY CLEANUP
========================================================== */

function releaseResults(results){

    results.forEach(r=>{

        if(r.url){

            URL.revokeObjectURL(r.url);

        }

    });

}

/* ==========================================================
   CHECK TRANSPARENCY
========================================================== */

async function hasTransparency(img){

    const canvas=document.createElement("canvas");

    canvas.width=1;

    canvas.height=1;

    const ctx=canvas.getContext("2d");

    ctx.drawImage(img,0,0,1,1);

    const pixel=ctx.getImageData(
        0,
        0,
        1,
        1
    ).data;

    return pixel[3]<255;

}

/* ==========================================================
   FILE NAME
========================================================== */

function outputName(file,mime){

    const base=file.name.replace(/\.\w+$/,"");

    if(mime==="image/png")

        return base+".png";

    return base+".jpg";

}

/* ==========================================================
   RETRY
========================================================== */

async function retryCompression(item){

    return await compressImage(item);

}

/* ==========================================================
   BENCHMARK
========================================================== */

function benchmark(start){

    return (

        (performance.now()-start)

        /1000

    ).toFixed(2);

}

/* ==========================================================
   READY
========================================================== */

console.log(

    "%cCompressor Engine Ready",

    "color:#16a34a;font-size:18px;font-weight:bold"

);