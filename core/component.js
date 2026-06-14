/**
 * WebFast Component - Web Components 基类
 *
 * 所有组件继承此类，自动获得：
 * - Shadow DOM 样式隔离
 * - template.html + style.css 自动加载
 * - 声明式事件绑定 events()
 * - 统一生命周期 onConnected / onDisconnected / onAttributeChanged
 * - 组件通信 emit / listen
 * - Store 订阅 subscribe()
 * - this.$http 快捷访问
 * - 模板渲染 render(data)
 *
 * 用法：
 *   import { WebFastComponent } from '../core/component.js';
 *   export default class MyButton extends WebFastComponent {
 *     constructor() {
 *       super({ template: './template.html', style: './style.css' });
 *     }
 *     events() {
 *       return { 'click .btn': this.onClick };
 *     }
 *     onClick(e) { this.emit('clicked', { id: this.id }); }
 *   }
 */

import { EventBus } from './event-bus.js';
import { http } from './http.js';
import { getStore } from './store.js';
import { renderTemplate, pascalToKebab } from './utils.js';

/** 模板缓存，避免重复 fetch */
const templateCache = new Map();

/**
 * 加载并缓存文本文件
 * @param {string} url
 * @returns {Promise<string>}
 */
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

/**
 * WebFastComponent 基类
 * 继承自 HTMLElement，是 Web Components 的核心。
 *
 * 子类需要实现：
 *   constructor() 中调用 super({ template, style })
 *   events()           - 返回 { 'click .btn': this.handler } 格式
 *   onConnected()      - 挂载后回调
 *   onDisconnected()   - 卸载后回调
 *   onAttributeChanged(name, oldVal, newVal) - 属性变化回调
 *   subscribe()        - 返回需要订阅的 store 名称数组
 *   onStoreChanged(storeName, state) - store 变化回调
 */
export class WebFastComponent extends HTMLElement {
  /**
   * @param {object} options
   * @param {string} options.template - 模板文件相对路径
   * @param {string} options.style - 样式文件相对路径
   * @param {boolean} [options.shadow=true] - 是否使用 Shadow DOM
   */
  constructor({ template, style, shadow = true } = {}) {
    super();

    this._templateUrl = template;
    this._styleUrl = style;
    this._shadow = shadow;
    this._eventListeners = [];
    this._storeUnsubscribers = [];
    this._initialized = false;
    this._pendingData = null;

    // 注入快捷引用
    this.$http = http;

    if (shadow) {
      this._shadowRoot = this.attachShadow({ mode: 'open' });
    } else {
      this._shadowRoot = this;
    }
  }

  /**
   * 组件挂载到 DOM 时触发
   * 自动加载模板和样式，绑定事件，注册 store 订阅
   */
  async connectedCallback() {
    await this._init();
    this.onConnected && this.onConnected();
  }

  /**
   * 组件从 DOM 移除时触发
   * 自动清理事件监听器和 store 订阅
   */
  disconnectedCallback() {
    this._cleanup();
    this.onDisconnected && this.onDisconnected();
  }

  /**
   * 监听属性变化
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this.onAttributeChanged && this.onAttributeChanged(name, oldValue, newValue);
  }

  /**
   * 初始化：加载模板、样式、绑定事件、订阅 store
   * @private
   */
  async _init() {
    if (this._initialized) return;
    this._initialized = true;

    const [templateHtml, styleCss] = await Promise.all([
      this._templateUrl ? loadText(this._resolveUrl(this._templateUrl)) : Promise.resolve(''),
      this._styleUrl ? loadText(this._resolveUrl(this._styleUrl)) : Promise.resolve(''),
    ]);

    this._templateHtml = templateHtml;
    this._styleCss = styleCss;

    // 初始渲染
    this._renderHtml();

    // 绑定声明式事件
    this._bindEvents();

    // 订阅 store
    this._subscribeStores();

    // 如果有待渲染的数据，立即渲染
    if (this._pendingData) {
      this.render(this._pendingData);
      this._pendingData = null;
    }
  }

  /**
   * 将相对路径解析为绝对路径（基于当前组件文件位置）
   * @private
   */
  _resolveUrl(url) {
    if (url.startsWith('/') || url.startsWith('http')) return url;
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

  /**
   * 渲染 HTML 到 Shadow DOM
   * @private
   */
  _renderHtml() {
    if (!this._shadowRoot) return;

    let html = this._templateHtml || '';

    // 如果有样式，注入 <style>
    if (this._styleCss) {
      html = `<style>${this._styleCss}</style>${html}`;
    }

    this._shadowRoot.innerHTML = html;
  }

  /**
   * 使用数据渲染模板
   * 会重新解析模板并替换 {{key}} 占位符
   * @param {object} data
   */
  render(data = {}) {
    if (!this._initialized) {
      this._pendingData = data;
      return;
    }
    if (!this._templateHtml) return;

    let html = this._templateHtml;
    html = renderTemplate(html, data);

    if (this._styleCss) {
      html = `<style>${this._styleCss}</style>${html}`;
    }

    this._shadowRoot.innerHTML = html;

    // 重新绑定事件（因为 DOM 被重建了）
    this._bindEvents();
  }

  /**
   * 绑定声明式事件
   * 子类通过 events() 方法返回 { 'event selector': handler } 格式
   * @private
   */
  _bindEvents() {
    // 先清理旧的事件绑定
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
      const elements = this._shadowRoot.querySelectorAll(selector);
      for (const el of elements) {
        el.addEventListener(eventType, boundHandler);
        this._eventListeners.push({ el, eventType, boundHandler });
      }
    }
  }

  /**
   * 清理事件监听器
   * @private
   */
  _cleanupEvents() {
    for (const { el, eventType, boundHandler } of this._eventListeners) {
      el.removeEventListener(eventType, boundHandler);
    }
    this._eventListeners = [];
  }

  /**
   * 订阅 store
   * 子类通过 subscribe() 返回 ['storeName1', 'storeName2']
   * @private
   */
  _subscribeStores() {
    if (typeof this.subscribe !== 'function') return;
    const storeNames = this.subscribe();
    if (!Array.isArray(storeNames)) return;

    for (const name of storeNames) {
      const store = getStore(name);
      if (!store) {
        console.warn(`[WebFast] Store "${name}" not found for component ${this.tagName}`);
        continue;
      }
      const unsub = store.subscribe((state, oldState) => {
        this.onStoreChanged && this.onStoreChanged(name, state, oldState);
      });
      this._storeUnsubscribers.push(unsub);
    }
  }

  /**
   * 清理 store 订阅
   * @private
   */
  _cleanupStores() {
    for (const unsub of this._storeUnsubscribers) {
      unsub && unsub();
    }
    this._storeUnsubscribers = [];
  }

  /**
   * 统一清理
   * @private
   */
  _cleanup() {
    this._cleanupEvents();
    this._cleanupStores();
  }

  // ============== 公共 API ==============

  /**
   * 在 Shadow DOM 内查询单个元素
   * @param {string} selector
   * @returns {Element|null}
   */
  $(selector) {
    return this._shadowRoot.querySelector(selector);
  }

  /**
   * 在 Shadow DOM 内查询所有元素
   * @param {string} selector
   * @returns {NodeList}
   */
  $$(selector) {
    return this._shadowRoot.querySelectorAll(selector);
  }

  /**
   * 向父组件或全局发送事件
   * @param {string} eventName
   * @param {*} detail
   */
  emit(eventName, detail = null) {
    // 1. 触发自定义事件（冒泡到父组件）
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true,
    }));
    // 2. 同时通过 EventBus 广播
    EventBus.emit(eventName, detail);
  }

  /**
   * 监听全局事件
   * @param {string} eventName
   * @param {Function} handler
   */
  listen(eventName, handler) {
    EventBus.on(eventName, handler);
  }

  /**
   * 取消监听全局事件
   * @param {string} eventName
   * @param {Function} handler
   */
  unlisten(eventName, handler) {
    EventBus.off(eventName, handler);
  }
}

/**
 * 注册组件为自定义元素
 * 自动将 PascalCase 类名转为 kebab-case 标签名
 *
 * @param {Function} ComponentClass - 继承 WebFastComponent 的类
 * @param {string} [tagName] - 可选的自定义标签名
 */
export function defineComponent(ComponentClass, tagName) {
  const name = tagName || pascalToKebab(ComponentClass.name);
  if (!customElements.get(name)) {
    customElements.define(name, ComponentClass);
  }
  return name;
}
