const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
var WebpackPwaManifest = require("webpack-pwa-manifest");

module.exports = {
    entry: "./src/index.tsx",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|webp|ico)$/i,
                type: "asset/resource",
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: "asset/resource",
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "Cistern Chapel",
            template: "./src/index-template.html",
            favicon: "src/assets/icons/favicon.ico",
        }),
        new CopyPlugin({
            patterns: [
                { from: "./src/audio", to: "audio" },
                { from: "./src/assets/icons", to: "icons" },
            ],
        }),
        new MiniCssExtractPlugin({
            filename: "[name].[contenthash].css",
        }),
        new WebpackPwaManifest({
            name: "Cistern Chapel",
            short_name: "CisternChapel",
            description: "Cistern Chapel web audio sound art of sorts",
            background_color: "black",
            theme_color: "#883714",
            start_url: "/cistern-chapel/index.html",
            icons: [
                {
                    src: path.resolve("src/assets/icons/android-chrome-192x192.png"),
                    sizes: "192x192",
                    type: "image/png",
                    purpose: "any maskable",
                },
                {
                    src: path.resolve("src/assets/icons/android-chrome-512x512.png"),
                    sizes: "512x512",
                    type: "image/png",
                },
            ],
        }),
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        filename: "[name].[contenthash].js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
        publicPath: "", // To resolve the WebpackManifestPlugin prefixing output with "auto"
    },
    optimization: {
        minimizer: [new CssMinimizerPlugin(), new TerserPlugin()],
    },
};
