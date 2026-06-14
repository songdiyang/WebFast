import { WebFastComponent } from '../../core/component.js';

export default class AppFooter extends WebFastComponent {
  constructor() {
    super({
      template: './template.html',
      style: './style.css',
    });
    this.setBaseUrl(import.meta.url);
  }
}
