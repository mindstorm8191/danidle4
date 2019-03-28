// Stick Maker
// for DanIdle version 4
// Allows the user to cut branches from trees for sticks, of various uses

import { blockOutputsItems, blockHasWorkerPriority, blockDeletesClean } from "./activeblock.js";
import { blockHasSelectableCrafting } from "./blockAddon_HasSelectableCrafting.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { game } from "./game.js";
import $ from "jquery";

export const stickmaker = mapsquare => {
    let state = {
        name: "Stick Maker",
        tile: mapsquare,
        id: game.lastBlockId,
        counter: 0,
        allowOutput: true,
        toolChoices: ["None", "Flint Stabber", "Flint Hatchet"],
        currenttool: null,
        targettool: "None",
        outputItems: [
            { name: "None", prereq: [], parts: [], isTool: false },
            { name: "Short Stick", prereq: [], parts: [], isTool: false, craftTime: 30 },
            { name: "Long Stick", prereq: [], parts: [], isTool: false, craftTime: 30 },
            {
                name: "Log",
                prereq: ["Flint Hatchet"],
                parts: [],
                toolsUsable: ["Flint Hatchet"],
                isTool: false,
                craftTime: 80
            }
        ],

        // getItem() is already defined in blockOutputsItems
        // possibleoutputs() is already defined in blockHasSelectableCrafting
        // inputsAccepted() is already defined in blockHasSelectableCrafting
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasSelectableCrafting
        // receiveItem() is already defined in blockHasSelectableCrafting

        update() {
            if (state.onhand.length >= 15) return;
            if (!state.readyToCraft()) return;
            const eff = state.checkTool();
            if (eff === null) return;
            //console.log("StickMaker using " + eff + " efficiency");
            state.processCraft(eff);
        },

        drawpanel() {
            $("#sidepanel").html(
                "<b>Stick Maker</b><br />" +
                    "<br />" +
                    "The effective use of wood is crucial for continued expansion of your colony. Durable yet " +
                    "easily workable, and there's plenty to be made use of.<br />" +
                    "<br />" +
                    "Cuts down small trees and branches of larger ones to produce sticks of various sizes, including " +
                    "firewood.<br />" +
                    "<br />"
            );
            state.showPriority();
            $("#sidepanel").append(
                "<br />" +
                    'Items on hand: <span id="sidepanelonhand">' +
                    state.onhand.length +
                    "</span><br />" +
                    'Currently building: <span id="sidepanelcurrent">' +
                    state.currentcraft +
                    "</span><br />" +
                    'Current progress: <span id="sidepanelprogress">' +
                    state.drawProgressPercent() +
                    "</span>%<br />"
            );
            state.showDeleteLink();
            $("#sidepanel").append("<br /><br />");
            state.drawOutputChoices();
            state.showTools();
        },

        updatepanel() {
            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepanelcurrent").html(state.currentcraft);
            $("#sidepanelprogress").html(state.drawProgressPercent());
            state.updateToolPanel();
            state.updateOutputChoices();
        },

        deleteblock() {
            state.finishDelete();
        }
    };

    game.lastBlockId++;
    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/stickmaker.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockRequiresTool(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state),
        blockHasSelectableCrafting(state)
    );
};
