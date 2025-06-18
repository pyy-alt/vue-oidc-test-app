<!--
 Copyright (c) 2025 zdb
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

<template>
  <div id="app-container">
    <h1>Vue 2.0 OIDC 测试应用</h1>

    <div v-if="!isAuthenticated" class="auth-section">
      <p>您尚未登录。</p>
      <button @click="login" class="btn primary">登录</button>
    </div>

    <div v-else class="auth-section">
      <p>欢迎，**{{ userProfile.name || userProfile.sub }}**！</p>
      <p>角色: <span v-if="userProfile.role">{{ userProfile.role.join(', ') }}</span> <span v-else>无</span></p>
      <p>Access Token 有效期：{{ tokenExpirationRemaining }} 秒</p>

      <button @click="callApi" class="btn secondary">调用受保护 API (WeatherForecast)</button>
      <button @click="logout" class="btn danger">登出</button>

      <div v-if="apiResponse" class="api-response">
        <h3>API 响应:</h3>
        <pre>{{ apiResponse }}</pre>
      </div>
      <div v-if="apiError" class="api-error">
        <h3>API 错误:</h3>
        <pre>{{ apiError }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import userManager from '@/auth/oidc'; // 引入 oidc manager
import axios from 'axios';

export default {
  name: 'Home-Page',
  data () {
    return {
      isAuthenticated: false,
      userProfile: {},
      apiResponse: null,
      apiError: null,
      tokenExpirationRemaining: 0,
      tokenRefreshInterval: null // 用于刷新令牌倒计时的计时器
    };
  },
  async created () {
    // 在组件创建时检查用户状态
    await this.checkUserStatus();

    // 每秒更新令牌有效期倒计时
    this.tokenRefreshInterval = setInterval(this.updateTokenExpiration, 1000);
  },
  beforeDestroy () {
    // 组件销毁前清除计时器
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
  },
  methods: {
    async checkUserStatus () {
      const user = await userManager.getUser();
      if (user && !user.expired) { // 检查用户是否存在且令牌未过期
        this.isAuthenticated = true;
        this.userProfile = user.profile;
        this.updateTokenExpiration(); // 立即更新一次
        console.log("Logged in user:", JSON.stringify(user));
      } else {
        this.isAuthenticated = false;
        this.userProfile = {};
        console.log("No user logged in or token expired.");
      }
    },
    async updateTokenExpiration() { // 修改为 async 方法，以便获取最新的 user 对象
    if (this.isAuthenticated) {
      const user = await userManager.getUser(); // 获取最新的 user 对象
      if (user && typeof user.expires_at === 'number') {
        const now = Math.floor(Date.now() / 1000); // 当前时间（秒）
        // 计算剩余时间
        this.tokenExpirationRemaining = Math.max(0, user.expires_at - now);
      } else {
        this.tokenExpirationRemaining = 0;
      }
    } else {
      this.tokenExpirationRemaining = 0;
    }
  },
    login () {
      // 重定向到认证中心进行登录
      userManager.signinRedirect();
    },
    async logout () {
      try {
        await userManager.signoutRedirect(); // 重定向到认证中心进行登出
        // 登出后 oidc-client 会清除本地存储的用户数据
        this.isAuthenticated = false;
        this.userProfile = {};
        this.apiResponse = null;
        this.apiError = null;
        this.tokenExpirationRemaining = 0;
        console.log("User logged out.");
      } catch (error) {
        console.error("Logout error:", error);
        this.apiError = `Logout Error: ${error.message}`;
      }
    },
    async callApi () {
      this.apiResponse = null;
      this.apiError = null;
      try {
        const currentUser = await userManager.getUser();
        if (currentUser && currentUser.access_token) {
          console.log("Calling API with token:", currentUser.access_token);
          const response = await axios.get('http://localhost:5004/WeatherForecast', { // **您的 MySecureWebApi 地址**
            headers: {
              Authorization: `Bearer ${currentUser.access_token}`
            }
          });
          this.apiResponse = JSON.stringify(response.data, null, 2);
        } else {
          this.apiResponse = '未认证，无法调用 API。请先登录。';
        }
      } catch (error) {
        console.error('API call failed:', error.response ? error.response.data : error.message);
        this.apiError = `API Error: ${error.response ? error.response.status + ': ' + JSON.stringify(error.response.data) : error.message}`;
      }
    }
  }
};
</script>

<style scoped>
#app-container {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  border: 1px solid #eee;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.auth-section {
  text-align: center;
  margin-bottom: 30px;
}

.btn {
  padding: 10px 20px;
  margin: 5px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.btn.primary {
  background-color: #007bff;
  color: white;
}

.btn.primary:hover {
  background-color: #0056b3;
}

.btn.secondary {
  background-color: #6c757d;
  color: white;
}

.btn.secondary:hover {
  background-color: #545b62;
}

.btn.danger {
  background-color: #dc3545;
  color: white;
}

.btn.danger:hover {
  background-color: #bd2130;
}

.api-response,
.api-error {
  margin-top: 20px;
  padding: 15px;
  border-radius: 5px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  overflow-x: auto;
}

.api-error {
  background-color: #fdd;
  border-color: #fbc;
  color: #a00;
}

pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>