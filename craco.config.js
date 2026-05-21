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
};
