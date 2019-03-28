// Fire Miner
// for DanIdle version 4
// Uses fire and water to cut through rocks using thermal shock

import { game } from "./game.js";
import { blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority } from "./activeblock.js";
import { blockCooksItems } from "./blockAddon_CooksItems.js";
import $ from "jquery";

export const fireminer = mapsquare => {
    let state = {
        name: "fireminer",
        tile: mapsquare,
        id: game.lastBlockId,
        counter: 0,
        allowOutput: true,
        mode: "heat",
        itemsConversion: [], // This block won't have any items to convert (directly)
        fuelTypes: [
            { name: "Small Firewood", burnTime: 3, burnBoost: 4 },
            { name: "Medium Firewood", burnTime: 6, burnBoost: 5 },
            { name: "Large Firewood", burnTime: 15, burnBoost: 5 }
        ],
        tempDecay: 2,
        defaultTemp: 400,
        // This contains a list of all usable water containers, for shocking the hot rocks. Note we only have one, so it has little use - yet
        waterContainers: ["Wooden Water Cup"],
        rockTemp: 0,

        inputsAccepted() {
            // Returns an array list of all items that this block accepts as input
            return [...state.waterContainers, state.fuelTypes.map(ele => ele.name)];
        },

        update() {
            // Handles updating this block, once per tick
            // Unlike the campfire, we will not be processing cooking items

            if (state.mode == "heat") {
                state.updateTemp();
                // Now manage the temperature of the rock. We will determine a temperature difference between the two, and increase its temperature
                // based on a fraction of that amount
                state.rockTemp = (state.temp - state.rockTemp) / 50;
                // Now determine if the rocks are hot enough

                if (state.manageFuel()) return;
                if (state.findFuel()) return;
                // While we're here, we should also work on collecting water cups
                if (game.workPoints < 1) return;
                game.blockList.neighbors(state.tile).find(neighbor => {
                    let pickup = neighbor.getItem(state.waterContainers);
                    if (pickup === null) return false;
                    state.water.push(pickup);
                    game.workPoints--;
                    return true;
                });
            }
        },

        drawpanel() {
            $("#sidepanel").html(
                "<b><center>Fire Miner</center></b>" +
                    "<br />" +
                    "It should be obvious, the one directly to advance tech is through metals. But how do you mine through rocks without metals? " +
                    "The secret is fire - and water. Thermal shock will cut through any rock, no matter its toughness. But it is slow.<br />" +
                    "<br />" +
                    "Requires firewood, water (in a container such as a wooden cup), a hoe (flint will do), and wooden cranes. Outputs rock. After a " +
                    "sufficient depth, will begin to output metal ores or minerals based on your area."
            );
            state.showPriority();
            $("#sidepanel").append(
                "<br />" +
                "Status: heating rocks<br />" + // obviously we will need to change this later, but this will do for now
                    'Fire temperature: <span id="sidepaneltemp">' +
                    state.temp +
                    "</span><br />" +
                    'Rock temperature: <span id="sidepanelrocktemp">' +
                    state.rockTemp +
                    "</span> (target 300)<br />" +
                    ""
            );
        }
    };

    game.lastBlockId++;
    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/minerspost.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockShowsOutputItems(state),
        blockHasWorkerPriority(state),
        blockCooksItems(state)
    );
};
