const {ipcRenderer} = require('electron');
const {dialog} = require('electron').remote;
const {spawn, execFile} = require('child_process');
const request = require('request');
const https = require('https');
var CryptoJS = require("crypto-js");
https.globalAgent.options.ca = require('ssl-root-cas/latest').create();
const serverUrl = "https://everlost.jusola.cf/";
const updateFile = "";
var token = null;
var installLoc = "";
var updateInterval = null;
var currentUserName;
const download = require('download');
const fs = require('fs');
const unzip = require('unzip');
var configContent = fs.readFileSync("config.json");
const config = JSON.parse(configContent);
if(config.installLoc){
  installLoc = config.installLoc;
}
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
  request.get({url: serverUrl+"getusericon", form: {username: usernameToGet}, encoding: null}, (err,httpResponse,body)=>{
    if(!err && body){
      fs.writeFile("cache/icon/"+usernameToGet+".png", body, (err)=>{
        if(!err){
          cb(true, "cache/icon/"+usernameToGet+".png");
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
  var servererr = document.getElementById("servererr_L");
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
        servererr.style.display = "block";
        setTimeout(()=>{
          servererr.style.display="none";
        }, 7500);
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
      var versionDisplay = document.getElementById("version");
      fs.readFile('Game/version.txt', 'utf8', (fileErr, data) => {
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
      var settingsModal = document.getElementById('settingsModal');
      updateInterval = setInterval(()=>{
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

function checkUpdates(){
  gameUpdater.writeValidVersion();
  gameUpdater.getUpdates((avail, urls, size, version)=>{
    if(avail){
      console.log("avail, "+version)
      setToUpdate(version);
    }else{
      gameIsUpdated(false, version);
    }
  })

}

function quitPress(){
  ipcRenderer.send("appcontrol", "quit");
  process.quit();
}

function launch(){
  const game = execFile("Game/Everlost.exe", ["mainmenu", "-username="+currentUserName, "-token="+token], {detached: true});
  toggleLaunch(false);
  game.on("close", ()=>{
    toggleLaunch(true);
    console.log("Game closed");
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




function updatePressed(){
  clearInterval(updateInterval);
  gameUpdater.getUpdates((isAvail, urls, size, toVersion)=>{
    if(isAvail){
      console.log("updategame: "+toVersion)
      updateGame(urls,size, toVersion);
    }else{
      console.log("noAvail-UPDATE");
      setToMain();
    }
  });
}

function updateGame(urls ,size, toVersion){
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
  updating.textContent = "Updating to: "+toVersion;
  let lastProgress = null;
  gameUpdater.updateGame(urls, size, toVersion, (error, version)=>{
    if(!error){
      gameIsUpdated(true, version);
    }
  }, (uprogress, uprogressdisp)=>{

      updatebar.style.width = uprogress;
      if (lastProgress != uprogressdisp) {
        progressText.textContent = "Downloading: "+uprogressdisp;
      }
      lastProgress = uprogressdisp;
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
    fs.writeFile('Game/version.txt', version, (err)=>{
      console.log(err);
    });
    gameUpdater.writeValidVersion();
  }

}



//settingsModal


// When the user clicks the button, open the modal


function openSettings(){
  var settingsModal = document.getElementById('settingsModal');
  if(settingsModal.classList.contains('fadedout')){
    settingsModal.classList.remove('fadedout');
  }
  settingsModal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal


// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  var settingsModal = document.getElementById('settingsModal');
  if (event.target == settingsModal) {
    closeSettings();
  }
}

function closeSettings(){
  var settingsModal = document.getElementById('settingsModal');
  settingsModal.classList.add('fadedout');
}
