// Gravel road
// for DanIdle version 4
// Provides a gravel pathway, to make travel easier
// Note this was originally added to provide a use for all the gravel produced by the fire miner

import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { blockHasWorkerPriority } from "./activeBlock.js";
import { blockIsStructure } from "./blockAddon_IsStructure.js";
import { game } from "./game.js";
import $ from "jquery";

export const gravelRoad = mapSquare => {
    let state = {
        name: "gravelRoad",
        tile: mapSquare,
        id: game.getNextBlockId(),
        inItems: [], // Array that holds all the gravel that this block will receive
        mode: "collect",
        counter: 0,
        endurance: 0,
        allowOutput: false, // Determines if this block will output items. Note that this setting can be adjusted within this block
        //targetitems: [], // list of items we want to store here. Contains only the name of the items we want
        toolChoices: [{ groupName: "Spreader", isRequired: true, choices: ["None", "Flint Hoe"] }],
        buildRequirements: [{ name: "Gravel", qty: 4 }],
        baseEndurance: 20,
        toolEndurance: 4,
        buildTime: 120,

        // getItem() is now handled by blockIsStorage
        // possibleOutputs() is now handled in blockIsStructure
        // inputsAccepted() is now handled in blockIsStructure
        // willOutput() is now handled in blockIsStructure
        // willAccept() is now handled in blockIsStructure
        // receiveItem() is now handled in blockIsStructure

        update() {
            // Handles updating this block once each turn
            // Everything we need to do here is now handled in blockIsStructure
            state.handleUpdate();
        },

        drawPanel() {
            // Handles drawing the content on the right side of the page, when this block is selected.

            $("#sidepanel").html(`
                <center><b>Gravel Road</b></center>
                <br/>
                Traveling is a critical part of a kingdom. Developed roads allow people and goods to go places with less energy and time.
                Gravel isn't the best surface to travel on, but at this point it is easily available.<br />
                <br />
                Uses 4 gravel and a spreader tool (such as a hoe) to create one block of gravel road.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                Status: <span id="sidepanelstate">${state.showStatus()}</span><br />
                Gravel on hand: <span id="sidepanelonhand">${state.inItems.length}</span><br />
            `);
            state.showTools();
        },

        updatePanel() {
            // Handles updating the content shown on the right side of the page, if this block is selected.
            $("#sidepanelstate").html(state.showStatus());
            $("#sidepanelonhand").html(state.inItems.length);
            state.updateToolPanel();
        }

        //showstatus() is now handled in blockIsStructure
    };

    game.blockList.push(state);
    mapSquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/gravelRoad.png" />');
    return Object.assign(state, blockHasWorkerPriority(state), blockRequiresTool(state), blockIsStructure(state));
};
