var store = {
  state: {
    downloadProgress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    updateStatus: 'checkingUpdates',
    loading: 0
  },
  addDownloadProgress (newBytes) {
    this.state.downloadedBytes += newBytes
    this.state.downloadProgress = this.state.downloadedBytes / this.state.totalBytes
  },
  setDownloadProgress (newBytes) {
    if (process.env.NODE_ENV === 'development') console.log(`Set progress: ${newBytes}`)
    this.state.downloadedBytes = newBytes
    this.state.downloadProgress = this.state.downloadedBytes / this.state.totalBytes
  },
  setTotalBytes (newTotalBytes) {
    if (process.env.NODE_ENV === 'development') console.log(`New total bytes: ${newTotalBytes}`)
    this.state.totalBytes = newTotalBytes
  },
  setUpdateStatus (newStatus) {
    if (process.env.NODE_ENV === 'development') console.log(`Setting update status: ${newStatus}`)
    this.state.updateStatus = newStatus
  },
  addLoading (newLoading) {
    if (process.env.NODE_ENV === 'development') console.log(`Adding loading: ${newLoading}`)
    this.state.loading += newLoading
  }
}

window.store = store

export default store
