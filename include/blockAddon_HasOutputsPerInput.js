// blockHasOutputsPerInput
// for DanIdle version 4
// Provides extra functionality for any blocks where their output is determined by what items are put into it.

import { game } from "./game.js";
import { danCommon } from "./danCommon.js";
import { item } from "../index.js";
import $ from "jquery";

export const blockHasOutputsPerInput = state => ({
    // Add-on unit to handle blocks that have outputs based on input types
    // state - state block unit that this is to be added to
    //   must contain an outputItems array. This will consist of individual objects for each possible input:
    //      name: item name that is allowed as input
    //      craftTime: how long this item will take to produce
    //      output: array of objects for output items
    //          name: name of the item to output
    //          qty: how many of this item to output

    inItems: [], // Holds all items that are received by this block, in linear fashion
    //inputEnabled: true, // Set to false for this block to refuse any input items. Useful for blocks that need structures built first,
    // such as the Bloomery
    // Note: we were going to add inputEnabled for the dryer block. However this wouldn't solve any problems, as the dryer would need to
    // input items during construction. If this becomes useful later, we can add it in.

    possibleOutputs() {
        // Returns all possible outputs that this block has
        return danCommon.removeDuplicates(
            // Even after flattening, we may have duplicates. We need to remove those.
            danCommon.flatten(
                // The output of this is actually a 2D array. We need to convert it to a 1D array.
                state.outputItems.map(ele => ele.output.map(inner => inner.name))
            )
        );
    },

    inputsAccepted() {
        // returns an array of all items this block will accept as an input
        return state.outputItems.map(ele => ele.name).filter(iname => game.unlockedItems.includes(iname));
    },

    willAccept(itemName) {
        // Returns true if this block will accept the specified item as input, right now.

        if (state.inItems.length > 15) return false; // because we're out of room
        return state.outputItems.map(ele => ele.name).includes(itemName);
    },

    receiveItem(item) {
        // Accepts an item as input. Returns true if successful, or false if not.
        if (state.inItems.length > 15) return false;
        state.inItems.push(item);
        return true;
    },

    readyToCraft() {
        // Returns true if this block is ready to craft an item (aka there's something on hand to work on), or false if not
        if (state.inItems.length > 0) return true;
        return false;
    },

    searchForItems(useWorkPoints) {
        // Searches neighboring blocks for valid input items
        // useWorkPoints - Set to true to consume a work point if an item is found

        const searchList = state.outputItems.map(ele => {
            return ele.name;
        });
        game.blockList.neighbors(state.tile).find(neighbor => {
            let pickup = neighbor.getItem(searchList);
            if (pickup === null) return false;
            // Unlike in blockHasSelectableCrafting, we only have one input list to add items to
            state.inItems.push(pickup);
            if (useWorkPoints === true) game.workPoints--; // Use a work point, if we're supposed to here
            return true;
        });
    },

    processCraft(efficiency) {
        // Handles progressing the construction of the item we are working on

        if (efficiency === undefined) {
            console.log(
                `Error in HasOuputsPerInput->processCraft: no efficiency value provided - this is mandatory (block name=${
                    state.name
                })`
            );
            return;
        }

        // Start by determining what we are currently crafting
        if (state.inItems.length === 0) return;
        state.counter += efficiency;
        const crafting = state.outputItems.find(ele => ele.name === state.inItems[0].name);
        if (state.counter >= crafting.craftTime) {
            state.completeProduction();
            // Now, reduce the counter value by the correct amount
            state.counter -= crafting.craftTime;
        }
        // Now, update this block's scroll bar
        $("#" + state.tile.id + "progress").css({ width: (state.counter / crafting.craftTime) * 60 });
    },

    completeProduction() {
        // Handles completing the production of the target item. This is placed separately for blocks that don't follow the standard
        // object crafting process.
        // Assumes the first item in the inItems array will need to be produced

        if (state.inItems.length === 0) return;
        state.outputItems
            .find(ele => {
                return ele.name === state.inItems[0].name;
            })
            .output.forEach(ele => {
                for (let i = 0; i < ele.qty; i++) {
                    state.onhand.push(item(ele.name));
                }
            });
        state.inItems.splice(0, 1); // delete the current item here
    }
});
