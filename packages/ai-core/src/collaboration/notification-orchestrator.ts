/**
 * NotificationOrchestrator
 *
 * Governs enterprise notifications across Desktop, CLI, Email, and Webhooks with secret masking and tenant isolation.
 */

import { SecretProvider } from "../security/secret-provider.js";

export type NotificationChannel = "DESKTOP" | "CLI" | "EMAIL" | "WEBHOOK" | "IN_APP";

export interface EnterpriseNotification {
  notificationId: string;
  organizationId: string;
  category: "APPROVAL_REQUIRED" | "DEPLOYMENT_COMPLETED" | "INCIDENT_ESCALATED" | "SECURITY_ALERT";
  recipientUserIds: string[];
  channel: NotificationChannel;
  title: string;
  message: string;
  timestamp: string;
}

export class NotificationOrchestrator {
  private static notifications: EnterpriseNotification[] = [];

  public static sendNotification(params: Omit<EnterpriseNotification, "notificationId" | "timestamp" | "message"> & { rawMessage: string }): EnterpriseNotification {
    const maskedMessage = SecretProvider.maskSecrets(params.rawMessage);
    const notif: EnterpriseNotification = {
      notificationId: `notif_${Date.now()}`,
      organizationId: params.organizationId,
      category: params.category,
      recipientUserIds: params.recipientUserIds,
      channel: params.channel,
      title: params.title,
      message: maskedMessage,
      timestamp: new Date().toISOString(),
    };
    this.notifications.push(notif);
    return notif;
  }

  public static listNotifications(organizationId?: string): EnterpriseNotification[] {
    if (organizationId) {
      return this.notifications.filter((n) => n.organizationId === organizationId);
    }
    return [...this.notifications];
  }

  public static reset(): void {
    this.notifications = [];
  }
}
