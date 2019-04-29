// Twine Maker
// for DanIdle version 4
// Cuts bark off certain trees in the forests to produce twine, for use as a primitive rope

import { blockOutputsItems, blockHasWorkerPriority, blockDeletesClean } from "./activeblock.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { item } from "../index.js";
import { game } from "./game.js";
import $ from "jquery";

export const twinemaker = mapsquare => {
    // Early tech block to produce twine rope.  Minimum tool is a flint knife. Has no automation abilities
    let state = {
        name: "Twine Maker",
        tile: mapsquare,
        id: game.getNextBlockId(),
        counter: 0,
        craftTime: 20,
        allowOutput: true,
        toolChoices: [{ groupName: "Cutter", isRequired: true, choices: ["None", "Flint Knife"] }],
        // List of tools this block can use. There's only one possible tool at this time, though
        // Later on we will move this list to an external source, and utilize all knives possible

        possibleoutputs() {
            // Unlike other block types, this will only have one available output item
            return ["Twine"];
        },

        inputsAccepted() {
            // This item does not accept any items as input
            return [];
        },

        // willOutput() is defined in blockOutputsItems

        willAccept() {
            // Returns true if this block will accept the specified item right now.
            // This block does not have any (item) inputs.
            return false;
        },

        receiveItem() {
            // Accepts an item as input. Returns true if successful, or false if not.
            // This block does not have any input items.
            return false;
        },

        update() {
            // Start by ensuring we have enough space, and a tool selected

            if (state.onhand.length >= 15) return;
            if (game.workPoints <= 0) return;
            const efficiency = state.checkTool();
            if (efficiency === null) return;

            game.workPoints--;
            state.counter += efficiency;
            // This is managed by the checkTool function
            //if (state.currentTool.endurance <= 0) state.currentTool = null; // This sets things up for the next round to load another tool
            if (state.counter > state.craftTime) {
                state.onhand.push(item("Twine"));
                state.counter -= state.craftTime;
            }
            $("#" + state.tile.id + "progress").css({ width: (state.counter / state.craftTime) * 60 });
        },

        drawpanel() {
            $("#sidepanel").html(`
                <b>Twine Maker</b><br />
                <br />
                Rope is an essential tool for survival, providing hundreds of potential uses to get things done. Twine isn't a very effective
                rope, but it is available, and will do for now.<br />
                <br />
                Produces twine from vines of the forest and tree bark.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Twine on hand: <span id="sidepanelonhand">${state.onhand.length}</span><br />
                Progress: <span id="sidepanelprogress">${Math.floor(
                    (state.counter * 100) / state.craftTime
                )}</span>%<br />
            `);
            state.showDeleteLink();
            $("#sidepanel").append("<br /><br />");
            state.showTools();
        },

        updatepanel() {
            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepanelprogress").html(Math.floor((state.counter * 100) / state.craftTime));
            state.updateToolPanel();
        },

        deleteblock() {
            // Need to finish this
            state.finishDelete();
        }
    };

    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/twinemaker.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockRequiresTool(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state)
    );
};
