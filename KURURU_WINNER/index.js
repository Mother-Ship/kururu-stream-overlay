// connecting to websocket
import WebSocketManager from '../COMMON/lib/socket.js';

const socket = new WebSocketManager('127.0.0.1:24050');


const cache = {

    bestOF: 0,

    leftStar: 0,
    rightStar: 0,

};

// receive message update from websocket
socket.api_v1(({tourney, menu}) => {
    try {


        const bestOF = tourney.manager.bestOF;
        if (bestOF !== cache.bestOF) {

            cache.bestOF = bestOF;
            const max = bestOF / 2 + 0.5;
            if (leftStar >= max) {
                const leftUid = tourney.ipcClients[0].spectating.userID;
                if (leftUid !== 0) {
                    document.getElementById("winner").style.display = "block";
                    document.getElementById("winner-avatar").src = "https://a.ppy.sh/" + leftUid + "?.jpeg"
                    document.getElementById("winner-name").innerHTML = tourney.ipcClients[0].spectating.name;
                }
            }
            if (rightStar >= max) {
                const rightUid = tourney.ipcClients[1].spectating.userID;
                if (rightUid !== 0){
                    document.getElementById("winner").style.display = "block";
                    document.getElementById("winner-avatar").src = "https://a.ppy.sh/" + rightUid + "?.jpeg"
                    document.getElementById("winner-name").innerHTML = tourney.ipcClients[1].spectating.name;
                }

            }
        }

        const leftStar = tourney.manager.stars.left
        if (leftStar !== cache.leftStar) {
            cache.leftStar = leftStar;

            const max = cache.bestOF / 2 + 0.5;
            if (leftStar >= max) {
                const leftUid = tourney.ipcClients[0].spectating.userID;
                if (leftUid !== 0) {
                    document.getElementById("winner").style.display = "block";
                    document.getElementById("winner-avatar").src = "https://a.ppy.sh/" + leftUid + "?.jpeg"
                    document.getElementById("winner-name").innerHTML = tourney.ipcClients[0].spectating.name;
                }
            }

        }
        const rightStar = tourney.manager.stars.right
        if (rightStar !== cache.rightStar) {
            cache.rightStar = rightStar;

            const max = cache.bestOF / 2 + 0.5;
            if (rightStar >= max) {
                const rightUid = tourney.ipcClients[1].spectating.userID;
                if (rightUid !== 0){
                    document.getElementById("winner").style.display = "block";
                    document.getElementById("winner-avatar").src = "https://a.ppy.sh/" + rightUid + "?.jpeg"
                    document.getElementById("winner-name").innerHTML = tourney.ipcClients[1].spectating.name;
                }

            }
        }
    } catch (error) {
        console.log(error);
    }
});