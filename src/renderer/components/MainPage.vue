<script>
import store from '@/modules/store'
import backend from '@/modules/backend'
import auth from '@/modules/auth'

import Updater from '@/components/MainPage/Updater'

export default {
  name: 'MainPage',
  components: { Updater },
  data () {
    return {
      loading: false,
      store: store.state,
      error: null,
      isActive: true
    }
  },
  lists: {listid: '1234', listname: 'Example'},
  mounted: function () {
    console.log('Mounted')
    this.$nextTick(() => {
      backend.initialLoad()
    })
  },
  methods: {
    open (link) {
      this.$electron.shell.openExternal(link)
    }
  }
}
</script>

<template>
  <div class="columns is-fullheight">
    <b-loading
      :active="store.loading !== 0"
      :is-full-page="true"
      :can-cancel="false"
    />
    <div class="column is-one-quarter has-background-black-ter has-text-light">
      <Updater />
    </div>
  </div>
</template>

<style></style>
