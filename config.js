/**
 * WebFast Config - 全局配置
 *
 * 所有应用级配置集中在此，便于 AI 统一修改。
 */

export const config = {
  // 应用名称
  appName: 'WebFast App',

  // 路由模式: 'history' | 'hash'
  routerMode: 'history',

  // 页面容器 ID
  appContainer: '#app',

  // 默认页面布局
  defaultLayout: null,

  // API 基础地址
  apiBaseUrl: '',

  // 请求超时时间（毫秒）
  requestTimeout: 10000,

  // 是否启用开发日志
  debug: true,
};

/**
 * 动态修改配置
 * @param {object} partial
 */
export function setConfig(partial) {
  Object.assign(config, partial);
}
