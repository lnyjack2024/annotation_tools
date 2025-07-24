import { pathToRegexp } from 'path-to-regexp';

import type { Route } from '@/models/connect';
import { reloadAuthorized } from './Authorized';
import { UserAuthority } from '../../config/routes.config';

// use localStorage to store the authority info, which might be sent from server in actual project.
export function getAuthority(str?: string): string | string[] {
  const authorityString =
    typeof str === 'undefined' ? localStorage.getItem('appen-authority') : str;
  let authority;
  try {
    if (authorityString) {
      authority = JSON.parse(authorityString);
    }
  } catch (e) {
    authority = authorityString;
  }
  if (typeof authority === 'string') {
    return [authority];
  }

  return authority;
}

export function setAuthority(authority: string | string[]): void {
  const proAuthority = typeof authority === 'string' ? [authority] : authority;
  localStorage.setItem('appen-authority', JSON.stringify(proAuthority));
  reloadAuthorized();
}

/**
 * props.route.routes
 * @param routers [{}]
 * @param pathname string
 */
export const getAuthorityFromRouter = <
  T extends { path?: string; children?: T[]; authority?: string[] },
>(
  routers: T[] = [],
  pathname: string,
): T | undefined => {
  let parentRoute: T;
  const getAuthRouter = (routes: T[] = [], pathname: string): T | undefined => {
    for (let i = 0; i < routes.length; i++) {
      let route = routes[i];
      if (route.path && pathToRegexp(route.path).exec(pathname)) {
        if (!route.authority && parentRoute) {
          route.authority = parentRoute.authority;
        }
        return route;
      }
      if (Array.isArray(route.children)) {
        if (route.authority) {
          parentRoute = route;
        }
        const router = getAuthRouter(route.children, pathname);
        if (router) {
          return router;
        }
      }
    }
    return undefined;
  };

  return getAuthRouter(routers, pathname);
};

export function rolesConvert(roles: string[]) {
  return roles.map(role => role.toLowerCase().replace(/\s+/g, ''));
}

export function isPM(roles: string[] = []): boolean {
  const convertRoles = rolesConvert(roles);
  return convertRoles.indexOf(UserAuthority.PM) !== -1;
}

export async function getUserRoles(roles: string[] = []) {
  const newRoles = roles.slice();
  const convertedRoles = rolesConvert(newRoles);

  return {
    convertedRoles,
  };
}
