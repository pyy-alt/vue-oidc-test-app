<!--
 Copyright (c) 2025 zdb
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->
<template>
  <div id="app-container">
    <h1>Vue 2.0 OIDC 测试应用</h1>

      <h2>用户注册</h2>
      <div class="input-group">
        <label for="reg-username">用户名:</label>
        <input type="text" id="reg-username" v-model="regUsername" placeholder="注册用户名" />
      </div>
      <div class="input-group">
        <label for="reg-email">邮箱:</label>
        <input type="email" id="reg-email" v-model="regEmail" placeholder="注册邮箱" />
      </div>
      <div class="input-group">
        <label for="reg-password">密码:</label>
        <input type="password" id="reg-password" v-model="regPassword" placeholder="注册密码" />
      </div>
      <div class="input-group">
        <label for="reg-confirm-password">确认密码:</label>
        <input type="password" id="reg-confirm-password" v-model="regConfirmPassword" placeholder="再次输入密码" />
      </div>

      <button @click="handleRegister" class="btn primary">注册</button>

      <p v-if="registerMessage" class="success-message">{{ registerMessage }}</p>
      <p v-if="registerError" class="error-message">{{ registerError }}</p>
  </div>
</template>

<script>
import axios from 'axios';

const MY_SECURE_WEB_API_URL = 'http://localhost:5004';

export default {
  name: 'Register-Page',
  data () {
    return {
      isAuthenticated: false,
      username: '',
      password: '',
      errorMessage: '',
      userProfile: {},
      tokenExpirationTimer: null,
      tokenExpirationRemaining: 0,
      apiResponse: '',
      apiError: '',

      // 注册相关数据
      regUsername: '',
      regEmail: '',
      regPassword: '',
      regConfirmPassword: '',
      registerMessage: '', // 注册成功消息
      registerError: '',   // 注册失败错误
    };
  },
  mounted () {
    this.checkAuthenticationStatus();
  },
  beforeDestroy () {
    if (this.tokenExpirationTimer) {
      clearInterval(this.tokenExpirationTimer);
    }
  },
  methods: {
    // ... (decodeJwt, checkAuthenticationStatus, updateTokenExpiration, handleLogin, callApi, logout 方法不变) ...

    // 新增的注册方法
    async handleRegister () {
      this.registerMessage = '';
      this.registerError = '';

      if (this.regPassword !== this.regConfirmPassword) {
        this.registerError = '密码和确认密码不匹配。';
        return;
      }

      try {
        const response = await axios.post(
          `${MY_SECURE_WEB_API_URL}/api/AuthProxy/register`, // 调用 MySecureWebApi 的注册代理
          {
            username: this.regUsername,
            email: this.regEmail,
            password: this.regPassword,
            confirmPassword: this.regConfirmPassword,
          }
        );

        this.registerMessage = response.data.message || '用户注册成功！';
        console.log('注册成功:', response.data);

        // 清空注册表单
        this.regUsername = '';
        this.regEmail = '';
        this.regPassword = '';
        this.regConfirmPassword = '';

        // 可选：注册成功后自动登录
        // this.username = this.regUsername;
        // this.password = this.regPassword;
        // await this.handleLogin();

      } catch (error) {
        console.error('注册失败:', error.response ? error.response.data : error.message);
        this.registerError = error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : '注册失败，请稍后再试。';
        // 如果后端返回了详细的ModelState错误，可以进一步解析显示
        if (error.response && error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors;
          for (const key in errors) {
            if (Object.prototype.hasOwnProperty.call(errors, key)) {
              this.registerError += `\n${errors[key].join(', ')}`;
            }
          }
        }
      }
    },
  },
};
</script>

<style scoped>
/* ... (CSS 样式不变，可以添加一些 .success-message 的样式) ... */
.success-message {
  color: #28a745;
  margin-top: 15px;
  font-weight: bold;
}
</style>