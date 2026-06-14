/**
 * WebFast App - 应用引导入口
 *
 * 职责：
 * 1. 注册全局组件
 * 2. 初始化路由
 * 3. 配置 HTTP 拦截器
 * 4. 启动应用（支持水合模式）
 */

import { config } from './config.js';
import { http } from './core/http.js';
import { Router } from './core/router.js';
import { defineComponent } from './core/component.js';

// 导入全局组件
import AppHeader from './components/app-header/index.js';
import AppFooter from './components/app-footer/index.js';

// 注册全局组件
defineComponent(AppHeader, 'app-header');
defineComponent(AppFooter, 'app-footer');

// 配置 HTTP
http.setBaseUrl(config.apiBaseUrl);
http.addRequestInterceptor((cfg) => {
  // 示例：自动附加 Token
  const token = localStorage.getItem('token');
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers['Authorization'] = `Bearer ${token}`;
  }
  return cfg;
});
http.setErrorHandler((err) => {
  if (config.debug) {
    console.error('[HTTP Error]', err);
  }
  if (err.status === 401) {
    // 未授权，跳转到登录（使用局部 router 引用）
    router.navigate('/login');
  }
});

// 检查是否存在预渲染的静态内容（水合模式）
const appContainer = document.querySelector(config.appContainer);
const hasStaticContent = appContainer && appContainer.children.length > 0;

// 初始化路由
const router = new Router({
  container: config.appContainer,
  mode: config.routerMode,
  routes: [
    { path: '/', page: () => import('./pages/home/index.js') },
  ],
  on404: ({ path }) => {
    document.querySelector(config.appContainer).innerHTML = `
      <div style="padding:40px;text-align:center">
        <h1>404</h1>
        <p>Page not found: ${path}</p>
        <a href="/">Go Home</a>
      </div>
    `;
  },
});

// 启动应用
if (hasStaticContent && window.location.pathname === '/') {
  // 水合模式：首页静态内容已存在，直接绑定而非重新加载
  router.start({ hydrate: true });
} else {
  // 标准模式：从服务器加载页面
  router.start();
}

// 仅在调试模式下暴露到全局，使用 Symbol 命名空间避免冲突
const WF_SYMBOL = Symbol.for('WebFast');
if (config.debug) {
  window[WF_SYMBOL] = { router, http };
  // 保留兼容性的 $ 前缀，但添加警告
  Object.defineProperty(window, '$router', {
    get() {
      console.warn('[WebFast] window.$router is deprecated. Use window[Symbol.for("WebFast")].router instead.');
      return router;
    },
    configurable: true,
  });
  Object.defineProperty(window, '$http', {
    get() {
      console.warn('[WebFast] window.$http is deprecated. Use window[Symbol.for("WebFast")].http instead.');
      return http;
    },
    configurable: true,
  });
}
