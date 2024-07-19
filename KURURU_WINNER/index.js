// connecting to websocket
import WebSocketManager from '../COMMON/lib/socket.js';

const socket = new WebSocketManager('127.0.0.1:24050');


const cache = {

    bestOF: 0,

    leftStar: 0,
    rightStar: 0,

};

function leftWin(tourney) {
    const leftName = tourney.ipcClients[0].spectating.name;
    if (leftName !== "") {
        document.getElementById("winner").style.display = "block";
        document.getElementById("winner-avatar").src =
            "http://localhost:24050/COMMON/img/avatar/" + leftName + ".jpg"
        document.getElementById("winner-name").innerHTML = leftName
    }
}

function rightWin(tourney) {
    const rightName = tourney.ipcClients[0].spectating.name;
    if (rightName !== "") {
        document.getElementById("winner").style.display = "block";
        document.getElementById("winner-avatar").src =
            "http://localhost:24050/COMMON/img/avatar/" + rightName + ".jpg"
        document.getElementById("winner-name").innerHTML = rightName
    }
}

// receive message update from websocket
socket.api_v1(({tourney, menu}) => {
    try {


        const leftStar = tourney.manager.stars.left
        if (leftStar !== cache.leftStar) {
            cache.leftStar = leftStar;

            const max = cache.bestOF / 2 + 0.5;
            if (leftStar >= max) {
                leftWin(tourney);
            }

        }
        const rightStar = tourney.manager.stars.right
        if (rightStar !== cache.rightStar) {
            cache.rightStar = rightStar;

            const max = cache.bestOF / 2 + 0.5;
            if (rightStar >= max) {
                rightWin(tourney);
            }
        }


        const bestOF = tourney.manager.bestOF;
        if (bestOF !== cache.bestOF) {

            cache.bestOF = bestOF;
            const max = bestOF / 2 + 0.5;
            if (leftStar >= max) {
                leftWin(tourney);
            }
            if (rightStar >= max) {
                rightWin(tourney);
            }
        }

    } catch (error) {
        console.log(error);
    }
});