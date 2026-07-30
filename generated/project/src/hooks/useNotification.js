import { NotificationService } from '../services/NotificationService.js';

export class useNotification {
  constructor(alertElementId) {
    this.notificationService = new NotificationService();
    this.alertElement = document.getElementById(alertElementId);
  }

  notify(message, playSound = true) {
    this.notificationService.requestBrowserPermission();
    
    if (playSound) {
      this.notificationService.playBeep();
    }

    this.notificationService.showBrowserNotification('Countdown Timer', message);

    if (this.alertElement) {
      this.alertElement.textContent = message;
      this.alertElement.classList.remove('hidden');
      
      setTimeout(() => {
        this.alertElement.classList.add('hidden');
      }, 5000);
    }
  }
}