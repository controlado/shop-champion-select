import { sleep, layerManager, addRoutines, linkEndpoint, request, StoreBase, Champion } from "https://cdn.skypack.dev/balaclava-utils@latest";
import { version } from "../package.json";
import trans from "./trans.json"; // If you want to help me translate this, please open a PR! :)
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
        const response = await request("GET", "/lol-inventory/v1/wallet/lol_blue_essence");
        const { lol_blue_essence } = await response.json(); // TODO: Encapsulate this

        this.element.setAttribute("placeholder", `BE: ${lol_blue_essence}`);
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
    await Promise.all([championSearchInput.refreshPlaceholder(), championSearchInput.updateChampions()]);

    const icon = new Icon(store);
    gridHeader.appendChild(icon.element);

    const tooltip = new Tooltip("right");
    icon.element.addEventListener("mouseleave", () => tooltip.hide());
    icon.element.addEventListener("mouseenter", () => tooltip.show(icon.element));
    icon.element.addEventListener("click", () => store.buyChampions(icon.champion));
    icon.element.addEventListener("contextmenu", async () => {
        const buyResponse = await store.buyChampions(icon.champion);
        if (buyResponse.status !== 200) {
            console.debug("shop-champion-select(buy): error", buyResponse);
            return;
        }

        await sleep(1000); // o campeão não fica imediatamente disponível
        const sessionResponse = await request("GET", "/lol-champ-select/v1/session");
        const { localPlayerCellId, actions } = await sessionResponse.json();

        for (const action of actions) {
            for (const subAction of action) {
                if (subAction.completed === false && subAction.actorCellId === localPlayerCellId) {
                    const body = { championId: icon.champion.id, completed: false };
                    const selectResponse = await request("PATCH", `/lol-champ-select/v1/session/actions/${subAction.id}`, { body });
                    if (selectResponse.ok) { return; }
                    else {
                        const selectData = await selectResponse.json();
                        console.debug("shop-champion-select(select): error", selectData);
                    }
                }
            }
        }
    });

    championSearchInput.element.addEventListener("input", () => {
        const filteredChampions = championSearchInput.getSearchedChampions();
        if (filteredChampions.length === 1) {
            icon.setChampion(...filteredChampions);
            icon.show();
        } else {
            icon.hide();
        }
    });

    linkEndpoint("/lol-inventory/v1/wallet", (parsedEvent) => {
        if (parsedEvent.eventType === "Update") {
            championSearchInput.refreshPlaceholder();
            championSearchInput.updateChampions();
            console.debug("shop-champion-select: Refreshed champions");
        }
    });
}

addEventListener("load", () => {
    addRoutines(() => setupElements(".champion-grid-header", "shop-champion-select"));
    console.debug(`shop-champion-select(${version}): Report bugs to Balaclava#1912`);
});