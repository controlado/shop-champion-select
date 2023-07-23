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
        rollupOptions: {
            input: "src/index.js",
            output: {
                manualChunks: undefined,
                entryFileNames: "index.js",
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name.endsWith(".css")) {
                        return "assets/style.css";
                    }
                    return assetInfo.name;
                },
            }
        },
    },
    esbuild: {
        banner: banner,
        legalComments: "none",
    },
});
