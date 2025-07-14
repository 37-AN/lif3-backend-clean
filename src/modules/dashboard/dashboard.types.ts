export interface DeploymentEvent {
  id: string;
  timestamp: Date;
  service: 'render' | 'vercel' | 'github';
  event: string;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  branch: string;
  commit: string;
  message: string;
  url?: string;
  duration?: number;
}

export interface NotificationConfig {
  discord: {
    enabled: boolean;
    webhookUrl: string;
  };
  slack: {
    enabled: boolean;
    webhookUrl: string;
  };
}

export interface DeploymentStatus {
  timestamp: Date;
  services: {
    render: ServiceStatus;
    vercel: ServiceStatus;
    github: ServiceStatus;
  };
  recentEvents: DeploymentEvent[];
}

export interface ServiceStatus {
  status: string;
  lastDeployment?: Date;
  url?: string;
  lastCommit?: Date;
  repository?: string;
}

export interface GitHubEventsResponse {
  events: DeploymentEvent[];
  total: number;
  lastUpdate: Date;
}

export interface WebhookResponse {
  status: string;
  event: DeploymentEvent;
}

export interface DeploymentLogsResponse {
  logs: DeploymentEvent[];
  total: number;
  services: string[];
  lastUpdate: Date;
}

export interface StatusOverviewResponse {
  period: string;
  statistics: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
  };
  successRate: string | number;
  services: {
    render: number;
    vercel: number;
    github: number;
  };
  lastDeployment?: DeploymentEvent;
  notifications: NotificationConfig;
}