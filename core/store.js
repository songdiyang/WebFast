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
   * @param {object} options.getters - 派生状态计算函数，签名 (state) => value
   * @param {object} options.modules - 子模块 { name: StoreOptions }
   */
  constructor(name, { state = {}, actions = {}, getters = {}, modules = {} } = {}) {
    this._name = name;
    this._state = deepClone(state);
    this._actions = actions;
    this._getters = {};
    this._modules = new Map();
    this._plugins = [];
    this._batchTimer = null;
    this._pendingNotify = false;
    /** @type {Set<(state: object) => void>} */
    this._subscribers = new Set();

    // 注册 getters
    for (const [key, fn] of Object.entries(getters)) {
      Object.defineProperty(this._getters, key, {
        get: () => fn(this._state),
        enumerable: true,
      });
    }

    // 注册子模块（命名空间）
    for (const [moduleName, moduleOptions] of Object.entries(modules)) {
      const moduleStore = new Store(`${name}/${moduleName}`, moduleOptions);
      this._modules.set(moduleName, moduleStore);
      // 代理模块状态到根状态
      this._state[moduleName] = moduleStore._state;
    }
  }

  /**
   * 获取 getter 值
   * @param {string} key
   * @returns {any}
   */
  get(key) {
    if (this._getters[key] !== undefined) {
      return this._getters[key];
    }
    // 尝试从模块获取
    const [moduleName, getterName] = key.split('/');
    if (getterName && this._modules.has(moduleName)) {
      return this._modules.get(moduleName).get(getterName);
    }
    return undefined;
  }

  /**
   * 注册插件
   * @param {Function} plugin - (store) => { ... }
   */
  use(plugin) {
    this._plugins.push(plugin);
    plugin(this);
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
    // 批量更新：使用微任务合并多次通知
    if (!this._pendingNotify) {
      this._pendingNotify = true;
      queueMicrotask(() => {
        this._pendingNotify = false;
        this._notify(oldState, this._state);
      });
    }
  }

  /**
   * 订阅状态变化
   * @param {(state: object, oldState: object) => void} fn
   * @returns {() => void} 取消订阅函数
   */
  subscribe(fn) {
    this._subscribers.add(fn);
    // 立即返回当前状态（方便初始化）
    return () => this._subscribers.delete(fn);
  }

  /**
   * 获取子模块
   * @param {string} name
   * @returns {Store|undefined}
   */
  module(name) {
    return this._modules.get(name);
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
