// src/auth/oidc.js

// 对于 oidc-client v1.x.x，通常需要这样导入整个模块来访问其内部属性，包括 Log
import * as Oidc from 'oidc-client';

// 从导入的 Oidc 命名空间中获取 UserManager 和 WebStorageStateStore
const UserManager = Oidc.UserManager;
const WebStorageStateStore = Oidc.WebStorageStateStore;

// 从导入的 Oidc 命名空间中获取 Log 对象
const Log = Oidc.Log;
console.dir(Log.setLevel);

// 启用 oidc-client 的日志（开发时非常有用）
// Log.setLevel(Oidc.Log.DEBUG); // 使用 Oidc.Log.DEBUG 来设置级别 【没有找到此方法】

Log.level = Log.DEBUG; // 设置日志级别为 DEBUG。Log.DEBUG, Log.INFO, Log.WARN, Log.ERROR, Log.NONE 都是可用的常量。

Log.logger = console; // <--- **关键修改点：这里是 Log.logger = console**

const settings = {
  authority: 'http://localhost:5233/', // 您的 Orchard Core 认证中心地址
  client_id: 'mywebapi', // 您在 Orchard Core 中注册的客户端 ID
  redirect_uri: 'http://localhost:8080/callback', // 前端应用的认证成功回调 URL
  response_type: 'code', // 授权码流
  scope: 'openid profile api1 offline_access', // 请求的权限范围
  post_logout_redirect_uri: 'http://localhost:8080/', // 登出后的重定向 URL

  // PKCE 相关设置
  code_challenge_method: 'S256',

  // 存储用户会话信息的地方
  userStore: new WebStorageStateStore({ store: window.localStorage }),

  // 其他可选设置
  automaticSilentRenew: true, // 自动静默刷新 access_token
  // 需要配置 silent_redirect_uri
  silent_redirect_uri: window.location.origin + '/silent-renew.html', // 指向一个空的 HTML 页面

  monitorSession: true, // 监控会话状态

   // ****** 添加/修改这一行 ******
  // 让 oidc-client 在 Access Token "原始" 过期前 3500 秒 (即实际签发后 100 秒左右)就开始尝试刷新
  // 这样它就会早于后端 10 秒过期时间进行刷新
  accessTokenExpiringNotificationTime: 3500, // 默认是 60 秒


  filterProtocolClaims: true, // 过滤协议声明
  loadUserInfo: true, // 在获取 id_token 后自动加载用户信息
};

const userManager = new UserManager(settings);

// 监听用户事件（这里的事件名称和回调参数在新旧版本中通常是兼容的）
userManager.events.addUserLoaded((user) => {
  console.log('User loaded:', user);
});
userManager.events.addUserUnloaded(() => {
  console.log('User unloaded');
});
userManager.events.addAccessTokenExpiring(() => {
  console.log('Access token expiring...');
});
userManager.events.addAccessTokenExpired(() => {
  console.log('Access token expired.');
});
userManager.events.addSilentRenewError((error) => {
  console.error('Silent renew error:', error);
});

export default userManager;
