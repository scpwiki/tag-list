const path = require("path")
const TerserPlugin = require("terser-webpack-plugin")
const CleanPlugin = require("clean-webpack-plugin")
const HtmlPlugin = require("html-webpack-plugin")

module.exports = {
  mode: process.env.NODE_ENV,
  ...(
    process.env.NODE_ENV === "development"
    ? { devtool: "eval-source-map" }
    : {}
  ),
  output: {
    filename: "3211.js",
    path: path.resolve(__dirname, "./dist/")
  },
  module: {
    rules: [
      { test: /\.ts$/, use: "babel-loader" },
      { test: /\.html$/, use: "html-loader" }
    ]
  },
  resolve: { extensions: [".ts", ".js"] },
  optimization: {
    minimize: process.env.NODE_ENV === "production",
    minimizer: [ new TerserPlugin({ extractComments: false }) ],
    usedExports: true
  },
  plugins: [
    new CleanPlugin(),
    new HtmlPlugin()
  ]
}
