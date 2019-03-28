// blockCooksItems
// for DanIdle verison 4
// Provides extra functionality for any blocks that use fire to cook items

import { danCommon } from "./dancommon.js";
import { game } from "./game.js";
import { food } from "../index.js";
import $ from "jquery";

export const blockCooksItems = state => ({
    // Provides a block with extra functionality to allow it to cook items.
    // Handles two potential input item groups (to be cooked or to be burned). State must contain the following variables & objects:
    // itemsConversion (as array), consisting of objects of the following:
    //      name: name of the item to be output
    //      craftTime: how long this item needs to cook for, when the fire is at or above the target temperature
    //      minTemp: minimum temperature needed before progress can be made on completing this item
    //      targetTemp: maximum temperature needed
    //      burnlimit: Items will be considered done after they reach 100% of their crafting time. This is the percent point at which
    //          this item will be considered burned an unusable. For example, with a value of 150, if this is cooked for 50% longer than
    //          the finish burn time, it will have to be thrown away (whenever a worker is available to place a new item into the 'cook slot')
    //      output: array of objects to describe what is output. Consisting of:
    //          name: name of the item to output
    //          qty: how many of that specific item to output (per input item)
    // fuelTypes (as array), consisting of objects of the following:
    //      name: name of the item we can use for cooking
    //      burnTime: how long this fuel type will burn for
    //      burnBoost: how much this fuel type increases the fire's temp by, per tick
    // tempDecay: how quickly the fire's temperature will decrease, per tick
    //

    toBurn: [], // Array containing items ready to be used as fuel. Should match the names within fuelTypes
    toCook: [], // Array containing items ready to be cooked. Should match the input names within itemsConversion
    burnTime: 0, // How many ticks remain for the current fuel item to burn. Increases the fire's temperature until this reaches zero
    burnBoost: 0, // How much the current fuel type is increasing the temperature by
    temp: 0, // Current temperature of the fire

    possibleOutputs() {
        // Returns an array of all items that this item could output
        return danCommon.removeDuplicates(
            // Even after flattening, we may have duplicates. We need to remove those.
            danCommon.flatten(
                // The output of this is actually a 2D array. We need to convert it to a 1D array.
                state.itemsConversion.map(ele => ele.output.map(inner => inner.name))
            )
        );
    },

    inputsAccepted() {
        // Outputs an array of all items that this block will accept as input
        return [...state.itemsConversion.map(ele => ele.name), state.fuelTypes.map(ele => ele.name)];
    },

    willAccept(itemname) {
        // Returns true if this block will accept the specified item as input, right now.

        if (state.itemsConversion.some(ele => ele.name === itemname)) {
            if (state.toCook.length > 15) return false; // ensure we have space for the selected item
            return true;
        }
        if (state.fuelTypes.some(ele => ele.name === itemname)) {
            if (state.toBurn.length > 15) return false;
            return true;
        }
        return false; // We can't find any other place to put this
    },

    receiveItem(item) {
        // Accepts an item as input. Returns true if successful, or false if not
        // Unlike other blocks, we will need to determine if this is a food item or fuel item.
        if (state.fuelTypes.some(ele => ele.name === item.name)) {
            state.toBurn.push(item);
            return true;
        }
        if (state.itemsConversion.some(ele => ele.name === item.name)) {
            state.toCook.push(item);
            return true;
        }
        return false;
    },

    curCookTime() {
        // Helper function. Returns the total cook time of the current item to craft
        if (state.toCook.length === 0) return 0;
        return state.itemsConversion.find(ele => ele.name === state.toCook[0].name).craftTime;
    },

    targetTemp() {
        // Helper function. Returns the target temperature that this block is trying to reach, for the current cook item
        if (state.toCook.length === 0) return state.defaultTemp;
        return state.itemsConversion.find(ele => ele.name === state.toCook[0].name).targetTemp;
    },

    updateTemp() {
        // Handles updating the fire's temperature. This should be called in update(), before worker availability is considered (aka it happens
        // no matter what).

        state.temp = Math.max(0, state.temp - state.tempDecay);
        // We can also account for current fuel being consumed
        if (state.burnTime > 0) {
            state.temp += state.burnBoost;
            state.burnTime--;
        }
    },

    updateCook() {
        // Handles tracking the progress on the cooking of the current item.
        // Note that this doesn't manage when cook items are removed from the fire (this can be done at a later point), which means cook items
        // can burn if left on the fire too long.
        // Also note that this function is separate from updateTemp, as some blocks don't cook items like the campfire does

        if (state.toCook.length === 0) return; // we have nothing to cook anyway
        // We will need a few facts from the item we're currently cooking
        const cookObject = state.itemsConversion.find(ele => ele.name === state.toCook[0].name);

        // Make progress on this item. Note that we don't check if the item has finished yet; that is handled later
        state.counter += Math.min(
            1,
            Math.max(0, (state.temp - cookObject.minTemp) / (cookObject.targetTemp - cookObject.minTemp))
        );
        $("#" + state.tile.id + "progress").css({ width: (state.counter / cookObject.craftTime) * 60 });
    },

    manageCooking() {
        // Handles managing the handling of the cook items 'on the fire', such as removing the currently crafting item (and putting another one on)
        // Returns true if this block did work (or could not do any work due to missing workpoints), or false if no work was done here

        // At this point, we determine if there are work points available to use
        if (game.workPoints <= 0) return true;

        // Make sure we have something to check on here
        if (state.toCook.length === 0) return false;

        // Next, determine if our current item can be removed from the fire
        if (state.counter < state.curCookTime()) return false;

        // The output of this block is determined by the itemsConversion structure.  Start by getting the conversion
        // information
        state.counter = 0; // don't forget to reset this!
        const conversion = state.itemsConversion.find(ele => ele.name === state.toCook[0].name);
        conversion.output.forEach(ele => {
            for (let i = 0; i < ele.qty; i++) {
                state.onhand.push(food(ele.name, 500, state));
            }
        });
        // Now delete the existing item from our cook array
        state.toCook.shift();
        $("#" + state.tile.id + "progress").css({ width: 0 });
        // Since our worker can only do one thing per tick, we cannot do any of the lower tasks. Go ahead and
        // exit the function now
        game.workPoints--;
        return true;
    },

    manageFuel() {
        // Determines if this block needs more fuel added to the fire.
        // Returns true if work was done here, or false if not

        if (state.burnTime > 0) return false; // No need - we still have burn time going
        if (state.toCook.length === 0) return false; // No need - there's nothing to cook anyway
        if (state.temp > state.targetTemp()) return false; // No need - the fire's temperature is at/above target
        if (state.toBurn.length === 0) return false; // Unable - no fuel left in this block

        const fuelFacts = state.fuelTypes.find(ele => ele.name === state.toBurn[0].name);
        state.burnTime += fuelFacts.burnTime;
        state.burnBoost = fuelFacts.burnBoost;
        state.toBurn.shift(); // Drops the current fuel item
        game.workPoints--;
        return true;
    },

    findFuel() {
        // Searches for fuel to make use of, from nearby blocks. Returns true if successful (using a workPoint), or false if not
        if (state.toBurn.length >= 15) return false;
        const burnables = state.fuelTypes.map(ele => ele.name);
        if (
            game.blockList.neighbors(state.tile).some(neighbor => {
                let pickup = neighbor.getItem(burnables);
                if (pickup === null) return false;
                // Since we have access to the item here, go ahead and add it to our storage
                state.toBurn.push(pickup);
                return true;
            })
        ) {
            game.workPoints--;
            return true; // Our search returns true only if it finds an item
        }
        // Nothing was found to make use of
        return false;
    },

    findCookables() {
        // Searches for cookable items to make use of, from nearby blocks. Returns true if successful (using a workPoint), or false if not

        if (state.toCook.length >= 15) return false;

        const cookables = state.itemsConversion.map(ele => ele.name);
        if (
            game.blockList.neighbors(state.tile).some(neighbor => {
                let pickup = neighbor.getItem(cookables);
                if (pickup === null) {
                    return false;
                }
                state.toCook.push(pickup);
                return true;
            })
        ) {
            game.workPoints--;
            return true;
        }
        return false;
    }
});
