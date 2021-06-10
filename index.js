const vercelLoader = require("@vercel/webpack-asset-relocator-loader");

function isRendererTarget(target) {
  // target can be a string or an array of strings
  return (
    (typeof target === "string" && target === "electron-renderer") ||
    (Array.isArray(target) && target.includes("electron-renderer"))
  );
}

const hooked = new WeakSet();

function interceptCodeInjection(compilation) {
  const {
    compiler: { options },
    mainTemplate,
  } = compilation;

  // We only want to modify paths if the current webpack config is for a
  // renderer. The Vercel loader works in the main process without modification.
  //
  // This loader will be called multiple times and we only want to hook the
  // intercept the code injection once!
  if (isRendererTarget(options.target) && !hooked.has(mainTemplate)) {
    hooked.add(mainTemplate);

    const isProd = options.mode === "production";

    // We intercept the Vercel loader code injection and replace __dirname with
    // code that works with Electron Forge
    //
    // Here is where the injection occurs:
    // https://github.com/vercel/webpack-asset-relocator-loader/blob/4710a018fc8fb64ad51efb368759616fb273618f/src/asset-relocator.js#L331-L339
    mainTemplate.hooks.requireExtensions.intercept({
      register: (tapInfo) => {
        if (tapInfo.name == "asset-relocator-loader") {
          // We store the original function because we're about to overwrite it
          // and we still need to call it
          const originalFn = tapInfo.fn;

          tapInfo.fn = (source, chunk) => {
            const originalInjectCode = originalFn(source, chunk);

            if (isProd) {
              // In production, the native asset base is up one directory from
              // __dirname.
              //
              // We use dirname(__filename) because there is a bug in
              // html-webpack-plugin where it throws an error if the bundle
              // contains __dirname 🤷‍♂️
              return (
                "const { dirname, resolve } = require('path');\n" +
                originalInjectCode.replace(
                  "__dirname",
                  "resolve(dirname(__filename), '..')"
                )
              );
            } else {
              // In development, the app is loaded via webpack-dev-server so
              // __dirname is useless because it points to Electron internal
              // code. Instead we just hard-code the absolute path to the webpack
              // output
              return originalInjectCode.replace(
                "__dirname",
                JSON.stringify(options.output.path)
              );
            }
          };
        }

        return tapInfo;
      },
    });
  }
}

module.exports = async function (content, map) {
  interceptCodeInjection(this._compilation);
  return vercelLoader.call(this, content, map);
};
