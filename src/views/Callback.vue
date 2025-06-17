<!--
 Copyright (c) 2025 zdb
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

<template>
  <div class="callback-container">
    <h2>正在处理认证...</h2>
    <p>请稍候，您将被重定向。</p>
    <div class="spinner"></div>
  </div>
</template>

<script>
import userManager from '@/auth/oidc';

export default {
  name: 'Callback-Page',
  async created() {
    try {
      console.log('Callback page: Processing signinRedirectCallback...');
      await userManager.signinRedirectCallback(); // 处理重定向回调，获取令牌
      console.log('Callback successful. Redirecting to home.');
      this.$router.push('/'); // 认证成功后，重定向回首页
    } catch (error) {
      console.error('Authentication callback error:', error);
      // 处理错误，例如显示错误消息给用户
      this.$router.push({ name: 'Error', query: { message: error.message } }); // 跳转到错误页面并传递错误信息
    }
  }
};
</script>

<style scoped>
.callback-container {
  text-align: center;
  padding: 50px;
  font-family: Arial, sans-serif;
}
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #007bff;
  animation: spin 1s ease infinite;
  margin: 20px auto;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>