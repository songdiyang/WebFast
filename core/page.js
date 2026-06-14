/**
 * WebFast Page - 页面基类（非 Web Component）
 *
 * 页面不需要 Shadow DOM 隔离，直接操作真实 DOM。
 * 继承此类获得与 WebFastComponent 相同的 API：
 * - template.html + style.css 自动加载
 * - 声明式事件绑定 events()
 * - 生命周期 onConnected / onDisconnected
 * - 组件通信 emit / listen
 * - Store 订阅 subscribe()
 * - this.$http 快捷访问
 * - 模板渲染 render(data)
 *
 * 与 WebFastComponent 的区别：
 * - 不是 Custom Element，不需要 customElements.define()
 * - 直接创建 div 容器，模板内容插入其中
 * - 样式通过 <style> 标签注入到容器内
 */

import { EventBus } from './event-bus.js';
import { http } from './http.js';
import { getStore } from './store.js';
import { renderTemplate } from './utils.js';
import { diff, patch, preserveState } from './diff.js';

/** 模板缓存 */
const templateCache = new Map();

async function loadText(url) {
  if (templateCache.has(url)) return templateCache.get(url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    templateCache.set(url, text);
    return text;
  } catch (err) {
    console.warn(`[WebFast] Failed to load: ${url}`, err);
    return '';
  }
}

export class WebFastPage {
  /**
   * @param {object} options
   * @param {string} options.template - 模板文件相对路径
   * @param {string} options.style - 样式文件相对路径
   */
  constructor({ template, style } = {}) {
    this._templateUrl = template;
    this._styleUrl = style;
    this._eventListeners = [];
    this._storeUnsubscribers = [];
    this._initialized = false;
    this._pendingData = null;

    this.$http = http;

    // 创建容器元素
    this.el = document.createElement('div');
    this.el.className = 'wf-page';
  }

  /**
   * 初始化：加载模板、样式、绑定事件、订阅 store
   * 由 Router 在挂载后调用
   * @param {object} options
   * @param {boolean} options.hydrate - 是否水合模式（使用已有 DOM）
   * @param {Element} options.hydrateEl - 水合模式下使用的已有 DOM 元素
   */
  async mount(options = {}) {
    if (this._initialized) return;
    this._initialized = true;

    const [templateHtml, styleCss] = await Promise.all([
      this._templateUrl ? loadText(this._resolveUrl(this._templateUrl)) : Promise.resolve(''),
      this._styleUrl ? loadText(this._resolveUrl(this._styleUrl)) : Promise.resolve(''),
    ]);

    this._templateHtml = templateHtml;
    this._styleCss = styleCss;

    if (options.hydrate && options.hydrateEl) {
      // 水合模式：使用已有的 DOM 元素，不重新渲染
      this.el = options.hydrateEl;
      this._bindEvents();
      this._subscribeStores();
    } else {
      // 标准模式：创建新 DOM 并渲染
      this._renderHtml();
      this._bindEvents();
      this._subscribeStores();
    }

    if (this._pendingData) {
      this.render(this._pendingData);
      this._pendingData = null;
    }

    this.onConnected && this.onConnected();
  }

  /**
   * 卸载清理
   */
  unmount() {
    this._cleanup();
    this.onDisconnected && this.onDisconnected();
  }

  /**
   * 解析相对路径为绝对路径
   * 基于 import.meta.url 的当前模块路径来解析
   */
  _resolveUrl(url) {
    if (url.startsWith('/') || url.startsWith('http')) return url;
    // 使用当前页面的 JS 文件路径作为基准
    const base = this._baseUrl || document.baseURI;
    return new URL(url, base).href;
  }

  /**
   * 设置路径解析基准（由子类在 constructor 中调用）
   * @param {string} importMetaUrl - import.meta.url
   */
  setBaseUrl(importMetaUrl) {
    this._baseUrl = importMetaUrl;
  }

  _renderHtml() {
    let html = this._templateHtml || '';
    if (this._styleCss) {
      html = `<style>${this._styleCss}</style>${html}`;
    }
    this.el.innerHTML = html;
  }

  /**
   * 使用 Diff 算法渲染模板
   * 对比新旧 DOM，只更新变化的部分，保留用户状态
   * @param {object} data
   */
  render(data = {}) {
    if (!this._initialized) {
      this._pendingData = data;
      return;
    }
    if (!this._templateHtml) return;

    // 1. 生成新 HTML
    let newHtml = this._templateHtml;
    newHtml = renderTemplate(newHtml, data);

    if (this._styleCss) {
      newHtml = `<style>${this._styleCss}</style>${newHtml}`;
    }

    // 2. 解析为新 DOM 树
    const newContainer = document.createElement('div');
    newContainer.innerHTML = newHtml;

    // 3. 使用 Diff 算法对比并应用（保留焦点/滚动/表单值）
    preserveState(() => {
      const patches = diff(this.el, newContainer);
      patch(this.el, patches);
    });

    // 4. 重新绑定事件（DOM 可能已变化）
    this._bindEvents();
  }

  _bindEvents() {
    this._cleanupEvents();
    if (typeof this.events !== 'function') return;
    const eventMap = this.events();
    if (!eventMap) return;

    for (const key of Object.keys(eventMap)) {
      const [eventType, ...selectorParts] = key.split(' ');
      const selector = selectorParts.join(' ').trim();
      const handler = eventMap[key];

      if (!eventType || !selector || typeof handler !== 'function') continue;

      const boundHandler = handler.bind(this);
      const elements = this.el.querySelectorAll(selector);
      for (const el of elements) {
        el.addEventListener(eventType, boundHandler);
        this._eventListeners.push({ el, eventType, boundHandler });
      }
    }
  }

  _cleanupEvents() {
    for (const { el, eventType, boundHandler } of this._eventListeners) {
      el.removeEventListener(eventType, boundHandler);
    }
    this._eventListeners = [];
  }

  _subscribeStores() {
    if (typeof this.subscribe !== 'function') return;
    const storeNames = this.subscribe();
    if (!Array.isArray(storeNames)) return;

    for (const name of storeNames) {
      const store = getStore(name);
      if (!store) {
        console.warn(`[WebFast] Store "${name}" not found for page`);
        continue;
      }
      const unsub = store.subscribe((state, oldState) => {
        this.onStoreChanged && this.onStoreChanged(name, state, oldState);
      });
      this._storeUnsubscribers.push(unsub);
    }
  }

  _cleanupStores() {
    for (const unsub of this._storeUnsubscribers) {
      unsub && unsub();
    }
    this._storeUnsubscribers = [];
  }

  _cleanup() {
    this._cleanupEvents();
    this._cleanupStores();
  }

  // ============== 公共 API ==============

  $(selector) {
    return this.el.querySelector(selector);
  }

  $$(selector) {
    return this.el.querySelectorAll(selector);
  }

  emit(eventName, detail = null) {
    EventBus.emit(eventName, detail);
    this.el.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
  }

  listen(eventName, handler) {
    EventBus.on(eventName, handler);
  }

  unlisten(eventName, handler) {
    EventBus.off(eventName, handler);
  }
}
