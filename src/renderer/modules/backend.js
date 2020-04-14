import net from '@/modules/net'
import store from '@/modules/store'
import router from '@/router'
import auth from '@/modules/auth'
import updater from '@/modules/updater'

import { v4 as uuidv4 } from 'uuid'

class Backend {
    initialLoad = async () => {
      store.addLoading(1)
      await updater.hashGame()
      await updater.getUpdates()
      store.addLoading(-1)
    }

    login = async (username, password) => {
      try {
        store.addLoading(1)
        const token = await net.login(username, password)
        store.addLoading(-1)
        if (token !== null) {
          net.setToken(token)
          auth.setPassword(password)
          router.push('/')
          return null
        } else {
          return 'Supply both username and a password'
        }
      } catch (err) {
        console.error(err)
        return 'Internal error: ' + err.toString()
      }
    }

    logout = async () => {
      net.logout()
      store.setTasks([])
      store.setLists([])
      router.push('/')
    }

    updateGame = () => {
      return updater.updateGame()
    }
}

export default new Backend()
