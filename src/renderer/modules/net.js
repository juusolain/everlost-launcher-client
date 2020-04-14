import ElectronStore from 'electron-store'
import jwtDecode from 'jwt-decode'
import axios from 'axios'
import download from 'download'

import { v4 as uuidv4 } from 'uuid'

import store from '@/modules/store'

const electronstore = new ElectronStore()

const server = process.env.NODE_ENV === 'development'
  ? 'https://everlost.jusola.tk:5001/'
  : 'https://everlost.jusola.tk:5001/'

const preRelease = process.env.NODE_ENV === 'development'

class Net {
  constructor () {
    this.server = server
    console.log(`New auth created with server ${this.server}`)
  }

  login = async (username, password) => {
    if (username && password) {
      try {
        const res = await this.post('/server/login', {
          data: {
            username: username,
            password: password
          }
        })
        if (res.data.success) {
          return res.data.token
        } else {
          return null
        }
      } catch (err) {
        throw new Error('netError')
      }
    } else {
      throw new Error('invalidQuery')
    }
  };

  getToken = () => {
    return electronstore.get('token')
  };

  setToken = newToken => {
    return electronstore.set('token', newToken)
  };

  isLoggedIn = () => {
    const token = this.getToken()
    if (token && !this.isExpired(token)) {
      return true
    } else {
      return false
    }
  };

  getUserID = () => {
    const token = this.getToken()
    const decodedJWT = jwtDecode(token)
    return decodedJWT.userid
  }

  logout = () => {
    this.setToken(null)
    return true
  };

  isExpired = token => {
    const decodedJWT = jwtDecode(token)
    if (decodedJWT.exp < Date.now() / 1000) {
      return true
    } else {
      return false
    }
  };

  post = async (apiAddress, options) => {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
    if (this.isLoggedIn()) {
      headers['Authorization'] = 'Bearer ' + this.getToken()
    }
    try {
      const res = await axios({
        baseURL: this.server,
        method: 'post',
        url: apiAddress,
        headers: headers,
        ...options
      })
      return res
    } catch (error) {
      return Promise.reject(error)
    }
  };

  get = async (apiAddress, options) => {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
    if (this.isLoggedIn()) {
      headers['Authorization'] = 'Bearer ' + this.getToken()
    }
    try {
      const res = await axios({
        baseURL: this.server,
        method: 'get',
        url: apiAddress,
        headers: headers,
        ...options
      })
      return res
    } catch (error) {
      return Promise.reject(error)
    }
  };

  getUpdates = async () => {
    const res = await this.get('/server/getupdates', {
      data: {
        preRelease: process.env.NODE_ENV === 'development'
      }
    })
    return res.data
  }

  download = (elem, dest, options) => {
    const relString = preRelease ? 'preRelease' : 'latest'
    const dlPath = server + relString + '/WindowsNoEditor/' + elem
    return download(dlPath, dest, options)
  }
}

export default new Net()
