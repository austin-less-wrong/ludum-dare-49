const mix = require('laravel-mix');
require('mix-html-builder');

mix.webpackConfig({
    module: {
        rules: [
            {
                test: /\.(txt|mp3)$/,
                use: 'file-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.txt', '.mp3'],
    },
});

mix.setPublicPath('public');
mix.setResourceRoot('./');
mix.ts('src/index.ts', 'public/js');
mix.sass('src/index.scss', 'public/css');
mix.html({output: '', inject: true, versioning: true});
mix.version();
