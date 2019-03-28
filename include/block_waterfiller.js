// Water Filler
// for DanIdle version 4
// Fills liquid-holding items (such as wooden bowls) with water

import { game } from "./game.js";
import { blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockDeletesClean } from "./activeblock.js";
import { blockHasOutputsPerInput } from "./blockAddon_HasOutputsPerInput";
import $ from "jquery";

export const waterfiller = mapsquare => {
    let state = {
        name: "waterfiller",
        tile: mapsquare,
        id: game.lastBlockId,
        counter: 0,
        allowOutput: true,
        outputItems: [
            {
                name: "Wooden Bowl",
                craftTime: 1,
                output: [{ name: "Wooden Water Bowl", qty: 1 }]
                // So far, we only have wooden bowls as output. I'm sure that will change at a later date
            }
        ],

        // getItem() is already defined in blockOutputsItems
        // possibleoutputs() is already defined in blockHasOutputsPerInput
        // inputsAccepted() is already defined in blockHasOutputsPerInput
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasOutputsPerInput
        // receiveItem() is already defined in blockHasOutputsPerInput

        update() {
            if (!state.readyToCraft()) {
                if (game.workPoints <= 0) return; // We have no workers to work this block anyway
                state.searchForItems();
                return;
            }
            game.workPoints--;
            state.processCraft(1);
        },

        drawpanel() {
            $("#sidepanel").html(
                "<b><center>Water Filler</center></b><br />" +
                    "Water is easily available, but moving it is easier said than done. Fortunately, you have a tool for that.<br />" +
                    "<br />" +
                    "Fills wooden bowls (or any other container) with water. Takes only one tick to complete.<br />"
            );
            state.showPriority();
            $("#sidepanel").append("<br />");
            state.showDeleteLink();
            $("#sidepanel").append(
                "<br />" +
                    'Empty containers on hand: <span id="sidepanelinput">' +
                    state.inItems.length +
                    "</span><br />" +
                    "Output items on hand:" +
                    '<div id="sidepanelonhand">' +
                    state.displayItemsOnHand() +
                    "</div>"
            );
        },

        updatepanel() {
            $("#sidepanelinput").html(state.inItems.length);
            $("#sidepanelonhand").html(state.displayItemsOnHand());
        },

        deleteblock() {
            // Handles deleting this block when the user chooses to delete it.
            // This block doesn't do anything special when deleting
            state.finishDelete();
        }
    };

    game.lastBlockId++;
    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/watercup.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockShowsOutputItems(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state),
        blockHasOutputsPerInput(state)
    );
};
