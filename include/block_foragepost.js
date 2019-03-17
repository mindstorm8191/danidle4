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

export const foragepost = mapsquare => {
    let state = {
        name: "foragepost",
        tile: mapsquare,
        id: lastblockid,
        counter: 0,
        allowOutput: false, // Determines if this block will output items. Later in the game, we will allow this item to output items,
        // and potentially other output types (like seeds to plant)
        outputItems: [
            { name: "Apple", isFood: true, shelfLife: 120 },
            { name: "Berry", isFood: true, shelfLife: 80 },
            { name: "Tree Nut", isFood: true, shelfLife: 800 },
            { name: "Mushroom", isFood: true, shelfLife: 400 }
        ],
        craftTime: 30,

        // possibleoutputs is already defined in HasRandomizedOutput

        inputsAccepted() {
            // This block doesn't accept any items as input
            return [];
        },

        update() {
            if (state.onhand.length >= 15) return; // cannot proceed if this inventory is full
            if (workpoints <= 0) return;
            state.processCraft(1);
        },

        drawpanel() {
            $("#sidepanel").html(
                "<b>Foraging Post</b><br />" +
                    "<br />" +
                    "All around you is a world teeming with life - and food. It is there for the taking, you just " +
                    "have to find it first.<br />" +
                    "<br />" +
                    "Collects edible foods from the surrounding environment.  Local supplies can only support up to " +
                    "4 workers. Cannot place another one in this area<br />" +
                    "<br />" +
                    state.showPriority() +
                    "Food on-hand:<br />" +
                    '<span id="sidepanelonhand">' +
                    state.displayItemsOnHand() +
                    "</span><br />" +
                    'Progress to next: <span id="sidepanelprogress">' +
                    Math.floor((state.counter / 30) * 100) +
                    "</span>%<br />" +
                    "<br />" +
                    state.showDeleteLink()
            );
        },

        updatepanel() {
            $("#sidepanelonhand").html(state.displayItemsOnHand());
            $("#sidepanelprogress").html(Math.floor((state.counter / 30) * 100));
        },

        deleteblock() {
            // Deletes this block from the map.

            // Start by clearing up the food items we have here, since they are also in the foodlist array
            state.deleteWithFood();
            // Now complete the deletion process
            state.finishDelete();
        }
    };
    lastblockid++;
    blocklist.push(state);
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
