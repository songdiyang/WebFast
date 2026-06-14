import { WebFastComponent } from '../../core/component.js';

export default class AppHeader extends WebFastComponent {
  constructor() {
    super({
      template: './template.html',
      style: './style.css',
    });
    this.setBaseUrl(import.meta.url);
  }

  events() {
    return {
      'click .nav-link': this.onNavClick,
    };
  }

  onNavClick(e) {
    e.preventDefault();
    const path = e.target.getAttribute('href');
    this.emit('navigate', { path });
  }
}
