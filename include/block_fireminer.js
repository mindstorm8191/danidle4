// Fire Miner
// for DanIdle version 4
// Uses fire and water to cut through rocks using thermal shock

import { game } from "./game.js";
import { blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority } from "./activeblock.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { blockCooksItems } from "./blockAddon_CooksItems.js";
import { item } from "../index.js";
import $ from "jquery";

export const fireminer = mapsquare => {
    let state = {
        name: "fireminer",
        tile: mapsquare,
        id: game.lastBlockId,
        counter: 0, // This is used in the clearing process, but not the heating process
        depth: 0, // How deep this mine currently is. Mines have to get to a certain depth before they begin yielding metal ores
        clearProgress: 0, // How many units of stone we have removed from this process
        allowOutput: true,
        mode: "heat",
        modeConverter: [{ source: "heat", show: "Heating rocks" }, { source: "clear", show: "Clearing rubble" }],
        // We use this structure to help us determine what to show in the block's mode, when drawing the side panel. We are putting this
        // here instead of as a constant in a function, since we'll need it in more than one function
        itemsConversion: [], // This block won't have any items to convert (directly), yet we still need to have it for the cooksItems add-on
        fuelTypes: [
            { name: "Small Firewood", burnTime: 3, burnBoost: 4 },
            { name: "Medium Firewood", burnTime: 6, burnBoost: 5 },
            { name: "Large Firewood", burnTime: 15, burnBoost: 5 }
        ],
        tempDecay: 2,
        defaultTemp: 400,
        // This contains a list of all usable water containers, for shocking the hot rocks. Note we only have one, so it has little use - yet
        waterContainers: ["Wooden Water Cup"],
        water: [], // All water units we have on hand
        toolChoices: [
            { groupName: "Shovel", isRequired: true, inUse: false, choices: ["None", "Flint Hoe"] },
            { groupName: "Crane", isRequired: true, inUse: false, choices: ["None", "Pole Crane"] }
        ],
        rockTemp: 0,

        possibleOutputs() {
            // Returns all possible outputs that this block can produce
            // We will eventually add ores to this as well... not just yet
            return ["Gravel", "Boulder"];
        },

        or_inputsAccepted() {
            // inputsAccepted() is already defined in blockCooksItems. This allows us to 'overwrite' that function to get this one to work
            // Returns an array list of all items that this block accepts as input
            //console.log(state.waterContainers);
            console.log([...state.waterContainers, ...state.fuelTypes.map(ele => ele.name)]);
            return [...state.waterContainers, ...state.fuelTypes.map(ele => ele.name)];
        },

        willOutput(itemname) {
            // Returns true if this block can output the specified item right now
            return state.onhand.some(ele => ele.name === itemname);
        },

        or_willAccept(itemname) {
            // Returns true if this block will accept the given item
            console.log("Check for acceptable items");
            if (state.waterContainers.includes(itemname)) return state.water.length < 10;
            if (state.fuelTypes.some(ele => ele.name === itemname)) return state.toBurn.length < 10;
            return false;
        },

        or_receiveItem(item) {
            // Handles receiving an item as input. Returns true if successful, or false if not
            if (state.waterContainers.includes(item.name) && state.water.length < 10) {
                console.log(state.water.push(item));
                return true;
            }
            if (state.fuelTypes.some(ele => ele.name === item.name) && state.toBurn.length < 10) {
                state.toBurn.push(item);
                return true;
            }
            return false;
        },

        update() {
            // Handles updating this block, once per tick
            // Unlike the campfire, we will not be processing cooking items

            if (state.mode == "heat") {
                state.updateTemp();
                // Now manage the temperature of the rock. We will determine a temperature difference between the two, and increase its temperature
                // based on a fraction of that amount
                //state.rockTemp += (state.temp - state.rockTemp) / 50;  // 50 is a good rate of progress. we are using another value for testing
                state.rockTemp += (state.temp - state.rockTemp) / 5;
                // Now determine if the rocks are hot enough
                if (state.rockTemp > 300 && state.water.length > 5) {
                    state.mode = "clear";
                    state.temp = 0;
                    state.rockTemp = 0;
                    state.counter = 0;
                    // Remove the first 5 items from the list of water units we have
                    state.water.splice(0, 5); // We will need to generate empty liquid containers here, but for now we'll simply discard them
                    state.clearProgress = 0;
                    state.clearTarget = ""; // Blank this out so we can select something new to clear away
                    return;
                }

                // These return true when work was completed
                //if (state.toCook.length === 0) state.toCook.push(1); This won't work; targetTemp then assumes we have something we want to cook, with a defined temperature
                if (state.manageFuel()) {
                    console.log("Exit at fuel management");
                    return;
                }
                if (state.findFuel()) {
                    console.log("Exit at fuel searching");
                    return;
                }
                // While we're here, we should also work on collecting water cups
                if (game.workPoints < 1 || state.water.length > 10) return;
                game.blockList.neighbors(state.tile).find(neighbor => {
                    let pickup = neighbor.getItem(state.waterContainers);
                    if (pickup === null) return false;
                    state.water.push(pickup);
                    game.workPoints--;
                    return true;
                });
                return;
            }

            //This should only be the clear mode
            // Start by selecting something we are currently clearing
            if (state.clearTarget === "") {
                console.log(state.toolChoices);
                if (Math.random() > 0.75) {
                    state.clearTarget = "Boulder";
                    // Also, set the usage modes of both tools
                    state.toolChoices.find(ele => {
                        console.log(ele.groupName);
                        if (ele.groupName === "Shovel") return true;
                        return false;
                    }).inUse = false;
                    state.toolChoices.find(ele => ele.groupName === "Crane").inUse = true;
                } else {
                    state.clearTarget = "Gravel";
                    state.toolChoices.find(ele => ele.groupName === "Shovel").inUse = true;
                    state.toolChoices.find(ele => ele.groupName === "Crane").inUse = false;
                }
                console.log("Now clearing " + state.clearTarget);
            }

            if (game.workPoints < 1) return; // cannot make progress unless there's a worker available
            const eff = state.checkTool();
            if (eff === null) return;
            // At this point, we are clear to make progress on clearing this
            game.workPoints--;
            state.counter += eff;
            console.log("Using efficiency " + eff + ", now at progress " + state.counter);
            if (state.counter < 30) return;

            // We have enough progress to generate something
            state.counter -= 30;
            state.onhand.push(item(state.clearTarget));
            state.clearProgress++;
            if (state.clearProgress < 20) return;

            // We have cleared enough room to 'start the fire' again. Most of our mode variables have already been set
            state.mode = "heat";
            state.clearProgress = 0;
            state.counter = 0;
        },

        drawpanel() {
            $("#sidepanel").html(`
                <b><center>Fire Miner</center></b>
                <br />
                It should be obvious, the one directly to advance tech is through metals. But how do you mine through rocks without metals?
                The secret is fire - and water. Thermal shock will cut through any rock, no matter its toughness. Yes, it is slow, but still
                effective, even when having no suitable tools. You will have better mining options in the future.<br />
                <br />
                Requires firewood, water (in a container such as a wooden cup), a hoe (flint will do), and wooden cranes. Outputs rock. After a
                sufficient depth, will begin to output metal ores or minerals based on your area.
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Status: <span id="sidepanelstatus">${
                    state.modeConverter.find(ele => state.mode === ele.source).show
                }</span><br />
                Current digging depth: <span id="sidepaneldepth">${state.depth}</span><br />
                Fire temperature: <span id="sidepaneltemp">${state.temp}</span><br />
                Rock temperature: <span id="sidepanelrocktemp">${state.rockTemp}</span> (target 300)<br />
                Fuel on hand: <span id="sidepanelfuel">${state.toBurn.length}</span><br />
                Output items:
                <div id="sidepanelonhand">${state.displayItemsOnHand()}</div>
                <br />
            `);
            state.showTools();
        },

        updatepanel() {
            $("#sidepanelstatus").html(state.modeConverter.find(ele => state.mode === ele.source).show);
            $("#sidepaneldepth").html(state.depth);
            $("#sidepaneltemp").html(state.temp);
            $("#sidepanelrocktemp").html(state.rockTemp);
            $("#sidepanelfuel").html(state.toBurn.length);
            $("#sidepanelonhand").html(state.displayItemsOnHand());
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
        blockRequiresTool(state),
        blockCooksItems(state)
    );
};
