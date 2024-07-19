import {
    clearBeatmapSelections,
    deleteBeatmapSelectionById,
    getAllRound,
    getBeatmapListByRoundName,
    getStoredBeatmapById,
    getTeamRankByFullName,
    storeBeatmapSelection
} from "../COMMON/lib/bracket.js";
import WebSocketManager from '../COMMON/lib/socket.js';

const socket = new WebSocketManager('127.0.0.1:24050');


const cache = {
    leftName: "",
    rightName: "",


    leftScore: 0,
    rightScore: 0,

    bestOF: 0,

    leftStar: 0,
    rightStar: 0,

    chat: [],
};

// receive message update from websocket
socket.api_v1(({tourney, menu}) => {
    try {
        const chat = tourney.manager.chat;
        if (chat.length !== cache.chat.length) {
            cache.chat = chat;
            console.log(chat)
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

        }
        const leftName = tourney.ipcClients[0].spectating.name;
        if (leftName !== cache.leftName) {
            cache.leftName = leftName;
            document.getElementById("player-a-name").innerText = leftName;
            getTeamRankByFullName(leftName).then(
                rank => {
                    document.getElementById("player-a-rank").innerText =
                        "#" + rank;
                }
            )

            if (leftName !== "") {
                document.getElementById("player-a-avatar").src =
                    "http://localhost:24050/COMMON/img/avatar/" + leftName + ".jpg"
            }
        }
        const rightName = tourney.ipcClients[0].spectating.name;
        if (rightName !== cache.rightName) {
            cache.rightName = rightName;
            document.getElementById("player-b-name").innerText = rightName;
            getTeamRankByFullName(rightName).then(
                rank => {
                    document.getElementById("player-b-rank").innerText =
                        "#" + rank;
                }
            )

            if (rightName !== "") {
                document.getElementById("player-b-avatar").src =
                    "http://localhost:24050/COMMON/img/avatar/" + rightName + ".jpg"
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
                document.getElementById("player-a-stars").innerHTML = "";

                document.getElementById("player-a-stars").appendChild(star);
            }


            for (let i = 0; i < max; i++) {
                const star = document.createElement("img");
                star.className = "points_white";
                star.src = "../COMMON/img/points_white.png";
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
    } catch (error) {
        console.log(error);
    }
});

let allRound;
let currentRound;


getAllRound().then(
    (rounds) => {
        allRound = rounds;
        currentRound = rounds[0];
        onCurrentRoundChange();
    }
)

function onCurrentRoundChange() {
    document.getElementById('current-match').innerText = "当前场次：" + currentRound.roundName;

    // 根据场次名称找到本场谱面
    const beatmapList = getBeatmapListByRoundName(currentRound.roundName);
    beatmapList.then(
        (beatmaps) => {
            console.log(beatmaps)
            // 填充map-pool
            const mapPool = document.getElementById("map-pool");
            mapPool.innerHTML = "";
            var currentMod = "";

            let mod;
            let index = 0;

            beatmaps.forEach(
                (beatmap) => {
                    if (beatmap.Mods !== currentMod) {
                        currentMod = beatmap.Mods;
                        mod = document.createElement("div");
                        mod.className = "map-pool-mod";
                        mapPool.appendChild(mod);
                        index = 0;
                    }

                    const map = document.createElement("div");
                    map.className = "map-pool-map";
                    map.id = `${beatmap.ID}`;

                    // 检查localstorage内有没有当前谱面的ban pick操作，如果有则添加相应class
                    const operation = getStoredBeatmapById(beatmap.ID.toString())
                    if (operation !== null) {
                        if (operation.type === "Ban") {
                            if (operation.team === "Red") {
                                map.classList.add("banned-by-a")
                            }
                            if (operation.team === "Blue") {
                                map.classList.add("banned-by-b")
                            }
                        }
                        if (operation.type === "Pick") {
                            if (operation.team === "Red") {
                                map.classList.add("picked-by-a")
                            }
                            if (operation.team === "Blue") {
                                map.classList.add("picked-by-b")
                            }
                        }
                    }
                    // 生成HTML
                    map.innerHTML = `
                        <div class="map-bg-container">
                            <img class="map-bg" src="${beatmap.BeatmapInfo.Covers["card@2x"]}">
                        </div>
                        <div class="mod-bg mod-bg-${currentMod.toLowerCase()}">
                            <span class="mod-name">${beatmap.Mods}${index + 1}</span>
                        </div>
                        <div class="map-container">
                            <span class="map-name">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${beatmap.BeatmapInfo.Metadata.Artist} - ${beatmap.BeatmapInfo.Metadata.Title}</span>
                            <div class="map-info">
                                <span class="mapper-desc">mapper&nbsp;</span>
                                <span class="mapper-name">${beatmap.BeatmapInfo.Metadata.Author.Username}</span>
                                <span class="diff-desc">&nbsp;&nbsp;&nbsp;diff&nbsp;</span>
                                <span class="diff-name">${beatmap.BeatmapInfo.DifficultyName}</span>
                            </div>
                        </div>
                    `
                    mod.appendChild(map);

                    // 添加左右键点击事件
                    map.addEventListener('click', function (event) {
                        console.log(this.id);
                        // 为currentOperation 添加beatmapId
                        if (currentOperation !== null) {
                            currentOperation = {
                                ...currentOperation,
                                "beatmapId": this.id
                            }
                            map.classList.remove("banned-by-a", "banned-by-b", "picked-by-a", "picked-by-b");

                            if (currentOperation.type === "Ban") {
                                if (currentOperation.team === "Red") {
                                    map.classList.add("banned-by-a")
                                }
                                if (currentOperation.team === "Blue") {
                                    map.classList.add("banned-by-b")
                                }
                            }
                            if (currentOperation.type === "Pick") {
                                if (currentOperation.team === "Red") {
                                    map.classList.add("picked-by-a")
                                }
                                if (currentOperation.team === "Blue") {
                                    map.classList.add("picked-by-b")
                                }
                            }
                            // 存入localstorage
                            storeBeatmapSelection(currentOperation);
                            currentOperation = null;

                        }

                        // 熄灭所有ban pick按钮
                        document.getElementById('button-a-ban').classList.remove("button-inactive", "button-active");
                        document.getElementById('button-a-ban').classList.add("button-inactive");
                        document.getElementById('button-a-pick').classList.remove("button-inactive", "button-active");
                        document.getElementById('button-a-pick').classList.add("button-inactive");
                        document.getElementById('button-b-ban').classList.remove("button-inactive", "button-active");
                        document.getElementById('button-b-ban').classList.add("button-inactive");
                        document.getElementById('button-b-pick').classList.remove("button-inactive", "button-active");
                        document.getElementById('button-b-pick').classList.add("button-inactive");
                    });
                    map.addEventListener('contextmenu', function (event) {
                        console.log(this.id);
                        map.classList.remove("banned-by-a", "banned-by-b", "picked-by-a", "picked-by-b");

                        deleteBeatmapSelectionById(this.id);

                        event.preventDefault();
                    })

                    index++;
                }
            )

            // 统计map-pool下每个mod里map的数量，放在每个行里
            const mods = document.querySelectorAll(".map-pool-mod");
            mods.forEach(
                (mod) => {
                    const maps = mod.querySelectorAll(".map-pool-map");
                    // 每3个map放到一行，每行是一个新建的flex布局的div，不足3个的也放到一行
                    maps.forEach(
                        (map, index) => {
                            if (index % 3 === 0) {
                                const flex = document.createElement("div");
                                flex.className = "map-pool-row";
                                mod.appendChild(flex);
                                flex.appendChild(map);
                            } else {
                                // 获取最后一个map-pool-row
                                const flex = mod.querySelector(".map-pool-row:last-child");
                                flex.appendChild(map);
                            }
                        }
                    )
                }
            );
            // 统计每行的map数量，根据map数量不同设置每行map宽度
            // 使用CSS类来管理不同数量map的样式，减少硬编码
            const rows = document.querySelectorAll(".map-pool-row");
            rows.forEach((row) => {
                const maps = row.querySelectorAll(".map-pool-map");
                const mapCount = maps.length;

                // 根据map数量动态设置行的类名
                row.classList.remove("map-count-1", "map-count-2", "map-count-3");
                row.classList.add(`map-count-${mapCount}`);
            });

        }
    );

}

document.getElementById('button-match-next').addEventListener('click', function (e) {
    //切换currentRound到下一场
    for (let i = 0; i < allRound.length; i++) {
        if (allRound[i].roundName === currentRound.roundName) {
            console.log(i)
            if (i === allRound.length - 1) {
                currentRound = allRound[0];
            } else {
                currentRound = allRound[i + 1];
            }
            break;
        }
    }

    onCurrentRoundChange();

})

document.getElementById('button-match-previous').addEventListener('click', function (e) {
    //切换currentRound到上一场
    for (let i = 0; i < allRound.length; i++) {
        if (allRound[i].roundName === currentRound.roundName) {
            console.log(i)
            if (i === 0) {
                currentRound = allRound[allRound.length - 1];
            } else {
                currentRound = allRound[i - 1];
            }
            break;
        }
    }
    onCurrentRoundChange();
})


document.addEventListener('selectstart', function (e) {
    e.preventDefault();
})

let currentOperation = null;

document.getElementById('button-a-ban').addEventListener('click', function (e) {
    // 激活自己，熄灭其他ban pick按钮
    document.getElementById('button-a-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-ban').classList.add("button-active");

    document.getElementById('button-a-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-pick').classList.add("button-inactive");
    document.getElementById('button-b-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-ban').classList.add("button-inactive");
    document.getElementById('button-b-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-pick').classList.add("button-inactive");

    // 准备好全局变量，类似于{ "team": "Red", "type": "Pick", "beatmapID": 2194138 }，只不过没有beatmapId
    currentOperation = {
        "team": "Red",
        "type": "Ban"
    };
})
document.getElementById('button-a-pick').addEventListener('click', function (e) {
    // 激活自己，熄灭其他ban pick按钮
    document.getElementById('button-a-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-ban').classList.add("button-inactive");
    document.getElementById('button-a-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-pick').classList.add("button-active");
    document.getElementById('button-b-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-ban').classList.add("button-inactive");
    document.getElementById('button-b-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-pick').classList.add("button-inactive");
    currentOperation = {
        "team": "Red",
        "type": "Pick"
    };
})

document.getElementById('button-b-ban').addEventListener('click', function (e) {
    // 激活自己，熄灭其他ban pick按钮
    document.getElementById('button-a-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-ban').classList.add("button-inactive");
    document.getElementById('button-a-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-pick').classList.add("button-inactive");
    document.getElementById('button-b-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-ban').classList.add("button-active");
    document.getElementById('button-b-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-pick').classList.add("button-inactive");
    currentOperation = {
        "team": "Blue",
        "type": "Ban"
    }
})
document.getElementById('button-b-pick').addEventListener('click', function (e) {
    // 激活自己，熄灭其他ban pick按钮
    document.getElementById('button-a-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-ban').classList.add("button-inactive");
    document.getElementById('button-a-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-pick').classList.add("button-inactive");
    document.getElementById('button-b-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-ban').classList.add("button-inactive");
    document.getElementById('button-b-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-pick').classList.add("button-active");
    currentOperation = {
        "team": "Blue",
        "type": "Pick"
    }
})


document.getElementById('button-a-first').addEventListener('click', function (e) {
    document.getElementById('player-a-pick').innerText = "SECOND PICK"
    document.getElementById('player-a-ban').innerText = "FIRST BAN"

    document.getElementById('player-b-pick').innerText = "FIRST PICK"
    document.getElementById('player-b-ban').innerText = "SECOND BAN"
    // 激活自己
    document.getElementById('button-a-first').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-first').classList.add("button-active");
    // 取消激活隔壁
    document.getElementById('button-b-first').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-first').classList.add("button-inactive");

    // 激活先Ban方的Ban按钮
    document.getElementById('button-a-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-ban').classList.add("button-active");

    document.getElementById('button-b-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-ban').classList.add("button-inactive");

    document.getElementById('button-a-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-pick').classList.add("button-inactive");
    document.getElementById('button-b-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-pick').classList.add("button-inactive");
    currentOperation = {
        "team": "Red",
        "type": "Ban"
    };
})

document.getElementById('button-b-first').addEventListener('click', function (e) {
    // 替换文案
    document.getElementById('player-a-pick').innerText = "FIRST PICK"
    document.getElementById('player-a-ban').innerText = "SECOND BAN"

    document.getElementById('player-b-pick').innerText = "SECOND PICK"
    document.getElementById('player-b-ban').innerText = "FIRST BAN"

    // 激活自己
    document.getElementById('button-b-first').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-first').classList.add("button-active");
    // 取消激活隔壁
    document.getElementById('button-a-first').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-first').classList.add("button-inactive");

    // 激活先Ban方的Ban按钮
    document.getElementById('button-a-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-ban').classList.add("button-inactive");

    document.getElementById('button-b-ban').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-ban').classList.add("button-active");

    document.getElementById('button-a-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-a-pick').classList.add("button-inactive");
    document.getElementById('button-b-pick').classList.remove("button-inactive", "button-active");
    document.getElementById('button-b-pick').classList.add("button-inactive");

    currentOperation = {
        "team": "Blue",
        "type": "Ban"
    };

})
document.getElementById('reset').addEventListener('click', function (e) {
    // 清掉所有map节点的pick ban属性
    const maps = document.querySelectorAll(".map-pool-map");
    maps.forEach(
        (map) => {
            map.classList.remove("banned-by-a", "banned-by-b", "picked-by-a", "picked-by-b");
        }
    )
    clearBeatmapSelections();
})
document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
})
