// connecting to websocket
import WebSocketManager from '../COMMON/lib/socket.js';
import {getModNameAndIndexById} from '../COMMON/lib/bracket.js'; // 路径根据实际情况调整

const socket = new WebSocketManager('127.0.0.1:24050');


const cache = {
    bid: 0,
};

function drawStar(x) {
    var canvas = document.getElementById("map-star-canvas");
    var ctx = canvas.getContext('2d');
    ctx.lineWidth = 27;

    var grd = ctx.createLinearGradient(0, 0, 170, 0);
    grd.addColorStop(0, "#f27608");

    ctx.clearRect(0, 0, 192, 192);
    ctx.beginPath();
    ctx.strokeStyle = grd;
    // 从横轴的-π/2（纵轴）开始  在横轴开始的x个圆 逆时针移90度结束
    ctx.arc(96, 96, 83, -Math.PI / 2, Math.PI * 2 * x - Math.PI / 2, false);
    ctx.stroke();
}

function drawBpm(x) {
    var canvas = document.getElementById("map-bpm-canvas");
    var ctx = canvas.getContext('2d');
    ctx.lineWidth = 27;

    var grd = ctx.createLinearGradient(0, 0, 170, 0);
    grd.addColorStop(0, "#a41ed5");

    ctx.clearRect(0, 0, 192, 192);
    ctx.beginPath();
    ctx.strokeStyle = grd;
    // 从横轴的-π/2（纵轴）开始  在横轴开始的x个圆 逆时针移90度结束
    ctx.arc(96, 96, 83, -Math.PI / 2, Math.PI * 2 * x - Math.PI / 2, false);
    ctx.stroke();
}

function drawLength(x) {
    var canvas = document.getElementById("map-length-canvas");
    var ctx = canvas.getContext('2d');
    ctx.lineWidth = 27;

    var grd = ctx.createLinearGradient(0, 0, 170, 0);
    grd.addColorStop(0, "#413e3e");

    ctx.clearRect(0, 0, 192, 192);
    ctx.beginPath();
    ctx.strokeStyle = grd;
    // 从横轴的-π/2（纵轴）开始  在横轴开始的x个圆 逆时针移90度结束
    ctx.arc(96, 96, 83, -Math.PI / 2, Math.PI * 2 * x - Math.PI / 2, false);
    ctx.stroke();
}

document.addEventListener('selectstart', function (e) {
    e.preventDefault();
})
socket.api_v1(({menu}) => {

    try {
        var bid = menu.bm.id;
        if (bid !== cache.bid) {
            cache.bid = bid;

            document.getElementById("bg").src = "http://localhost:24050/Songs/" + menu.bm.path.full;

            document.getElementById("ar").innerText = parseFloat(menu.bm.stats.AR).toFixed(1);
            document.getElementById("cs").innerText = parseFloat(menu.bm.stats.CS).toFixed(1);
            document.getElementById("od").innerText = parseFloat(menu.bm.stats.OD).toFixed(1);

            document.getElementById("map-ar-bar").style.height = menu.bm.stats.AR * 100 / 10 + "%";
            document.getElementById("map-cs-bar").style.height = menu.bm.stats.CS * 100 / 10 + "%";
            document.getElementById("map-od-bar").style.height = menu.bm.stats.OD * 100 / 10 + "%";


            document.getElementById("length").innerText =
                //毫秒数转分：秒
                (menu.bm.time.full / 60000).toFixed(0) + ":" +
                //毫秒数转秒， 个位数前面添0
                (menu.bm.time.full % 60000 / 1000).toFixed(0).padStart(2, "0");

            document.getElementById("bpm").innerText = menu.bm.stats.BPM.common;

            document.getElementById("star-ranking").innerText = menu.bm.stats.fullSR.toFixed(2) + "*";
            document.getElementById("artist").innerText = menu.bm.metadata.artist
            document.getElementById("diff").innerText = "[" + menu.bm.metadata.difficulty + "]"

            document.getElementById("title").innerText = menu.bm.metadata.title;

            document.getElementById("mapper").innerText = "Mapper: " + menu.bm.metadata.mapper;

            drawStar(menu.bm.stats.fullSR / 10);
            drawBpm(menu.bm.stats.BPM.common / 400);
            // 10分钟拉满
            drawLength(menu.bm.time.full / 600000);

            //读取bracket.json处理mod
            const mod = getModNameAndIndexById(bid);
            mod.then(mod => {
                console.log(mod)

                document.getElementById("mods").innerText = mod.modName + mod.index;
                // 修改display: flex + background-color: #1eafed
                var element = document.getElementById("mods-bg");
                element.style.display = "flex";
                // NM 1eafed，HD f9a826 HR f25c54  DT 7e5a83 RX 76d7c4 TB 2f2f2f
                if (mod.modName === "NM") {
                    element.style.backgroundColor = "#1eafed";
                }
                if (mod.modName === "HD") {
                    element.style.backgroundColor = "#f9a826";
                }
                if (mod.modName === "HR") {
                    element.style.backgroundColor = "#f25c54";
                }
                if (mod.modName === "DT") {
                    element.style.backgroundColor = "#7e5a83";
                }
                if (mod.modName === "RX") {
                    element.style.backgroundColor = "#76d7c4";
                }
                if (mod.modName === "TB") {
                    element.style.backgroundColor = "#2f2f2f";
                }
            });
        }

    } catch (error) {
        console.log(error);
    }
});