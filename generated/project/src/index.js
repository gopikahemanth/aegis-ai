import { useSettings } from './hooks/useSettings.js';
import { useCountdown } from './hooks/useCountdown.js';
import { TimerDisplay } from './components/TimerDisplay.js';
import { CountdownForm } from './components/CountdownForm.js';
import { SettingsForm } from './components/SettingsForm.js';
import { Notification } from './components/Notification.js';

document.addEventListener('DOMContentLoaded', () => {
  const settingsHook = new useSettings();
  const initialSettings = settingsHook.getSettings();
  
  const countdownHook = new useCountdown(initialSettings.defaultDuration);

  const notificationRoot = document.getElementById('notification-root');
  const notification = new Notification(notificationRoot);

  countdownHook.setOnComplete(() => {
    notification.show('Countdown completed!');
  });

  const timerDisplayRoot = document.getElementById('timer-display-root');
  new TimerDisplay(timerDisplayRoot, countdownHook);

  const countdownFormRoot = document.getElementById('countdown-form-root');
  const countdownForm = new CountdownForm(countdownFormRoot, countdownHook);
  countdownForm.setInitialInputs(initialSettings.defaultDuration);

  const settingsFormRoot = document.getElementById('settings-form-root');
  new SettingsForm(settingsFormRoot, settingsHook, (newDefaultSeconds) => {
    countdownHook.reset(newDefaultSeconds);
    countdownForm.setInitialInputs(newDefaultSeconds);
    notification.show('Settings saved successfully!');
  });

  // Navigation Logic
  const navButtons = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.view');

  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetViewId = e.target.getAttribute('data-target');

      navButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      views.forEach(view => {
        if (view.id === targetViewId) {
          view.classList.add('active');
        } else {
          view.classList.remove('active');
        }
      });
    });
  });
});