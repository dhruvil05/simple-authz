declare module "simple-authz" {
  interface User {
    role?: string;
    roles?: string[];
    [key: string]: any;
  }

  interface ExplainResult {
    allowed: boolean;
    role?: string;
    resource?: string;
    action?: string;
    reason: string;
    condition?: any;
  }

  class Authz {
    load(path: string): void;
    can(user: User, action: string, resource: string, data?: any): boolean;
    explain(
      user: User,
      action: string,
      resource: string,
      data?: any,
    ): ExplainResult;
    middleware(action: string, resource: string): any;
  }

  const authz: Authz;
  export = authz;
}
