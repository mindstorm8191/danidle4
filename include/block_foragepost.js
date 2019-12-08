// Forage Post
// For DanIdle version 4
// Provides an early access to food for a users' colonists

import {
    blockOutputsItems,
    blockShowsOutputItems,
    blockHasWorkerPriority,
    blockHandlesFood,
    blockDeletesClean
} from "./activeblock.js";
import { blockHasRandomizedOutput } from "./blockAddon_HasRandomizedOutput";
import { game } from "./game.js";
import $ from "jquery";

export const foragepost = mapsquare => {
    let state = {
        name: "foragepost",
        tile: mapsquare,
        id: game.getNextBlockId(),
        counter: 0,
        allowOutput: false, // Determines if this block will output items. Later in the game, we will allow this item to output items,
        // and potentially other output types (like seeds to plant)
        getSeeds: false, // This is set to true when the user wants this block to search for seeds, along with edible items
        outputItems: [
            { name: "Apple", isFood: true, shelfLife: 120 },
            { name: "Berry", isFood: true, shelfLife: 80 },
            { name: "Tree Nut", isFood: true, shelfLife: 800 },
            { name: "Mushroom", isFood: true, shelfLife: 400 }
        ],
        seedsList: [
            { name: "Wheat Seeds", isFood: false },
            { name: "Carrot Seeds", isFood: false },
            { name: "Potato Seeds", isFood: false },
            //{ name: "Tomato Seeds", isFood: false },
            { name: "Bean Seeds", isFood: false },
            { name: "Corn", isFood: true }
            //{ name: "Onion Seeds", isFood: false },
            //{ name: "Pepper Seeds", isFood: false },
            //{ name: "Lettuce Seeds", isFood: false },
            //{ name: "Cucumber Seeds", isFood: false }
        ],
        craftTime: 30,

        // possibleoutputs is already defined in HasRandomizedOutput

        inputsAccepted() {
            // This block doesn't accept any items as input
            return [];
        },

        // willOutput() is already defined in blockOutputsItems

        willAccept() {
            // Returns true if this block will accept the specified item right now.
            // This block has no inputs
            return false;
        },

        receiveItem() {
            // Accepts an item as input. Returns true when successful, or false if not.
            // This block does not accept any input.
            return false;
        },

        update() {
            if (state.onhand.length >= 15) return; // cannot proceed if this inventory is full
            state.processCraft(1); // this function now handles checking & using workPoints.
        },

        drawpanel() {
            $("#sidepanel").html(`
                <b>Foraging Post</b><br />
                <br />
                All around you is a world teeming with life - and food. It is there for the taking, you just have to find it first.<br />
                <br />
                Collects edible foods from the surrounding environment.  Local supplies can only support up to 4 workers. Cannot place
                another one in this area<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Food on-hand:
                <div id="sidepanelonhand">${state.displayItemsOnHand()}</div>
                Progress to next: <span id="sidepanelprogress">${Math.floor(
                    (state.counter / state.craftTime) * 100
                )}</span>%<br />
                <br />
            `);
            state.showDeleteLink();
            // At this point, we need to allow players to enable an extended set of resource gathering for this block (which doesn't include
            // edible food). This will primarily be for collecting seeds to grow for farming.
            if (game.unlockedItems.includes("Flint Hoe")) {
                // Provide a button to let players enable or disable extra item searching
                $("#sidepanel").append(`
                    <br />
                    <span class="sidepanelbutton"
                          id="sidepanelgetseeds"
                          title="Allow collecting seeds, in addition to edible items"
                          style="background-color: ${state.getSeeds ? "green" : "red"}">Get Seeds</span>
                    <br />
                    <span class="sidepanelbutton"
                          id="sidepaneloutput"
                          title="Allow items to be output"
                          style="background-color: ${state.allowOutput ? "green" : "red"}">Output Items</span>
                `);
                document
                    .getElementById("sidepanelgetseeds")
                    .addEventListener("click", () => game.blockList.getById(state.id).toggleSeeds());
                document
                    .getElementById("sidepaneloutput")
                    .addEventListener("click", () => game.blockList.getById(state.id).toggleOutput());
            }
        },

        updatepanel() {
            $("#sidepanelonhand").html(state.displayItemsOnHand());
            $("#sidepanelprogress").html(Math.floor((state.counter / state.craftTime) * 100));
        },

        toggleSeeds() {
            // Enables or disables collection of seeds (in addition to other edible items)

            state.getSeeds = !state.getSeeds;
            if (state.getSeeds) {
                state.outputItems = [...state.outputItems, ...state.seedsList];
            } else {
                state.outputItems = state.outputItems.filter(ele => !state.seedsList.includes(ele));
            }
            $("#sidepanelgetseeds").css("background-color", state.getSeeds ? "green" : "red");
        },

        toggleOutput() {
            // Enables or disabled output of items that this block generates

            state.allowOutput = !state.allowOutput;
            $("#sidepaneloutput").css("background-color", state.allowOutput ? "green" : "red");
        },

        deleteblock() {
            // Deletes this block from the map.

            // Start by clearing up the food items we have here, since they are also in the foodlist array
            state.deleteWithFood();
            // Now complete the deletion process
            state.finishDelete();
        }
    };

    // Now, provide a way to show when new options become available for this block type
    const genHandle = game.blockDemands.find(ele => ele.name === state.name);
    if (genHandle.hasNewOptions === undefined) {
        genHandle.hasNewOptions = itemname => {
            return itemname === "Flint Hoe";
            // Aka if the itemname passed to this function is a flint hoe, return true.
        };
    }

    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/foragepost.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockShowsOutputItems(state),
        blockHasWorkerPriority(state),
        blockHandlesFood(state),
        blockDeletesClean(state),
        blockHasRandomizedOutput(state)
    );
};
