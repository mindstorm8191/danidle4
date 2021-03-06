// Campfire
// For DanIdle version 4
// Provides warmth for the colonists, as well as a way to cook meats they collect

import {
    blockOutputsItems,
    blockHasWorkerPriority,
    blockHandlesFood
} from "./activeBlock.js";
import { blockCooksItems } from "./blockAddon_CooksItems.js";
import { game } from "./game.js";
import $ from "jquery";

export const campfire = mapSquare => {
    let state = {
        name: "campfire",
        tile: mapSquare,
        id: game.getNextBlockId(),
        counter: 0,
        allowOutput: true,
        mode: "run", // This is used only for when the block is set to be deleted. Will be set to something else until the temperature is low enough

        // itemsConversion handles determinine what items are accepted as input, as well as what it generated by each item
        itemsConversion: [
            {
                name: "Dead Deer",
                craftTime: 40,
                minTemp: 50,
                targetTemp: 200,
                burnLimit: 150,
                output: [{ name: "Deer Meat", qty: 4, itemType: "food" }]
            },
            {
                name: "Dead Wolf",
                craftTime: 20,
                minTemp: 50,
                targetTemp: 200,
                burnLimit: 150,
                output: [{ name: "Wolf Meat", qty: 2, itemType: "food" }]
            },
            {
                name: "Dead Chicken",
                craftTime: 15,
                minTemp: 50,
                targetTemp: 200,
                burnLimit: 150,
                output: [{ name: "Chicken Meat", qty: 1, itemType: "food" }]
            },
            // Once we have the butcher shop set up, we can also handle raw chopped meats
            {
                name: "Raw Deer Meat",
                craftTime: 6,
                minTemp: 50,
                targetTemp: 200,
                burnLimit: 200,
                output: [{ name: "Deer Meat", qty: 1, itemType: "food" }]
            },
            {
                name: "Raw Wolf Meat",
                craftTime: 6,
                minTemp: 50,
                targetTemp: 200,
                burnLimit: 200,
                output: [{ name: "Wolf Meat", qty: 1, itemType: "food" }]
            },
            {
                name: "Raw Chicken Meat",
                craftTime: 6,
                minTemp: 50,
                taretTemp: 200,
                burnLimit: 200,
                output: [{ name: "Chicken Meat", qty: 1, itemType: "food" }]
            }
            // There will also be other non-food things to cook
        ],
        fuelTypes: [
            { name: "Small Firewood", burnTime: 5, burnBoost: 5 },
            { name: "Medium Firewood", burnTime: 10, burnBoost: 5 },
            { name: "Large Firewood", burnTime: 20, burnBoost: 5 }
        ],
        tempDecay: 2,
        defaultTemp: 0, // This is how hot the fire should get when not in use. Note that a temp of zero lets it cool all the way down if
        // this is not in use

        // getItem() is already defined in blockOutputsItems
        // possibleOutputs() is already defined in blockCooksItems
        // inputsAccepted() is already defined in blockCooksItems
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockCooksItems

        update() {
            // Unlike other block types, we will have to manage the temperature of the fire. Here's the plan:
            // 1) The fire will loose 2 heat every tick, whether there's wood, food or not. Temperature cannot drop below zero
            // 2) Adding wood to the fire will increase heat by 5 every tick.
            // 3) Various wood types will burn for different time spans (sticks will last 10 ticks, logs will last 30)
            // 4) Colonists will continue adding wood to the fire until a target temperature is reached (probably 250)
            // 5) Foods will cook at a regular rate at a temperature of 200. Foods will not cook at all at/below 50. Between
            //    these temperatures, food will cook more slowly, at a ratio rate. So, something like
            //    counter += (temp-50)/150, min=0, max=1

            state.updateTemp();

            if (state.mode === "remove") {
                if (state.temp < 50) state.finishDelete();
                return;
            }

            state.updateCook(state.onhand.length < 20);
            if (state.manageCooking()) return;
            if (state.manageFuel()) return;
            if (state.findFuel()) return;
            state.findCookables();
        },

        drawPanel() {
            // Before starting, determine how much progress to show in the item progress (even if we're working on nothing)
            $("#sidepanel").html(`
                <b>Fire Pit</b><br />
                <br />
                Fire is man's ultimate tool, even in primitive times. Not only does it provide warmth, it cooks food, unlocking
                nutrients that would otherwise be inaccessible to the body. Easy access to nutrients allows humans to do more.<br />
                <br />
                Provides a place to cook foods and other things. Requires constant supply of firewood (such as sticks) to maintain
                heat. Provide raw foods (like meats) to be cooked; butchering is optional but recommended.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Fire temperature: <span id="sidepaneltemp">${
                    state.temp
                }</span><br />
                Current item progress: <span id="sidepanelprogress">${state.getCookProgress()}</span>%<br />
                Firewood on hand: <span id="sidepanelfuel">${
                    state.toBurn.length
                }</span><br />
                Cookable items on hand: <span id="sidepanelcook">${
                    state.toCook.length
                }</span><br />
                <a href="#" id="sidepaneldelete">Delete Block</a><br />
                Completed items on hand: <span id="sidepanelonhand">${
                    state.onhand.length
                }</span><br />
            `);
            document
                .getElementById("sidepaneldelete")
                .addEventListener("click", () =>
                    game.blockSelect.deleteBlock()
                );
        },

        updatePanel() {
            $("#sidepaneltemp").html(state.temp);
            $("#sidepanelprogress").html(state.getCookProgress());
            $("#sidepanelfuel").html(state.toBurn.length);
            $("#sidepanelcook").html(state.toCook.length);
            $("#sidepanelonhand").html(state.onhand.length);
        },

        getCookProgress() {
            // Determines what cook time to show in the side panel. This is delegated to a function since we'll need it both in
            // the initial display of the side panel, and again when updating it.
            // Returns the percent value of progress on completing the current cooking process, or "N/A" if there's nothing to cook.

            if (state.toCook.length === 0) return "N/A";
            return Math.floor(
                (state.counter * 100) /
                    state.itemsConversion.find(
                        ele => ele.name === state.toCook[0].name
                    ).craftTime
            );
        },

        deleteBlock() {
            // This block can delete clean, but it requires that the fire not be really hot. We will wait for the fire to cool down
            // before making this block disappear.

            if (state.temp > 50) {
                state.mode = "remove";
                return;
            }

            // Since the temperature is less than 50, we can go ahead and delete this.
            state.finishDelete();
        },

        finishDelete() {
            // Handle the actual deletion process. Note that this matches what we do with other clean-delete blocks.

            $("#" + state.tile.id + "progress").css({
                width: 0,
                "background-color": "green"
            });
            $("#" + state.tile.id + "imageholder").html("");
            state.tile.structure = null;
            $("#sidepanel").html(" ");
            game.blockList.splice(game.blockList.indexOf(this), 1);
            game.blockSelect = null;
        }
    };

    game.blockList.push(state);
    mapSquare.structure = state;
    $("#" + state.tile.id + "imageholder").html(
        '<img src="img/campfire.png" />'
    );
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockHasWorkerPriority(state),
        blockHandlesFood(state),
        blockCooksItems(state)
    );
};
