import Vue from 'vue'
import Router from 'vue-router'

import net from '@/modules/net'
import auth from '../modules/auth'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: require('@/components/Login').default,
      props: true
    },
    {
      path: '/main',
      name: 'Main',
      component: require('@/components/MainPage').default,
      props: true
    },
    {
      path: '/',
      name: 'redirect',
      redirect: to => {
        if (net.isLoggedIn()) {
          return {
            name: 'Main'
          }
        } else {
          return {
            name: 'Login'
          }
        }
      }
    }
  ],
  default: '/'
})

export default router
