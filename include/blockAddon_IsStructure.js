// blockIsStructure
// for DanIdle version 4
// Provides functionality for any block that behaves as an idle structure, instead of managing items

import { game } from "./game.js";
import $ from "jquery";

export const blockIsStructure = state => ({
    // Add-on block for any block that has a structural use instead of managing items
    // state must contain the following variables:
    //      buildRequirements: This array will contain objects of:
    //          name: name of the item that this block needs in order to be built
    //          qty: how many of that item this block needs
    //      buildTime: How long this block will take to be constructed

    mode: "collect", // Handles what mode this block is in.  Options are:
    // collect - the block is waiting for all the materials to arrive. If there are none, this will advance to the next mode
    // build - the block is being constructed, using the the tools on hand to construct it.
    // use - this block is in use and is providing the benefits it allows

    // This mainly manages the regular function list for each block

    getItem(name) {
        // Returns an output item, when given the target item name
        // This block doesn't return anything anyway.
        if (state.or_getItem != undefined) return state.or_getItem(name);
        return null;
    },

    possibleoutputs() {
        // Returns a list of items that this block can output
        if (state.or_possibleoutputs != undefined) return state.or_posibleoutputs();
        return [];
    },

    inputsAccepted() {
        // Returns a list of items that this block will accept as input
        // All that data is stored in the buildRequirements array - we just need to map the correct content
        if (state.or_inputsAccepted != undefined) return state.or_inputsAccepted();
        return state.buildRequirements.map(ele => ele.name);
    },

    willOutput() {
        // Returns true if this block will output the specified item right now
        // This block doesn't output anything anyway
        if (state.or_willOutput != undefined) return state.or_willOutput();
        return false;
    },

    willAccept(itemname) {
        // Returns true if this block will accept the given item
        if (state.or_willAccept != undefined) return state.or_willAccept();
        const { mode, buildRequirements, inItems } = state;
        return (
            mode === "collect" &&
            buildRequirements.length > 0 &&
            inItems.filter(ele => ele.name === itemname).length <
                buildRequirements.find(ele => ele.name === itemname).qty
        );
    },

    receiveItem(item) {
        // Allows this block to accept an item as input. Returns true upon completion, or false if this item was not allowed.

        if (state.or_receiveItem != undefined) return state.or_receiveItem();
        if (state.mode != "collect") return false;
        const reqs = state.buildRequirements.find(ele => ele.name === item.name);
        if (reqs === null) return false; // Aka this is not an accepted item
        if (reqs.qty <= state.inItems.filter(ele => ele.name === item.name).length) return false;
        state.inItems.push(item);
        return true;
    },

    handleUpdate(usesWorkPoint) {
        // Handles the majority of tasks for this block
        // usesWorkPoint - set to true if this block should use a work point while building this block. It wil also use a workPoint if
        //  it pulls in a needed item from a nearby block

        if (state.mode === "collect") {
            // Start by determining if we have enough input items to start construction
            if (
                state.buildRequirements.length === 0 ||
                state.buildRequirements.every(ele => {
                    if (state.inItems.length === 0) return ele.qty === 0;
                    return state.inItems.filter(it => it.name === ele.name).length >= ele.qty;
                })
            ) {
                state.mode = "build";
                $("#" + state.tile.id + "progress").css({ "background-color": "green" }); // Change the color of the progress bar
                return state.handleUpdate(usesWorkPoint); // We want to call this again, since we haven't actually done anything this round
            }

            // Search neighbor blocks for the items we need. We will need a workPoint for this, though.
            if (game.workPoints < 1) return;
            game.blockList.neighbors(state.tile).some(ele => {
                let pickup = ele.getItem(
                    state.buildRequirements
                        .filter(ele => ele.qty < state.inItems.filter(it => it.name === ele.name).length)
                        .map(ele => ele.name)
                );
                if (pickup === null) return false;
                state.inItems.push(pickup);
                game.workPoints--;
                return true;
            });
            return;
        }

        if (state.mode == "build") {
            if (usesWorkPoint === true && game.workPoints < 1) return; // This needs a work point to work, and we don't have any

            // Get tool efficiency values. Note that this will not affect construction time, but how long this block lasts after construction
            let eff = 1;
            if (state.checkTool != undefined) state.checkTool();
            if (eff === null) return; // Aka we require tools we don't have

            if (game.workPoints < 1) return; // This structure cannot be built without a worker of some kind
            game.workPoints--;
            state.counter++;
            state.endurance += state.baseEndurance + state.toolEndurance * eff;
            $("#" + state.tile.id + "progress").css({ width: (state.counter * 60) / state.buildTime });
            if (state.counter < state.buildTime) return;

            // We are ready to advance to the next phase
            // Since we want to show how much life time this block has remaining, we will use our counter to track lifetime progress, with
            // our endurance value showing what we started at.
            state.counter = state.endurance;
            $("#" + state.tile.id + "progress").css({ "background-color": "brown" });
            state.mode = "use";
            state.isReady(true);
            return;
        }

        // Here, we can make use of this block. Note that this looses value whether there are work points or not.
        state.counter--;
        $("#" + state.tile.id + "progress").css({ width: (state.counter * 60.0) / state.endurance });
        if (state.counter > 0) return;

        // Now this block must be repaired. Lets clear our variables so it can be rebuilt
        state.mode = "collect";
        state.isReady(false);
        state.counter = 0;
        state.endurance = 0;
        state.inItems.splice(0, state.inItems.length);
    },

    showStatus() {
        // Shows text about what state this block is in.
        if (state.mode === "collect") {
            return `Collecting materials. Need ${state.buildRequirements
                .map(ele => ele.qty)
                .reduce((sum, value) => sum + value, 0) - state.inItems.length} more`;
        }
        if (state.mode === "build") {
            return `Building (${Math.floor((this.counter * 100) / state.buildTime)}% complete)`;
        }
        if (state.mode === "use") {
            return `In use. ${Math.floor((this.counter * 100) / this.endurance)}% lifetime remaining`;
        }
        return `Bad mode type of ${state.mode}.`;
    }
});
