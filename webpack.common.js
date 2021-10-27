const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

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
                test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
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
        new WorkboxPlugin.GenerateSW({
            // these options encourage the ServiceWorkers to get in there fast
            // and not allow any straggling "old" SWs to hang around
            clientsClaim: true,
            skipWaiting: true,
            maximumFileSizeToCacheInBytes: 10240000,
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
