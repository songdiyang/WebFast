import { WebFastPage } from '../../core/page.js';

export default class UserPage extends WebFastPage {
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

  onRouteEnter(params, query) {
    this.render({
      userId: params.id,
      query: JSON.stringify(query),
      loading: false,
    });
  }

  onNavigate({ path }) {
    window.$router.navigate(path);
  }
}
