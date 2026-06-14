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
    // 使用事件委托，绑定到 header 容器上，更高效且支持动态内容
    return {
      'click .header-inner': this.onNavClick,
    };
  }

  onNavClick(e) {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    // 外部链接、锚点、mailto、tel 等不拦截
    if (
      !href ||
      href.startsWith('http') ||
      href.startsWith('//') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      link.hasAttribute('download') ||
      link.target === '_blank'
    ) {
      return;
    }
    e.preventDefault();
    this.emit('navigate', { path: href });
  }
}
