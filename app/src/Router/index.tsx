import { RouteObject } from 'react-router-dom';
import { RouteConfig } from './types';
import { routes } from './routes';

// 将我们的 RouteConfig 转换为 React Router 期望的 RouteObject 格式
function convertRoutes(routes: RouteConfig[]): RouteObject[] {
  return routes.map(route => ({
    path: route.path,
    element: <route.component />,
    children: route.children ? convertRoutes(route.children) : undefined
  }));
}

export const routeConfig = convertRoutes(routes); 