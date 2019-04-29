// Boulder Wall
// for DanIdle version 4
// Provides a solid wall made of boulders and gravel, improving protection from invaders
// Note, this was originally added as something for boulders to be used for, since the Fire Miner block will produce a ton of it

import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { blockIsStructure } from "./blockAddon_IsStructure.js";
import { blockHasWorkerPriority } from "./activeblock.js";
import { game } from "./game.js";
import $ from "jquery";

export const boulderwall = mapsquare => {
    let state = {
        name: "boulderwall",
        tile: mapsquare,
        id: game.getNextBlockId(),
        inItems: [],
        mode: "collect",
        counter: 0,
        endurance: 0,
        allowOutput: false,
        toolChoices: [
            { groupName: "Crane", isRequired: true, choices: ["None", "Pole Crane"] },
            { groupName: "Spreader", isRequired: true, choices: ["None", "Flint Hoe"] }
        ],
        buildRequirements: [{ name: "Boulder", qty: 5 }, { name: "Gravel", qty: 4 }],
        baseEndurance: 20, // How much endurance is gained each tick, reguarless of tools
        toolEndurance: 5, // This is multiplied by all the tools' endurance value, then added to the accumulated endurance, per tick
        buildTime: 300,

        // getItem() is now handled by blockIsStorage
        // possibleoutputs() is now handled in blockIsStructure
        // inputsAccepted() is now handled in blockIsStructure
        // willOutput() is now handled in blockIsStructure
        // willAccept() is now handled in blockIsStructure
        // receiveItem() is now handled in blockIsStructure

        update() {
            // Handles updating this block every tick.
            // This is a simple block, just about everything is handled in the blockIsStructure's update code

            state.handleUpdate();
        },

        drawpanel() {
            // Handles displaying content that is shown on the right side, for this block
            $("#sidepanel").html(`
                <center><b>Boulder Wall</b></center>
                <br />
                As your colony grows, so too will threats from the outside. Though a short wall cannot block all threats, it will keep enemy
                armies from storming into your colony from unexpected directions.<br />
                <br />
                Uses boulders and gravel to build a short stone wall.  Requires a spreading tool (such as a flint hoe) and a lifting device
                (such as a pole crane).<br />
                <br />
                Status: <span id="sidepanelstatus">${state.showStatus()}</span><br />
            `);
            state.showTools();
        },

        updatepanel() {
            // Handles updating the side panel content, when displayed, once per tick
            $("#sidepanelstatus").html(state.showStatus());
        }
    };

    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/boulderwall.png" />');
    return Object.assign(state, blockIsStructure(state), blockHasWorkerPriority(state), blockRequiresTool(state));
};
