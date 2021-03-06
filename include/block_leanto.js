// Lean-To
// for DanIdle version 4
// Provides an early shelter for colonists

import { blockHasWorkerPriority, blockDeletesClean } from "./activeBlock.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { blockIsStructure } from "./blockAddon_IsStructure.js";
import { game } from "./game.js";
import $ from "jquery";

export const leanto = mapSquare => {
    let state = {
        name: "leanto",
        tile: mapSquare,
        id: game.getNextBlockId(),
        inItems: [],
        mode: "collect",
        counter: 0,
        endurance: 0, // Rather than using the counter to count down, we will use a second variable to determine how much
        // total endurance we can generate within the 'construction' time (based on what tools are used)
        //status: 0,
        housingSpace: 0, // This is read by a core function to determine how much housing space the user currently has.
        // This will only be set to 2 if this leanTo is in a useable state
        toolChoices: [{ groupName: "Chopper", isRequired: false, choices: ["None", "Flint Stabber", "Flint Hatchet"] }],
        buildRequirements: [],
        baseEndurance: 5,
        toolEndurance: 5,
        buildTime: 120,

        // getItem() is now handled by blockIsStructure
        // possibleOutputs() is now handled by blockIsStructure
        // inputsAccepted() is now handled by blockIsStructure
        // willOutput() is now handled by blockIsStructure
        // willAccept() is now handled by blockIsStructure
        // receiveItem() is now handled by blockIsStructure

        update() {
            // Handles updating this block every tick
            // All this update stuff should be handled by blockIsStructure now

            state.handleUpdate();
        },

        drawPanel() {
            $("#sidepanel").html(`
                <b>Lean-To</b><br />
                Before food, even before water, one must find shelter from the elements. It is the first requirement for survival; for the
                elements, at their worst, can defeat you faster than anything else.<br />
                <br />
                Consisting of a downed branch with leaves on top, this is easy to set up, needing no tools - but wont last long in the
                elements itself. With luck, youll be able to upgrade this soon enough<br />
                <br />
                Once set up, will require regular maintenance to remain functional.<br />
                <br />
            `);
            state.showPriority();
            state.showDeleteLink();
            $("#sidepanel").append(`<br />Status: <span id="sidepanelstate">${state.showStatus()}</span><br />`);
            if (game.unlockedItems.includes("Flint Stabber")) {
                state.showTools();
            }
        },

        updatePanel() {
            $("#sidepanelstate").html(state.showStatus());
            if (game.unlockedItems.includes("Flint Stabber")) {
                state.updateToolPanel();
            }
        },

        deleteBlock() {
            state.finishDelete();
        },

        isReady(newState) {
            // This is called by blockIsStructure whenever the block mode is changed to/from in-use
            state.housingSpace = newState ? 2 : 0;
        }
    };

    // Provide a way to show when new options become available for a specific block type
    const genHandle = game.blockDemands.find(ele => ele.name === state.name);
    if (genHandle.hasNewOptions === undefined) {
        genHandle.hasNewOptions = itemName => {
            const helperTools = ["Flint Stabber", "Flint Hatchet"];
            return helperTools.includes(itemName);
        };
    }

    game.blockList.push(state);
    mapSquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/leanto.png" />');
    return Object.assign(
        state,
        blockHasWorkerPriority(state),
        blockDeletesClean(state),
        blockRequiresTool(state),
        blockIsStructure(state)
    );
};
