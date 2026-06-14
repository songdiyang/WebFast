import { WebFastComponent } from '../../core/component.js';

export default class AppHeader extends WebFastComponent {
  constructor() {
    super({
      template: './template.html',
      style: './style.css',
      shadow: false,
    });
    this.setBaseUrl(import.meta.url);
  }

  async connectedCallback() {
    // 检查是否已有子内容（水合模式）
    const hasChildren = this.children.length > 0;
    if (hasChildren) {
      // 水合模式：已有静态内容，只绑定事件
      this._initialized = true;
      this._bindEvents();
    } else {
      // 标准模式：加载模板渲染
      await this._init();
    }
    this.onConnected && this.onConnected();
  }

  events() {
    return {
      'click .nav-link': this.onNavClick,
    };
  }

  onNavClick(e) {
    const href = e.target.getAttribute('href');
    // 外部链接不拦截
    if (href && (href.startsWith('http') || href.startsWith('//'))) {
      return;
    }
    e.preventDefault();
    this.emit('navigate', { path: href });
  }
}
