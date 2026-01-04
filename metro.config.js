const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  extraNodeModules: new Proxy(
    {},
    {
      get: (target, name) => {
        // Redirect node_modules resolution to the actual project directory
        return path.join(__dirname, `node_modules/${name}`);
      },
    }
  ),
  // Explicitly disable symnlink resolution
  resolveRequest: (context, moduleName, platform) => {
    // Remove any absolute paths and force relative resolution
    if (moduleName.startsWith("/mnt/") || moduleName.startsWith("./mnt/")) {
      const cleanModuleName = moduleName.replace(
        /^\.?\/mnt\/.*?\/node_modules\//,
        ""
      );
      return context.resolveRequest(context, cleanModuleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Watch all files in the project directory
config.watchFolders = [__dirname];

// Reset cache on start
config.resetCache = true;

module.exports = config;
