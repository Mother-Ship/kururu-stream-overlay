// connecting to websocket
import WebSocketManager from '../COMMON/lib/socket.js';
import {
    getModEnumFromModString,
    getModNameAndIndexById,
    getStoredBeatmapById,
    getTeamRankByFullName
} from '../COMMON/lib/bracket.js'; // 路径根据实际情况调整
import {CountUp} from '../COMMON/lib/countUp.min.js';

import OsuParser from '../COMMON/lib/osuParser.js';
import {__wbg_init} from "../COMMON/lib/rosu-pp/rosu_pp.js";
await __wbg_init('../COMMON/lib/rosu-pp/rosu_pp_bg.wasm')
const p = new OsuParser();

const socket = new WebSocketManager('127.0.0.1:24050');
const teamAScore = new CountUp('score-red', 0, {duration: 0.5, useGrouping: true});
const teamBScore = new CountUp('score-blue', 0, {duration: 0.5, useGrouping: true});
const scoreOffset = new CountUp('score-offset', 0, {duration: 0.5, useGrouping: true});


function showChat() {
    document.getElementById('chat').classList.remove('fade-out');
    document.getElementById('chat').style.opacity = "1";
    document.getElementById('chat').classList.add('fade-in');

    document.getElementById('scoreboard').classList.remove('fade-in');
    document.getElementById('scoreboard').classList.add('fade-out');
    document.getElementById('scoreboard').style.opacity = "0";
}

function showScoreboard() {
    document.getElementById('chat').classList.remove('fade-in');
    document.getElementById('chat').classList.add('fade-out');
    document.getElementById('chat').style.opacity = "0";

    document.getElementById('scoreboard').classList.remove('fade-out');
    document.getElementById('scoreboard').style.opacity = "1";
    document.getElementById('scoreboard').classList.add('fade-in');

}

document.getElementById('button-scoreboard').addEventListener('click', function (e) {
    showScoreboard();
})
document.getElementById('button-chat').addEventListener('click', function (e) {
    showChat();
})
let percent = 0;


function updateTriangleAxis() {
    const ellipseCenterY = 954 + 684 / 2;
    const startX = 939;
// 当X从椭圆顶点向右移100% * 300像素时
    const newX = 600 * percent / 100;
// 相对椭圆圆心的Y
    const newY = calculateY(newX)

    const newTriangleX = startX + newX;
    const newTriangleY = ellipseCenterY - newY - 20;

    document.getElementById("triangle").style.left = newTriangleX + 'px';
    document.getElementById("triangle").style.top = newTriangleY + 'px';
}

updateTriangleAxis();

function calculateY(x) {
    // 椭圆的参数
    const a = 644.5;
    const b = 342;

    // 计算 y^2
    const ySquared = (1 - (x * x) / (a * a)) * (b * b);

    return Math.sqrt(ySquared);
}

const cache = {

    leftName: "",
    rightName: "",


    leftScore: 0,
    rightScore: 0,

    bestOF: 0,
    leftStar: 0,
    rightStar: 0,

    chat: [],

    bid: 0,
    bgPath: ""

};
document.addEventListener('selectstart', function (e) {
    e.preventDefault();
})
socket.api_v1(async ({tourney, menu}) => {

    try {

        const chat = tourney.manager.chat;
        if (chat.length !== cache.chat.length) {
            cache.chat = chat;
            // 根据chat内容生成HTML
            const chatHtml = chat.map(item => {
                switch (item.team) {
                    case 'left':
                        return `<p><span class="time">${item.time}&nbsp;</span> <span class="player-a-name-chat">${item.name}&nbsp;</span>${item.messageBody}</p>`
                    case 'right':
                        return `<p><span class="time">${item.time}&nbsp;</span> <span class="player-b-name-chat">${item.name}&nbsp;</span>${item.messageBody}</p>`
                    case 'bot':
                    case 'unknown':
                        return `<p><span class="time">${item.time}&nbsp;</span> <span class="unknown-chat">${item.name}&nbsp;</span>${item.messageBody}</p>`

                }
            }).join('');
            document.getElementById("chat-content").innerHTML = chatHtml;
            let element = document.getElementById("chat-content");
            element.scrollTop = element.scrollHeight;
        }

        const leftName = tourney.ipcClients[0].spectating.name;
        if (leftName !== cache.leftName) {
            cache.leftName = leftName;
            document.getElementById("player-a-name").innerText = leftName;
            getTeamRankByFullName(leftName).then(
                rank => {
                    if (rank)
                        document.getElementById("player-a-rank").innerText =
                            "#" + rank;
                }
            )

            if (leftName !== "") {
                document.getElementById("player-a-avatar").src =
                    "http://localhost:24050/COMMON/img/avatar/" + leftName + ".jpg"
            }
        }
        const rightName = tourney.ipcClients[1].spectating.name;
        if (rightName !== cache.rightName) {
            cache.rightName = rightName;
            document.getElementById("player-b-name").innerText = rightName;
            getTeamRankByFullName(rightName).then(
                rank => {
                    if (rank)
                        document.getElementById("player-b-rank").innerText =
                            "#" + rank;
                }
            )

            if (rightName !== "") {
                document.getElementById("player-b-avatar").src =
                    "http://localhost:24050/COMMON/img/avatar/" + rightName + ".jpg"
            }
        }
        let leftScore = tourney.manager.gameplay.score.left;
        let rightScore = tourney.manager.gameplay.score.right;

        if (leftScore !== cache.leftScore || rightScore !== cache.rightScore) {
            cache.leftScore = leftScore;
            cache.rightScore = rightScore;

            teamAScore.update(leftScore);
            teamBScore.update(rightScore);
            scoreOffset.update(Math.abs(leftScore - rightScore));
            let diff = Math.abs(leftScore - rightScore);
            percent = Math.min(1, Math.pow(diff / 1500000, 0.5) / 2) * 100;
            if (rightScore < leftScore) {
                percent = -percent;
            }
            updateTriangleAxis();
        }

        const bestOF = tourney.manager.bestOF;
        if (bestOF !== cache.bestOF) {

            cache.bestOF = bestOF;
            const max = bestOF / 2 + 0.5;
            //为player-a-stars和player-b-stars填充<img class="points_white" src="../COMMON/img/points_white.png"> 元素
            for (let i = 0; i < max; i++) {
                const star = document.createElement("img");
                star.className = "points_white";
                star.src = "../COMMON/img/points_white.png";
                // 清空原有星星
                document.getElementById("player-a-stars").innerHTML = "";

                document.getElementById("player-a-stars").appendChild(star);
            }


            for (let i = 0; i < max; i++) {
                const star = document.createElement("img");
                star.className = "points_white";
                star.src = "../COMMON/img/points_white.png";
                // 清空原有星星
                document.getElementById("player-b-stars").innerHTML = "";

                document.getElementById("player-b-stars").appendChild(star);
            }


        }

        const leftStar = tourney.manager.stars.left
        if (leftStar !== cache.leftStar) {
            cache.leftStar = leftStar;


            const max = cache.bestOF / 2 + 0.5;
            for (let i = 0; i < max; i++) {
                document.getElementById("player-a-stars").children[i].src = "../COMMON/img/points_white.png";
            }
            // 从左到右把player-a-stars的子元素的src属性替换成"../COMMON/img/points_red.png"
            for (let i = 0; i < leftStar; i++) {
                const childElement = document.getElementById("player-a-stars").children[i];
                childElement.src = "../COMMON/img/points_red.png";
            }

        }
        const rightStar = tourney.manager.stars.right
        if (rightStar !== cache.rightStar) {
            cache.rightStar = rightStar;

            const max = cache.bestOF / 2 + 0.5;
            for (let i = 0; i < max; i++) {
                document.getElementById("player-b-stars").children[i].src = "../COMMON/img/points_white.png";
            }
            // 从左到右把player-a-stars的子元素的src属性替换成"../COMMON/img/points_red.png"
            for (let i = 0; i < rightStar; i++) {
                const childElement = document.getElementById("player-b-stars").children[i];
                childElement.src = "../COMMON/img/points_blue.png";
            }
        }


        document.getElementById("title").innerText = menu.bm.metadata.artist
            + " - "
            + menu.bm.metadata.title
            + " [" + menu.bm.metadata.difficulty + "]";

        document.getElementById("mapper").innerText = "Mapper: " + menu.bm.metadata.mapper;

        const bgPath = menu.bm.path.full;
        if (bgPath !== cache.bgPath) {
            cache.bgPath = bgPath;
            document.getElementById("bg").src = "http://localhost:24050/Songs/" + encodeURIComponent(menu.bm.path.full);
        }

        const bid = menu.bm.id;
        if (bid !== cache.bid) {
            cache.bid = bid;
            let path = encodeURIComponent(menu.bm.path.folder);
            let file = encodeURIComponent(menu.bm.path.file);
            let parsed = await p.parse(`http://${location.host}/Songs/${path}/${file}`);
            const modNameAndIndex = await getModNameAndIndexById(parsed.metadata.bid);
            parsed.mod = modNameAndIndex.modName;
            let mods = getModEnumFromModString(parsed.mod);
            parsed.modded = p.getModded(parsed, mods);
            document.getElementById("ar").innerText = parseFloat(parsed.modded.difficulty.ar).toFixed(1);
            document.getElementById("cs").innerText = parseFloat(parsed.modded.difficulty.cs).toFixed(1);
            document.getElementById("od").innerText = parseFloat(parsed.modded.difficulty.od).toFixed(1);

            document.getElementById("bpm").innerText = parsed.modded.beatmap.bpm.mostly;
            document.getElementById("star-ranking").innerText = parsed.modded.difficulty.sr.toFixed(2) + "*"


            // 处理picked by
            const operation = getStoredBeatmapById(bid.toString())
            console.log(operation)
            if (operation !== null) {
                if (operation.type === "Pick") {
                    if (operation.team === "Red") {
                        document.getElementById("selected").classList.remove("picked-by-a", "picked-by-b")
                        document.getElementById("selected").classList.add("picked-by-a")
                        document.getElementById("selected").style.display = "flex"
                        document.getElementById("picked-by").innerText = "Picked by " + tourney.ipcClients[0].spectating.name;
                    }
                    if (operation.team === "Blue") {
                        document.getElementById("selected").classList.remove("picked-by-a", "picked-by-b")
                        document.getElementById("selected").classList.add("picked-by-b")
                        document.getElementById("selected").style.display = "flex"
                        document.getElementById("picked-by").innerText = "Picked by " + tourney.ipcClients[1].spectating.name;
                    }
                }
            }

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

        }

    } catch (error) {
        console.log(error);
    }
});