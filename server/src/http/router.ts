import type { IncomingMessage, ServerResponse } from 'http'

export type RouteHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>

interface RouteDefinition {
  method: string
  path: string
  handler: RouteHandler
}

/** Minimal exact-path router — Phase 2 has no dynamic route segments. */
export class Router {
  private routes: RouteDefinition[] = []

  get(path: string, handler: RouteHandler): void {
    this.routes.push({ method: 'GET', path, handler })
  }

  post(path: string, handler: RouteHandler): void {
    this.routes.push({ method: 'POST', path, handler })
  }

  match(method: string, pathname: string): RouteHandler | undefined {
    return this.routes.find((r) => r.method === method && r.path === pathname)?.handler
  }
}
