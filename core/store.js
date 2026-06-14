/**
 * WebFast Store - 轻量级状态管理
 *
 * 用法：
 *   import { createStore, getStore } from '../core/store.js';
 *
 *   // 创建 store
 *   createStore('user', {
 *     state: { name: '', isLoggedIn: false },
 *     actions: {
 *       login(state, user) { return { ...state, name: user.name, isLoggedIn: true }; },
 *       logout(state)      { return { ...state, name: '', isLoggedIn: false }; },
 *     },
 *   });
 *
 *   // 使用 store
 *   const userStore = getStore('user');
 *   userStore.dispatch('login', { name: 'Alice' });
 *   userStore.subscribe((state) => { ... });
 */

import { deepClone } from './utils.js';

/** @type {Map<string, Store>} */
const stores = new Map();

class Store {
  /**
   * @param {string} name
   * @param {object} options
   * @param {object} options.state - 初始状态
   * @param {object} options.actions - 操作方法，签名 (state, payload) => newState
   */
  constructor(name, { state = {}, actions = {} } = {}) {
    this._name = name;
    this._state = deepClone(state);
    this._actions = actions;
    /** @type {Set<(state: object) => void>} */
    this._subscribers = new Set();
  }

  /** 获取当前状态的深拷贝 */
  getState() {
    return deepClone(this._state);
  }

  /**
   * 派发 action
   * @param {string} actionName
   * @param {*} payload
   * @returns {Promise<void>|void}
   */
  dispatch(actionName, payload) {
    const action = this._actions[actionName];
    if (!action) {
      console.warn(`[Store:${this._name}] Action "${actionName}" not found.`);
      return;
    }

    // action 内的 this 绑定到 store 上下文（可访问 $http 等）
    const result = action.call(this, this._state, payload);

    // 支持异步 action
    if (result && typeof result.then === 'function') {
      return result.then((newState) => {
        if (newState) this._commit(newState);
      });
    }

    if (result) {
      this._commit(result);
    }
  }

  /**
   * 直接更新状态（用于简单场景）
   * @param {object} partialState
   */
  setState(partialState) {
    this._commit({ ...this._state, ...partialState });
  }

  /**
   * 内部提交新状态
   * @param {object} newState
   * @private
   */
  _commit(newState) {
    const oldState = this._state;
    this._state = newState;
    this._notify(oldState, newState);
  }

  /**
   * 订阅状态变化
   * @param {(state: object, oldState: object) => void} fn
   * @returns {() => void} 取消订阅函数
   */
  subscribe(fn) {
    this._subscribers.add(fn);
    return () => this._subscribers.delete(fn);
  }

  /**
   * @param {object} oldState
   * @param {object} newState
   * @private
   */
  _notify(oldState, newState) {
    for (const fn of this._subscribers) {
      try {
        fn(newState, oldState);
      } catch (err) {
        console.error(`[Store:${this._name}] Subscriber error:`, err);
      }
    }
  }
}

/**
 * 创建并注册一个 Store
 * @param {string} name
 * @param {object} options
 * @returns {Store}
 */
export function createStore(name, options) {
  if (stores.has(name)) {
    console.warn(`[Store] Store "${name}" already exists, returning existing instance.`);
    return stores.get(name);
  }
  const store = new Store(name, options);
  stores.set(name, store);
  return store;
}

/**
 * 获取已注册的 Store
 * @param {string} name
 * @returns {Store|undefined}
 */
export function getStore(name) {
  return stores.get(name);
}

/**
 * 移除 Store
 * @param {string} name
 */
export function removeStore(name) {
  stores.delete(name);
}

/** 清除所有 Store */
export function clearStores() {
  stores.clear();
}
