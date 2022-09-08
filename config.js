var envType = null;
var sendKafkaURL = {
    "PRD": "http://192.168.10.231:22102/api/v1/kafka/message",
    "Local": "http://192.168.9.232/mq/api/kafka/message"
}
var priceCenterManageGetWay = "https://ls2.zbdigital.net/backend/";
var machinesHeartBeatURL = `${priceCenterManageGetWay}api/system/machines/`;
var getNewVersionUrl = "https://ls2.zbdigital.net/backend/api/extension/getversion/oxb";
var Official = "https://1xbet.com/en/";
var OfficialResult = `${Official}results`;