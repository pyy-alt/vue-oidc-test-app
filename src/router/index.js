// Copyright (c) 2025 zdb
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// src/router/index.js
import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Callback from '../views/Callback.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/callback', // **必须与 Orchard Core 中配置的 Redirect URI 路径部分匹配**
    name: 'Callback',
    component: Callback
  },
  // 注册
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  }, 
  // 你可以添加更多路由
  {
    path: '/error', // 一个简单的错误页面，用于回调失败时
    name: 'Error',
    template: '<div><p>An error occurred during authentication. Please try again.</p></div>'
  },

  {
    path: '*', // 匹配所有未知路由，并重定向到主页
    redirect: '/'
  }
];

const router = new VueRouter({
  mode: 'history', // **推荐使用 history 模式，如果服务器不支持，会回退到 hash 模式**
  base: process.env.BASE_URL,
  routes
});

export default router;