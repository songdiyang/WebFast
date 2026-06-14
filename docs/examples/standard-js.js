/**
 * 示例：符合标准的 JavaScript 模块
 * 标准：ECMAScript 2025 + W3C Web API
 * 特点：模块化、异步、安全、无障碍
 */

// ===== 模块导入 =====
import { EventBus } from '../../core/event-bus.js';
import { http } from '../../core/http.js';
import { createStore } from '../../core/store.js';

// ===== 常量定义 =====
const API_BASE_URL = '/api';
const DEBOUNCE_DELAY = 300;
const MAX_RETRY_COUNT = 3;

// ===== 工具函数 =====

/**
 * HTML 转义函数（防止 XSS）
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * 防抖函数
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay = DEBOUNCE_DELAY) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 验证 URL 安全性（防止 javascript: 协议）
 * @param {string} url
 * @returns {boolean}
 */
function isSafeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ===== 状态管理 =====

const userStore = createStore('user', {
  state: {
    currentUser: null,
    isLoading: false,
    error: null,
  },
  actions: {
    async login(state, credentials) {
      this.setState({ ...state, isLoading: true, error: null });
      try {
        const user = await http.post(`${API_BASE_URL}/login`, credentials);
        return { ...state, currentUser: user, isLoading: false };
      } catch (error) {
        return { ...state, error: error.message, isLoading: false };
      }
    },
    logout(state) {
      return { ...state, currentUser: null, error: null };
    },
  },
});

// ===== 类定义 =====

/**
 * 用户列表组件
 * 符合 WebFast 组件标准
 */
class UserList {
  constructor(container) {
    this.container = container;
    this.users = [];
    this.searchQuery = '';
    this._eventListeners = [];
    this._storeUnsubscribe = null;

    this.init();
  }

  async init() {
    this.render();
    this.bindEvents();
    this.subscribeStore();
    await this.loadUsers();
  }

  /**
   * 渲染组件 HTML
   */
  render() {
    this.container.innerHTML = `
      <section class="user-list" aria-labelledby="user-list-title">
        <h2 id="user-list-title">用户列表</h2>
        
        <div class="user-list__search">
          <label for="user-search" class="visually-hidden">搜索用户</label>
          <input
            type="search"
            id="user-search"
            class="user-list__search-input"
            placeholder="搜索用户姓名..."
            autocomplete="off"
            aria-describedby="search-hint"
          />
          <span id="search-hint" class="visually-hidden">输入姓名进行实时搜索</span>
        </div>
        
        <div class="user-list__status" role="status" aria-live="polite"></div>
        
        <ul class="user-list__items" role="list">
          <!-- 用户列表项将动态插入 -->
        </ul>
        
        <div class="user-list__empty" hidden>
          <p>未找到匹配的用户</p>
        </div>
      </section>
    `;
  }

  /**
   * 绑定事件监听
   */
  bindEvents() {
    const searchInput = this.container.querySelector('#user-search');
    const debouncedSearch = debounce((query) => this.handleSearch(query));

    const handleInput = (event) => {
      debouncedSearch(event.target.value);
    };

    searchInput.addEventListener('input', handleInput);
    this._eventListeners.push({ element: searchInput, event: 'input', handler: handleInput });
  }

  /**
   * 订阅状态变化
   */
  subscribeStore() {
    this._storeUnsubscribe = userStore.subscribe((state) => {
      this.updateStatus(state);
    });
  }

  /**
   * 加载用户数据
   */
  async loadUsers() {
    try {
      this.setLoading(true);
      const users = await http.get(`${API_BASE_URL}/users`);
      this.users = users;
      this.renderUserList(users);
    } catch (error) {
      this.showError('加载用户失败，请稍后重试');
      console.error('Failed to load users:', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 渲染用户列表
   * @param {Array} users
   */
  renderUserList(users) {
    const list = this.container.querySelector('.user-list__items');
    const emptyState = this.container.querySelector('.user-list__empty');

    if (users.length === 0) {
      list.innerHTML = '';
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    // 使用 DocumentFragment 批量插入（性能优化）
    const fragment = document.createDocumentFragment();

    for (const user of users) {
      const li = document.createElement('li');
      li.className = 'user-list__item';
      li.setAttribute('role', 'listitem');

      // 使用 textContent 安全插入用户数据（防止 XSS）
      li.innerHTML = `
        <div class="user-card">
          <img
            src="${escapeHtml(user.avatar)}"
            alt=""
            class="user-card__avatar"
            width="48"
            height="48"
            loading="lazy"
          />
          <div class="user-card__info">
            <h3 class="user-card__name">${escapeHtml(user.name)}</h3>
            <p class="user-card__email">${escapeHtml(user.email)}</p>
          </div>
          <a
            href="/user/${encodeURIComponent(user.id)}"
            class="user-card__link"
            aria-label="查看 ${escapeHtml(user.name)} 的详情"
          >
            查看详情
          </a>
        </div>
      `;

      fragment.appendChild(li);
    }

    list.innerHTML = '';
    list.appendChild(fragment);

    // 更新状态通知（无障碍）
    this.updateStatus({ message: `显示 ${users.length} 位用户` });
  }

  /**
   * 处理搜索
   * @param {string} query
   */
  handleSearch(query) {
    this.searchQuery = query.toLowerCase().trim();

    const filtered = this.users.filter((user) =>
      user.name.toLowerCase().includes(this.searchQuery) ||
      user.email.toLowerCase().includes(this.searchQuery)
    );

    this.renderUserList(filtered);
  }

  /**
   * 设置加载状态
   * @param {boolean} isLoading
   */
  setLoading(isLoading) {
    const status = this.container.querySelector('.user-list__status');
    status.textContent = isLoading ? '加载中...' : '';
  }

  /**
   * 显示错误信息
   * @param {string} message
   */
  showError(message) {
    const status = this.container.querySelector('.user-list__status');
    status.textContent = message;
    status.classList.add('user-list__status--error');

    // 3 秒后清除错误
    setTimeout(() => {
      status.textContent = '';
      status.classList.remove('user-list__status--error');
    }, 3000);
  }

  /**
   * 更新状态通知
   * @param {object} state
   */
  updateStatus(state) {
    const status = this.container.querySelector('.user-list__status');
    if (state.message) {
      status.textContent = state.message;
    }
  }

  /**
   * 销毁组件，清理资源
   */
  destroy() {
    // 移除事件监听
    for (const { element, event, handler } of this._eventListeners) {
      element.removeEventListener(event, handler);
    }
    this._eventListeners = [];

    // 取消 store 订阅
    if (this._storeUnsubscribe) {
      this._storeUnsubscribe();
    }

    // 清空容器
    this.container.innerHTML = '';
  }
}

// ===== 导出 =====
export { UserList, escapeHtml, debounce, isSafeUrl };
export default UserList;
