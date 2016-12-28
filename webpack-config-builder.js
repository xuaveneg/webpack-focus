import webpack from 'DEV_ARCHETYPE/webpack';
import HtmlWebpackPlugin from 'DEV_ARCHETYPE/html-webpack-plugin';
import ExtractTextPlugin from 'DEV_ARCHETYPE/extract-text-webpack-plugin';
import { defaultsDeep } from 'DEV_ARCHETYPE/lodash';
import path from 'path';
import os from 'os';

const USER = os.hostname();

// Environment settings
let {
    DEV = 'true',                               // Toggles the hot reloading
    DEV_SERVER_HOST = 'localhost',              // Dev server hostname
    DEV_SERVER_PORT = 3000,                     // Dev server port
    ENTRY_FILE_PATH = './src',                  // Entry file to build the application
    npm_package_name = 'your-project',          // Project name, automatically set by npm
    OUTPUT_DIR = './dist',                      // Output directory
    PAGE_TITLE = 'You project landing page',    // Generated HTML page title
    ANCHOR_CLASS = 'your-project',              // Generated HTML div's class
    PUBLIC_PATH = '/',                          // Output public path
    GENERATE_HTML = 'true',                     // Toggle index.html auto generation
    BABELIFIED_PATH = './src',                  // Directory that will be babelified
    MINIMIFY = 'false',                         // Toggles sources minification
    LIBRARY_NAME = 'YourProject',               // Name of the bundled project, when set on the window (for brunch projects)
    SOURCE_MAPS = 'true',                       // Toggles source maps generation
    DEBUG = 'true',                             // Toggles webpack debug
    PACKAGE_JSON_PATH = './',                   // package.json path inside of focus packages, as seen from their root file
    OUTPUT_PUBLIC_PATH,                         // Output directory, as seen from the index.html
    BROWSERS                                    // Browsers that should be taken into account by the autoprefixer-loader
} = process.env;
// Parse json settings
DEV = JSON.parse(DEV);
GENERATE_HTML = JSON.parse(GENERATE_HTML);
MINIMIFY = JSON.parse(MINIMIFY);
SOURCE_MAPS = JSON.parse(SOURCE_MAPS);
DEBUG = JSON.parse(DEBUG);
OUTPUT_PUBLIC_PATH = OUTPUT_PUBLIC_PATH !== undefined ? OUTPUT_PUBLIC_PATH : `http://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}/`;
BABELIFIED_PATH = [].concat(BABELIFIED_PATH);
const babelifiedIncludes = BABELIFIED_PATH.map((relativePath) => {
    return path.resolve(process.cwd(), relativePath);
});
/*************************************
********* Webpack config *************
**************************************/
const defaultConfig = definedVariables => ({
    entry: [
        path.resolve(process.cwd(), ENTRY_FILE_PATH)
    ].concat(DEV ? [                                                                    // In dev mode, add hot reloading
        `webpack-dev-server/client?http://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}`,
        'webpack/hot/only-dev-server'
    ] : []),
    output: {
        path: path.resolve(process.cwd(), OUTPUT_DIR),
        publicPath: OUTPUT_PUBLIC_PATH,
        filename: `${npm_package_name}.js`,                                             // Generated file will hold the package name
        libraryTarget: 'umd',
        library: LIBRARY_NAME
    },
    devtool: SOURCE_MAPS ? 'source-map' : false,
    debug: DEBUG,
    stats: {                                                                            // Sets webpack to quieter setting, to leave a clean console on build
        colors: true,
        version: false,
        timings: false,
        assets: false,
        chunks: false,
        modules: false,
        reasons: false,
        children: false,
        source: false,
        errors: true,
        errorDetails: true,
        warnings: true
    },
    plugins: [
        new webpack.DefinePlugin({                                                      // Define several global variables to be used in the project
            __DEV__: DEV ? 'true' : 'false',
            __ANCHOR_CLASS__: JSON.stringify(ANCHOR_CLASS),
            __PACKAGE_JSON_PATH__: JSON.stringify(PACKAGE_JSON_PATH),
            __USER__: JSON.stringify(USER),
            __PROJECT__: JSON.stringify(npm_package_name),
            ...definedVariables                                                         // Add user defined variables
        }),
        new webpack.optimize.DedupePlugin(),
        new ExtractTextPlugin(`${npm_package_name}.css`)                                // Generated a CSS file
    ].concat(DEV ? [
        new webpack.HotModuleReplacementPlugin()
    ] : []).concat(GENERATE_HTML ? [
        new HtmlWebpackPlugin({
            inject: 'body',
            templateContent: `<html>
    <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
        <meta charset="UTF-8">
        <title>${PAGE_TITLE}</title>
    </head>
    <body>
        <div class="${ANCHOR_CLASS}"/>
    </body>
</html>`
        })
    ] : []).concat(MINIMIFY ? [
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                screw_ie8: true,
                warnings: false
            }
        })
    ] : []),
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
    },
    module: {
        preLoaders: [
            {
                test: /\.js$/,
                loader: require.resolve('source-map-loader')
            }
        ],
        loaders: [
            {
                test: /\.(js|jsx)$/,
                loader: require.resolve('webpack-alternate-require-loader'),
                include: babelifiedIncludes,
                query: JSON.stringify({
                    'webpack-focus/require': require.resolve('webpack-focus/require')
                })
            },
            {
                test: /\.(js|jsx)$/,
                loader: require.resolve('babel-loader'),
                include: babelifiedIncludes,
                query: {
                    presets: [require.resolve('babel-preset-focus')],
                    plugins: [
                        [
                            'replace-require',
                            {
                                DEV_ARCHETYPE: "require('webpack-focus/require')"
                            }
                        ]
                    ]
                }
            },

            {
                test: /\.json$/,
                loaders: [require.resolve('json-loader')]
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract(require.resolve('style-loader'), require.resolve('css-loader') + '!' + require.resolve('postcss-loader') + `${BROWSERS ? '?{browsers:' + JSON.stringify(BROWSERS.split(',')) + '}' : ''}` + '!' + require.resolve('sass-loader'))
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract(require.resolve('style-loader'), require.resolve('css-loader'), require.resolve('postcss-loader') + `${BROWSERS ? '?{browsers:' + JSON.stringify(BROWSERS.split(',')) + '}' : ''}`)
            },
            {
                test: /\.png(\?.*)?$/,
                loader: require.resolve('url-loader'),
                query: { mimetype: 'image/png' }
            },
            {
                test: /\.jpg(\?.*)?$/,
                loader: require.resolve('url-loader'),
                query: { mimetype: 'image/jpg' }
            },
            {
                test: /\.gif(\?.*)?$/,
                loader: require.resolve('url-loader'),
                query: { mimetype: 'image/gif' }
            },
            {
                test: /\.woff(\?.*)?$/,
                loader: require.resolve('url-loader'),
                query: { limit: 50000, mimetype: 'application/font-woff' }
            },
            {
                test: /\.woff2(\?.*)?$/,
                loader: require.resolve('url-loader'),
                query: { limit: 50000, mimetype: 'application/font-woff' }
            },
            {
                test: /\.ttf(\?.*)?$/,
                loader: require.resolve('url-loader'),
                query: { limit: 50000, mimetype: 'application/octet-stream' }
            },
            {
                test: /\.eot(\?.*)?$/,
                loader: require.resolve('file-loader')
            },
            {
                test: /\.svg(\?.*)?$/,
                loader: require.resolve('url-loader'),
                query: { limit: 50000, mimetype: 'image/svg+xml' }
            }
        ]
    }
});

export const configBuilder = (customConf = {}, definedVariables = {}) => defaultsDeep(customConf, defaultConfig(definedVariables));
