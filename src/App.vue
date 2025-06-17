<template>
  <div id="app">
    <header class="app-header">
      <nav>
        <router-link to="/" class="nav-link">首页</router-link>
        </nav>
    </header>

    <main class="app-main">
      <router-view/>
    </main>

    <footer class="app-footer">
      <p>&copy; 2025 OIDC Test App</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
  // App.vue 通常不需要太多的数据或方法，因为它的主要作用是布局
  // 如果需要全局的用户状态或认证状态，通常会通过 Vuex (或简单的 provide/inject) 来管理
}
</script>

<style>
/* 全局样式 (会影响整个应用) */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f4f7f6;
  color: #333;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 确保 App 占据整个视口高度 */
}

.app-header {
  background-color: #007bff;
  color: white;
  padding: 15px 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header nav {
  display: flex;
  justify-content: flex-start;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 8px 15px;
  border-radius: 5px;
  transition: background-color 0.2s ease;
}

.nav-link:hover, .nav-link.router-link-exact-active {
  background-color: #0056b3;
}

.app-main {
  flex-grow: 1; /* 让主内容区域占据剩余空间 */
  padding: 20px;
}

.app-footer {
  text-align: center;
  padding: 15px;
  background-color: #e9ecef;
  color: #6c757d;
  font-size: 0.9em;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.05);
}
</style>