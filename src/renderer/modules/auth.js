import net from '@/modules/net'
import store from '@/modules/store'

import ElectronStore from 'electron-store'
import aes256 from 'aes256'
import keytar from 'keytar'

class Auth {
  setPassword = async newPassword => {
    return keytar.setPassword('everlost', net.getUserID(), newPassword)
  }

  getPassword = async () => {
    return keytar.getPassword('everlost', net.getUserID())
  }
}

export default new Auth()
