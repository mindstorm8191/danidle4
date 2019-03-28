// Rock Knapper
// for DanIdle version 4
// Produces primitive tools out of rocks

import { blockOutputsItems, blockHasWorkerPriority, blockDeletesClean } from "./activeblock.js";
import { blockHasSelectableCrafting } from "./blockAddon_HasSelectableCrafting.js";
import { game } from "./game.js";
import $ from "jquery";

export const rockknapper = mapsquare => {
    let state = {
        name: "rockknapper",
        tile: mapsquare,
        id: game.lastBlockId,
        counter: 0,
        allowOutput: true,
        currentcraft: "None", // What this block is currently working on. Note that this is only changed when the crafting cycle resets
        targetcraft: "None", // What the user wants this block to work on.
        outputItems: [
            { name: "None", prereq: [], parts: [], isTool: false },
            {
                name: "Flint Knife",
                prereq: [],
                parts: [],
                craftTime: 20,
                isTool: true,
                endurance: 50, // with tapering, this gets up to 60.5
                enduranceGain: 1,
                enduranceTaper: 0.05,
                efficiency: 1,
                efficiencyGain: 0.01,
                efficiencyTaper: 0.001
            },
            {
                name: "Flint Stabber",
                prereq: [],
                parts: [],
                craftTime: 20,
                isTool: true,
                endurance: 40, // with tapering, this gets up to 53
                enduranceGain: 1,
                enduranceTaper: 0.04,
                efficiency: 1,
                efficiencyGain: 0.01,
                efficiencyTaper: 0.001
            },
            {
                name: "Flint Hatchet Head",
                prereq: ["Twine"],
                parts: [],
                craftTime: 40,
                isTool: false // Even though these items are used in tools, they are not, themselves, a tool
            },
            {
                name: "Flint Spear Head",
                prereq: ["Twine"],
                parts: [],
                craftTime: 30,
                isTool: false
            },
            {
                name: "Flint Hoe Head",
                prereq: ["Twine"],
                parts: [],
                craftTime: 40,
                isTool: false
            }
        ],

        // possibleoutputs is already defined in blockHasSelectableCrafting
        // inputsAccepted is already defined in blockHasSelectableCrafting
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasSelectableCrafting
        // receiveItem() is already defined in blockHasSelectableCrafting

        update() {
            if (state.onhand.length > 15) return; // Stop when this reaches a capacity limit
            if (!state.readyToCraft()) return;
            state.processCraft(1);
        },

        drawpanel() {
            $("#sidepanel").html(
                "<b>Rock Knapper</b><br />" +
                    "<br />" +
                    "Tools are critical to survival, and rocks are your first tool. Knapping is the art of smashing " +
                    "rocks into the shapes you need.<br />" +
                    "<br />" +
                    "Knapp rocks to craft either knives or stabbers - you must select one before crafting can begin. " +
                    "Once crafted, place into a storage unit to use where-ever needed.<br />" +
                    "<br />"
            );
            state.showPriority();
            $("#sidepanel").append(
                '<br />Items on hand: <span id="sidepanelonhand">' +
                    state.onhand.length +
                    "</span><br />" +
                    'Currently building: <span id="sidepaneltarget">' +
                    state.currentcraft +
                    "</span><br />" +
                    'Current progress: <span id="sidepanelprogress">' +
                    state.drawProgressPercent() +
                    "</span>%<br />"
            );
            state.showDeleteLink();
            $("#sidepanel").append("<br /><br />");
            state.drawOutputChoices();
        },

        updatepanel() {
            // This only manages the few stats shown before the output selection
            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepaneltarget").html(state.currentCraft);
            $("#sidepanelprogress").html(state.drawProgressPercent());
            state.updateOutputChoices();
        },

        deleteblock() {
            state.finishDelete();
        }
    };
    game.lastBlockId++;
    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/rockknapper.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state),
        blockHasSelectableCrafting(state)
    );
};
