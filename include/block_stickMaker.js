// Stick Maker
// for DanIdle version 4 
// Allows the user to cut branches from trees for sticks, of various uses

import { blockOutputsItems, blockHasWorkerPriority, blockDeletesClean } from "./activeBlock.js";
import { blockHasSelectableCrafting } from "./blockAddon_HasSelectableCrafting.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { game } from "./game.js";
import $ from "jquery";

export const stickMaker = mapSquare => {
    let state = {
        name: "stickMaker",
        tile: mapSquare,
        id: game.getNextBlockId(),
        counter: 0,
        maxOutput: 8,
        allowOutput: true,
        toolChoices: [{ groupName: "Chopper", isRequired: true, choices: ["None", "Flint Stabber", "Flint Hatchet"] }],
        outputItems: [
            { name: "None", prereq: [], parts: [], isTool: false },
            { name: "Short Stick", info: "Used for flint tools", prereq: [], parts: [], isTool: false, craftTime: 30 },
            { name: "Long Stick", info: "Used for flint tools", prereq: [], parts: [], isTool: false, craftTime: 30 },
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
        // possibleOutputs() is already defined in blockHasSelectableCrafting
        // inputsAccepted() is already defined in blockHasSelectableCrafting
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasSelectableCrafting
        // receiveItem() is already defined in blockHasSelectableCrafting

        update() {
            if (state.onhand.length >= 15) return;
            if (!state.readyToCraft()) return; // Normally we'd call searchForItems here, but this block doesn't need any inputs
            const eff = state.checkTool();
            if (eff === null) return;
            //console.log("StickMaker using " + eff + " efficiency");
            state.processCraft(eff);
        },

        drawPanel() {
            $("#sidepanel").html(`
                <b>Stick Maker</b><br />
                <br />
                The effective use of wood is crucial for continued expansion of your colony. Durable yet easily workable, and there's
                plenty to be made use of.<br />
                <br />
                Cuts down small trees and branches of larger ones to produce sticks of various sizes.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Items on hand: <span id="sidepanelonhand">${state.onhand.length}</span><br />
                Currently building: <span id="sidepanelcurrent">${state.currentCraft}</span><br />
                Current progress: <span id="sidepanelprogress">${state.drawProgressPercent()}</span>%<br />
            `);
            state.showDeleteLink();
            $("#sidepanel").append("<br /><br />");
            state.drawOutputChoices();
            state.showTools();
        },

        updatePanel() {
            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepanelcurrent").html(state.currentCraft);
            $("#sidepanelprogress").html(state.drawProgressPercent());
            state.updateToolPanel();
            state.updateOutputChoices();
        },

        deleteBlock() {
            state.finishDelete();
        }
    };

    // Provide a way to show the user when new options become available for this block type
    // We want to add a new function to the blockDemands list, called hasNewOptions. To
    // ensure that we're not creating & re-creating this, determine if it exists before
    // trying to generate it again. This function will be called (if it exists) when new
    // items are completed. It accepts an itemName parameter, and output true if
    const genHandle = game.blockDemands.find(ele => ele.name === state.name);
    if (genHandle.hasNewOptions === undefined) {
        genHandle.hasNewOptions = itemName => {
            return itemName === "Flint Hatchet";
        };
    }

    game.blockList.push(state);
    mapSquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/stickMaker.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockRequiresTool(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state),
        blockHasSelectableCrafting(state)
    );
};
