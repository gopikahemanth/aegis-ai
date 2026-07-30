export class SettingsForm {
  constructor(containerElement, settingsHook, onSaveCallback) {
    this.container = containerElement;
    this.settings = settingsHook;
    this.onSave = onSaveCallback;
    this.unsubscribe = null;
    this.render();
  }

  render() {
    const current = this.settings.getSettings();
    const currentMinutes = Math.floor(current.defaultDuration / 60);

    this.container.innerHTML = `
      <form class="settings-form" id="settings-form-element">
        <div class="input-field" style="align-items: flex-start;">
          <label for="default-duration">Default Duration (Minutes)</label>
          <input type="number" id="default-duration" min="1" max="180" value="${currentMinutes}" style="text-align: left;">
        </div>
        <div class="btn-group" style="margin-top: 1rem;">
          <button type="submit" class="btn btn-primary">Save Preferences</button>
        </div>
      </form>
    `;

    this.form = this.container.querySelector('#settings-form-element');
    this.durationInput = this.container.querySelector('#default-duration');

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const mins = parseInt(this.durationInput.value) || 5;
      const totalSeconds = mins * 60;
      this.settings.update({ defaultDuration: totalSeconds });
      if (this.onSave) {
        this.onSave(totalSeconds);
      }
    });

    this.unsubscribe = this.settings.subscribe(settings => {
      this.durationInput.value = Math.floor(settings.defaultDuration / 60);
    });
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}