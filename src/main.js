import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

new Vue({
  name: "root",//给组件一个表示
  router,
  store,
  render: h => h(App)
}).$mount('#app')
