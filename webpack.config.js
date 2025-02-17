const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  const plugins = [
    new webpack.DefinePlugin({
      'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL),
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /samples\//
    }),
    new JavaScriptObfuscator({
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.3,
      deadCodeInjection: false,
      debugProtection: true,
      debugProtectionInterval: 2000,
      identifierNamesGenerator: "mangled-shuffled",
      simplify: true,
      splitStrings: true,
      splitStringsChunkLength: 5,
      stringArray: true,
      stringArrayCallsTransform: true,
      stringArrayCallsTransformThreshold: 0.5,
      stringArrayEncoding: ['base64'],
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 1,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 2,
      stringArrayWrappersType: 'variable',
      stringArrayThreshold: 0.5,
      transformObjectKeys: true,
      unicodeEscapeSequence: false,
    })
  ];

  if (isProduction) {
    plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@maskito\/core$/,
        })
    );
  }
  if (!isProduction) {
    plugins.push(new HtmlWebpackPlugin({
      template: 'src/index.html'
    }));
  }

  return {
    mode: isProduction ? 'production' : 'development',
    entry: isProduction ? './src/index.js': './src/index-dev.js',
    output: {
      path: path.resolve(__dirname, 'v1'),
      filename: isProduction ? 'bundle.min.js' : 'bundle.js',
      library: 'TonderSdk',
      libraryTarget: 'umd',
      globalObject: 'this',
    },
    devtool: isProduction ? false : 'inline-source-map',
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      host: '0.0.0.0',
      port: 8080,
      allowedHosts: 'all',
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
      ],
    },
    plugins: plugins,
    optimization: {
      minimizer: [
        new TerserPlugin({
          parallel: true,
          extractComments: false,
          terserOptions: {
            ecma: 2015,
            compress: {
              drop_debugger: true,
              passes: 2,
              unsafe: false
            },
            mangle: {
              toplevel: false
            },
            format: {
              comments: false
            }
          }
        }),
      ],
    },
  };
};