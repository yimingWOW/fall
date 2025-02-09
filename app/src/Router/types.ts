export interface RouteConfig {
  path: string;
  component: React.ComponentType<any> | (() => JSX.Element);
  children?: RouteConfig[];
  meta?: {
    title?: string;
    requiresWallet?: boolean;
    layout?: 'default' | 'full';
  };
} 