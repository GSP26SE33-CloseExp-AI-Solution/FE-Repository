const path = require("path");

module.exports = {
    webpack: {
        alias: {
            "@": path.resolve(__dirname, "src"),
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
