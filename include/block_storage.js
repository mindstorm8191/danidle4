// Storage
// Storage space for users to put things (especially tools)
// For DanIdle version 4

import {
    blockOutputsItems,
    blockShowsOutputItems,
    blockHasWorkerPriority,
    blockHandlesFood,
    blockDeletesClean
} from "./activeblock.js";
import { game } from "./game.js";
import { danCommon } from "./dancommon.js";
import $ from "jquery";

export const storage = mapsquare => {
    let state = {
        name: "storage",
        tile: mapsquare,
        id: game.getNextBlockId(),
        counter: 0,
        allowOutput: false, // Determines if this block will output items. Note that this setting can be adjusted within this block
        targetitems: [], // list of items we want to store here. Contains only the name of the items we want

        consumeFood() {
            // We don't have a means to transfer foods yet, but we will need this eventually anyway.
            // Don't forget to pass in a foodID when putting this function to use
            console.log("Error - game trying to remove food from storage unit - code hasn't been built for that yet");
        },

        possibleoutputs() {
            // This only outputs the names of the items
            if (!state.allowOutput) return [];
            // I couldn't come up with a reasonable way to do this with functional programming (besides using Set(), which just feels
            // like a hack), so I decided to do it my own way.  .map() might be useful in other cases here, but we're already running
            // through all the data anyway
            let build = [];
            for (let i = 0; i < state.onhand.length; i++) {
                if (!build.includes(state.onhand[i].name)) build.push(state.onhand[i].name);
            }
            return build;
        },

        inputsAccepted() {
            // Since this will accept any item, we need to build a special case to handle its output
            return "any";
        },

        willOutput(itemname) {
            // Returns true if this block will output the stated item (or not)

            // Since anything this block holds is returned in possibleoutputs(), just check within that
            return state.possibleoutputs().includes(itemname);
        },

        willAccept() {
            // Returns true if this block can accept the specified item right now
            // This block will hold anything, so long as there's room for it.
            return state.onhand.length < 10; // returns true if we have room
        },

        receiveItem(item) {
            // Accepts an item as input. Returns true if successful, or false if not.
            if (state.onhand.length >= 10) return false; // The only situation we would refuse an item is if we're out of space
            state.onhand.push(item);
            return true;
        },

        update() {
            // Here, we will search nearby blocks for items to pull in, if they are allowed

            if (state.targetitems.length == 0) return; // There's nothing here to collect anyway, don't bother
            if (state.onhand.length >= 10) return; // This storage space is full

            // Before continuing, make sure we have a worker free to move items about
            if (game.workPoints <= 0) return;

            // Run through all the neighbors and see if we can pick up one of our target items
            game.blockList.neighbors(state.tile).find(neighbor => {
                let pickup = neighbor.getItem(state.targetitems);
                if (pickup == null) return false;
                state.onhand.push(pickup);

                // Since we have done work here, use a work point
                game.workPoints--;
                return true;
            });
        },
        drawpanel() {
            $("#sidepanel").html(`
                <b>Storage Unit</b><br />
                <br />
                So many items, where to put them?  This is your place to put things. The fact that its nothing but a spot on the ground
                isnt a problem - yet.<br />
                <br />
                Use this to hold items (especially tools). This can be upgraded with shelves and other things to hold more items<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Items on hand:
                <div id="sidepanelonhand">${state.displayItemsOnHand()}</div>
                <br />
            `);
            state.showDeleteLink();
            $("#sidepanel").append("<br /><br /><b>Items to store</b><br />");
            // Now for the real work of this block. Run through the neighbors of this block to list all available items (once).
            // This will mainly be tied to what each block might output.
            let built = danCommon.removeDuplicates(
                danCommon.flatten(
                    game.blockList.neighbors(state.tile).map(ele => {
                        if (ele.possibleoutputs === undefined) {
                            // Not all block types will have a possibleoutputs function
                            return []; // Not to worry, any empty array entries will be filtered out below
                        }
                        return ele.possibleoutputs();
                    })
                )
            );
            // This also flattens the array while removing duplicates
            if (built.length === 0) {
                $("#sidepanel").append("No neighbor blocks to pull from");
            } else {
                // Now, display the actual options
                built.forEach(ele => {
                    $("#sidepanel").append(`
                        <span id="sidepanelpick${danCommon.multiReplace(ele, " ", "")}"
                            class="sidepanelbutton" ' +
                            style="background-color: ${
                                state.targetitems.includes(ele) ? "green" : "red"
                            };" >${ele}</span>
                    `);
                    document
                        .getElementById("sidepanelpick" + danCommon.multiReplace(ele, " ", ""))
                        .addEventListener("click", () => game.blockList.getById(state.id).toggleinput(ele));
                });
                // Note that this list can be changed when a new block gets placed nearby and this is loaded again.
            }

            // Next, show a button to allow users to enable or disable item output
            $("#sidepanel").append(`
                <br />
                <br />
                <span id="sidepaneloutputmode"
                      class="sidepanelbutton"
                      style="background-color: ${state.allowOutput ? "green" : "red"};">Output Items</span>
            `);
            document
                .getElementById("sidepaneloutputmode")
                .addEventListener("click", () => game.blockList.getById(state.id).toggleOutput());
        },

        updatepanel() {
            $("#sidepanelonhand").html(state.displayItemsOnHand());
        },

        toggleinput(itemname) {
            if (state.targetitems.includes(itemname)) {
                // Item is currently in the grab-list. Remove it now
                state.targetitems.splice(state.targetitems.indexOf(itemname), 1);
                $("#sidepanelpick" + danCommon.multiReplace(itemname, " ", "")).css({ "background-color": "red" });
            } else {
                // Item is not currently in the list. Add it now
                state.targetitems.push(itemname);
                $("#sidepanelpick" + danCommon.multiReplace(itemname, " ", "")).css({ "background-color": "green" });
            }
        },

        toggleOutput() {
            // Allows the user to enable or disable the output of items
            state.allowOutput = !state.allowOutput;
            $("#sidepaneloutputmode").css({ "background-color": state.allowOutput ? "green" : "red" });
        },

        deleteblock() {
            //state.deleteWithFood(); We currently have deleteWithFood being called within finishDelete (if such exists, which we check for)
            state.finishDelete();
        }
    };

    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/storage.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockShowsOutputItems(state),
        blockHasWorkerPriority(state),
        blockHandlesFood(state),
        blockDeletesClean(state)
    );
};
