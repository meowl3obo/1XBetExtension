var tabDict = {};
var machineName = 'Extension';
var manifestData = chrome.runtime.getManifest();
let heartBeatTimer = null;
let lastSendTime = new Date().getTime();
let lastSend = null;
let sendCount = 0;
let resultID;
var foucesTabInterval;
let runStatus = 1;
chrome.runtime.onUpdateAvailable.addListener(() => {
    chrome.runtime.reload();
});

function autoUpdate() {
    $.ajax({
        type: "GET",
        url: `${getNewVersionUrl}`,
        dataType: "json",
        success: (res) => {
            if (res.version != manifestData.version) {
                closeAllPage()
                setTimeout(function () {
                    chrome.runtime.reload();
                }, 500);
            } else if (res.enabled != runStatus) {
                if (res.enabled <= 0) {
                    closeAllPage()
                } else {
                    chrome.runtime.reload();
                }
                runStatus = res.enabled
            }
        }
    })
}

function closeAllPage() {
    Object.keys(tabDict).forEach((id) => {
        closePage(id);
    })
}

function closePage(id) {
    chrome.tabs.remove(Number(id));
}
getLocalIPs((ips) => {
    machineName += ips.split('.')[3];
    openPage(OfficialResult)
    window.setTimeout(foucesTab, 10000);
    foucesTabInterval = window.setInterval(foucesTab, 15000);
    window.setInterval(autoUpdate, 300000);
});

function openPage(url, to = "result") {
    chrome.tabs.create({
        'url': url
    }, newTab => {
        function listener(tabId, changeInfo, tab) {
            if (tabId === newTab.id && changeInfo.status == 'complete') {
                if (to == "result") {
                    resultID = newTab.id;
                    if (tabDict[newTab.id] == undefined) {
                        tabDict[newTab.id] = 'result'
                    }
                }
            }
            if (to != "result") {
                console.log("clear")
                chrome.tabs.sendMessage(newTab.id, {
                    from: "background",
                    action: "clear",
                });
            }
        }
        chrome.tabs.onUpdated.addListener(listener);
    })
};

function checkActiveAndHeartBeat() {
    let now = new Date().getTime();
    if (now - Number(lastSendTime) >= 60000) {
        machinesHeartBeat(1);
    }
}

chrome.runtime.onMessage.addListener(function (msg, sender) {
    if (msg.from == "content") {
        if (msg.action == "send") {
            var topic = "oxbresulthtml";
            var data = `<tczb>result</tczb><machinename>${machineName}</machinename><timestamp>${Math.round(new Date().getTime())}</timestamp><gametype>${msg.message.gameType}</gametype><gametypeelement>${msg.message.gameTypeElement}</gametypeelement><league>${msg.message.leagueName}</league>===END===${msg.message.leagueData}`;
            sendKafka(data, topic);
            checkActiveAndHeartBeat()
        } else if (msg.action == "reload") {
            chrome.tabs.reload(sender.tab.id);
            window.setTimeout(foucesTab(), 500);
        } else if (msg.action == "focus") {
            foucesTab()
        } else if (msg.action == "clear") {
            clear();
        }
    } else if (msg.from == "activeCheck") {
        machinesHeartBeat()
    }
});

function sendKafka(message, topic) {
    var data = JSON.stringify({
        "Topic": topic,
        "Message": message
    });
    $.ajax({
        type: "POST",
        url: sendKafkaURL[envType],
        dataType: "json",
        data: data,
        contentType: "application/json",
    });
}


function machinesHeartBeat(workCount = 1) {
    const Now = new Date().getTime();
    var msg = "W:" + workCount + ",V:" + manifestData.version + ",H:";
    $.ajax({
        type: "POST",
        url: machinesHeartBeatURL + machineName + "/OXBE?status=" + msg,
        contentType: "application/json",
    });
    lastSendTime = Now;
}


function foucesTab() {
    let keys = Object.keys(tabDict);
    let index = 0;
    let timer = setInterval(() => {
        if (keys[index] != undefined) {
            chrome.tabs.update(parseInt(keys[index]), {
                active: true
            });
            index++;
        }
    }, 500)
    if (index == keys.length) {
        window.clearInterval(timer);
        index = 0;
    }
}


function getLocalIPs(callback) {
    var ips = "";

    var RTCPeerConnection = window.RTCPeerConnection ||
        window.webkitRTCPeerConnection || window.mozRTCPeerConnection;

    var pc = new RTCPeerConnection({
        iceServers: []
    });
    pc.createDataChannel('');

    pc.onicecandidate = function (e) {
        if (!e.candidate) {
            pc.close();
            callback(ips);
            return;
        }
        var ip = /^candidate:.+ (\S+) \d+ typ/.exec(e.candidate.candidate)[1];
        let prd = '192.168.10.'
        let local = '192.168.9.'
        if ((ip.includes(prd) && !ip.includes(local)) || (!ip.includes(prd) && ip.includes(local))) {
            ips = ip;
            if (ips.includes(prd)) {
                envType = "PRD"
            } else {
                envType = "Local"
            }
        }
    };
    pc.createOffer(function (sdp) {
        pc.setLocalDescription(sdp);
    }, function onerror() { });
}


chrome.tabs.onRemoved.addListener(function (tabid, removed) {
    if (tabDict[tabid] !== undefined) {
        lastSend[`${tabDict[tabid].pageType}${tabDict[tabid].pageName}`] = null;
        delete tabDict[tabid];
    }
});

var millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
var aWeekAgo = (new Date()).getTime() - millisecondsPerWeek;

function clear() {
    // openPage(ChromeSetting,"clear");
    chrome.browsingData.remove({
        "since": aWeekAgo
    }, {
        "appcache": true,
        "cache": true,
        "cacheStorage": true,
        "cookies": true,
        "downloads": true,
        "fileSystems": true,
        "formData": true,
        "history": true,
        "indexedDB": true,
        "localStorage": true,
        "passwords": true,
        "serviceWorkers": true,
        "webSQL": true
    }, chrome.tabs.reload(resultID));
}