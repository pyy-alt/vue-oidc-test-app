import Vue from 'vue'
import App from './App.vue'
import router from './router'; // 1. 确保正确导入您的 router 实例

Vue.config.productionTip = false

new Vue({
  router, // 2. 这里是关键！将 router 实例注入到 Vue 根实例中
  render: h => h(App),
}).$mount('#app')
