/**
 * HostingTargetEngine
 *
 * Determines the hosting model and provisions abstract targets:
 * LOCAL, DOCKER, VM, CLOUD, MANAGED_PLATFORM, CUSTOM.
 * Never fakes deployment if provider credentials are required.
 */

export type HostingTargetType =
  | "LOCAL"
  | "DOCKER"
  | "VM"
  | "CLOUD"
  | "MANAGED_PLATFORM"
  | "CUSTOM";

export interface HostingTarget {
  type: HostingTargetType;
  frontend: string;
  backend: string;
  database: string;
  deploymentStrategy: string;
  configurationRequired: string[];
  isProvisionable: boolean;
  ports: { frontend: number; backend: number; database: number };
  detail: string;
}

export class HostingTargetEngine {
  public static selectTarget(
    type: HostingTargetType = "LOCAL",
    credentials: Record<string, string> = {}
  ): HostingTarget {
    switch (type) {
      case "LOCAL":
        return {
          type: "LOCAL",
          frontend: "Vite dev/preview server (http://localhost:5173)",
          backend: "Node/Express server (http://localhost:3001)",
          database: "Local SQLite / PostgreSQL container (:5432)",
          deploymentStrategy: "LOCAL_PROCESS_DAEMON",
          configurationRequired: [],
          isProvisionable: true,
          ports: { frontend: 5173, backend: 3001, database: 5432 },
          detail: "Local development/staging runtime environment ready",
        };

      case "DOCKER":
        return {
          type: "DOCKER",
          frontend: "Nginx static container (:80)",
          backend: "Node.js container (:3001)",
          database: "PostgreSQL container (:5432)",
          deploymentStrategy: "DOCKER_COMPOSE",
          configurationRequired: [],
          isProvisionable: true,
          ports: { frontend: 80, backend: 3001, database: 5432 },
          detail: "Docker container stack configured with compose specification",
        };

      case "CLOUD":
        const hasCloudCreds = Boolean(credentials.AWS_ACCESS_KEY_ID || credentials.GCP_PROJECT_ID);
        return {
          type: "CLOUD",
          frontend: "CloudFront / S3 or Cloud CDN",
          backend: "ECS / Cloud Run / Kubernetes",
          database: "RDS / Cloud SQL",
          deploymentStrategy: "TERRAFORM_IAC",
          configurationRequired: hasCloudCreds ? [] : ["CLOUD_PROVIDER_CREDENTIALS"],
          isProvisionable: hasCloudCreds,
          ports: { frontend: 443, backend: 443, database: 5432 },
          detail: hasCloudCreds ? "Cloud infrastructure provisionable" : "Cloud provider credentials CONFIGURATION_REQUIRED",
        };

      case "MANAGED_PLATFORM":
        const hasPlatformKey = Boolean(credentials.VERCEL_TOKEN || credentials.RAILWAY_TOKEN);
        return {
          type: "MANAGED_PLATFORM",
          frontend: "Vercel / Netlify Edge Network",
          backend: "Railway / Render Web Service",
          database: "Neon / Supabase Serverless Postgres",
          deploymentStrategy: "MANAGED_WEBHOOK_DEPLOY",
          configurationRequired: hasPlatformKey ? [] : ["PLATFORM_API_TOKEN"],
          isProvisionable: hasPlatformKey,
          ports: { frontend: 443, backend: 443, database: 5432 },
          detail: hasPlatformKey ? "Managed platform connected" : "Platform API token CONFIGURATION_REQUIRED",
        };

      case "VM":
        const hasSsh = Boolean(credentials.SSH_PRIVATE_KEY || credentials.SERVER_HOST);
        return {
          type: "VM",
          frontend: "Nginx Reverse Proxy on VPS",
          backend: "PM2 / systemd Node service",
          database: "PostgreSQL service on VM",
          deploymentStrategy: "ANSIBLE_SSH_PROVISION",
          configurationRequired: hasSsh ? [] : ["SSH_ACCESS_KEYS"],
          isProvisionable: hasSsh,
          ports: { frontend: 443, backend: 3001, database: 5432 },
          detail: hasSsh ? "VPS host reachable via SSH" : "SSH credentials CONFIGURATION_REQUIRED",
        };

      case "CUSTOM":
      default:
        return {
          type: "CUSTOM",
          frontend: "Custom Frontend Runner",
          backend: "Custom Backend Runner",
          database: "External Database URL",
          deploymentStrategy: "CUSTOM_SCRIPT",
          configurationRequired: ["CUSTOM_DEPLOY_SPEC"],
          isProvisionable: false,
          ports: { frontend: 8080, backend: 8000, database: 5432 },
          detail: "Custom hosting target specification required",
        };
    }
  }
}
