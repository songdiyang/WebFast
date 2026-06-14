/**
 * WebFast EventBus - 全局事件总线
 *
 * 用法：
 *   import { EventBus } from '../core/event-bus.js';
 *   EventBus.on('user-login', (data) => { ... });
 *   EventBus.emit('user-login', { name: 'Alice' });
 *   EventBus.off('user-login', handler);
 */

class EventBusClass {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * 监听事件
   * @param {string} event - 事件名称
   * @param {Function} handler - 处理函数
   */
  on(event, handler) {
    if (typeof handler !== 'function') return;
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
  }

  /**
   * 监听一次性事件
   * @param {string} event
   * @param {Function} handler
   */
  once(event, handler) {
    const wrapper = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    wrapper._original = handler;
    this.on(event, wrapper);
  }

  /**
   * 取消监听
   * @param {string} event
   * @param {Function} handler - 传入原处理函数即可（once 注册的也支持）
   */
  off(event, handler) {
    const set = this._listeners.get(event);
    if (!set) return;

    // 移除精确匹配，或移除 once 包装器
    for (const fn of set) {
      if (fn === handler || fn._original === handler) {
        set.delete(fn);
        break;
      }
    }

    if (set.size === 0) {
      this._listeners.delete(event);
    }
  }

  /**
   * 触发事件
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    const set = this._listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    }
  }

  /**
   * 移除某个事件的所有监听器
   * @param {string} event
   */
  clear(event) {
    this._listeners.delete(event);
  }

  /** 清除所有监听器 */
  clearAll() {
    this._listeners.clear();
  }
}

// 全局单例
export const EventBus = new EventBusClass();
