// Farm
// for DanIdle version 4
// Provides a place for players to grow crops on, after some work is done

import { game } from "./game.js";
import { item, food } from "../index.js";
import {
    blockOutputsItems,
    blockHasWorkerPriority,
    blockDeletesClean,
    blockHandlesFood,
    blockShowsOutputItems
} from "./activeblock.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { danCommon } from "./dancommon.js";
import $ from "jquery";

export const farm = mapsquare => {
    let state = {
        name: "farm",
        tile: mapsquare,
        id: game.getNextBlockId(),
        counter: 0,
        decayCounter: 0, // This is used during harvest time. If this exceeds a certain amount, the crops will no longer be usable
        // Players will still have to harvest them, to clear the land
        allowOutput: true,
        inItems: null,
        mode: "build",
        buildTime: 60, // How long it will take for this block to get the ground set up for planting. Applies to all plant types

        outputItems: [
            {
                name: "Wheat Seeds",
                buildTime: 5,
                growTime: 300,
                harvestTime: 4,
                output: [{ name: "Whole Wheat", qty: 20, isFood: false }]
            },
            {
                name: "Carrot Seeds",
                buildTime: 6,
                growTime: 300,
                harvestTime: 5,
                output: [{ name: "Carrot", qty: 5, isFood: true }, { name: "Carrot Seeds", qty: 3, isFood: false }]
            },
            {
                name: "Potato Seeds",
                buildTime: 6,
                growTime: 400,
                harvestTime: 5,
                output: [{ name: "Potato", qty: 7, isFood: true }, { name: "Potato Seeds", qty: 3, isFood: false }]
            },
            {
                name: "Bean Seeds",
                buildTime: 4,
                growTime: 250,
                harvestTime: 4,
                output: [{ name: "Bean", qty: 6, isFood: true }, { name: "Bean Seeds", qty: 4, isFood: false }]
            },
            {
                name: "Corn",
                buildTime: 4,
                growTime: 350,
                harvestTime: 8,
                output: [{ name: "Corn", qty: 2, isFood: true }]
            }
        ],

        toolChoices: [
            { groupName: "Spreader", isRequired: true, isUsed: true, choices: ["None", "Flint Hoe"] },
            { groupName: "Harvester", isRequired: false, isUsed: false, choices: ["None", "Flint Sickle"] }
        ],

        // getItem() is already defined in blockOutputsItems

        possibleoutputs() {
            // Returns an array containing all the possible outputs that this block will have.

            // Since the crop we are growing stays here a long time, we have reason to show only outputs of that crop type. Start by
            // determining if we have anything to grow yet
            if (state.inItems === null) {
                // Nothing is (currently) selected. Show all possible outputs
                return danCommon.flatten(state.outputItems.map(ele => ele.output.map(inner => inner.name)));
            }
            return state.outputItems.find(ele => ele.name === state.inItems.name).map(inner => inner.name);
        },

        inputsAccepted() {
            // Returns an array of items that this block will accept as input.
            return state.outputItems.map(ele => ele.name);
        },

        //willOutput(name) is already defined in blockOutputsItems

        willAccept(itemname) {
            // Returns true if this block will accept the given item right now.

            // Unlike other block types, this block can only accept one item as input at a time. Farming, unfortunately, will require a lot of land
            const result = state.inItems === null && state.outputItems.map(ele => ele.name).includes(itemname);
            console.log("farm.willAccept = " + result);
            return result;
        },

        receiveItem(item) {
            // Allows this block to accept an item as input. Returns true if successful, or false if the item is blocked out
            if (state.inItems != null) return false;
            state.inItems = item;
            return true;
        },

        update() {
            if (state.mode === "build") {
                // For normal blocks, we would wait for items to arrive to begin construction. But for this block, we can start work as soon
                // as a tool is loaded.

                if (game.workPoints < 1) return;

                // Start by ensuring we have tools. We will start this by enabling the spreader tool, and disabling the harvester tool.
                const eff = state.checkTool();
                if (eff === null) return;

                // We should be ready, at this point, to make progress in building the farm plot
                game.workPoints--;
                state.counter += eff;
                $("#" + state.tile.id + "progress").css({ width: (state.counter * 60) / state.buildTime });
                if (state.counter < state.buildTime) return;

                // Now, we are ready to move to the next phase
                state.mode = "gather";
                state.counter = 0;
            }
            if (state.mode === "gather") {
                // Here, we only need to wait until we have a suitable item
                $("#" + state.tile.id + "progress").css({ width: 0 });
                if (state.inItems != null) {
                    state.mode = "plant";
                    return;
                }

                // Now, we need to try manually finding an item from a nearby block. This might be a rare way to do things, but we still need to
                // account for it.
                if (game.workPoints < 1) return;
                game.blockList.neighbors(state.tile).find(neighbor => {
                    let pickup = neighbor.getItem(state.outputItems.map(ele => ele.name));
                    if (pickup === null) return false;
                    state.inItems = pickup;
                    state.mode = "plant"; // Since this is a one-item input, we can go ahead and advance the block's mode now, instead of after
                    // this loop
                    game.workPoints--;
                    return true;
                });
                return;
            }
            if (state.mode === "plant") {
                // Handle planting whatever crops we might have.
                // Since we don't have any tools for this (yet) we can skip worrying about that portion
                if (game.workPoints < 1) return;
                game.workPoints--;
                state.counter++;
                // Determine if we have sufficient progress to move to the next step
                const target = state.outputItems.find(ele => ele.name === state.inItems.name).buildTime;
                $("#" + state.tile.id + "progress").css({ width: (state.counter * 60) / target });
                if (state.counter < target) return;

                state.mode = "grow";
                state.counter = 0;
                return;
            }
            if (state.mode === "grow") {
                // Here, plants will grow without intervention from workers
                state.counter++;
                const target = state.outputItems.find(ele => ele.name === state.inItems.name).growTime;
                $("#" + state.tile.id + "progress").css({ width: (state.counter * 60) / target });
                if (state.counter < target) return;

                state.mode = "harvest";
                state.counter = 0;
                state.decayCounter = 0;
                // We also need to set up the tools properly for the next phase
                state.toolChoices.find(ele => ele.groupName === "Spreader").isUsed = false;
                state.toolChoices.find(ele => ele.groupName === "Harvester").isUsed = true;
                return;
            }
            if (state.mode === "harvest") {
                // Here, the player needs to get the crops harvested, before the decayCounter gets too high
                state.decayCounter++;
                if (game.workPoints < 1) return;
                const eff = state.checkTool();
                if (eff === null) {
                    console.log("Farm.update mode=harvest - tool efficiency=null");
                    return;
                }
                console.log("farm.update tool efficiency=" + eff);

                game.workPoints--;
                state.counter += Math.max(eff, 1);
                const target = state.outputItems.find(ele => ele.name === state.inItems.name).harvestTime;
                $("#" + state.tile.id + "progress").css({ width: (state.counter * 60) / target });
                if (state.counter < target) return;

                // Now we need to generate the output item (and delete the input item). Our output structure has a bit of complexitity to it...
                const maker = state.outputItems.find(ele => ele.name === state.inItems.name);
                maker.output.forEach(ele => {
                    for (let i = 0; i < ele.qty; i++) {
                        state.onhand.push(ele.isFood ? food(ele.name, 300, state) : item(ele.name));
                    }
                });
                state.inItems = null;

                state.toolChoices.find(ele => ele.groupName === "Spreader").isUsed = true;
                state.toolChoices.find(ele => ele.groupName === "Harvester").isUsed = false;
                state.counter = 0;
                state.mode = "build";
            }
        },

        drawpanel() {
            // Handles drawing the right side panel when this block is selected by the user
            $("#sidepanel").html(`
                <b>Farm Plot</b><br />
                <br />
                Edible plants are everywhere, but in the wild, they don't grow in enough places to support anyone. Farming allows humans
                to grow crops on a larger scale, supporting much more people.<br />
                <br />
                Grows a single (group) of seeds per land plot. The land requires tilling before plants can be placed. Once grown, crops must
                be harvested before they begin to rot.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`<br />
                Farm State: <span id="sidepanelstate">${state.mode}</span><br />
                State progress: <span id="sidepanelprogress">${state.getProgressPercent()}</span>%<br />
                Currently growing: <span id="sidepanelcrop">${
                    state.inItems === null ? "Nothing yet" : state.inItems.name
                }</span><br />
                Output items: <br />
                <div id="sidepanelonhand">${state.displayItemsOnHand()}</div><br />
            `);
            state.showDeleteLink();
            state.showTools();
        },

        updatepanel() {
            // Handles updating the content on the right side panel, whenever this block is selected
            $("#sidepanelstate").html(state.mode);
            $("#sidepanelprogress").html(state.getProgressPercent());
            $("#sidepanelcrop").html(state.inItems === null ? "Nothing yet" : state.inItems.name);
            $("#sidepanelonhand").html(state.displayItemsOnHand());
            state.updateToolPanel();
        },

        getProgressPercent() {
            // Provides an amount of progress, to be shown to the user, based on which-ever task this block is on
            switch (state.mode) {
                case "build":
                    return parseInt((state.counter * 100) / state.buildTime);
                case "gather":
                    return 0; // This is based on recieving a single item. So once we get it, this will move to the next task
                case "plant":
                    return parseInt(
                        (state.counter * 100) / state.outputItems.find(ele => ele.name === state.inItems.name).buildTime
                    );
                case "grow":
                    return parseInt(
                        (state.counter * 100) / state.outputItems.find(ele => ele.name === state.inItems.name).growTime
                    );
                case "harvest":
                    return parseInt(
                        (state.counter * 100) /
                            state.outputItems.find(ele => ele.name === state.inItems.name).harvestTime
                    );
                default:
                    console.log("Error in farm.getProgressPercent: unknown mode of " + state.mode);
            }
        },

        deleteblock() {
            // Handles starting the deletion process for this block
            // There is nothing critical that needs to happen before this block is destroyed, so just delete it
            state.finishDelete();
        }
    };

    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/farm.png">');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state),
        blockRequiresTool(state),
        blockHandlesFood(state),
        blockShowsOutputItems(state)
    );
};
