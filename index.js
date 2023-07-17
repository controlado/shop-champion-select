import { layerManager, addRoutines, sleep, StoreBase, Champion } from "../controladoUtils";
import trans from "./trans.json";
import "./assets/style.css";

/**
 * @author balaclava
 * @name shop-champion-select
 * @link https://github.com/controlado/shop-champion-select
 * @description Buy champions inside Champion Select! 🐧
 */

class Store extends StoreBase {
    async getNotOwnedChampions() {
        const response = await this.request("GET", "/storefront/v3/view/champions");
        return response.data.catalog
            .filter(champion => !champion.owned)
            .map(champion => ({ ...champion, name: champion.name.toLowerCase() }));
    }

    async getWallet() {
        const { data } = await this.request("GET", "/storefront/v3/view/misc");
        return { ip: data.player.ip, rp: data.player.rp };
    }
}

class Icon {
    constructor(store) {
        this.element = document.createElement("div");
        this.element.classList.add("mini-icon-champion");

        this.img = document.createElement("img");
        this.img.classList.add("mini-icon-img");
        this.element.appendChild(this.img);

        this.store = store;
        this.champion = null;
    }

    setChampion(champion) {
        this.champion = new Champion(champion.itemId, champion.ip);
        this.img.src = `/lol-game-data/assets/v1/champion-icons/${this.champion.id}.png`;
    }

    show() {
        this.element.style.display = "block";
    }

    hide() {
        this.element.style.display = "none";
    }
}

class Tooltip {
    constructor(position) {
        this.element = document.createElement("div");
        this.element.setAttribute("id", "lol-uikit-tooltip-root");
        this.element.classList.add("tooltip", "tooltip-random-champion");

        const tooltipContent = document.createElement("lol-uikit-tooltip");
        tooltipContent.setAttribute("data-tooltip-position", position);
        tooltipContent.setAttribute("type", "system");

        const tooltipBlock = document.createElement("lol-uikit-content-block");
        tooltipBlock.setAttribute("type", "tooltip-system");

        const tooltipText = document.createElement("p");
        tooltipText.innerText = this.getLabel();

        tooltipBlock.appendChild(tooltipText);
        tooltipContent.appendChild(tooltipBlock);
        this.element.appendChild(tooltipContent);
    }

    getLabel() {
        const clientLocale = document.body.dataset.lang;
        return trans.tooltip[clientLocale] || trans.tooltip[trans.missing];
    }

    show(receiver) {
        const rect = receiver.getBoundingClientRect();
        this.element.style.top = `${rect.top + rect.height - 38}px`;
        this.element.style.left = `${rect.left + rect.width}px`;
        layerManager.appendChild(this.element);
    }

    hide() {
        layerManager.removeChild(this.element);
    }
}

async function setupElements(selector) {
    const gridHeader = document.querySelector(selector);
    if (!gridHeader || gridHeader.hasAttribute("shop-champion-select")) { return; }

    gridHeader.setAttribute("shop-champion-select", "true");

    const store = new Store();
    while (!store.token) {
        await sleep(500);
    }

    const championSearchInput = gridHeader.querySelector(".champion-input");
    updateInputPlaceholder(store, championSearchInput);
    let champions = await store.getNotOwnedChampions();

    const icon = new Icon(store);
    gridHeader.appendChild(icon.element);

    const tooltip = new Tooltip("right");
    icon.element.addEventListener("mouseleave", () => tooltip.hide());
    icon.element.addEventListener("mouseenter", () => tooltip.show(icon.element));
    icon.element.addEventListener("click", async () => {
        await store.buyChampions(icon.champion);
        updateInputPlaceholder(store, championSearchInput);
    });

    championSearchInput.addEventListener("keydown", async event => {
        if (event.key === "F5") {
            champions = await store.getNotOwnedChampions();
            championSearchInput.dispatchEvent(new Event("input"));
            console.debug("shop-champion-select: Refreshed champions");
        }
    });

    championSearchInput.addEventListener("input", () => {
        if (!championSearchInput.value) {
            icon.hide();
            return;
        }

        const championSearchInputValue = championSearchInput.value.toLowerCase();
        const filteredChampions = champions.filter(champion => champion.name.startsWith(championSearchInputValue));

        if (filteredChampions.length === 1) {
            icon.setChampion(...filteredChampions);
            icon.show();
        } else {
            icon.hide();
        }
    });
}

async function updateInputPlaceholder(store, input) {
    const wallet = await store.getWallet();
    input.setAttribute("placeholder", `BE: ${wallet.ip}`);
}

addEventListener("load", () => {
    addRoutines(() => setupElements(".champion-grid-header"));
    console.debug("shop-champion-select: Report bugs to Balaclava#1912");
});