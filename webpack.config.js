const JsonMinimizerPlugin = require("json-minimizer-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const pkg = require("./package.json");

const banner = `/**
 * @author ${pkg.author}
 * @name ${pkg.name}
 * @link ${pkg.homepage}
 * @description ${pkg.description}
 * @version ${pkg.version}
 * @license ${pkg.license}
 */`;

module.exports = {
    experiments: {
        outputModule: true,
    },
    output: {
        filename: "index.js",
        module: true
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: "./src/*.json",
                    to: "[name][ext]",
                }
            ],
        }),
        new MiniCssExtractPlugin(
            {
                filename: "assets/style.css",

            }
        )
    ],
    optimization: {
        minimizer: [
            new JsonMinimizerPlugin(),
            new CssMinimizerPlugin(),
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    output: {
                        preamble: banner,
                        comments: false,
                    },
                },
            }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader"
                ],
            },
            {
                test: /\.json$/i,
                type: "json",
            },
        ],
    },
};;