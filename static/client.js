const {ipcRenderer} = require('electron');
const spawn = require('child_process').spawn;

function setToRegister(){
  var registerDiv = document.getElementById("registerbox");
  var loginDiv = document.getElementById("loginbox");

  registerDiv.style.display = "block";
  loginDiv.style.display = "none";
}

function setToLogin(){
  var registerDiv = document.getElementById("registerbox");
  var loginDiv = document.getElementById("loginbox");

  registerDiv.style.display = "none";
  loginDiv.style.display = "block";
}

function registerAccount(){
  var username = document.getElementById("username_R").value;
  var email = document.getElementById("email_R").value;
  var password = document.getElementById("password_R").value;
}

function login(){
  var username = document.getElementById("username_L").value;
  var password = document.getElementById("password_L").value;

  setToMain();
}

function setToMain(){
  var loginscreen = document.getElementById("loginscreen");
  var mainscreen = document.getElementById("mainscreen");
  loginscreen.style.display = "none";
  mainscreen.style.display = "block";
}

function quitPress(){
  ipcRenderer.send("appcontrol", "quit");
  process.quit();
}

function launch(){
  const process = spawn("E:/EpicGames/UE_4.21/Engine/Binaries/Win64/UE4Editor.exe", ["E:/Projects/Everlost/Everlost.uproject", "-game", "-log", "-nosteam"], {detached: true});
  process.unref();
}
