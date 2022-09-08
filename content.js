var compareCount = 0;
var cacheHtml = "";
var pageType = "";
var pageName = "";
var typeCount = 0;
var leagueCount = 2;
var endCount = 0

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
})

var t1 = window.setInterval(action, 1000);
var t2 = null; // 檢查 collapse 是否打開
var t3 = null; // 檢查 圖片 是否關閉
var t4 = null; // 送出資料時間
var t5 = null; // 判斷是否 service error
var t6 = null; // 資料送完，每分鐘送出 heartbeat
var t7 = null;

const noImg = [
    'https://v2l.cdnsfree.com/sfiles/logo_teams/37431.png',
    'https://v2l.cdnsfree.com/sfiles/logo_teams/37429.png',
    'https://v2l.cdnsfree.com/sfiles/logo_teams/68969.png',
    'https://v2l.cdnsfree.com/sfiles/logo_teams/68967.png',
    'https://v2l.cdnsfree.com/sfiles/logo_teams/5417481.png',
    'https://v2l.cdnsfree.com/sfiles/logo_teams/5417459.png',
]

window.onunload = () => {
    window.clearInterval(t1);
    window.clearInterval(t2);
    window.clearInterval(t3);
    window.clearInterval(t4);
    window.clearTimeout(t5);
    window.clearInterval(t6)
}

let count = 0;

function action() {
    var reloadClassName = "c-games p-results__games"
    chrome.runtime.sendMessage({
        from: "content",
        action: "focus",
    });
    if (!checkDataExists(reloadClassName)) {
        if (checkData(reloadClassName)) {
            window.clearTimeout(t5)
            window.clearInterval(t1)
            clickTime();
        } else {
            reload()
        }
    } else {
        if (t5 == null) {
            t5 = setTimeout(() => {
                if (location.href.includes('results')) {
                    var block = document.getElementsByClassName('main-block')
                    if (block.length > 0) {
                        console.log("reload")
                        chrome.runtime.sendMessage({
                            from: "content",
                            action: "clear"
                        })
                        window.clearInterval(t1);
                    } else {
                        reload()
                    }
                } else {
                    location.href = 'https://1xbet.com/en/results'
                }
            }, 120000)
        }
    }
}

function clickTime() {
    const cookie = document.cookie;
    const tzo = cookie.match(/tzo\S+/)
    let timeZone
    if (tzo != null) {
        timeZone = tzo[0].match(/=(.+);/)[1]
    }
    if (tzo == null || timeZone != '8.00') {
        const timesDiv = document.getElementsByClassName('timeButTopFl')[0]
        timesDiv.click()
        const timeLi = timesDiv.getElementsByTagName('li')
        for (var time in timeLi) {
            if (timeLi[time].dataset.value == '8.00') {
                timeLi[time].click()
            }
        }
    } else {
        clickLine()
    }
}

function clickLine() {
    // check Lines
    const matchlist = ['American Football', 'Badminton', 'Baseball', 'Basketball', 'Football', 'Ice Hockey', 'Table Tennis', 'Volleyball', 'Cricket', 'Snooker', 'Handball', 'Darts', 'Water Polo', 'Billiards', '冰上曲棍球', '排球', '桌球', '棒球', '籃球', '美式足球', '羽毛球', '足球', '板球', '桌球', '手球', '飛鏢', '水球', '台球'];
    // const matchlist = ['Cricket', '板球'];
    const sidebar = document.getElementsByClassName("b-menu")[0];
    const allGameType = sidebar.getElementsByTagName("section")[0];
    const gameType = allGameType.getElementsByTagName("a");
    for (var item in gameType) {
        var title = gameType[item].title
        if (matchlist.includes(title)) {
            gameType[item].click()
        }
    }
    // noShowLogo();
    openCollapse()
}

function noShowLogo() {
    const settingDiv = document.getElementsByClassName('results-settings__list')[0];
    settingDiv.style.display = 'block';
    const logoSetting = settingDiv.getElementsByClassName('results-settings__title results-settings__check active')[0]
    logoSetting.click();
    t3 = setInterval(() => {
        var settingSuccess = settingDiv.getElementsByClassName('results-settings__title results-settings__check')
        if (settingSuccess.length > 0) {
            clearInterval(t3)
            settingDiv.style.display = 'none';
            openCollapse();
        }
    }, 250)
}

function openCollapse() {
    const filterArray = document.getElementsByClassName('c-filter c-filter_filled');
    let collapseBtn = '';
    for (var item in filterArray) {
        if (filterArray[item].title == 'Expand all') {
            collapseBtn = filterArray[item]
        }
    }
    if (collapseBtn != '') {
        collapseBtn.click()
        t2 = setInterval(() => {
            let isOpen = document.getElementsByClassName('c-games__row c-games__row_can-toggle active')
            if (isOpen.length > 0) {
                getData()
                clearInterval(t2)
            }
        }, 250)
    }
}

function getData() {
    const dataContent = document.getElementsByClassName('c-games p-results__games')[0];
    const gameTypeClassify = dataContent.getElementsByClassName('c-games__item');
    const typeLength = Object.keys(gameTypeClassify).length;

    setTimeLeagueData(gameTypeClassify, typeLength)
}

function setTimeLeagueData(gameTypeClassify, typeLength) {
    const reg = /(\n\s+|<!---->|u-mla |u-tar|u-nlpd|u-nvpd|u-dir-ltr|u-shrink|class="fa  c-games__ico-drop fa-angle-double-down"|c-table |style\S+\s\S+")/gi
    const regClass = /class=" "/gi
    const regCGames = /c-games/gi
    const regCTable = /c-table/gi
    var data = {};
    if (typeCount >= typeLength) {
        typeCount = 0
        leagueCount = 2
        t6 = setInterval(() => {
            endCount += 1
            heartBeat()
            chrome.runtime.sendMessage({
                from: "content",
                action: "focus",
            });
            if (endCount >= 40) {
                // reload()
                chrome.runtime.sendMessage({
                    from: "content",
                    action: "clear",
                });
                window.clearInterval(t6)
            }
        }, 30000)
    } else {
        var typeBar = gameTypeClassify[typeCount].getElementsByClassName('c-games__row c-games__row_head')[0];
        var typeClearMore = typeBar.innerHTML.replace(reg, '').replace(/^["|'](.*)["|']$/g, '$1')
        data.gameTypeElement = typeClearMore.replace(regClass, 'class="space"');
        data.gameType = typeBar.getElementsByClassName('c-games__sport')[0].innerText;
        var leagueAllData = gameTypeClassify[typeCount].childNodes;
        var leagueLength = Object.keys(leagueAllData).length
        t4 = setInterval(() => {
            var leagueBar = leagueAllData[leagueCount].getElementsByClassName('c-games__row c-games__row_can-toggle active')[0]
            data.leagueName = leagueBar.getElementsByClassName('c-games__name')[0].innerText;
            var img = leagueAllData[leagueCount].getElementsByTagName('img')
            for (i = 0; i < img.length; i++) {
                if (noImg.includes(img[i].src)) {
                    img[i].src = 'False'
                } else {
                    img[i].src = 'True'
                }
            }
            var leagueClearMore = leagueAllData[leagueCount].innerHTML.replace(reg, '').replace(/^["|'](.*)["|']$/g, '$1')
            var changeGame = leagueClearMore.replace(regCGames, 'G').replace(/^["|'](.*)["|']$/g, '$1')
            var changeTable = changeGame.replace(regCTable, 'TB').replace(/^["|'](.*)["|']$/g, '$1')
            var noAlt = changeTable.replace(/alt=""/gi, '').replace(/^["|'](.*)["|']$/g, '$1')
            // data.leagueData = leagueClearMore
            data.leagueData = noAlt.replace(regClass, 'class="space"');
            sendHtml(data)
            // console.log(data)
            leagueCount++
            if (leagueCount >= leagueLength) {
                leagueCount = 2
                typeCount += 1;
                clearInterval(t4)
                getData()
            }
        }, 250)
    }
}

function checkDataExists(className) {
    let noData = document.getElementsByClassName(className);
    return noData[0] == undefined;
}

function checkData(className) {
    let noData = document.getElementsByClassName(className)[0];
    let noResult = noData.getElementsByClassName('b-no-results')
    if (noResult.length == 0) {
        return true
    }
    return false
}

function sendHtml(data) {
    // console.log(data)
    chrome.runtime.sendMessage({
        from: "content",
        action: "send",
        message: !checkDataExists('c-games p-results__games') ? data : 'nodata'
    });
}

function heartBeat() {
    chrome.runtime.sendMessage({
        from: "activeCheck",
        action: "active",
        unixTime: new Date().getTime(),
    });
}

function reload() {
    chrome.runtime.sendMessage({
        from: "content",
        action: "reload"
    });
}