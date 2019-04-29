// block_huntingpost.js
// for DanIdle version 4
// The place where players hunt for nearby game animals. Produces meats, along with other animal-based resources (such as furs, bones and feathers)

import { blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockDeletesClean } from "./activeblock.js";
import { blockHasRandomizedOutput } from "./blockAddon_HasRandomizedOutput.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { game } from "./game.js";
import $ from "jquery";

export const huntingpost = mapsquare => {
    let state = {
        name: "huntingpost",
        tile: mapsquare,
        id: game.getNextBlockId(),
        counter: 0,
        allowOutput: true,
        //outputitems: [{name: "None"}] - but wait - this has randomized output - not user-selected output
        outputItems: [
            { name: "Dead Deer", isFood: false },
            { name: "Dead Wolf", isFood: false },
            { name: "Dead Chicken", isFood: false }
        ],
        toolChoices: [{ groupName: "Spear", isRequired: true, choices: ["None", "Flint Spear"] }],
        craftTime: 30,

        // possibleoutputs is defined in HasRandomizedOutput

        inputsAccepted() {
            // This does not have any inputs
            return [];
        },

        // willOutput() is already defined in blockOutputsItems

        willAccept() {
            // Returns true if this block will accept the specified item right now.
            // This block has no (item) input
            return false;
        },

        receiveItem() {
            // Accepts an item as input. Returns true when successful, or false if not.
            // This item does not accept any input items.
            return false;
        },

        update() {
            // Start by checking the size of our onhand array
            if (state.onhand.length > 15) return;
            // Next, verify our tools will allow us to continue
            if (game.workPoints <= 0) return;
            const eff = state.checkTool();
            if (eff === null) return;
            state.processCraft(eff);
        },

        drawpanel() {
            $("#sidepanel").html(`
                <b>Hunting Post</b><br />
                <br />
                Humans are not herbivores.  They require meats equally as much as plants. Without good sources of both, the body will
                struggle to survive.<br />
                <br />
                Uses weapons to hunt game animals in the area. Once killed, brings the animals back here for further uses.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Hunting progress: <span id="sidepanelprogress">${Math.floor(
                    (this.counter * 100) / state.craftTime
                )}</span>%<br />
            `);
            state.showDeleteLink();
            $("#sidepanel").append("<br /><br />");
            state.showOutput();
            state.showTools();
        },

        updatepanel() {
            // Handle updating any fields in the side panel that may change between ticks
            $("#sidepanelprogress").html(Math.floor((this.counter * 100) / state.craftTime));
            state.updateOutput();
            state.updateToolPanel();
        },

        deleteblock() {
            state.finishDelete();
        }
    };

    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/huntingpost.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockShowsOutputItems(state),
        blockRequiresTool(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state),
        blockHasRandomizedOutput(state)
    );
};
