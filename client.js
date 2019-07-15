const {ipcRenderer} = require('electron');
const {dialog} = require('electron').remote;
const child_process = require('child_process');
const request = require('request');
const https = require('https');
var CryptoJS = require("crypto-js");
https.globalAgent.options.ca = require('ssl-root-cas/latest').create();
const serverUrl = "https://everlost.jusola.cf/server/";
const updateFile = "";
var token = null;
var installLoc = "";
var updateInterval = null;
var currentUserName;
const download = require('download');
const path = require('path');
const fs = require('fs');
const unzip = require('unzipper');
var configContent;
var config;
var gameRunning = false;
var rootdir;
/*if(process.env.PORTABLE_EXECUTABLE_DIR){
  rootdir = process.env.PORTABLE_EXECUTABLE_DIR;
}else{
  rootdir = __dirname;
}*/
rootdir = require('electron-root-path').rootPath;

console.log(rootdir);

try {
  configContent = fs.readFileSync("config.json");
  config = JSON.parse(configContent);
} catch (err) {
  fs.copyFileSync("defaultconfig.json", "config.json");
  configContent = fs.readFileSync("config.json");
  config = JSON.parse(configContent);
  config.gameInstallLoc = rootdir+path.sep;
  saveSettingsSync();
}
if(config.gameInstallLoc == null || !config.platform){
  config.gameInstallLoc = rootdir+path.sep;
  config.preRelease = false;
  config.platform = "Win64";
  saveSettingsSync();
}
config.devServerIP = "172.23.189.190"; //Constant IP for dev server - easier testing
const gameUpdater = require("./gameupdater.js");

window.onload = function(){
  var settingsModal = document.getElementById('settingsModal');
  settingsModal.addEventListener('animationend', function() {
    if (this.classList.contains('fadedout')) {
      this.style.display = 'none';
      this.classList.remove('fadedout')
    }
  });
}

var defaultClientConfig = {
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
  var noavail = document.getElementById("accountnoavail");
  var servererr = document.getElementById("servererr_R");
  var password = document.getElementById("password_R").value;
  var encryptedPW = CryptoJS.SHA256(password).toString();
  request.get({url: serverUrl+"register", form: {username: username, password: encryptedPW, email: email}}, (err,httpResponse,body)=>{
    if(!err){
      let elembody = JSON.parse(body);
      if(!elembody.error){
          setToMain();
          token = elembody.token;
          console.log(token);
      }else if (elembody.error="NOAVAIL"){
        console.log(err);
        noavail.style.display = "block";
        setTimeout(()=>{
          noavail.style.display="none";
        }, 7500);
      }else{
        console.log(elembody.error);
        servererr.style.display = "block";
        setTimeout(()=>{
          servererr.style.display="none";
        }, 7500);
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
  request.get({url: serverUrl+"getusericon", form: {username: usernameToGet}, encoding: null, timeout: 5000}, (err,httpResponse,body)=>{
    if(!err && body){
      fs.stat(rootdir+path.sep+"cache"+path.sep+"icon", (dirNotExist)=>{
        if(dirNotExist){
          fs.mkdir(rootdir+path.sep+"cache", { recursive: true }, (err2) => {
            if(err2){
              console.log(err2);
            }
            fs.mkdir(rootdir+path.sep+"cache"+path.sep+"icon", { recursive: true }, (err3) => {
              if(err3){
                console.log(err3);
              }
              fs.writeFile(rootdir+path.sep+"cache"+path.sep+"icon"+path.sep+usernameToGet+".png", body, (err)=>{
                if(!err){
                  cb(true, rootdir+path.sep+"cache"+path.sep+"icon"+path.sep+usernameToGet+".png");
                }else{
                  console.log(err);
                  cb(false);
                }
              });
            });
          });
        }else{
          fs.writeFile(rootdir+path.sep+"cache"+path.sep+"icon"+path.sep+usernameToGet+".png", body, (err)=>{
            if(!err){
              cb(true, rootdir+path.sep+"cache"+path.sep+"icon"+path.sep+usernameToGet+".png");
            }else{
              console.log(err);
              cb(false);
            }
          })
        }
      })

    }
  })
}

function login(){
  var login = document.getElementById("username_L").value;
  var invalidacc = document.getElementById("invalidaccount");
  var servererr = document.getElementById("servererr_L");
  var password = document.getElementById("password_L").value;
  var encryptedPW = CryptoJS.SHA256(password).toString();
  request.get({url: serverUrl+"login", form: {login: login, password: encryptedPW, timeout: 5000}}, (err,httpResponse,body)=>{
    console.log(body);
    console.log(httpResponse);
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
        servererr.style.display = "block";
        setTimeout(()=>{
          servererr.style.display="none";
        }, 7500);
      }
    }else{
      console.log(err);
      servererr.style.display = "block";
      setTimeout(()=>{
        servererr.style.display="none";
      }, 7500);
    }

  })
}

function logout(){
  token = null;
  currentUserName = null;
  setToLogin();
}

function setToMain(){
  var launchbutton = document.getElementById("launchbutton");
  var updatecheck = document.getElementById("updatecheck");
  var updatebar = document.getElementById("updatebar");
  var progress = document.getElementById("updateprogress");
  var updating = document.getElementById("updating");
  var loadingBar = document.getElementById("loadingbar");
  var updatebutton= document.getElementById("updatebutton");
  updating.style.display = "none";
  progress.style.display = "none";
  updatebar.style.display = "none";
  updatecheck.style.display = "none";
  loadingBar.style.display = "none";
  getUserdata((success)=>{
    if(success){
      checkUpdates();
      var versionDisplay = document.getElementById("version");

      var loginscreen = document.getElementById("loginscreen");
      var mainscreen = document.getElementById("mainscreen");
      var usernamedisplay = document.getElementById("usernamedisplay");
      var usericondisplay = document.getElementById("currentusericon");
      usernamedisplay.textContent = currentUserName;
      loginscreen.style.display = "none";
      mainscreen.style.display = "block";
      var settingsModal = document.getElementById('settingsModal');
      updateInterval = setInterval(()=>{
        checkUpdates();
      }, 300000);
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

function checkUpdates(cb){
  gameUpdater.getUpdates((avail, downloads, isFull)=>{
    if(avail){
      setToUpdate();
    }else{
      gameIsUpdated(true, null);
    }
  })

}

function quitPress(){
  ipcRenderer.send("appcontrol", "quit");
  process.quit();
}

function launch(){
  let launchOpts;
  if(config.devServer){
    launchOpts = [config.devServerIP+"//Game/Map/Planet/Planet?Name="+currentUserName, "-username="+currentUserName, "-token="+token, "-devServerIP="+config.devServerIP];
  }else{
    launchOpts = ["mainmenu", "-username="+currentUserName, "-token="+token, "-devServerIP="+config.devServerIP];
  }
  if(!gameRunning){
    console.log("!gameRunning");
    toggleLaunch(false);
    gameRunning = false;
    //checkUpdates((updateNeeded)=>{
      //if(!updateNeeded){
        gameRunning = true;
        const game = child_process.execFile(config.gameInstallLoc+"EverlostGame"+path.sep+"Everlost.exe", launchOpts, {detached: true}, (err)=>{
          console.log(err);
        });
        console.log(game);
        game.on("close", ()=>{
          gameRunning = false;
          toggleLaunch(true);
          console.log("Game closed");
        });
      //}else{
        //gameRunning = false;
        //toggleLaunch(true);
      //}
    //})
  }


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



function setToUpdate(){
  clearMainState();
  var updating = document.getElementById("updating");
  var updatebutton= document.getElementById("updatebutton");
  updating.style.display = "block";
  updatebutton.style.display = "block";
  updating.textContent = "Update available";
}




function updatePressed(){
  clearInterval(updateInterval);
  gameUpdater.getUpdates((isAvail, dlList, needsFull)=>{
    if(isAvail){
      clearMainState();
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
      updating.textContent = "Updating";
      console.log("updategame");
      gameUpdater.updateGame(dlList, needsFull, ()=>{
        gameIsUpdated(true, null);
      }, (uprogress, uprogressdisp)=>{
          updatebar.style.width = uprogress*100+"%";
          progressText.textContent = "Downloading: "+(uprogress * 100).toFixed()+"%, "+uprogressdisp;
        })
    }else{
      console.log("noAvail-UPDATE");
      setToMain();
    }
  });
}


function gameIsUpdated(bUpdated, version){
  clearMainState();
  if(!gameRunning){
    var launchbutton = document.getElementById("launchbutton");
    launchbutton.style.display = "block";
  }
  var versionDisplay = document.getElementById("version");
  if(bUpdated){
    versionDisplay.textContent = "Game: "+version;
  }
  if(bUpdated){
  }

}



//settingsModal


// When the user clicks the button, open the modal


function openSettings(){
  var settingsModal = document.getElementById('settingsModal');
  var gameinstall = document.getElementById('settings-installloc');
  var settingsPreRelease = document.getElementById('settingsPreRelease');
  if(settingsModal.classList.contains('fadedout')){
    settingsModal.classList.remove('fadedout');
  }
  settingsPreRelease.checked = config.preRelease;
  settingsModal.style.display = "block";
  gameinstall.textContent = config.gameInstallLoc;
}

// When the user clicks on <span> (x), close the modal


// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  var settingsModal = document.getElementById('settingsModal');
  if (event.target == settingsModal) {
    closeSettings();
  }
}

function togglePreRelease(){
  config.preRelease = settingsPreRelease.checked;
  saveSettings();
}

function closeSettings(){
  var settingsModal = document.getElementById('settingsModal');
  settingsModal.classList.add('fadedout');
}

function saveSettings(){
  fs.writeFile("config.json", JSON.stringify(config),(err)=>{
    if(err) console.log(err);
    checkUpdates();
  })
}
function saveSettingsSync(){
  try{
      fs.writeFileSync("config.json", JSON.stringify(config));
  } catch (err){
    console.log("Error: "+err);
  }
}


function selectInstallLoc(){
  var fileChooser = document.getElementById('installLocSelect');
  fileChooser.click();
}

function installLocChanged(){
  var fileChooser = document.getElementById('installLocSelect');
  config.gameInstallLoc = fileChooser.files[0].path;
  console.log(config.gameInstallLoc);
  var gameinstall = document.getElementById('settings-installloc');
  gameinstall.textContent = config.gameInstallLoc;
  saveSettings();
}

function setToNoConn_UpdateServer(){
  clearMainState()
  var noconnError  = document.getElementById("noconn_updateserver")
  noconnError.style.display = "block";
}

function clearMainState(){
  var launchbutton = document.getElementById("launchbutton");
  var updatecheck = document.getElementById("updatecheck");
  var updatebar = document.getElementById("updatebar");
  var progress = document.getElementById("updateprogress");
  var loadingBar = document.getElementById("loadingbar");
  var updatebutton= document.getElementById("updatebutton");
  var noconnError  = document.getElementById("noconn_updateserver")
  var updating = document.getElementById("updating");
  updatecheck.style.display = "none";
  updatebar.style.display = "none";
  updating.style.display = "none";
  progress.style.display = "none";
  launchbutton.style.display = "none";
  loadingBar.style.display = "none";
  updatebutton.style.display = "none";
  noconnError.style.display = "none";
}
