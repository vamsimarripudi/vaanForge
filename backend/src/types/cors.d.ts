declare module "cors" {
  import type { RequestHandler } from "express";

  interface CorsOptions {
    origin?: string | boolean | RegExp | Array<string | RegExp>;
    credentials?: boolean;
  }

  export default function cors(options?: CorsOptions): RequestHandler;
}
