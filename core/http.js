/**
 * WebFast HTTP - 基于 Fetch API 的请求封装
 *
 * 用法：
 *   import { http } from '../core/http.js';
 *   const data = await http.get('/api/users');
 *   const user = await http.post('/api/users', { name: 'Alice' });
 */

class HttpClient {
  constructor() {
    this._baseUrl = '';
    this._headers = { 'Content-Type': 'application/json' };
    /** @type {Array<(config: object) => object>} */
    this._requestInterceptors = [];
    /** @type {Array<(response: Response) => Response>} */
    this._responseInterceptors = [];
    /** @type {((error: Error, config: object) => void)|null} */
    this._errorHandler = null;
  }

  /**
   * 设置基础 URL
   * @param {string} url
   */
  setBaseUrl(url) {
    this._baseUrl = url.replace(/\/$/, '');
  }

  /**
   * 设置默认请求头
   * @param {object} headers
   */
  setHeaders(headers) {
    Object.assign(this._headers, headers);
  }

  /**
   * 添加请求拦截器
   * @param {(config: object) => object} fn
   */
  addRequestInterceptor(fn) {
    this._requestInterceptors.push(fn);
  }

  /**
   * 添加响应拦截器
   * @param {(response: Response) => Response} fn
   */
  addResponseInterceptor(fn) {
    this._responseInterceptors.push(fn);
  }

  /**
   * 设置全局错误处理器
   * @param {(error: Error, config: object) => void} fn
   */
  setErrorHandler(fn) {
    this._errorHandler = fn;
  }

  /**
   * 发起请求
   * @param {string} url
   * @param {object} config
   * @returns {Promise<*>}
   */
  async request(url, config = {}) {
    let fullUrl = url.startsWith('http') ? url : `${this._baseUrl}${url}`;

    // 合并 headers
    let mergedConfig = {
      method: 'GET',
      ...config,
      headers: { ...this._headers, ...(config.headers || {}) },
    };

    // 处理查询参数
    if (config.params) {
      const qs = new URLSearchParams(config.params).toString();
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
    }

    // 序列化 body
    if (config.body && typeof config.body === 'object') {
      mergedConfig.body = JSON.stringify(config.body);
    }

    // 执行请求拦截器
    for (const interceptor of this._requestInterceptors) {
      mergedConfig = interceptor(mergedConfig) || mergedConfig;
    }

    try {
      let response = await fetch(fullUrl, mergedConfig);

      // 执行响应拦截器
      for (const interceptor of this._responseInterceptors) {
        response = interceptor(response) || response;
      }

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      // 根据 Content-Type 自动解析
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        return await response.json();
      }
      if (contentType.includes('text/')) {
        return await response.text();
      }
      return await response.blob();

    } catch (err) {
      if (this._errorHandler) {
        this._errorHandler(err, mergedConfig);
      }
      throw err;
    }
  }

  /** GET 请求 */
  get(url, config = {}) {
    return this.request(url, { ...config, method: 'GET' });
  }

  /** POST 请求 */
  post(url, body = null, config = {}) {
    return this.request(url, { ...config, method: 'POST', body });
  }

  /** PUT 请求 */
  put(url, body = null, config = {}) {
    return this.request(url, { ...config, method: 'PUT', body });
  }

  /** PATCH 请求 */
  patch(url, body = null, config = {}) {
    return this.request(url, { ...config, method: 'PATCH', body });
  }

  /** DELETE 请求 */
  delete(url, config = {}) {
    return this.request(url, { ...config, method: 'DELETE' });
  }
}

// 全局单例
export const http = new HttpClient();
