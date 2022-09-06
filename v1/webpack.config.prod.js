const path = require("path");
module.exports = {
  mode: "production",
  entry: ["./src/js/index.js"],
  devtool: false,
  output: {
    filename: "gridviz.min.js",
    publicPath: "build",
    library: "gridviz",
    libraryTarget: "umd",
    path: path.resolve(__dirname, "build")
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        exclude: /node_modules/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: '[hash]-[name].[ext]',
        },
      }
    ]
  },
  watch: false,
  optimization: {
    usedExports: true,
    minimize: true
  }
};
