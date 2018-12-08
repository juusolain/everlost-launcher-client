const {ipcRenderer} = require('electron');
const spawn = require('child_process').spawn;
const request = require('request');
const https = require('https');
var CryptoJS = require("crypto-js");
https.globalAgent.options.ca = require('ssl-root-cas/latest').create();
const serverUrl = "https://everlost.jusola.cf/";
const updateFile = "";
var token = null;
var currentUserName;
const download = require('download');
const fs = require('fs');
const unzip = require('unzip');

var clientConfig = {
  preRelease: true,
  platform: "Win64"
};


function setToRegister(){
  var registerDiv = document.getElementById("registerbox");
  var loginDiv = document.getElementById("loginbox");
  var mainscreen = document.getElementById("mainscreen");
  var loginscreen = document.getElementById("loginscreen");
  document.getElementById("username_R").value = document.getElementById("username_L").value;
  document.getElementById("email_R").value = null;
  document.getElementById("password_R").value = null;
  loginscreen.style.display = "block";
  mainscreen.style.display = "none";
  registerDiv.style.display = "block";
  loginDiv.style.display = "none";
}

function setToLogin(){
  var registerDiv = document.getElementById("registerbox");
  var loginDiv = document.getElementById("loginbox");
  var mainscreen = document.getElementById("mainscreen");
  var loginscreen = document.getElementById("loginscreen");
  document.getElementById("username_L").value = document.getElementById("username_R").value;
  document.getElementById("password_L").value = null;
  loginscreen.style.display = "block";
  mainscreen.style.display = "none";
  registerDiv.style.display = "none";
  loginDiv.style.display = "block";
}

function registerAccount(){
  var username = document.getElementById("username_R").value;
  var email = document.getElementById("email_R").value;
  var password = document.getElementById("password_R").value;
  var encryptedPW = CryptoJS.SHA256(password).toString();
  request.get({url: serverUrl+"register", form: {username: username, password: encryptedPW, email: email}}, (err,httpResponse,body)=>{
    if(!err){
      let elembody = JSON.parse(body);
      if(!elembody.error){
          setToMain();
          token = elembody.token;
          console.log(token);
      }else{
        console.log(elembody.error);
        console.log(err);
      }
    }
  })
}

function getUserdata(cb){
  request.get({url: serverUrl+"getuser", form: {token: token}}, (err,httpResponse,body)=>{
    if(!err){
      let elembody = JSON.parse(body);
      if(!elembody.error){
        currentUserName = elembody.username;
        cb(true);
      }else{
        console.log(elembody.error);
        cb(false);
      }
    }
  })
}

function getUserIcon(usernameToGet, cb){
  request.get({url: serverUrl+"getusericon", form: {username: usernameToGet}, encoding: null}, (err,httpResponse,body)=>{
    if(!err && body){
      fs.writeFile(__dirname+"/../cache/icon/"+usernameToGet+".png", body, (err)=>{
        if(!err){
          cb(true, __dirname+"/../cache/icon/"+usernameToGet+".png");
        }else{
          cb(false);
          console.log(err);
        }
      })
    }
  })
}

function login(){
  var login = document.getElementById("username_L").value;
  var invalidacc = document.getElementById("invalidaccount");
  var password = document.getElementById("password_L").value;
  var encryptedPW = CryptoJS.SHA256(password).toString();
  request.get({url: serverUrl+"login", form: {login: login, password: encryptedPW}}, (err,httpResponse,body)=>{
    if(!err){
      let elembody = JSON.parse(body);
      console.log(elembody);
      if(!elembody.error){
          invalidacc.style.display = "none";
          token = elembody.token;
          setToMain();
      }else if(elembody.error == "NOACCOUNT"){
        console.log("noaccount");
        invalidacc.style.display = "block";
        setTimeout(()=>{
          invalidacc.style.display="none";
        }, 7500);
      }else{
        console.log(elembody.error);
      }
    }

  })
}

function logout(){
  token = null;
  currentUserName = null;
  setToLogin();
}

function setToMain(){
  getUserdata((success)=>{
    if(success){
      var versionDisplay = document.getElementById("version");
      fs.readFile(__dirname+'/../Game/version.txt', 'utf8', (fileErr, data) => {
        if(!fileErr){
          versionDisplay.textContent = data;
        }
      });
      var loginscreen = document.getElementById("loginscreen");
      var mainscreen = document.getElementById("mainscreen");
      var usernamedisplay = document.getElementById("usernamedisplay");
      var usericondisplay = document.getElementById("currentusericon");
      usernamedisplay.textContent = currentUserName;
      loginscreen.style.display = "none";
      mainscreen.style.display = "block";
      setInterval(()=>{
        checkUpdates();
      }, 60000);
      checkUpdates();
      getUserIcon(currentUserName, (done, loc)=>{
        if(done){
          currentusericon.src=loc;
        }else{
          console.log("NOTDONE");
        }
      })
    }else{
      setToLogin();
    }
  });

}

function quitPress(){
  ipcRenderer.send("appcontrol", "quit");
  process.quit();
}

function launch(){
  const game = spawn("", ["172.23.189.179", "-username="+currentUserName, "-token="+token], {detached: true});
  game.on("close", ()=>{
    toggleLaunch(true);
  });
}

function toggleLaunch(bool){
  var launch = document.getElementById("launchbutton");
  var running = document.getElementById("gamerunning");
  if(bool){
    running.style.display = "none";
    launch.style.display = "block";
  }else{
    launch.style.display = "none";
    running.style.display = "block";
  }
}

function checkUpdates(){
  let currentVersion = null;
  let fullDL = true;
  fs.readFile(__dirname+'/../Game/version.txt', 'utf8', (fileErr, data) => {
    if(!fileErr){
      currentVersion = parseFloat(data.replace(/[^0-9]/gi, ''));
    }else{
      currentVersion = -1;
    }
    request.get("https://git.jusola.cf/api/v1/repos/porkposh/Everlost/releases", (err, httpResponse, body)=>{
      if(!err){
        let parsedBody = JSON.parse(body);
        parsedBody = parsedBody.filter((elem)=>{
          if(clientConfig.preRelease){
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
                if(elem.name.includes(clientConfig.platform)){
                  if(!fullDL){
                    if(elem.name.includes(clientConfig.platform) && elem.name.toLowerCase().includes("update")){
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
              setToUpdate(parsedBody[0].tag_name);
            }else{
              gameIsUpdated(false);
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

function setToUpdate(version){
  var launchbutton = document.getElementById("launchbutton");
  var updatecheck = document.getElementById("updatecheck");
  var updatebar = document.getElementById("updatebar");
  var progress = document.getElementById("updateprogress");
  var updating = document.getElementById("updating");
  var loadingBar = document.getElementById("loadingbar");
  var updatebutton= document.getElementById("updatebutton");
  updating.style.display = "block";
  progress.style.display = "none";
  updatebar.style.display = "none";
  updatecheck.style.display = "none";
  launchbutton.style.display = "none";
  loadingBar.style.display = "none";
  updatebutton.style.display = "block";
  updating.textContent = "Update available: "+version;
}

function getUpdateURL(cb){
  let currentVersion = null;
  let fullDL = true;
  fs.readFile(__dirname+'/../Game/version.txt', 'utf8', (fileErr, data) => {
    if(!fileErr){
      currentVersion = parseFloat(data.replace(/[^0-9]/gi, ''));
    }else{
      currentVersion = -1;
    }
    request.get("https://git.jusola.cf/api/v1/repos/porkposh/Everlost/releases", (err, httpResponse, body)=>{
      if(!err){
        let parsedBody = JSON.parse(body);
        parsedBody = parsedBody.filter((elem)=>{
          if(clientConfig.preRelease){
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
                if(elem.name.includes(clientConfig.platform)){
                  if(!fullDL){
                    if(elem.name.includes(clientConfig.platform) && elem.name.toLowerCase().includes("update")){
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

              cb(true, parsedBody2[0].browser_download_url, parsedBody2[0].size, parsedBody[0].tag_name);
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


function updatePressed(){
  getUpdateURL((isAvail, url, size, toVersion)=>{
    if(isAvail){
      updateGame(url,size, toVersion);
    }
  });
}

function updateGame(url, size, version){
  var updateButton = document.getElementById("updatebutton");
  var updatebar = document.getElementById("updatebar");
  var progressText = document.getElementById("updateprogress");
  var updatecheck = document.getElementById("updatecheck");
  var loadingBar = document.getElementById("loadingbar");
  var updating = document.getElementById("updating");
  updating.style.display = "block";
  updateButton.style.display = "none";
  updatecheck.style.display = "none";
  loadingBar.style.display = "none";
  progressText.style.display = "block";
  updatebar.style.display = "block";
  console.log(version);
  updating.textContent = "Updating to: "+version;
  let currentdl = download(url);
  let lastProgress = null;
  currentdl.pipe(unzip.Extract({ path: 'Game/' }));
  currentdl.on('downloadProgress', (progress)=>{
    let progressPercent = progress.transferred / size * 100 + "%";
    let progressPercentDisplay = (progress.transferred / size * 100).toFixed(0) + "%";
    updatebar.style.width = progressPercent;
    if (lastProgress != progressPercentDisplay) {
      console.log(progressPercentDisplay);
      progressText.textContent = "Downloading: "+progressPercentDisplay;
    }
    lastProgress = progressPercentDisplay;
  })
  currentdl.on('end', ()=>{
    updatebar.style.display="none";
    loadingBar.style.display = "block";
    progressText.textContent = "Unpacking";
    console.log('update complete');
    gameIsUpdated(true, version);
  })
}

function gameIsUpdated(bUpdated, version){
  var launchbutton = document.getElementById("launchbutton");
  var updatecheck = document.getElementById("updatecheck");
  var updatebar = document.getElementById("updatebar");
  var progress = document.getElementById("updateprogress");
  var updating = document.getElementById("updating");
  var loadingBar = document.getElementById("loadingbar");
  var updatebutton= document.getElementById("updatebutton");
  var versionDisplay = document.getElementById("version");
  if(bUpdated){
    versionDisplay.textContent = version;
  }
  updatebutton.style.display = "none";
  updating.style.display = "none";
  progress.style.display = "none";
  updatebar.style.display = "none";
  updatecheck.style.display = "none";
  launchbutton.style.display = "block";
  loadingBar.style.display = "none";
  if(bUpdated){
    fs.writeFile(__dirname+'/../Game/version.txt', version, (err)=>{
      console.log(err);
    });
  }

}
