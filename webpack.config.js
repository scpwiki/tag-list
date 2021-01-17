const path = require("path")
const TerserPlugin = require("terser-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
  mode: process.env.NODE_ENV,
  ...(
    process.env.NODE_ENV === "development"
    ? { devtool: "eval-source-map" }
    : {}
  ),
  entry: path.resolve(__dirname, "./src/index.ts"),
  output: {
    filename: "tag-list.js",
    path: path.resolve(__dirname, "./dist/")
  },
  devServer: {
    compress: true
  },
  module: {
    rules: [
      { test: /\.ts$/, use: "babel-loader" },
      { test: /\.html$/, use: "html-loader" },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  resolve: { extensions: [".ts", ".js"] },
  optimization: {
    minimize: process.env.NODE_ENV === "production",
    minimizer: [ new TerserPlugin({ extractComments: false }) ],
    usedExports: true
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin()
  ]
}
