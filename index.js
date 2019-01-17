const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const request = require('request');
const currentVersion = app.getVersion();
let win

console.log(currentVersion)

function createWindow() {
  win = new BrowserWindow({ width: 1440, height: 810, autoHideMenuBar: true, backgroundColor: "#2C2F33", show: false, resizable: false, frame: false, icon:'build/icon.png', webPreferences: {devTools: true, nodeIntegration: true}});

  win.loadFile('index.html');

  win.once('ready-to-show', () => {
    win.show();
    win.webContents.openDevTools();
  });

  //checkForUpdates();
  //win.on('closed', () => {
    //win = null;
  //})
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  app.quit();
})

ipcMain.on("appcontrol", (event, action)=>{
  if(action == "quit"){
    //win.close();
    app.quit();
  }else if(action == "minimize"){
    win.minimize();
  }
})

function checkForUpdates(){
  request.get({url: "https://api.github.com/repos/jusola/everlost-launcher-client/releases/latest"},  (err,httpResponse,body)=>{
    if(!err){
      let elembody = JSON.parse(body);
      if(elembody){
        let newVersion = elembody.name.search(/[^0-9]./gi);
        if(newVersion != currentVersion){
          notifyUpdates(elembody.url);
        }
      }
    }
  });
}

function notifyUpdates(url){
  win.webContents.send('clientupdate', url);
}
