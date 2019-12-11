// Rock Knapper
// for DanIdle version 4
// Produces primitive tools and parts out of rocks

import {
    blockOutputsItems,
    blockHasWorkerPriority,
    blockDeletesClean
} from "./activeBlock.js";
import { blockHasSelectableCrafting } from "./blockAddon_HasSelectableCrafting.js";
import { game } from "./game.js";
import $ from "jquery";

export const rockKnapper = mapSquare => {
    let state = {
        name: "rockKnapper",
        tile: mapSquare,
        id: game.getNextBlockId(),
        counter: 0,
        allowOutput: true,
        currentCraft: "None", // What this block is currently working on. Note that this is only changed when the crafting cycle resets
        targetcraft: "None", // What the user wants this block to work on.
        maxOutput: 8, // Max number of output items this block can have before stopping
        outputItems: [
            { name: "None", prereq: [], parts: [], isTool: false },
            {
                name: "Flint Knife",
                info: "Good for light cuts",
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
                info: "Good for chopping small wood",
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
                info:
                    "Combine with short stick & twine at the Flint Toolmaker.",
                prereq: ["Twine"],
                parts: [],
                craftTime: 40,
                isTool: false // Even though these items are used in tools, they are not, themselves, a tool
            },
            {
                name: "Flint Spear Head",
                info: "Combine with long stick & twine at the Flint Toolmaker",
                prereq: ["Twine"],
                parts: [],
                craftTime: 30,
                isTool: false
            },
            {
                name: "Flint Hoe Head",
                info: "Combine with long stick & twine at the Flint Toolmaker",
                prereq: ["Twine"],
                parts: [],
                craftTime: 40,
                isTool: false
            }
        ],

        // possibleOutputs is already defined in blockHasSelectableCrafting
        // inputsAccepted is already defined in blockHasSelectableCrafting
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasSelectableCrafting
        // receiveItem() is already defined in blockHasSelectableCrafting

        update() {
            if (!state.readyToCraft()) return; // Normally we'd call searchForItems here, but since this block has no input, that isn't needed
            state.processCraft(1);
        },

        drawPanel() {
            $("#sidepanel").html(`
                <b>Rock Knapper</b><br />
                <br />
                Tools are critical to survival, and rocks are your first tool. Knapping is the art of smashing rocks into the shapes
                you need.<br />
                <br />
                Knapp rocks to craft either knives or stabbers - you must select one before crafting can begin. Once crafted, place
                into a storage unit to use where-ever needed.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Items on hand: <span id="sidepanelonhand">${
                    state.onhand.length
                }</span><br />
                Currently building: <span id="sidepaneltarget">${
                    state.currentCraft
                }</span><br />
                Current progress: <span id="sidepanelprogress">${state.drawProgressPercent()}</span>%<br />
            `);
            state.showDeleteLink();
            $("#sidepanel").append("<br /><br />");
            state.drawOutputChoices();
        },

        updatePanel() {
            // This only manages the few stats shown before the output selection
            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepaneltarget").html(state.currentCraft);
            $("#sidepanelprogress").html(state.drawProgressPercent());
            state.updateOutputChoices();
        },

        deleteBlock() {
            state.finishDelete();
        }
    };

    // Provide a way to show when new options become available for this block
    const genHandle = game.blockDemands.find(ele => ele.name === state.name);
    if (genHandle.hasNewOptions === undefined) {
        genHandle.hasNewOptions = itemName => {
            return itemName === "Twine";
        };
    }

    game.blockList.push(state);
    mapSquare.structure = state;
    $("#" + state.tile.id + "imageholder").html(
        '<img src="img/rockKnapper.png" />'
    );
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state),
        blockHasSelectableCrafting(state)
    );
};
