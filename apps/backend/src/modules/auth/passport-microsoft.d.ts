declare module 'passport-microsoft' {
  import type { Request } from 'express';

  export interface MicrosoftProfile {
    id: string;
    displayName: string;
    emails?: { type?: string; value: string }[];
    _json?: { mail?: string; userPrincipalName?: string };
  }

  export class Strategy {
    constructor(
      options: {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
        scope?: string[];
        tenant?: string;
        passReqToCallback?: boolean;
      },
      verify?: (...args: unknown[]) => void,
    );
    name: string;
    authenticate(req: Request, options?: unknown): void;
  }
}
