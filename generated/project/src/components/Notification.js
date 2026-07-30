export class Notification {
  constructor(containerElement) {
    this.container = containerElement;
    this.element = null;
    this.timeoutId = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'notification';
    this.container.appendChild(this.element);
  }

  show(message, duration = 3000) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.element.textContent = message;
    this.element.classList.add('show');

    this.timeoutId = setTimeout(() => {
      this.element.classList.remove('show');
    }, duration);
  }
}