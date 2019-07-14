const request = require('request');
const https = require('https');
https.globalAgent.options.ca = require('ssl-root-cas/latest').create();
const serverUrl = "https://everlost.jusola.cf/server/";
const downloadURL = "https://everlost.jusola.cf/Latest";
const fullDownloadURL = "https://everlost.jusola.cf/Latest.zip";
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
  let dlList;
  let ret;
  try{
    fs.readdir(config.gameInstallLoc+path.sep+"EverlostGame"+path.sep+"Everlost"+path.sep+"Content"+path.sep+"Paks", (err, filearr)=>{
        console.log(filearr);
        if(!err){
          request.get({url: serverUrl+"getupdates", form: {localPAKs: JSON.stringify(filearr)}}, (err, httpResponse, body)=>{
            let parsedBody = JSON.parse(body);
            dlList = parsedBody.diffArray;
            ret = false;
            if(dlList.length > 0){
              ret = true;
            }else{
              ret = false;
            }
            cb(ret, dlList, false);
          })
        }else{
          console.log(err);
          cb(true, null, true);
        }
      })
  }
  catch(err){
    console.log(err);
    cb(true, null, true);
  }

}


exports.updateGame = function updateGame(downloadList, isFull, cb, onProgress){
  if(isFull){
    let dl = download(fullDownloadURL, config.gameInstallLoc+path.sep+"EverlostGame", {extract: true});
    dl.on('error', (err)=>{
      console.log(err);
    })
    dl.on('end', ()=>{
      console.log("finished");
      cb();
    })
    dl.on('downloadProgress', (progress)=>{
      onProgress(progress.percent, "1"+"/"+"1");
    });
  }else{
    if(downloadList.length > 0){
      currentItem = 0;
      downloadArrItems(downloadList, ()=>{
        console.log("ArrItemsDownloaded");
        cb();
      }, (percent, text)=>{
        onProgress(percent, text);
      });
    }
  }s
}

function downloadArrItems(dlList, cb, onProgress){
  console.log(downloadURL+PakDir+path.sep+dlList[currentItem]);
  var dl = download(downloadURL+PakDir+path.sep+dlList[currentItem], config.gameInstallLoc+path.sep+"EverlostGame"+path.sep+"Everlost"+path.sep+"Content"+path.sep+"Paks");
  dl.on('error', (err)=>{
    console.log(err);
  })
  dl.on('end', ()=>{
    console.log("finished");
    if(currentItem < dlList.length - 1){
      currentItem++;
      downloadArrItems(dlList, cb, onProgress);
    }else{
      cb();
    }
  })
  dl.on('downloadProgress', (progress)=>{
    onProgress(progress.percent, (currentItem+1)+"/"+dlList.length);
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
