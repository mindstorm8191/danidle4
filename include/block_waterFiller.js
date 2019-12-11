// Water Filler
// for DanIdle version 4
// Fills liquid-holding items (such as wooden bowls) with water

import { game } from "./game.js";
import { blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockDeletesClean } from "./activeBlock.js";
import { blockHasOutputsPerInput } from "./blockAddon_HasOutputsPerInput";
import $ from "jquery";

export const waterFiller = mapSquare => {
    let state = {
        name: "waterFiller",
        tile: mapSquare,
        id: game.getNextBlockId(),
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
        // possibleOutputs() is already defined in blockHasOutputsPerInput
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

        drawPanel() {
            $("#sidepanel").html(`
                <b><center>Water Filler</center></b><br />
                Water is easily available, but moving it is easier said than done. Fortunately, you have a tool for that.<br />
                <br />
                Fills wooden bowls (or any other container) with water. Takes only one tick to complete.<br />
            `);
            state.showPriority();
            $("#sidepanel").append("<br />");
            state.showDeleteLink();
            $("#sidepanel").append(`
                <br />
                Empty containers on hand: <span id="sidepanelinput">${state.inItems.length}</span><br />
                Output items on hand:
                <div id="sidepanelonhand">${state.displayItemsOnHand()}</div>
            `);
        },

        updatePanel() {
            $("#sidepanelinput").html(state.inItems.length);
            $("#sidepanelonhand").html(state.displayItemsOnHand());
        },

        deleteBlock() {
            // Handles deleting this block when the user chooses to delete it.
            // This block doesn't do anything special when deleting
            state.finishDelete();
        }
    };

    game.blockList.push(state);
    mapSquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/waterFiller.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockShowsOutputItems(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state),
        blockHasOutputsPerInput(state)
    );
};
