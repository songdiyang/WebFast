/**
 * WebFast Utils - 工具函数集
 *
 * 提供常用的纯函数工具，无副作用。
 */

/**
 * 深拷贝对象
 * @param {*} obj
 * @returns {*}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * 防抖
 * @param {Function} fn
 * @param {number} delay - 毫秒
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 节流
 * @param {Function} fn
 * @param {number} interval - 毫秒
 * @returns {Function}
 */
export function throttle(fn, interval = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 生成唯一 ID
 * @param {string} prefix
 * @returns {string}
 */
export function uid(prefix = 'wf') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 将驼峰转为 kebab-case
 * @param {string} str
 * @returns {string}
 */
export function toKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

/**
 * 将 kebab-case 转为驼峰
 * @param {string} str
 * @returns {string}
 */
export function toCamel(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * 将 PascalCase 转为 kebab-case
 * @param {string} str
 * @returns {string}
 */
export function pascalToKebab(str) {
  return str
    .replace(/([A-Z])/g, (m, c, i) => (i > 0 ? '-' : '') + c.toLowerCase())
    .replace(/^-/, '');
}

/**
 * 安全地获取嵌套对象的值
 * @param {object} obj
 * @param {string} path - 点分路径，如 'user.profile.name'
 * @param {*} defaultValue
 * @returns {*}
 */
export function getByPath(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result == null) return defaultValue;
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
}

/**
 * HTML 转义，防止 XSS
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}

/**
 * 增强模板引擎：支持 {{key}}、{{#each list}}...{{/each}}、{{#if cond}}...{{/if}}
 * @param {string} html
 * @param {object} data
 * @returns {string}
 */
export function renderTemplate(html, data = {}) {
  let result = html;

  // 1. 处理 {{#if key}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\s*[\w.]+\s*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    const value = getByPath(data, key.trim());
    return value ? content : '';
  });

  // 2. 处理 {{#each list}}...{{/each}}
  result = result.replace(/\{\{#each\s+(\s*[\w.]+\s*)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, content) => {
    const list = getByPath(data, key.trim());
    if (!Array.isArray(list) || list.length === 0) return '';
    return list.map((item, index) => {
      let itemHtml = content;
      // 替换 {{this}} 为当前项
      itemHtml = itemHtml.replace(/\{\{\s*this\s*\}\}/g, escapeHtml(String(item)));
      // 替换 {{this.key}} 为当前项的属性
      itemHtml = itemHtml.replace(/\{\{\s*this\.(\s*[\w.]+\s*)\}\}/g, (__, k) => {
        const v = getByPath(item, k.trim(), '');
        return escapeHtml(String(v));
      });
      // 替换 {{index}} 为当前索引
      itemHtml = itemHtml.replace(/\{\{\s*index\s*\}\}/g, String(index));
      // 自动注入 data-key 属性（用于 Diff 算法列表项匹配）
      // 如果 item 有 id 属性，自动添加 data-key
      if (item && typeof item === 'object' && item.id !== undefined) {
        itemHtml = itemHtml.replace(
          /^(\s*<)([\w-]+)(\s|>)/,
          `$1$2 data-key="${escapeHtml(String(item.id))}"$3`
        );
      }
      return itemHtml;
    }).join('');
  });

  // 3. 处理普通 {{key}}
  result = result.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (_, key) => {
    const value = getByPath(data, key.trim(), '');
    return escapeHtml(String(value));
  });

  return result;
}

/**
 * 解析 URL 查询参数
 * @param {string} searchStr - 如 '?a=1&b=2'
 * @returns {object}
 */
export function parseQuery(searchStr) {
  const params = new URLSearchParams(searchStr);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * 将对象序列化为查询字符串
 * @param {object} obj
 * @returns {string}
 */
export function toQueryString(obj) {
  return new URLSearchParams(obj).toString();
}
