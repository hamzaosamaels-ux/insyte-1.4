export default async function handler(req: any, res: any) {
  const appModule = await import("../website/server.js");
  const app = appModule.default || appModule;
  return app(req, res);
}

