export default async function handler(req: any, res: any) {
  const appModule = await import("../website/server");
  const app = appModule.default || appModule;
  return app(req, res);
}
