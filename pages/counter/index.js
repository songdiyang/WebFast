import { WebFastPage } from '../../core/page.js';

export default class CounterPage extends WebFastPage {
  constructor() {
    super({
      template: './template.html',
      style: './style.css',
    });
    this.setBaseUrl(import.meta.url);
    this.count = 0;
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

  events() {
    return {
      'click .increment-btn': this.onIncrement,
      'click .decrement-btn': this.onDecrement,
    };
  }

  onIncrement() {
    this.count++;
    this.render({ count: this.count });
  }

  onDecrement() {
    this.count--;
    this.render({ count: this.count });
  }

  onRouteEnter() {
    this.render({ count: this.count });
  }
}
