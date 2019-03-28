// DanIdle Version 4
// Auto-provider - A cheat-block

import { item, food, tool } from "../index.js";
import { game } from "./game.js";
import { storage } from "./block_storage.js";
import $ from "jquery";

export const autoprovider = mapsquare => {
    // This is a cheat-block. When placed, it will generate multiple storage blocks (to its right) to provide the resources needed below
    // This may also set other game states, such as unlocked items and blocks
    let state = {
        name: "autoprovider",
        tile: mapsquare,
        id: game.lastBlockId,
        counter: 0,
        allowOutput: false, // Determines if this block will output items. Later in the game, we will allow this item to output items,
        // We don't need to have a function to decide what gets generated - we can simply edit a fixed data structure here
        generate: [
            { name: "Flint Spear", class: "tool", efficiency: 1, endurance: 10000 },
            { name: "Flint Hatchet", class: "tool", efficiency: 5, endurance: 10000 },
            { name: "Apple", class: "food", lifetime: 10000 }
        ],
        fixedPopulation: 10,
        unlockItems: [
            "Twine",
            "Short Stick",
            "Dead Deer",
            "Flint Hatchet",
            "Flint Stabber",
            "Flint Knife",
            "Log",
            "Wooden Bowl"
        ],
        // These items are added to the unlocked array, but not generated

        isActivated: false, // On this block's first run, we will generate all the storage blocks we need. This determines if we have
        // done that already or not.

        possibleoutputs() {
            return [];
        },

        inputsAccepted() {
            return [];
        },

        willOutput() {
            // Returns true if this block can output the specified item right now.
            // This block has no output items.
            return false;
        },

        willAccept() {
            return false;
        },

        receiveItem() {
            return false;
        },

        update() {
            // Allows this block to handle the tasks it needs. Mainly we'll work on filling up the storage chests we have been assigned
            // to put resources into

            if (state.isActivated === false) {
                // We haven't set anything up yet. Run through our data and generate new storage units. These will all be placed
                // to the right of this block - we don't need to care what land they fall into
                let position = 1;
                state.generate.forEach(ele => {
                    let mappos = game.chunkList[0][0].map[state.tile.ypos][state.tile.xpos + position];
                    ele.hand = storage(mappos);
                    position++;
                });
                // While we're here, unlock the additional items
                state.unlockItems.forEach(ele => {
                    game.unlockedItems.push(ele);
                });
                game.blockDemands.unlock();
                state.isActivated = true;
            }
            state.generate.forEach(ele => {
                if (ele.hand.onhand.length < 10) {
                    switch (ele.class) {
                        case "food":
                            ele.hand.onhand.push(food(ele.name, ele.lifetime, ele.hand));
                            break;
                        case "tool":
                            ele.hand.onhand.push(tool(ele.name, ele.efficiency, ele.endurance));
                            break;
                        default:
                            ele.hand.onhand.push(item(ele.name));
                    }
                }
            });
            game.population = Math.max(game.population, 10);
        },

        drawpanel() {
            $("#sidepanel").html(
                "<b>AutoProvider</b><br />" +
                    "<br />" +
                    "Use of this block indicates you are cheating. The code will determine how it affects the game"
            );
        },

        updatepanel() {} // We probably won't need this for anything here
    };

    game.lastBlockId++;
    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/axe_flint.png" />');
    return Object.assign(state);
};
