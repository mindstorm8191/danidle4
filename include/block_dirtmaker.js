// Dirt Maker
// for DanIdle version 4
// Uses a flint hoe (or better) to collect units of dirt, for crafting

import { game } from "./game.js";
import { blockOutputsItems, blockHasWorkerPriority, blockDeletesClean } from "./activeblock.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { item } from "../index.js";
import $ from "jquery";

export const dirtmaker = mapsquare => {
    let state = {
        name: "dirtmaker",
        tile: mapsquare,
        id: game.getNextBlockId(),
        counter: 0,
        craftTime: 20,
        allowOutput: true,
        toolChoices: [{ groupName: "Digger", isRequired: true, choices: ["None", "Flint Hoe"] }],

        possibleoutputs() {
            // Outputs an array of items that this block can output.
            // Unlike other block types, this has only one output type
            return ["Dirt"];
        },

        inputsAccepted() {
            // Returns an array of input items that this block accepts.
            // This block does not have any items it takes as input
            return [];
        },

        willAccept() {
            // Returns true if this block accepts a specified item
            // This block doesn't accept any input items
            return false;
        },

        receiveItem() {
            // Accepts an item as input. Returne true if successful, or false if not
            // This block doesn't have any items as input
            return false;
        },

        update() {
            // Handles updating this block once every tick

            if (state.onhand.length >= 15) return;
            if (game.workPoints <= 0) return;
            const efficiency = state.checkTool();
            if (efficiency === null) return;

            game.workPoints--;
            state.counter += efficiency;
            if (state.counter >= state.craftTime) {
                state.onhand.push(item("Dirt"));
                state.counter -= state.craftTime;
            }
            $("#" + state.tile.id + "progress").css({ width: (state.counter * 60) / state.craftTime });
        },

        drawpanel() {
            // Handles filling out the side panel with content for this block

            $("#sidepanel").html(`
                <b>Dirt Maker</b><br />
                <br />
                With usable hoes becomes the ability to gather dirt, and craft with it (such as producing clay).<br />
                <br />
                Gathers dirt from the ground, in units small enough to carry around.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Dirt on hand: <span id="sidepanelonhand">${state.onhand.length}</span><br />
                Progress: <span id="sidepanelprogress">${Math.floor(
                    (state.counter * 100) / state.craftTime
                )}</span>%<br />
            `);
            state.showDeleteLink();
            $("#sidepanel").append(`<br /><br />`);
            state.showTools();
        },

        updatepanel() {
            // Handles updating the side panel when this block is selected

            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepanelprogress").html(Math.floor((state.counter * 100) / state.craftTime));
            state.updateToolPanel();
        },

        deleteBlock() {
            // Handles what to do when the user wishes to delete this block
            // Everything we need to do is already managed by blockDeletesClean
            state.finishDelete();
        }
    };

    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/dirt.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockRequiresTool(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state)
    );
};
