// Twine Maker
// for DanIdle version 4
// Cuts bark off certain trees in the forests to produce twine, for use as a primitive rope

import { blockOutputsItems, blockRequiresTool, blockHasWorkerPriority, blockDeletesClean } from "./activeblock.js";

export const twinemaker = mapsquare => {
    // Early tech block to produce twine rope.  Minimum tool is a flint knife. Has no automation abilities
    let state = {
        name: "Twine Maker",
        tile: mapsquare,
        id: lastblockid,
        counter: 0,
        allowOutput: true,
        toolChoices: ["None", "Flint Knife"], // List of tools this block can use. There's only one possible tool at this time.
        // Later on we will move this list to an external source, and utilize all knives possible

        possibleoutputs() {
            // Unlike other block types, this will only have one available output item
            return ["Twine"];
        },

        inputsAccepted() {
            // This item does not accept any items as input
            return [];
        },

        update() {
            // Start by ensuring we have enough space, and a tool selected

            if (state.onhand.length >= 15) return;
            if (workpoints <= 0) return;
            const efficiency = state.checkTool();
            if (efficiency === null) return;

            workpoints--;
            state.counter += efficiency;
            // This is managed by the checkTool function
            //if (state.currentTool.endurance <= 0) state.currentTool = null; // This sets things up for the next round to load another tool
            if (state.counter > 20) {
                state.onhand.push(item("Twine"));
                state.counter -= 20;
            }
            $("#" + state.tile.id + "progress").css({ width: state.counter * 3 });
        },

        drawpanel() {
            $("#sidepanel").html(
                "<b>Twine Maker</b><br />" +
                    "<br />" +
                    "Rope is an essential tool for survival, providing hundreds of potential uses to get things done. " +
                    "Twine isn't a very effective rope, but it is available, and will do for now.<br />" +
                    "<br />" +
                    "Produces twine from vines of the forest and tree bark.<br />" +
                    "<br />" +
                    state.showPriority() +
                    'Twine on hand: <span id="sidepanelonhand">' +
                    state.onhand.length +
                    "</span><br />" +
                    'Progress: <span id="sidepanelprogress">' +
                    Math.floor((state.counter * 100) / 20) +
                    "</span>%<br />" +
                    state.showDeleteLink() +
                    "<br />" +
                    "<br />"
            );
            state.showTools();
        },

        updatepanel() {
            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepanelprogress").html(Math.floor((state.counter * 100) / 20));
        },

        deleteblock() {
            // Need to finish this
            state.finishDelete();
        }
    };
    lastblockid++;
    blocklist.push(state);
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
