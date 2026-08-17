/**
 * NotificationGateway
 *
 * Routes notifications and human authorization requests across Desktop, CLI, and Webhooks.
 */

export interface NotificationPayload {
  notificationId: string;
  channel: "DESKTOP" | "CLI" | "WEBHOOK";
  title: string;
  body: string;
  requiresAction: boolean;
  timestamp: string;
}

export class NotificationGateway {
  private static sentNotifications: NotificationPayload[] = [];

  public static send(
    channel: NotificationPayload["channel"],
    title: string,
    body: string,
    requiresAction: boolean = false
  ): NotificationPayload {
    const payload: NotificationPayload = {
      notificationId: `notif_${Date.now()}`,
      channel,
      title,
      body,
      requiresAction,
      timestamp: new Date().toISOString(),
    };
    this.sentNotifications.push(payload);
    return payload;
  }

  public static listSent(): NotificationPayload[] {
    return [...this.sentNotifications];
  }

  public static clear(): void {
    this.sentNotifications = [];
  }
}
