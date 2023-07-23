import { defineConfig } from "vite";
import pkg from "./package.json";

const banner = `/**
 * @author ${pkg.author}
 * @name ${pkg.name}
 * @link ${pkg.homepage}
 * @description ${pkg.description}
 * @version ${pkg.version}
 * @license ${pkg.license}
 */`;

export default defineConfig({
    build: {
        emptyOutDir: true,
        lib: {
            entry: "src/index.js",
            name: "shop-champion-select",
        },
        rollupOptions: {
            output: {
                manualChunks: undefined,
                assetFileNames: "assets/[name][extname]",
                chunkFileNames: "assets/[name].js",
                entryFileNames: "[name].js",
            },
        },
    },
    esbuild: {
        banner: banner,
        legalComments: "none",
    },
});
