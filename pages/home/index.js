import { WebFastPage } from '../../core/page.js';

export default class HomePage extends WebFastPage {
  constructor() {
    super({
      template: './template.html',
      style: './style.css',
    });
    this.setBaseUrl(import.meta.url);
  }

  // 路由进入时获取数据（由 Router 调用）
  async onRouteEnter(params, query) {
    // 示例：异步数据获取
    try {
      const data = await this.$http.get('/api/home');
      this.render({ ...data, loaded: true });
    } catch (err) {
      console.warn('[HomePage] Failed to load home data:', err);
      this.render({ loaded: true, error: err.message });
    }
  }

  onConnected() {
    // 监听全局导航事件（来自 app-header）
    this.listen('navigate', this.onNavigate);
  }

  onDisconnected() {
    this.unlisten('navigate', this.onNavigate);
  }

  onNavigate({ path }) {
    // 使用事件委托触发的导航，通过 emit 让 Router 处理
    this.emit('navigate', { path });
  }

  events() {
    return {
      'click .demo-btn': this.onDemoClick,
    };
  }

  onDemoClick() {
    this.emit('navigate', { path: '/user/42' });
  }
}
