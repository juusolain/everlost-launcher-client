<script>
import net from '@/modules/net'
import store from '@/modules/store'
import backend from '@/modules/backend'

export default {
  data () {
    return {
      username: '',
      password: '',
      store: store.state,
      error: ''
    }
  },
  methods: {
    async submit () {
      const returnError = await backend.login(this.username, this.password)
      this.username = ''
      this.password = ''
      if (returnError) {
        this.error = returnError
      }
    }
  }
}
</script>

<template>
  <div class="columns is-fullheight is-centered is-vcentered">
    <div
      class="is-login column is-half is-vcentered"
      @keyup.enter="submit"
    >
      <b-loading
        :active="store.loading !== 0"
        :is-full-page="true"
        :can-cancel="false"
      />
      <div
        v-if="error"
        class="error"
      >
        {{ error }}
      </div>
      <b-field>
        <b-input
          v-model="username"
          type="text"
          placeholder="Username"
          required
        />
      </b-field>
      <b-field>
        <b-input
          v-model="password"
          type="password"
          placeholder="Password"
          required
        />
      </b-field>
      <b-button
        expanded
        type="is-primary"
        @click="submit"
      >
        Login
      </b-button>
    </div>
  </div>
</template>

<style></style>
