const request = require('request');
const https = require('https');
https.globalAgent.options.ca = require('ssl-root-cas/latest').create();
const serverUrl = "https://everlost.jusola.cf/server/";
const downloadURL = "https://everlost.jusola.cf/Latest/WindowsNoEditor";
const downloadURL_PRE = "https://everlost.jusola.cf/Latest-Pre/WindowsNoEditor";
const fullDownloadURL = "https://everlost.jusola.cf/Latest.zip";
const fullDownloadURL_PRE = "https://everlost.jusola.cf/Latest-Pre.zip";
const download = require('download');
const fs = require('fs');
const sha1Sum = require('sha1-sum')
const path = require('path');
const md5File = require("md5-file")
const CryptoJS = require('crypto-js');
const unzip = require('unzipper');
var configContent;
var isHashing = false;
var enableUpdateCheck = false;
var config;
var checksums = new Map();
var currentItem = 0;
var dirsRead = false;
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

exports.hashGame = function hashGame(){
  hashDir(config.gameInstallLoc+"EverlostGame");
}


exports.getUpdates = function getUpdates(cb){
  let dlList = [];
  let ret;
  if(!isHashing){
    try{
        request.get({url: serverUrl+"getupdates", form: {preRelease: config.preRelease}}, (err, httpResponse, body)=>{
          let parsedBody = JSON.parse(body);
          let remoteSums = new Map(JSON.parse(parsedBody.serverChecksums));
          let remoteFiles = Array.from( remoteSums.keys() );
          let localFiles = Array.from( checksums.keys() );
          dlList = diffArrays(remoteFiles, localFiles);
          let matches = matchArrays(remoteFiles, localFiles);
          matches.forEach((elem)=>{
            let remoteSum = remoteSums.get(elem);
            let localSum = checksums.get(elem);
            if(remoteSum !== localSum){
              console.log("Mismatching file: "+elem+", CHKsums: Server: "+remoteSum+", local: "+localSum );
              dlList.push(elem);
            }
          })
          ret = false;
          if(dlList.length > 0){
            ret = true;
          }else{
            ret = false;
          }
          cb(ret, dlList);
          })
    }
    catch(err){
      console.log(err);
    }
  }else{
    setTimeout(getUpdates, 5000, cb);
  }


}


exports.updateGame = function updateGame(downloadList, cb, onProgress){
  if(downloadList.length > 0){
      currentItem = 0;
      downloadArrItems(downloadList, ()=>{
        console.log("ArrItemsDownloaded");
        cb();
      }, (percent, text)=>{
        onProgress(percent, text);
      });
    }
}

function downloadArrItems(dlList, cb, onProgress){
  let dlURL = downloadURL;
  if(config.preRelease){
    dlURL = downloadURL_PRE;
  }
  let split = dlList[currentItem].split("/");
  split.pop();
  let dirStr = "";
  split.forEach((elem)=>{
    dirStr+=elem+path.sep;
  })
  var dl = download(dlURL+path.sep+dlList[currentItem], config.gameInstallLoc+path.sep+"EverlostGame"+path.sep+dirStr);
  dl.on('error', (err)=>{
    console.log(err);
    if(currentItem < dlList.length - 1){
      currentItem++;
      downloadArrItems(dlList, cb, onProgress);
    }else{
      cb();
    }
  })
  dl.on('end', ()=>{
    if(currentItem < dlList.length - 1){
      currentItem++;
      downloadArrItems(dlList, cb, onProgress);
    }else{
      cb();
    }
  })
  dl.on('downloadProgress', (progress)=>{
    onProgress((currentItem+1)/dlList.length, (currentItem+1)+"/"+dlList.length, progress.percent);
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

function hashDir(dir) {
  try{
    isHashing = true;
    fs.readdirSync(dir).forEach(file => {
      let fullPath = path.join(dir, file);
      let filePath = fullPath.split("EverlostGame"+path.sep, 2)[1];
      filePath = filePath.replace(/\\/g, "/");
      if (fs.lstatSync(fullPath).isDirectory()) {
         hashDir(fullPath);
       } else {
         sha1Sum(fullPath).then((sum)=>{
         clearTimeout(enableUpdateCheck);
         enableUpdateCheck = setTimeout(enableUpdates, 5000);
         checksums.set(filePath, sum);
         }).catch((err)=>{
           console.log(err);
         })
       }
    });
  }catch(err) {
    isHashing = false;
    console.log(err);
  }
}

function enableUpdates(){
  isHashing=false;
  console.log("Hashing complete");
}

function diffArrays(arr1, arr2) {
 var newArr = [];

  arr1.forEach(function(val){
   if(!arr2.includes(val)) newArr.push(val);
  });

  return newArr;
}

function matchArrays(arr1, arr2){
  var newArr = [];

   arr1.forEach(function(val){
    if(arr2.indexOf(val) >= 0) newArr.push(val);
   });

   return newArr;
}
