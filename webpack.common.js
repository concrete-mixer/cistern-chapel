const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

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
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
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
            meta: {
                author: "Concrete Mixer Audio",
                description: "Cistern Chapel web audio sound art of sorts",
                // "Content-Security-Policy": {
                //     "http-equiv": "Content-Security-Policy",
                //     content: "default-src 'self'; object-src 'none'",
                // },
            },
        }),
        new CopyPlugin({
            patterns: [{ from: "./src/audio", to: "audio" }],
        }),
        new WebpackManifestPlugin({}),
        new MiniCssExtractPlugin({
            filename: "[name].[contenthash].css",
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
        minimizer: [new CssMinimizerPlugin()],
    },
};
