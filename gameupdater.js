const request = require('request');
const https = require('https');
https.globalAgent.options.ca = require('ssl-root-cas/latest').create();
const serverUrl = "https://everlost.jusola.cf/";
const download = require('download');
const fs = require('fs');
const unzip = require('unzip');
var configContent = fs.readFileSync("config.json");
var config = JSON.parse(configContent);
if(config){
  installLoc = config.installLoc;
}else{
  config.preRelease = false;
  config.platform = process.platform;
}

exports.checkUpdates = function checkUpdates(cb){
  let currentVersion = null;
  let fullDL = true;
  fs.readFile("Game/version.txt", 'utf8', (fileErr, data) => {
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
          return parseFloat(a)-parseFloat(b);
        })
        if (parsedBody.length > 1){
          let versionBefore = parsedBody[1].tag_name.replace(/[^0-9]/gi, '')
          if(versionBefore == currentVersion){
            fullDL = false;
          }
        }
        request.get("https://git.jusola.cf/api/v1/repos/porkposh/Everlost/releases/"+parsedBody[0].id+"/assets", (err, httpR, body)=>{
          if(!err && body){
            let parsedBody2 = JSON.parse(body);
            parsedBody2 = parsedBody2.filter((elem)=>{
                if(elem.name.includes(config.platform)){
                  if(!fullDL){
                    if(elem.name.includes(config.platform) && elem.name.toLowerCase().includes("update")){
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
            console.log(parsedBody);
            if((currentVersion != parseFloat(parsedBody[0].tag_name.replace(/[^0-9]/gi, ''))) || fileErr){
              console.log('Updating to version: '+parsedBody[0].tag_name);
              cb(parsedBody[0].tag_name);
            }else{
              cb(false);
            }

          }else{
            console.log(err);
          }
        })
      }else{
        console.log(err);
      }
    })
  });

}


exports.getUpdates = function getUpdates(cb){
  let currentVersion = null;
  let fullDL = true;
  fs.readFile("/Game/version.txt", 'utf8', (fileErr, data) => {
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
          return parseFloat(a)-parseFloat(b);
        })
        if (parsedBody.length > 1){
          parsedBody.forEach((elem)=>{
            if(currentVersion == parseFloat(elem.tag_name.replace(/[^0-9]/gi, ''))){
              fullDL = false;
            }
          })
        }
        request.get("https://git.jusola.cf/api/v1/repos/porkposh/Everlost/releases/"+parsedBody[0].id+"/assets", (err, httpR, body)=>{
          if(!err && body){
            let parsedBody2 = JSON.parse(body);
            parsedBody2 = parsedBody2.filter((elem)=>{
                if(elem.name.includes(config.platform)){
                  if(!fullDL){
                    if(elem.name.includes(config.platform) && elem.name.toLowerCase().includes("update")){
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
            console.log(parsedBody);
            if((currentVersion != parseFloat(parsedBody[0].tag_name.replace(/[^0-9]/gi, ''))) || fileErr){
              console.log('Updating to version: '+parsedBody[0].tag_name);
              let totalSize = 0;
              let downloadUrls = [];
              parsedBody2.forEach((elem)=>{
                totalSize+=elem.size;
                downloadUrls.unshift(elem.browser_download_url);
              })
              cb(true, downloadUrls, totalSize, parsedBody[0].tag_name);
            }else{
              cb(false);
            }

          }else{
            console.log(err);
          }
        })
      }else{
        console.log(err);
      }
    })
  });

}


exports.updateGame = function updateGame(urls, size, version, cb, onProgress){
  let totalProgress = 0;
  let currentItem = 0;
  let downloadArr = function(cbDLArr){
    let currentdl = download(urls[currentItem]);
    currentdl.pipe(unzip.Extract({ path: 'Game/' }));
    currentdl.on('downloadProgress', (progress)=>{
      let progressPercent = progress.transferred+totalProgress / size * 100 + "%";
      let progressPercentDisplay = (progress.transferred+totalProgress / size * 100).toFixed(0) + "%";
      onProgressLower(progressPercent, progressPercentDisplay);
    });
    currentdl.on('error', (err)=>{
      currentdl.destroy(err);
      cbDLArr(false, "Error");
    });
    currentdl.on('end', ()=>{
      totalProgress+=size;
      currentItem++;
      if(currentItem < downloads.length){
        downloadArrItem(complete);
      }else{
        cbDLArr(true, null)
      }
    })
  }
  downloadArrItem((complete, err)=>{
    if(complete && !err){
      cb(true, version);
    }else{
      cb(false, "-1");
    }
  })
}
