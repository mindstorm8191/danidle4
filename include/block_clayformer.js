// Clay Former
// for DanIdle version 4
// Forms wet clay into appropriate shapes for their uses

import { game } from "./game.js";
import { blockOutputsItems, blockHasWorkerPriority, blockDeletesClean } from "./activeblock.js";
import { blockHasSelectableCrafting } from "./blockAddon_HasSelectableCrafting.js";
import $ from "jquery";

export const clayformer = mapsquare => {
    let state = {
        name: "clayformer",
        tile: mapsquare,
        id: game.getNextBlockId(),
        counter: 0,
        allowOutput: true,
        outputItems: [
            { name: "None", prereq: [], parts: [], isTool: false },
            {
                name: "Wet Bloomery Block",
                info: "Block for a Bloomery. Needs to be dried first",
                prereq: [], // Actual prereqs are the same as this block; no need to list here
                parts: [{ name: "Clay", qty: 5 }],
                isTool: false,
                craftTime: 120
            }
        ],

        // getItem() is already defined in blockOutputsItems
        // possibleoutputs() is already defined in blockHasSelectableCrafting
        // inputsAccepted() is already defined in blockHasSelectableCrafting
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasSelectableCrafting
        // receiveItem() is already defined in blockHasSelectableCrafting

        update() {
            // Handles updating this block for each game tick
            if (state.onhand.length > 10) return; // No inventory space to produce more
            if (!state.readyToCraft()) {
                state.searchForItems(true);
                return;
            }
            state.processCraft(1);
        },

        drawpanel() {
            // Handles drawing the content on the right side of the page whenever this block is selected
            $("#sidepanel").html(`
                <center><b>Clay Form Maker</b></center>
                <br />
                What use is clay if you cannot form it to the shapes you need? You don't have a spinning wheel yet, but there are still many things
                to be made.<br />
                <br />
                Forms clay into the shapes you need before being dried out
            `);
        }
    };
};
