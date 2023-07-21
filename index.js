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

class Input {
    constructor(selector, store) {
        this.element = document.querySelector(selector);
        this.store = store;
        this.champions = [];
    }

    async refreshPlaceholder() {
        const wallet = await this.store.getWallet();
        this.element.setAttribute("placeholder", `BE: ${wallet.ip}`);
    }

    async updateChampions() {
        const newEvent = new Event("input");
        this.champions = await this.store.getNotOwnedChampions();
        this.element.dispatchEvent(newEvent);
    }

    getSearchedChampions() {
        const championSearchInputValue = this.element.value.toLowerCase();
        return this.champions.filter(champion => champion.name.startsWith(championSearchInputValue));
    }
}

async function setupElements(selector, attribute) {
    const gridHeader = document.querySelector(selector);
    if (!gridHeader || gridHeader.hasAttribute(attribute)) { return; }
    gridHeader.setAttribute(attribute, "true");

    const store = new Store();
    await store.wait(400);

    const championSearchInput = new Input(".champion-input", store);
    championSearchInput.refreshPlaceholder();
    await championSearchInput.updateChampions();

    const icon = new Icon(store);
    gridHeader.appendChild(icon.element);

    const tooltip = new Tooltip("right");
    icon.element.addEventListener("mouseleave", () => tooltip.hide());
    icon.element.addEventListener("mouseenter", () => tooltip.show(icon.element));
    icon.element.addEventListener("click", async () => {
        const response = await store.buyChampions(icon.champion);
        if (response.status === 200) {
            championSearchInput.refreshPlaceholder();
            championSearchInput.updateChampions();
        }
    });

    championSearchInput.element.addEventListener("keydown", event => {
        if (event.key === "F5") {
            championSearchInput.refreshPlaceholder();
            championSearchInput.updateChampions();
            console.debug("shop-champion-select: Refreshed champions");
        }
    });

    championSearchInput.element.addEventListener("input", () => {
        if (!championSearchInput.element.value) {
            icon.hide();
            return;
        }

        const filteredChampions = championSearchInput.getSearchedChampions();

        if (filteredChampions.length === 1) {
            icon.setChampion(...filteredChampions);
            icon.show();
        } else {
            icon.hide();
        }
    });
}

addEventListener("load", () => {
    addRoutines(() => setupElements(".champion-grid-header", "shop-champion-select"));
    console.debug("shop-champion-select: Report bugs to Balaclava#1912");
});