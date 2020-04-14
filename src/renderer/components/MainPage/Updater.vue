<script>
import store from '@/modules/store'
import backend from '@/modules/backend'
import auth from '@/modules/auth'

export default {
  name: 'Updater',
  data () {
    return {
      loading: false,
      state: store.state,
      error: null
    }
  },
  lists: {listid: '1234', listname: 'Example'},
  mounted: function () {
    console.log('Mounted')
  },
  methods: {
    update () {
      backend.updateGame()
    }
  }
}
</script>

<template>
  <div>
    <div v-if="state.updateStatus === 'checkingUpdates'">
      Checking updates
    </div>
    <div v-if="state.updateStatus === 'downloading'">
      <b-progress
        :value="state.downloadProgress"
        :max="1"
      />
    </div>
    <div v-if="state.updateStatus === 'finished'">
      Update finished
    </div>
    <div v-if="state.updateStatus === 'available'">
      <button @click="update()">
        Update
      </button>
    </div>
  </div>
</template>

<style></style>
