var drawFlag = false;
var oldX = 0;
var oldY = 0;
var img_id = 0;
var canvases = {};
var cursol = null;

var colorList = {
    "black"   : "rgba(0,0,0,1)",
    "blue"    : "rgba(0,0,255,1)",
    "red"     : "rgba(255,0,0,1)",
    "magenta" : "rgba(255,0,255,1)",
    "green"   : "rgba(0,255,0,1)",
    "cyan"    : "rgba(0,255,255,1)",
    "yellow"  : "rgba(255,255,0,1)",
    "white"   : "rgba(255,255,255,1)"
}
var penColor = "rgba(255,0,0,1)";

window.addEventListener("load", function(){
    // キーボード初期化
    initKeyboard();
    // キャンバス初期化
    initCanvas();
    // カラーパレット初期化
    $("#colorPalet div").click(function(e){
        penColor = colorList[this.id];
    });

    // Setup the dnd listeners.
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);
}, true);

function generateGIF() {
    var gif = new GIF({
        workers: 2,
        quality: 10,
    });
    var fps = parseInt($("#fps").attr("value"));
    var img_divs = $("#canvases").children();
    for (var i = 0 ; i < img_divs.length; i++) {
        var key = img_divs[i].id;
        gif.addFrame(canvases[key],{delay: 1000/fps});        
    }
    gif.on('finished', function(blob) {

        var a = document.createElement('a');
        a.download = name;
        a.target   = '_blank';
        
        if (window.navigator.msSaveBlob) {
            // for IE
            window.navigator.msSaveBlob(blob, name)
        }/*
        else if (window.URL && window.URL.createObjectURL) {
            // for Firefox
            a.href = window.URL.createObjectURL(blob);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        else if (window.webkitURL && window.webkitURL.createObject) {
            // for Chrome
            a.href = window.webkitURL.createObjectURL(blob);
            a.click();
        }*/
        else {
            // for Safari
            var reader = new FileReader();
            reader.onload = function(e) {
                console.log(e.target.result)
                window.open(e.target.result, '_blank');
            }
            reader.readAsDataURL(blob);
            
        }
        
        console.log('finished');
        
    });

    gif.render();
}

function initKeyboard() {
    document.addEventListener('keydown', (event) => {
        var key = event.key;
        if (key == 'ArrowDown' || key == 'PageDown') {
            getNextCanvas();
        } else if (key == 'ArrowUp' || key == 'PageUp') {
            getPrevCanvas();
        }
    },false);
}

function initCanvas() {
    var can = document.getElementById("myCanvas");
    can.addEventListener("mousemove", function(e) {draw(e,false)}, true);
    can.addEventListener("mousedown", function(e){
        drawFlag = true;
        pos = getPosT(e,false)
        oldX = pos.x;
        oldY = pos.y;
    }, true);
    can.addEventListener("mouseup", function(){
        drawFlag = false;
    }, true);
     // タップ開始時に、絵を描く準備をする
    can.addEventListener("touchstart", function (e) {
        drawFlag = true;
        pos = getPosT(e,true)
        oldX = pos.x;
        oldY = pos.y;
    }, true);

    // タップ終了時に、絵を描く後処理を行う
    can.addEventListener("touchend", function () {
        drawFlag = false;
    }, true);

    // gestureイベント（２本指以上で触ると発生するやつ）の
    // 終了時にも絵を描く後処理を行う
    can.addEventListener("gestureend", function () {
        drawFlag = false;
    }, true);

    // 実際に絵を描く処理
    // 前回に保存した位置から現在の位置迄線を引く
    can.addEventListener("touchmove", function(e) {
        draw(e,true);
        e.preventDefault();
    }, true);
    clearCanvas();
    setNextCanvas();
}
// 描画処理
function draw(e,smartFlag){
    if (!drawFlag) return;
    pos = getPosT(e,smartFlag);
    var x = pos.x;
    var y = pos.y;
    var can = document.getElementById("myCanvas");
    var context = can.getContext("2d");
    context.strokeStyle = penColor;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(oldX, oldY);
    context.lineTo(x, y);
    context.stroke();
    context.closePath();
    oldX = x;
    oldY = y;
}
function readImage(reader, key){
    //ファイル読み取り後の処理
    //読み込んだ画像とdataURLを書き出す
    var div = $(`#${key}`);
    var img = div.children("img");
    img.attr("src",reader.result);

    var can = document.getElementById("myCanvas");
    var context = can.getContext("2d");
    img[0].onload = function(){

        clearCanvas();
        context.drawImage(img[0], 0, 0, can.width, can.height);
        var img_data = context.getImageData(0, 0, can.width, can.height);
        canvases[key] = img_data;
    };
}
function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    // files is a FileList of File objects. List some properties.
    for (var i = 0, f; f = files[i]; i++) {
        var reader = new FileReader();
        //dataURL形式でファイルを読み込む
        reader.readAsDataURL(f);
        //ファイルの読込が終了した時の処理

        // next してカーソルのkeyをもらう
        setNextCanvas();
        var key = cursol.attr("id");
        var readImageToKey = function(reader,key) {
            return function() {
                readImage(reader,key);           
            }
        }
        var onError = function(key) { 
            return function() {
                deleteCurrentCanvas(key);
            }
        }
        reader.onload = readImageToKey(reader,key);
        reader.onerror = onError(key);
    }
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}


function scrollX(){return document.documentElement.scrollLeft || document.body.scrollLeft;}
function scrollY(){return document.documentElement.scrollTop || document.body.scrollTop;}
function getPosT (e,smartFlag) {
    if (smartFlag){
        var mouseX = e.touches[0].clientX - $("#myCanvas").position().left + scrollX();
        var mouseY = e.touches[0].clientY - $("#myCanvas").position().top + scrollY();
        return {x:mouseX, y:mouseY};
    } else {
        var mouseX = e.clientX - $("#myCanvas").position().left + scrollX();
        var mouseY = e.clientY - $("#myCanvas").position().top + scrollY();
        return {x:mouseX, y:mouseY};
    }
}
// 保存処理
function saveData(){
    var can = document.getElementById("myCanvas");
    var d = can.toDataURL("image/png");
    var context = can.getContext("2d");
    var img_data = context.getImageData(0,0,can.width,can.height);

    // 画像一時保存
    var key = cursol.attr("id");
    canvases[key] = img_data;

    // 画像表示
    var div = $(`#${key}`);
    var img = div.children("img");

    console.log(img);
    img.attr("src",d);
}

function setNextCanvas(){
    var can = document.getElementById("myCanvas");
    var div = $("<div></div>");
    var img = $("<img>");
    var key = (`img${img_id++}`);  
    div.attr("id",key);  
    div.append(img);    


    // 画像をhtmlに追加    
    // カーソルない場合
    if (cursol == undefined){
        // 白い画面をを画像に
        var d = can.toDataURL("image/png");
        img[0].src = d;
        canvases[key] = can.getContext("2d").getImageData(0,0,can.width,can.height);
        $("#canvases").append(div);
        getCurrentCanvas(div);
    } else { 
    // カーソルの次
        // cursol移す前にセーブして全消し
        saveData();
        clearCanvas();
        canvases[key] = can.getContext("2d").getImageData(0,0,can.width,can.height);
        // 白い画面を画像に
        var d = can.toDataURL("image/png");
        img[0].src = d;
    
        cursol.after(div);
        getCurrentCanvas(div);
    }

    // 復帰できるような処理
    div.click(function(){
        getCurrentCanvas($(this));
    });

    var context = can.getContext('2d');
    context.fillStyle = "rgba(255,255,255,1)";
    context.fillRect(0,0,can.width,can.height);
    
}

function clearCanvas(){
    var can = document.getElementById("myCanvas");
    var context = can.getContext("2d");
    context.clearRect(0,0,can.width,can.height);
    context.fillStyle = "rgba(255,255,255,1)";
    context.fillRect(0,0,can.width,can.height);
}

function getNextCanvas(){
    if (cursol == undefined) return;
    next = cursol.next("div");
    if (next.length > 0) {
        getCurrentCanvas(next);
    }
}

function getPrevCanvas(){
    if (cursol == undefined) return;
    prev = cursol.prev("div");
    if (prev.length > 0){
        getCurrentCanvas(prev);
    }
}

function getCurrentCanvas(target){
    console.log(target);
    var can = document.getElementById("myCanvas");
    var context = can.getContext("2d");
    context.putImageData(canvases[target.attr("id")],0,0);
    cursol = target;
}

// 画像をkeyに保存し、cursolをうつす
function saveAndAppend() {
    saveData();
    setNextCanvas();
}

function deleteCurrentCanvas(key) {
    if (key == undefined){
        key = cursol.attr("id");
    }
    // image消去
    delete(canvases[key]);

    // cursol を次に移す
    var next = cursol.next("div");
    if (next.length == 0) {
        var prev = cursol.prev("div");
        if (prev.length == 0) return;
        cursol.remove();
        cursol = prev;
    } else {
        // cursol消去
        cursol.remove();

        // 次のcursolに移る
        cursol = next;
    }
    getCurrentCanvas(cursol);
}
