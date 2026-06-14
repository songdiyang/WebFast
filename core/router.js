/**
 * WebFast Router - 约定式路由系统
 *
 * 基于 History API，支持：
 * - 约定式路由映射（pages/ 目录结构 = URL 路径）
 * - 动态路由 [id].js => /:id
 * - 路由守卫 beforeEnter / beforeLeave
 * - 懒加载（import() 动态导入）
 * - 查询参数解析
 * - 404 回退
 *
 * 用法：
 *   import { Router } from '../core/router.js';
 *   const router = new Router({
 *     container: '#app',
 *     routes: [
 *       { path: '/', page: () => import('../pages/home/index.js') },
 *       { path: '/about', page: () => import('../pages/about/index.js') },
 *       { path: '/user/:id', page: () => import('../pages/user/[id].js') },
 *     ],
 *   });
 *   router.start();
 */

import { parseQuery } from './utils.js';
import { preserveState } from './diff.js';

/**
 * 将路由路径转为正则表达式和参数名列表
 * @param {string} path - 如 '/user/:id' 或 '/user/:id/posts/:postId'
 * @returns {{regex: RegExp, keys: string[]}}
 */
function compileRoute(path) {
  const keys = [];
  // 将 :param 替换为捕获组，并支持可选的末尾 /
  const regexStr = path
    .replace(/\//g, '\\/')
    .replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  const regex = new RegExp(`^${regexStr}\/?$`);
  return { regex, keys };
}

class Router {
  /**
   * @param {object} options
   * @param {string} options.container - 页面挂载容器选择器
   * @param {Array<{path: string, page: () => Promise, beforeEnter?: Function, beforeLeave?: Function}>} options.routes
   * @param {string} [options.mode='history'] - 'history' | 'hash'
   * @param {Function} [options.on404] - 404 处理函数
   */
  constructor({ container, routes = [], mode = 'history', on404 } = {}) {
    this._container = document.querySelector(container);
    this._routes = routes.map(r => ({ ...r, ...compileRoute(r.path) }));
    this._mode = mode;
    this._on404 = on404;
    this._currentRoute = null;
    this._currentPage = null;

    // 绑定导航方法
    this.navigate = this.navigate.bind(this);
    this._onPopState = this._onPopState.bind(this);
    this._onClick = this._onClick.bind(this);
  }

  /** 启动路由
   * @param {object} options
   * @param {boolean} options.hydrate - 是否水合模式（使用已有 DOM）
   */
  start(options = {}) {
    // 监听浏览器前进/后退
    window.addEventListener('popstate', this._onPopState);
    // 拦截 <a> 标签点击，实现客户端导航
    document.addEventListener('click', this._onClick);
    // 初始匹配当前路径
    this._matchAndRender(this._getCurrentPath(), options);
  }

  /** 销毁路由 */
  destroy() {
    window.removeEventListener('popstate', this._onPopState);
    document.removeEventListener('click', this._onClick);
  }

  /**
   * 导航到指定路径
   * @param {string} path
   * @param {boolean} [replace=false] - 是否替换当前历史记录
   */
  navigate(path, replace = false) {
    if (this._mode === 'history') {
      if (replace) {
        history.replaceState(null, '', path);
      } else {
        history.pushState(null, '', path);
      }
    } else {
      location.hash = path;
    }
    this._matchAndRender(path);
  }

  /** 获取当前路径 */
  _getCurrentPath() {
    if (this._mode === 'history') {
      return location.pathname + location.search;
    }
    return location.hash.slice(1) || '/';
  }

  /** 解析路径和查询参数 */
  _parsePath(fullPath) {
    const [path, search] = fullPath.split('?');
    return { path, query: parseQuery(search ? '?' + search : '') };
  }

  /** 匹配路由并渲染
   * @param {string} fullPath
   * @param {object} options
   * @param {boolean} options.hydrate - 是否水合模式
   */
  async _matchAndRender(fullPath, options = {}) {
    const { path, query } = this._parsePath(fullPath);

    // 查找匹配的路由
    let matchedRoute = null;
    let params = {};

    for (const route of this._routes) {
      const match = route.regex.exec(path);
      if (match) {
        matchedRoute = route;
        params = {};
        for (let i = 0; i < route.keys.length; i++) {
          params[route.keys[i]] = match[i + 1];
        }
        break;
      }
    }

    // 未匹配到路由
    if (!matchedRoute) {
      if (this._on404) {
        this._on404({ path, query });
      } else {
        console.warn(`[Router] No route matched for: ${path}`);
        this._clearContainer();
      }
      return;
    }

    // 执行 beforeLeave（当前页面）
    if (this._currentPage && this._currentRoute && this._currentRoute.beforeLeave) {
      const canLeave = await this._currentRoute.beforeLeave(this._currentPage, { path, query, params });
      if (canLeave === false) return;
    }

    // 执行 beforeEnter（目标页面）
    if (matchedRoute.beforeEnter) {
      const canEnter = await matchedRoute.beforeEnter({ path, query, params });
      if (canEnter === false) return;
    }

    // 懒加载页面组件
    try {
      const module = await matchedRoute.page();
      const PageClass = module.default || module;

      // 创建新页面实例（但不挂载）
      const newPage = new PageClass();

      // 如果是 WebFastPage，先 mount 加载模板
      if (newPage.mount) {
        if (options.hydrate) {
          // 水合模式：查找已有的 DOM 元素并绑定
          const existingEl = this._container.querySelector('.wf-page');
          await newPage.mount({ hydrate: true, hydrateEl: existingEl });
        } else {
          await newPage.mount();
        }
      }

      // 触发路由生命周期（让页面渲染数据）
      if (newPage.onRouteEnter) {
        newPage.onRouteEnter(params, query);
      }

      if (this._currentPage) {
        // 已有页面：使用 Diff 算法对比并替换差异
        const oldTarget = this._currentPage.el || this._currentPage;
        const newTarget = newPage.el || newPage;

        // 清理旧页面事件和订阅
        if (this._currentPage.unmount) {
          this._currentPage.unmount();
        }

        // 路由级切换：使用新页面元素替换旧页面元素（保留状态）
        preserveState(() => {
          if (oldTarget.parentNode) {
            oldTarget.parentNode.replaceChild(newTarget, oldTarget);
          }
        });

        // 更新引用
        this._currentPage = newPage;
        this._currentRoute = matchedRoute;

        // 重新绑定新页面的事件
        if (newPage._bindEvents) {
          newPage._bindEvents();
        }
        if (newPage._subscribeStores) {
          newPage._subscribeStores();
        }
        if (newPage.onConnected) {
          newPage.onConnected();
        }
      } else {
        // 首次加载：直接挂载
        const mountTarget = newPage.el || newPage;
        this._container.appendChild(mountTarget);

        this._currentPage = newPage;
        this._currentRoute = matchedRoute;
      }

    } catch (err) {
      console.error(`[Router] Failed to load page for ${path}:`, err);
      this._container.innerHTML = `<div style="padding:20px;color:red">Error loading page: ${err.message}</div>`;
    }
  }

  /** 清空容器 */
  _clearContainer() {
    if (!this._container) return;
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }
  }

  /** 处理 popstate 事件 */
  _onPopState() {
    this._matchAndRender(this._getCurrentPath());
  }

  /**
   * 拦截 <a> 标签点击，实现客户端导航
   * 只拦截同域链接，外部链接正常跳转
   */
  _onClick(e) {
    const link = e.composedPath().find(el => el.tagName === 'A');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // 外部链接、锚点、mailto、tel 等不拦截
    if (
      href.startsWith('http') ||
      href.startsWith('//') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      link.hasAttribute('download') ||
      link.target === '_blank'
    ) {
      return;
    }

    // 不同域不拦截
    if (link.origin && link.origin !== location.origin) return;

    e.preventDefault();
    this.navigate(href);
  }
}

export { Router };
