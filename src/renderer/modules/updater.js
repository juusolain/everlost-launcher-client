import fs from 'fs'
import path from 'path'
import sha1Sum from 'sha1-sum'
import ElectronStore from 'electron-store'
import asyncPool from 'tiny-async-pool'

import net from '@/modules/net'
import store from '@/modules/store'

import {remote, app} from 'electron'

const electronStore = new ElectronStore()

class Updater {
  constructor () {
    this.hashing = false
    this.checksums = new Map()
    this.updateList = []
    this.updateSize = 0
  }

    hashGame = async () => {
      const loc = await this.getInstallLocation()
      await this.hashDir(path.join(loc, 'EverlostGame') + path.sep)
      console.log('Should be complete')
    }

    queryInstallLoc = async () => {
      const res = await remote.dialog.showOpenDialog({
        title: 'Select install location',
        properties: ['openDirectory', 'createDirectory', 'promptToCreate']
      })
      if (res.canceled) {
        await this.queryInstallLoc()
      } else {
        electronStore.set('installLocation', res.filePaths[0])
        return res.filePaths[0]
      }
    }

    getInstallLocation = async () => {
      var installLoc = await electronStore.get('installLocation')
      if (!installLoc) {
        installLoc = await this.queryInstallLoc()
      }
      return installLoc
    }

    hashDir = async (dir, originalPath = dir) => {
      try {
        const readDir = fs.readdirSync(dir)
        for (var elem of readDir) {
          var fullPath = path.join(dir, elem)
          var filePath = fullPath.replace(originalPath, '')
          filePath = filePath.replace(/\\/g, '/')
          fullPath = fullPath.replace(/\\/g, '/')
          const stats = fs.statSync(fullPath)
          if (!stats.isFile()) {
            await this.hashDir(fullPath, originalPath)
          } else {
            const res = await sha1Sum(fullPath)
            this.checksums.set(filePath, res)
          }
        }
      } catch (error) {
        console.log(error)
      }
    }

    getUpdates = async () => {
      const serverData = await net.getUpdates()
      const serverChecksums = new Map(JSON.parse(serverData.serverChecksums))
      const serverFiles = Array.from(serverChecksums.keys())
      const localFiles = Array.from(this.checksums.keys())
      var downloadList = this.diffArrays(serverFiles, localFiles)
      this.matchArrays(serverFiles, localFiles).forEach((elem) => {
        if (serverChecksums.get(elem) !== this.checksums.get(elem)) {
          downloadList.push(elem)
        }
      })
      this.updateList = downloadList
      this.updateSize = serverData.size
      if (downloadList.length !== 0) {
        store.setUpdateStatus('available')
      } else {
        store.setUpdateStatus('finished')
      }
    }

    diffArrays = (arr1, arr2) => {
      var newArr = []
      arr1.forEach(function (val) {
        if (!arr2.includes(val)) newArr.push(val)
      })
      return newArr
    }

    matchArrays = (arr1, arr2) => {
      var newArr = []
      arr1.forEach(function (val) {
        if (arr2.indexOf(val) >= 0) newArr.push(val)
      })
      return newArr
    }

    updateGame = async () => {
      const list = this.updateList
      store.setTotalBytes(this.updateSize)
      store.setDownloadProgress(0)
      store.setUpdateStatus('downloading')
      console.log(`Downloading ${list.length} items`)
      await asyncPool(2, list, this.downloadItem)
      store.setUpdateStatus('finished')
    }

    downloadItem = async elem => {
      if (elem) {
        try {
          const loc = await this.getInstallLocation()
          var dlPath = path.join(loc, 'EverlostGame', elem)
          dlPath = dlPath.replace(/\\/g, '/')
          dlPath = dlPath.substr(0, dlPath.lastIndexOf('/'))
          const res = net.download(elem, dlPath)
          let lastTransferred = 0
          res.on('downloadProgress', progress => {
            store.addDownloadProgress(progress.transferred - lastTransferred)
            lastTransferred = progress.transferred
          })
          await res
          console.log('Finished this file')
        } catch (error) {
          console.error(error)
        }
      }
    }
}

export default new Updater()
