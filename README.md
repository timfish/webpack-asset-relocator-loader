# @timfish/webpack-asset-relocator-loader

This loader wraps `@vercel/webpack-asset-relocator-loader@1.4.1` and modifies
loading paths so that they are compatible with [**Electron Forge**](https://www.electronforge.io/config/plugins/webpack).

It works in development and production for both main and renderer processes.

This replaces `@marshallofsound/webpack-asset-relocator-loader` which has become
unmaintained.

Add it to your loader rules in the same way as before:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.node$/,
        use: "node-loader",
      },
      {
        test: /\.(m?js|node)$/,
        parser: { amd: false },
        use: {
          loader: "@timfish/webpack-asset-relocator-loader",
          options: {
            outputAssetBase: "native_modules",
          },
        },
      },
    ],
  },
};
```
