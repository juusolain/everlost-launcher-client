const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { autoUpdater } = require("electron-updater");

let win

autoUpdater.checkForUpdatesAndNotify()

function createWindow() {
  win = new BrowserWindow({ width: 1440, height: 810, autoHideMenuBar: true, backgroundColor: "#2C2F33", show: false, resizable: false, frame: false, icon:'build/icon.png', webPreferences: {devTools: true}});

  win.loadFile('static/index.html');

  win.once('ready-to-show', () => {
    win.show();
  });

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
