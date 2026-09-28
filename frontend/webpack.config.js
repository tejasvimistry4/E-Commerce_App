const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const fs = require("fs");

// Load .env file
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath)) {
  try {
    const dotenv = require("dotenv");
    dotenv.config({ path: envPath });
  } catch (e) {
    // Fallback simple line-by-line .env parser if dotenv is not loaded
    const content = fs.readFileSync(envPath, "utf-8");
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
}

// Clean up any extraneous quotes around the client ID
const googleClientId = (process.env.REACT_APP_GOOGLE_CLIENT_ID || "")
  .replace(/^["']|["']$/g, "")
  .trim();

module.exports = {
  mode: "development",

  entry: "./src/main.tsx",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true,
    publicPath: "/",
  },

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
      },

      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader",
          "postcss-loader",
        ],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new webpack.DefinePlugin({
      "process.env": JSON.stringify({
        NODE_ENV: process.env.NODE_ENV || "development",
        REACT_APP_API_URL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
        REACT_APP_GOOGLE_CLIENT_ID: googleClientId,
      }),
    }),
  ],

  devServer: {
    port: 3000,
    historyApiFallback: true,
    hot: true,
  },

  devtool: "source-map",
};