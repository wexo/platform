const webpack = require('webpack');
const merge = require('webpack-merge');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackPluginInjector = require('@shopware-ag/webpack-plugin-injector');
const AssetsPlugin = require('assets-webpack-plugin');
const config = require('../config');
const utils = require('./utils');

const baseWebpackConfig = require('./webpack.base.conf');

let mergedWebpackConfig = merge(baseWebpackConfig, {
    mode: 'development',
    node: {
        __filename: true
    },
    module: {
        rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap })
    },
    optimization: {
        splitChunks: {
            minSize: 0
        }
    },
    devtool: 'eval-source-map',
    plugins: [
        new webpack.DefinePlugin({
            'process.env': config.dev.env
        }),
        new MiniCssExtractPlugin({
            filename: utils.assetsPath('css/[name].css')
        }),
        // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new FriendlyErrorsPlugin(),
        new AssetsPlugin({
            filename: 'sw-plugin-dev.json',
            fileTypes: ['js', 'css'],
            includeAllFileTypes: false,
            fullPath: true,
            useCompilerPath: true,
            prettyPrint: true,
            keepInMemory: true,
            processOutput: utils.filterAssetsOutput
        })

    ]
});

const injector = new WebpackPluginInjector('var/plugins.json', mergedWebpackConfig, 'administration');

// Collecting feature flag paths from third party plugins
let pluginEntryFilePaths = [];
if (injector._plugins.length) {
    pluginEntryFilePaths = injector._plugins.map((plugin) => {
        return plugin.entryFile;
    });
}

// https://github.com/ampedandwired/html-webpack-plugin
injector.webpackConfig.plugins.push(
    utils.injectHtmlPlugin(
        baseWebpackConfig,
        utils.loadFeatureFlags(process.env.ENV_FILE, pluginEntryFilePaths),
        utils.getLatestApiVersion()
    )
);

mergedWebpackConfig = merge(injector.webpackConfig);

if (config.dev.openInEditor) {
    mergedWebpackConfig = utils.injectSwDevModeLoader(mergedWebpackConfig);
}
module.exports = mergedWebpackConfig;
