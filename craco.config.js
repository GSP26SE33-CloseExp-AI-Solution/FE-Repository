const path = require("path");

module.exports = {
    webpack: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
        configure: (webpackConfig) => {
            webpackConfig.ignoreWarnings = [
                ...(webpackConfig.ignoreWarnings || []),
                (warning) =>
                    typeof warning.message === "string" &&
                    warning.message.includes("Failed to parse source map") &&
                    warning.message.includes("@zxing"),
            ]
            return webpackConfig
        },
    },

    devServer: {
        proxy: {
            "/api": {
                target: "https://c122w5dv-5014.asse.devtunnels.ms",
                changeOrigin: true,
                secure: false,
            },
        },
    },
};
