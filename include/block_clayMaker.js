// Clay Maker
// for DanIdle version 4
// uses dirt and water to produce clay

import { game } from "./game.js";
import { blockOutputsItems, blockHasWorkerPriority, blockDeletesClean } from "./activeBlock.js";
import { blockHasSelectableCrafting } from "./blockAddon_HasSelectableCrafting.js";
import $ from "jquery";

// HasSelectableCrafting is designed to allow for multiple output choices, but this block will only ever handle one type. We can simply set the
// output choice via code, and leave out the displayed selection choices on the drawPanel call.

export const clayMaker = mapSquare => {
    let state = {
        name: "clayMaker",
        tile: mapSquare,
        id: game.getNextBlockId(),
        counter: 0,
        maxOutput: 10,
        allowOutput: true,
        outputItems: [
            {
                name: "Clay",
                info: "This text shouldnt be visible",
                prereq: [],
                parts: [{ name: "Dirt", qty: 5 }, { name: "Wooden Water Bowl", qty: 15 }],
                isTool: false,
                craftTime: 60,
                byProducts: [{ name: "Wooden Bowl", qty: 15 }]
            }
        ],

        // getItem() is already defined in blockOutputsItems
        // possibleOutputs() is already defined in blockHasSelectableCrafting
        // inputsAccepted() is already defined in blockHasSelectableCrafting
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasSelectableCrafting
        // receiveItem() is already defined in blockHasSelectableCrafting

        update() {
            console.log(state.onhand.length);
            if (state.onhand.length >= 20) return;
            if (!state.readyToCraft()) return state.searchForItems(true);
            state.processCraft(1);
        },

        drawPanel() {
            $("#sidepanel").html(`
                <b>Clay Maker</b><br />
                <br />
                Dirt doesn't have much uses outside of farming and leveling lands. But dirt contains clay, a very effective
                material for working with fire. By mixing dirt with water and draining, non-clay parts can be washed away. Repeated
                cycles will leave you with pure clay.<br />
                <br />
                Uses 5 units of dirt and 15 water bowls to extract one unit of clay.
            `);
            state.showPriority();
            $("#sidepanel").append("<br />");
            state.showDeleteLink();
            $("#sidepanel").append(`
                <br />
                <b>Items Needed</b>:
                <div id="sidepanelparts">${state.drawStocks()}</div>
                <br />
                Current progress: <span id="sidepanelprogress">${state.drawProgressPercent()}</span>%<br />
                Output items on hand: <span id="sidepanelonhand">${state.onhand.length}</span>
            `);
        },

        updatePanel() {
            // Handles updating the side panel once per tick, while this block is selected
            $("#sidepanelparts").html(state.drawStocks());
            $("#sidepanelprogress").html(state.drawProgressPercent());
            $("#sidepanelonhand").html(state.onhand.length);
        },

        deleteBlock() {
            // Handles deleting this block when the users chooses to delete it.
            // This block doesn't do anything special when deleting
            state.finishDelete();
        }
    };

    game.blockList.push(state);
    mapSquare.structure = state;
    $(`#${state.tile.id}imageholder`).html('<img src="img/clayMaker.png" />');
    const output = Object.assign(
        state,
        blockOutputsItems(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state),
        blockHasSelectableCrafting(state)
    );

    // With this block now generated, we need to ensure that we select the correct output here, since the user will not have access to do so
    state.targetCraft = "Clay";
    return output;
};
