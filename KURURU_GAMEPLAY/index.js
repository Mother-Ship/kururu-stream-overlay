// connecting to websocket
import WebSocketManager from '../COMMON/lib/socket.js';
import {getModNameAndIndexById, getStoredBeatmapById} from '../COMMON/lib/bracket.js'; // 路径根据实际情况调整

const socket = new WebSocketManager('127.0.0.1:24050');


let scoreUpdateTimer = setTimeout(() => {
    console.log('隐藏计分板，展示聊天框')
    document.getElementById('chat').style.display = 'flex';
    document.getElementById('scoreboard').style.display = 'none';
}, 5000);

const cache = {

    leftUid: -1,
    rightUid: -1,

    leftScore: 0,
    rightScore: 0,

    bestOF: 0,
    leftStar: 0,
    rightStar: 0,

    chat: [],

    bid: 0,

};
document.addEventListener('selectstart', function (e) {
    e.preventDefault();
})
socket.api_v1(({tourney, menu}) => {

    try {

        const chat = tourney.manager.chat;
        if (chat.length !== cache.chat.length) {
            cache.chat = chat;
            console.log(chat)
            // 根据chat内容生成HTML
            const chatHtml = chat.map(item => {
                switch (item.team){
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

        }

        const leftUid = tourney.ipcClients[0].spectating.userID;
        if (leftUid !== cache.leftUid) {
            cache.leftUid = leftUid;
            document.getElementById("player-a-name").innerText = tourney.ipcClients[0].spectating.name;
            document.getElementById("player-a-rank").innerText = "#" + tourney.ipcClients[0].spectating.globalRank;
            if (leftUid !== 0) {
                document.getElementById("player-a-avatar").src =
                    "https://a.ppy.sh/" + leftUid + "?.jpeg"
            }
        }
        const rightUid = tourney.ipcClients[1].spectating.userID;
        if (rightUid !== cache.rightUid) {
            cache.rightUid = rightUid;
            document.getElementById("player-b-name").innerText = tourney.ipcClients[1].spectating.name;
            document.getElementById("player-b-rank").innerText = "#" + tourney.ipcClients[1].spectating.globalRank;
            if (leftUid !== 0) {
                document.getElementById("player-b-avatar").src =
                    "https://a.ppy.sh/" + rightUid + "?.jpeg"
            }
        }
        const leftScore = tourney.manager.gameplay.score.left;
        const rightScore = tourney.manager.gameplay.score.right;
        if (leftScore !== cache.leftScore || rightScore !== cache.rightScore) {
            cache.leftScore = leftScore;
            cache.rightScore = rightScore;
            document.getElementById("score-red").innerText = leftScore;
            document.getElementById("score-blue").innerText = rightScore;
            document.getElementById("score-offset").innerText = Math.abs(leftScore - rightScore);

            // 隐藏聊天框，显示计分板
            document.getElementById('chat').style.display = 'none';
            document.getElementById('scoreboard').style.display = 'flex';

            // 重置计时器的执行时间
            clearTimeout(scoreUpdateTimer);
            scoreUpdateTimer = setTimeout(() => {
                console.log('隐藏计分板，展示聊天框')
                document.getElementById('chat').style.display = 'flex';
                document.getElementById('scoreboard').style.display = 'none';
            }, 5000);

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
                document.getElementById("player-a-stars").appendChild(star);
            }


            for (let i = 0; i < max; i++) {
                const star = document.createElement("img");
                star.className = "points_white";
                star.src = "../COMMON/img/points_white.png";
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

        var bid = menu.bm.id;
        if (bid !== cache.bid) {
            cache.bid = bid;

            document.getElementById("bg").src = "http://localhost:24050/Songs/" + menu.bm.path.full;

            document.getElementById("ar").innerText = parseFloat(menu.bm.stats.AR).toFixed(1);
            document.getElementById("cs").innerText = parseFloat(menu.bm.stats.CS).toFixed(1);
            document.getElementById("od").innerText = parseFloat(menu.bm.stats.OD).toFixed(1);

            document.getElementById("bpm").innerText = menu.bm.stats.BPM.common;
            document.getElementById("star-ranking").innerText = menu.bm.stats.fullSR + "*";

            document.getElementById("title").innerText = menu.bm.metadata.artist
                + " - "
                + menu.bm.metadata.title
                + " [" + menu.bm.metadata.difficulty + "]";

            document.getElementById("mapper").innerText = menu.bm.metadata.mapper;

            // 处理picked by
            const operation = getStoredBeatmapById(bid.toString())
            console.log(operation)
            if (operation !== null) {
                if (operation.type === "Pick") {
                    if (operation.team === "Red") {
                        document.getElementById("selected").classList.remove("picked-by-a", "picked-by-b")
                        document.getElementById("selected").classList.add("picked-by-a")
                        document.getElementById("selected").style.display= "flex"
                        document.getElementById("picked-by").innerText = "Picked by " + tourney.ipcClients[0].spectating.name;
                    }
                    if (operation.team === "Blue") {
                        document.getElementById("selected").classList.remove("picked-by-a", "picked-by-b")
                        document.getElementById("selected").classList.add("picked-by-b")
                        document.getElementById("selected").style.display= "flex"
                        document.getElementById("picked-by").innerText = "Picked by " + tourney.ipcClients[1].spectating.name;
                    }
                }
            }

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