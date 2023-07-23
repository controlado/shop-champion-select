/**
 * @author balaclava
 * @name shop-champion-select
 * @link https://github.com/controlado/shop-champion-select
 * @description Buy champions inside Champion Select! 🐧
 */

import "https://cdn.skypack.dev/shop-champion-select@latest?min";

function addCssLink(url) {
    const link = document.createElement("link");
    link.href = url;
    link.type = "text/css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
}

window.addEventListener("load", () => {
    addCssLink("https://cdn.skypack.dev/shop-champion-select@latest/dist/assets/index.css");
});
