import { WebFastPage } from '../../core/page.js';

export default class HomePage extends WebFastPage {
  constructor() {
    super({
      template: './template.html',
      style: './style.css',
    });
    this.setBaseUrl(import.meta.url);
  }

  onConnected() {
    // 监听全局导航事件（来自 app-header）
    this.listen('navigate', this.onNavigate);
  }

  onDisconnected() {
    this.unlisten('navigate', this.onNavigate);
  }

  onNavigate({ path }) {
    window.$router.navigate(path);
  }

  events() {
    return {
      'click .demo-btn': this.onDemoClick,
    };
  }

  onDemoClick() {
    window.$router.navigate('/user/42');
  }
}
