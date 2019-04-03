// Firewood collector
// For DanIdle Version 4
// Allows colonists to collect loose dried wood from the local area, for burning in fires

import { blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockDeletesClean } from "./activeblock.js";
import { blockHasRandomizedOutput } from "./blockAddon_HasRandomizedOutput.js";
import { game } from "./game.js";
import $ from "jquery";

export const firewoodmaker = mapsquare => {
    let state = {
        name: "firewoodmaker",
        tile: mapsquare,
        id: game.lastBlockId,
        counter: 0,
        allowOutput: true,
        craftTime: 6,

        outputItems: [
            { name: "Small Firewood", isFood: false },
            { name: "Medium Firewood", isFood: false },
            { name: "Large Firewood", isFood: false }
        ],

        //possibleoutputs is defined in HasRandomizedOutput
        // willOutput() is already defined in blockOutputsItems

        inputsAccepted() {
            // This block does not have any inputs
            return [];
        },

        willAccept() {
            // Returns true if this block will accept the specified item right now.
            // This block has no (item) input
            return false;
        },

        receiveItem() {
            // Accepts an item as input. Returns true if successful, or false if not.
            // This block does not have any items for input.
            return false;
        },

        update() {
            if (state.onhand.length >= 15) return; // We already have a bunch of sticks. Time to stop
            state.processCraft(1);
        },

        drawpanel() {
            $("#sidepanel").html(`
                <b><center>Firewood Collector</center></b><br />
                <br />
                Fires don't burn on their own. You need to collect firewood from the surrounding lands. Dead wood is dry and burns much
                better than freshly cut wood.<br />
                <br />
                Collects firewood from the surrounding lands. Place next to a campfire to provide the fire with fuel.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Current progress: <span id="sidepanelprogress">${Math.floor(
                    (state.counter / state.craftTime) * 100
                )}</span>%<br />
                Wood on hand: <span id="sidepanelonhand">${state.onhand.length}</span><br />
            `);
            state.showDeleteLink();
        },

        updatepanel() {
            $("#sidepanelprogress").html(Math.floor((state.counter / state.craftTime) * 100));
            $("#sidepanelonhand").html(state.onhand.length);
        },

        deleteblock() {
            state.finishDelete();
        }
    };
    game.lastBlockId++;
    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/firewoodmaker.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockHasWorkerPriority(state),
        blockShowsOutputItems(state),
        blockDeletesClean(state),
        blockHasRandomizedOutput(state)
    );
};
