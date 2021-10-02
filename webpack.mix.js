const mix = require('laravel-mix');
require('mix-html-builder');

mix.webpackConfig({
    module: {
        rules: [
            {
                test: /\.txt$/,
                use: 'file-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.txt'],
    },
});

mix.setPublicPath('public');
mix.ts('src/index.ts', 'public/js');
mix.sass('src/index.scss', 'public/css');
mix.html({output: '', inject: true});
mix.version();
