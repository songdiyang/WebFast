import { WebFastPage } from '../../core/page.js';

export default class AboutPage extends WebFastPage {
  constructor() {
    super({
      template: './template.html',
      style: './style.css',
    });
    this.setBaseUrl(import.meta.url);
  }

  onConnected() {
    this.listen('navigate', this.onNavigate);
  }

  onDisconnected() {
    this.unlisten('navigate', this.onNavigate);
  }

  onNavigate({ path }) {
    window.$router.navigate(path);
  }
}
