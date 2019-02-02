const request = require('request');
const https = require('https');
https.globalAgent.options.ca = require('ssl-root-cas/latest').create();
const serverUrl = "https://everlost.jusola.cf/";
const download = require('download');
const fs = require('fs');
const path = require('path');
const md5File = require("md5-file")
const CryptoJS = require('crypto-js');
const unzip = require('unzipper');
var configContent;
var config;
try {
  configContent = fs.readFileSync("config.json");
  config = JSON.parse(configContent);
} catch (err) {
  console.error("Error with reading config.json, please check file permissions")
}

console.log(config.gameInstallLoc);
exports.checkUpdates = function checkUpdates(cb){
  console.warn("Deprecated, use gameupdater.getUpdates instead");
}


exports.getUpdates = function getUpdates(cb){
  let currentVersion = null;
  let fullDL = true;
  fs.readFile(config.gameInstallLoc+"Game"+path.sep+"version.txt", 'utf8', (fileErr, data) => {
    if(!fileErr){
      currentVersion = parseFloat(data.replace(/[^0-9]/gi, ''));
    }else{
      currentVersion = -1;
    }
    request.get("https://git.jusola.cf/api/v1/repos/porkposh/Everlost/releases", (err, httpResponse, body)=>{
      if(!err){
        let parsedBody = JSON.parse(body);
        parsedBody = parsedBody.filter((elem)=>{
          if(config.preRelease){
            if(elem.target_commitish == "pre-release" || elem.target_commitish == "release"){
              return true;
            }else{
              return false;
            }
          }else{
            if(elem.target_commitish == "release"){
              return true;
            }else{
              return false;
            }
          }
        });
        parsedBody = parsedBody.sort((a, b)=>{
          let aTag = a.tag_name;
          let bTag = b.tag_name;
          aTag = aTag.replace(/[^0-9]/gi, '');
          bTag = bTag.replace(/[^0-9]/gi, '');
          return parseFloat(aTag)-parseFloat(bTag);
        })
        parsedBody = parsedBody.filter((a)=>{
          let aTag = a.tag_name;
          aTag = aTag.replace(/[^0-9]/gi, '');
          aTag = parseFloat(aTag);
          if(aTag > currentVersion){
            return true;
          }else{
            return false;
          }
        });
        if (parsedBody.length > 0){
          parsedBody.forEach((elem)=>{
            if(currentVersion == parseFloat(elem.tag_name.replace(/[^0-9]/gi, ''))){
              fullDL = false;
            }
          })
        }else{
          cb(false);
          return;
        }
        console.log(parsedBody);
        request.get("https://git.jusola.cf/api/v1/repos/porkposh/Everlost/releases/"+parsedBody[parsedBody.length-1].id+"/assets", (err, httpR, body)=>{
          if(!err && body){
            let parsedBody2 = JSON.parse(body);
            parsedBody2 = parsedBody2.filter((elem)=>{
                if(elem.name.toLowerCase().includes(config.platform.toLowerCase())){
                  if(!fullDL){
                    if(elem.name.toLowerCase().includes("update")){
                      return true;
                    }else{
                      return false;
                    }
                  }else{
                    if(!elem.name.toLowerCase().includes("update")){
                      return true;
                    }else{
                      return false;
                    }
                  }
                  return true;
                }else{
                  return false;
                }
            });
            if((currentVersion != parseFloat(parsedBody[parsedBody.length-1].tag_name.replace(/[^0-9]/gi, ''))) || fileErr){
              let totalSize = 0;
              let downloadUrls = [];
              parsedBody2.forEach((elem)=>{
                totalSize+=elem.size;
                downloadUrls.unshift(elem.browser_download_url);
              })
              if(fullDL){

                cb(true, [parsedBody2[parsedBody2.length-1].browser_download_url], parsedBody2[parsedBody2.length-1].size, parsedBody[parsedBody.length-1].tag_name);
              }else{
                cb(true, downloadUrls, totalSize, parsedBody[parsedBody.length-1].tag_name);
              }
            }else{
              cb(false);
            }

          }else{
            cb(false);
            console.log(err);
          }
        })
      }else{
        cb(false);
        console.log(err);
      }
    })
  });

}


exports.updateGame = function updateGame(urls, size, version, cb, onProgress){
  console.log("Updating to version: "+version)
  let totalProgress = 0;
  let currentItem = 0;
  let downloadArr = function(cbDLArr){
    console.log("Downloading: "+urls[currentItem]);
    let currentdl = download(urls[currentItem]);
    currentdl.pipe(unzip.Extract({ path: config.gameInstallLoc+'Game' }));
    currentdl.on('downloadProgress', (progress)=>{
      let progressPercent = (progress.transferred+totalProgress) / size * 100 + "%";
      let progressPercentDisplay = ((progress.transferred+totalProgress) / size * 100).toFixed(0) + "%";
      onProgress(progressPercent, progressPercentDisplay);
    });
    currentdl.on('error', (err)=>{
      currentdl.destroy(err);
      console.error(err);
      cbDLArr(false, "Error");
    });
    currentdl.on('end', ()=>{
      console.log("Downloaded item: "+urls[currentItem]);
      totalProgress+=size;
      currentItem++;
      if(currentItem < urls.length){
        downloadArr(complete);
      }else{
        cbDLArr(true, null)
      }
    })
  }
  downloadArr((complete, err)=>{
    if(complete){
      cb(true, version);
    }else{
      cb(false, "-1");
    }
  })
}

/*function getCurrentVersion(cb){
  getChecksums((checksums)=>{
    checksum = md5File(config.gameInstallLoc+"Game/Everlost/Binaries/Win64/Everlost.exe", (err, checksum)=>{
      if(!err){
        console.log(checksum);
        version = getKeyForValue(checksums, checksum);
        if(version){
            cb(version);
          }else{
            console.log("InvalidVersion");
            cb(false, "ERROR");
        }
      }

    });
  });
}

exports.writeValidVersion = function(){
  getCurrentVersion((version, error)=>{
    if(version){
      console.log(version);
      fs.writeFile(config.gameInstallLoc+'Game/version.txt', version, (err)=>{
        console.log(err);
      });
    }
  })
}*/

function getChecksums(cb){ //Get checksums of all releases
  request.get("https://git.jusola.cf/api/v1/repos/porkposh/Everlost/releases", (err, httpResponse, body)=>{ //Get all releases
    if(!err){
      let parsedBody = JSON.parse(body);
      request.get("https://git.jusola.cf/api/v1/repos/porkposh/Everlost/releases/"+parsedBody[0].id+"/assets", (err, httpR, body)=>{//Get latest release files
        if(!err && body){
          let parsedBody2 = JSON.parse(body);
          console.log(parsedBody2);
          let checksums = parsedBody2.find((elem)=>{//Find checksums.json from all releases
            return elem.name == "checksums.json";
          });
          if(checksums){//check if checksums exits
            request.get(checksums.browser_download_url, (err, httpR, body)=>{
              if(!err){
                checksumsParsedBody = JSON.parse(body);
                cb(checksumsParsedBody);
              }else{
                console.error(error);
                cb(false)
              }

            })
          }
        }else{
          cb(false);
          console.log(err);
        }
      })
    }else{
      cb(false);
      console.log(err);
    }
  })
}




function getKeyForValue(object, value) {
  let key = Object.keys(object).find((key)=>{
     return object[key] == value;
  });
  return key;
}
