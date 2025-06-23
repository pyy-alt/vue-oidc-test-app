<template>
  <div id="app-container">
    <h1>Vue 2.0 OIDC 测试应用</h1>

    <div v-if="!isAuthenticated" class="auth-section login-form">
      <p>您尚未登录。</p>
      
      <div class="input-group">
        <label for="username">用户名:</label>
        <input type="text" id="username" v-model="username" placeholder="请输入用户名" />
      </div>
      <div class="input-group">
        <label for="password">密码:</label>
        <input type="password" id="password" v-model="password" placeholder="请输入密码" />
      </div>
      
      <button @click="handleLogin" class="btn primary">登录</button>
      <button @click="register" class="btn primary">注册</button>

      
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>

    <div v-else class="auth-section">
      <p>欢迎，**{{ userProfile.name || userProfile.sub }}**！</p>
      <p>角色: <span v-if="userProfile.role">{{ Array.isArray(userProfile.role) ? userProfile.role.join(', ') : userProfile.role }}</span> <span v-else>无</span></p>
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
import axios from 'axios';
import { Buffer } from 'buffer'; // 用于解码 Base64 字符串，需要安装 buffer 包
// npm install buffer

// 替换为 MySecureWebApi 的实际地址
const MY_SECURE_WEB_API_URL = 'http://localhost:5004'; 

export default {
  name: 'Home-Page', // 通常首页组件命名为 Home 或 Index
  data() {
    return {
      isAuthenticated: false,
      username: '',
      password: '',
      errorMessage: '',
      userProfile: {}, // 用于存储从 ID Token 解析出的用户数据
      tokenExpirationTimer: null, // 定时器句柄
      tokenExpirationRemaining: 0, // 剩余有效期秒数
      apiResponse: '',
      apiError: '',
    };
  },
  mounted() {
    // 组件挂载时检查本地存储是否有Token，如果有则尝试恢复认证状态
    this.checkAuthenticationStatus();
  },
  beforeDestroy() {
    // 组件销毁前清除定时器，防止内存泄漏
    if (this.tokenExpirationTimer) {
      clearInterval(this.tokenExpirationTimer);
    }
  },
  methods: {
    register(){
      this.$router.push('/register');
    },
    // JWT 解码辅助函数
    decodeJwt(token) {
      if (!token) return {};
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }
        const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(decoded);
      } catch (e) {
        console.error('Error decoding JWT:', e);
        return {};
      }
    },

    // 检查本地存储中的Token，并更新认证状态
    checkAuthenticationStatus() {
      const accessToken = localStorage.getItem('accessToken');
      const idToken = localStorage.getItem('idToken');

      if (accessToken && idToken) {
        this.isAuthenticated = true;
        this.userProfile = this.decodeJwt(idToken); // 解析ID Token获取用户Profile

        // 设置Token过期时间监控
        const decodedAccessToken = this.decodeJwt(accessToken);
        if (decodedAccessToken && decodedAccessToken.exp) {
          const expirationTime = decodedAccessToken.exp * 1000; // exp 是 Unix timestamp (秒)，转为毫秒
          this.updateTokenExpiration(expirationTime);
        } else {
          this.tokenExpirationRemaining = 0;
        }

        // 登录成功后，如果已经在首页，直接调用API
        // 确保您在路由配置中正确设置了 / 为此组件
        if (this.$router && this.$router.currentRoute.path === '/') {
            this.callApi(); // 自动调用一次API
        }

      } else {
        this.isAuthenticated = false;
        this.userProfile = {};
        this.tokenExpirationRemaining = 0;
        this.apiResponse = '';
        this.apiError = '';
        if (this.tokenExpirationTimer) {
          clearInterval(this.tokenExpirationTimer);
          this.tokenExpirationTimer = null;
        }
      }
    },

    // 更新Token过期时间剩余秒数
    updateTokenExpiration(expirationTime) {
      if (this.tokenExpirationTimer) {
        clearInterval(this.tokenExpirationTimer);
      }

      this.tokenExpirationTimer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));
        this.tokenExpirationRemaining = remaining;

        if (remaining === 0) {
          clearInterval(this.tokenExpirationTimer);
          this.tokenExpirationTimer = null;
          console.warn('Access Token 已过期。');
          // TODO: 这里可以触发自动刷新Token或者强制用户重新登录
          // 为了简化，这里只是登出
          this.logout(); 
        }
      }, 1000); // 每秒更新一次
    },

    async handleLogin() {
      this.errorMessage = ''; 
      this.apiResponse = ''; // 清除之前的API响应和错误
      this.apiError = '';

      try {
        const response = await axios.post(
          `${MY_SECURE_WEB_API_URL}/api/AuthProxy/login`, 
          {
            username: this.username,
            password: this.password
          }
        );

        const { accessToken, idToken, refreshToken } = response.data;
        console.log('登录成功！');
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('idToken', idToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }

        this.isAuthenticated = true; // 更新认证状态
        this.userProfile = this.decodeJwt(idToken); // 解析用户Profile

        const decodedAccessToken = this.decodeJwt(accessToken);
        if (decodedAccessToken && decodedAccessToken.exp) {
          const expirationTime = decodedAccessToken.exp * 1000;
          this.updateTokenExpiration(expirationTime); // 启动过期时间监控
        }
        
        // 登录成功后，直接调用受保护API
        await this.callApi(); 

        // 清除用户名和密码输入框
        this.username = '';
        this.password = '';
        this.errorMessage = ''; // 清除登录错误消息

        // 如果当前路由不是首页，则跳转到首页 (如果需要)
        if (this.$router && this.$router.currentRoute.path !== '/') {
            this.$router.push('/'); 
        }

      } catch (error) {
        console.error('登录失败:', error.response ? error.response.data : error.message);
        this.errorMessage = error.response && error.response.data && error.response.data.message
                            ? error.response.data.message 
                            : '登录失败，请检查用户名和密码。';
        this.isAuthenticated = false; // 登录失败，确保认证状态为未认证
        this.userProfile = {};
        this.tokenExpirationRemaining = 0;
        this.apiResponse = '';
        this.apiError = '';
        if (this.tokenExpirationTimer) {
          clearInterval(this.tokenExpirationTimer);
          this.tokenExpirationTimer = null;
        }
      }
    },
    async logout() {
      // 1. 获取要发送给后端代理的 Token
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      // ID Token通常用于本地信息解析或 end_session_endpoint 的 id_token_hint，不用于 revoke
      // const idToken = localStorage.getItem('idToken'); 

      // 2. 本地清理 Token (重要：无论后端代理调用结果如何，先清理本地，确保前端状态立即更新)
      // localStorage.removeItem('accessToken');
      // localStorage.removeItem('idToken');
      // localStorage.removeItem('refreshToken');
      localStorage.clear();
      
      this.isAuthenticated = false;
      this.userProfile = {};
      this.tokenExpirationRemaining = 0;
      this.apiResponse = '';
      this.apiError = '';

      if (this.tokenExpirationTimer) {
        clearInterval(this.tokenExpirationTimer);
        this.tokenExpirationTimer = null;
      }

      console.log('用户已登出，清除本地Token。');

      // 3. 调用 MySecureWebApi 的登出代理端点，让其负责撤销 IdentityServer 上的 Token
      try {
        await axios.post(`${MY_SECURE_WEB_API_URL}/api/AuthProxy/logout`, {
          accessToken: accessToken,  // 可以发送 access_token
          refreshToken: refreshToken // 也可以发送 refresh_token，MySecureWebApi 会根据逻辑处理
        });
        console.log('已请求 MySecureWebApi 代理执行后端Token撤销。');
      } catch (error) {
        console.error('调用 MySecureWebApi 登出代理失败:', error.response ? error.response.data : error.message);
        // 即使代理调用失败，本地也已登出，所以可以继续执行页面跳转
      } finally {
        // 4. 最终跳转回首页（登录界面）
        if (this.$router && this.$router.currentRoute.path !== '/') {
            this.$router.replace('/'); 
        }else{
          console.log('已跳转到首页。');
        }
      }
    },

    async callApi() {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        this.apiError = '没有Access Token，请先登录。';
        this.apiResponse = '';
        return;
      }
      try {
        const response = await axios.get(`${MY_SECURE_WEB_API_URL}/WeatherForecast`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        this.apiResponse = JSON.stringify(response.data, null, 2);
        this.apiError = ''; 
      } catch (error) {
        console.error('调用 API 失败:', error.response ? error.response.data : error.message);
        this.apiError = JSON.stringify(error.response ? error.response.data : error.message, null, 2);
        this.apiResponse = ''; 
        // 如果是 401 Unauthorized，可能意味着 Token 过期或无效
        if (error.response && error.response.status === 401) {
            this.errorMessage = '会话已过期，请重新登录。';
            this.logout(); // 强制登出
        }
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
  display: flex;
  justify-content: center;
  align-items: center;
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

.login-form {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.input-group {
  margin-bottom: 15px;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.input-group input[type="text"],
.input-group input[type="password"] {
  width: calc(100% - 22px); /* 减去 padding 和 border */
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.error-message {
  color: #dc3545;
  margin-top: 15px;
  font-weight: bold;
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