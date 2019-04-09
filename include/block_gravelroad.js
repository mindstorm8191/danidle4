// Gravel road
// for DanIdle version 4
// Provides a gravel pathway, to make travel easier
// Note this was originally added to provide a use for all the gravel produced by the fire miner

import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { blockHasWorkerPriority } from "./activeblock.js";
import { game } from "./game.js";
import $ from "jquery";

export const gravelroad = mapsquare => {
    let state = {
        name: "gravelroad",
        tile: mapsquare,
        id: game.lastBlockId,
        inItems: [], // Array that holds all the gravel that this block will receive
        mode: "collect",
        counter: 0,
        endurance: 0,
        allowOutput: false, // Determines if this block will output items. Note that this setting can be adjusted within this block
        targetitems: [], // list of items we want to store here. Contains only the name of the items we want
        toolChoices: [{ groupName: "Spreader", isRequired: true, choices: ["None", "Flint Hoe"] }],

        possibleoutputs() {
            // Return a list of all the item names that this block might output
            // This block doesn't have any output options
            return [];
        },

        inputsAccepted() {
            // Returns a list of items that this block accepts as input
            return ["Gravel"];
        },

        willOutput() {
            // Returns true if the given item (by itemname) can be output right now.
            // This block doesn't output any items
            return false;
        },

        willAccept(itemname) {
            // Returns true if this block will accept the given item right now.
            return state.mode === "collect" && state.inItems.length < 4 && itemname === "Gravel";
        },

        receiveItem(item) {
            // Accepts an item as input. Returns true if successful, or false if not.
            // This block does not accept any items.
            if (state.mode != "collect" || state.inItems.length >= 4 || item.name != "Gravel") return false;
            state.inItems.push(item);
            return true;
        },

        update() {
            // Handles updating this block once each turn
            if (state.mode === "collect") {
                if (state.inItems.length >= 4) {
                    // We are ready to proceed to building this
                    state.mode = "build";
                    return state.update(); // Since nothing has actually happened here, go ahead and call our function again
                }
                // Search neighbor blocks for gravel input (we might as well do this here, even though most of it will be brought in by hauler blocks)
                if (game.workPoints < 1) return;
                game.blockList.neighbors(state.tile).some(ele => {
                    let pickup = ele.getItem("Gravel");
                    if (pickup === null) return false;
                    state.inItems.push(pickup);
                    game.workPoints--;
                    return true;
                });
                return;
            }
            if (state.mode === "build") {
                if (game.workPoints < 1) return;
                // We need to use a total of 2 minutes to spread the gravel into a reasonable road surface. We will also need to use our tools here

                let eff = state.checkTool();
                if (eff === null) return;
                game.workPoints--;
                state.counter++;
                state.endurance += 20 + eff; // Gravel roads will last a very long time. Tools won't have much bearing on it, but will still have some.
                if (state.counter < 120) return;

                state.counter = state.endurance; // Like the lean-to, we will keep the endurance value as a total, and use the counter to
                // determine when we need to rebuild this
                state.mode = "use";
                return;
            }
            // Here, we can assume the mode is 'use'.
            state.counter--;
            if (state.counter > 0) return;
            // Our gravel road has faced out, and needs to be replaced
            state.endurance = 0;
            state.inItems.splice(0, 4);
            state.counter = 0;
            state.mode = "collect";
        },

        drawpanel() {
            // Handles drawing the content on the right side of the page, when this block is selected.

            $("#sidepanel").html(`
                <center><b>Gravel Road</b></center>
                <br/>
                Traveling is a critical part of a kingdom. Developed roads allow people and goods to go places with less energy and time.
                Gravel isn't the best surface to travel on, but at this point it is easily available.<br />
                <br />
                Uses 4 gravel and a spreader (such as a hoe) to create one block of gravel road.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                Status: <span id="sidepanelstate">${state.showstatus()}</span><br />
                Gravel on hand: <span id="sidepanelonhand">${state.inItems.length}</span><br />
            `);
            state.showTools();
        },

        updatepanel() {
            // Handles updating the content shown on the right side of the page, if this block is selected.
            $("#sidepanelstate").html(state.showstatus());
            $("#sidepanelonhand").html(state.inItems.length);
            state.updateToolPanel();
        },

        showstatus() {
            // Shows text about what state this block is in.
            if (state.mode === "collect") {
                return `Collecting gravel. Need ${4 - state.inItems.length} more`;
            }
            if (state.mode === "build") {
                return `Building (${Math.floor((this.counter * 100) / 120)}% complete)`;
            }
            if (state.mode === "use") {
                return `In use. ${Math.floor((this.counter * 100) / this.endurance)}% lifetime remaining`;
            }
            return `Bad mode type of ${state.mode}.`;
        }
    };

    game.lastBlockId++;
    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/gravelroad.png" />');
    return Object.assign(state, blockHasWorkerPriority(state), blockRequiresTool(state));
};
