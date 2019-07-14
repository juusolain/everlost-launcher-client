const request = require('request');
const https = require('https');
https.globalAgent.options.ca = require('ssl-root-cas/latest').create();
const serverUrl = "https://everlost.jusola.cf/server";
const downloadURL = "https://everlost.jusola.cf/Latest";
const PakDir = "/Everlost/Content/Paks"
const download = require('download');
const fs = require('fs');
const path = require('path');
const md5File = require("md5-file")
const CryptoJS = require('crypto-js');
const unzip = require('unzipper');
var configContent;
var config;
var currentItem = 0;
try {
  configContent = fs.readFileSync("config.json");
  config = JSON.parse(configContent);
} catch (err) {
  console.error("Error with reading config.json, please check file permissions")
}
var rootdir;

console.log(process.env.PORTABLE_EXECUTABLE_DIR);
console.log(__dirname);

exports.checkUpdates = function checkUpdates(cb){
  console.warn("Deprecated, use gameupdater.getUpdates instead");
}

if(process.env.PORTABLE_EXECUTABLE_DIR){
  rootdir = process.env.PORTABLE_EXECUTABLE_DIR;
}else{
  rootdir = __dirname;
}

exports.getUpdates = function getUpdates(cb){
  try{
    fs.readdir(config.gameInstallLoc+path.sep+"Game"+path.sep+"Everlost"+path.sep+"Content"+path.sep+"Paks", (err, filearr)=>{
      console.log(filearr);
      if(!err){
        request.get({url: serverUrl+path.sep+"getupdates", form: {localPAKs: JSON.stringify(filearr)}}, (err, httpResponse, body)=>{
          let parsedBody = JSON.parse(body);
          let dlList = parsedBody.diffArray;
          let ret = false;
          if(dlList.length > 0){
            ret = true;
          }
          cb(ret, dlList);
        })
      }
    })

  }catch (err)
  {
    cb(false, null);
  }
}


exports.updateGame = function updateGame(downloadList, cb, onProgress){
  if(downloadList.length > 0){
    currentItem = 0;
    downloadArrItems(()=>{
      console.log("ArrItemsDownloaded");
    })
  }
}

function downloadArrItems(cb){
  download(serverUrl+PakDir+path.sep+dlList[currentItem], config.gameInstallLoc+path.sep+"Game"+path.sep+"Everlost"+path.sep+"Content"+path.sep+"Paks").then(()=>{
    if(currentItem < downloadList.length - 1){
      currentItem++;
      downloadArrItems(cb);
    }else{
      cb();
    }
  });
}



function versionSort(version1, version2){
  version1 = version1.replace(/[^.0-9]/gi, '');
  version2 = version2.replace(/[^.0-9]/gi, '');

  version1_A = version1.split(".");
  version2_A = version2.split(".");
  var resolved = false;
  if(version1_A.length == version2_A.length){
    for(var i=0; i < version1_A.length; i++){
      if(version1_A[i] != version2_A[i]){
        resolved = true;
        return version1_A[i] - version2_A[i];
      }
    }
    if(!resolved){
      return 0;
    }
  }else{
    return 0;
  }
}

function getKeyForValue(object, value) {
  let key = Object.keys(object).find((key)=>{
     return object[key] == value;
  });
  return key;
}
