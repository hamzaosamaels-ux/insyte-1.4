// Monorepo wiring: Metro needs to watch the repo root (so changes in
// packages/shared are picked up) and resolve node_modules hoisted there
// by npm workspaces, in addition to this app's own node_modules.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules")
];

module.exports = withNativeWind(config, { input: "./global.css" });
