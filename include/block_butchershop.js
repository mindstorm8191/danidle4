// Butcher Shop
// for DanIdle version 4
// Cuts dead animals into smaller meats, easy for cooking. Also outputs animal byproducts, such as fur, bones and feathers

import { blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockDeletesClean } from "./activeblock.js";
import { blockHasOutputsPerInput } from "./blockAddon_HasOutputsPerInput";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { game } from "./game.js";
import $ from "jquery";

export const butchershop = mapsquare => {
    let state = {
        name: "butchershop",
        tile: mapsquare,
        id: game.getNextBlockId(),
        counter: 0,
        allowOutput: true, // Determines if this block will output items. Later in the game, we will allow this item to output items,
        outputItems: [
            {
                name: "Dead Deer",
                craftTime: 50,
                output: [{ name: "Raw Deer Meat", qty: 7 }, { name: "Bone", qty: 4 }, { name: "Fur", qty: 3 }]
            },
            {
                name: "Dead Wolf",
                craftTime: 30,
                output: [{ name: "Raw Wolf Meat", qty: 4 }, { name: "Bone", qty: 2 }, { name: "Fur", qty: 2 }]
            },
            {
                name: "Dead Chicken",
                craftTime: 20,
                output: [{ name: "Raw Chicken Meat", qty: 2 }, { name: "Bone", qty: 1 }, { name: "Feather", qty: 5 }]
            }
        ],
        toolChoices: [{ groupName: "Cutter", isRequired: true, choices: ["None", "Flint Knife"] }],

        // getItem() is already defined in blockOutputsItems
        // possibleoutputs() is already defined in blockHasOutputsPerInput
        // inputsAccepted() is already defined in blockHasOutputsPerInput
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasOutputsPerInput
        // receiveItem() is already defined in blockHasOutputsPerInput

        update() {
            // Handles updating this block once every turn
            // Most of this is handled by our add-on code blocks
            if (!state.readyToCraft()) {
                if (game.workPoints <= 0) return; // We have no workers to work this block anyway
                state.searchForItems();
                return;
            }
            if (game.workPoints <= 0) return;
            const eff = state.checkTool();
            if (eff === null) return;
            game.workPoints--;
            state.processCraft(eff);
        },

        drawpanel() {
            // Handles drawing the contents on the side panel
            let curjob = "n/a";
            let craftPercent = "n/a";
            if (state.inItems.length > 0) {
                curjob = state.inItems[0].name;
                craftPercent = Math.floor(
                    (state.counter * 100) / state.outputItems.find(ele => ele.name === state.inItems[0].name).craftTime
                );
            }
            $("#sidepanel").html(`
                <b><center>Butcher Shop</center></b><br />
                <br />
                While cooking meats whole gets the job done, it is a lengthy process. Cutting meats into smaller pieces allows for
                faster cooking. Plus, other resources can be extracted from your catches.<br />
                <br />
                Chops dead animals into raw meats and other resources.  Requires a knife.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Items to butcher:<span id="sidepanelinput">${state.inItems.length}</span><br />
                Current work:<span id="sidepanelworking">${curjob}</span><br />
                Current progress: <span id="sidepanelprogress">${craftPercent}</span>%<br />
            `);
            state.showDeleteLink();
            $("#sidepanel").append(`
                <br />
                Output items on hand:
                <div id="sidepanelonhand">${state.displayItemsOnHand()}</div>
            `);
            state.showTools();
        },

        updatepanel() {
            $("#sidepanelinput").html(state.inItems.length);
            if (state.inItems.length > 0) {
                $("#sidepanelworking").html(state.inItems[0].name);
                $("#sidepanelprogress").html(
                    Math.floor(
                        (state.counter * 100) /
                            state.outputItems.find(ele => ele.name === state.inItems[0].name).craftTime
                    )
                );
            } else {
                $("#sidepanelworking").html("n/a");
                $("#sidepanelprogress").html("n/a");
            }
            $("#sidepanelonhand").html(state.displayItemsOnHand());
            state.updateToolPanel();
        },

        deleteblock() {
            state.finishDelete();
        }
    };

    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/butcher.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockShowsOutputItems(state),
        blockRequiresTool(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state),
        blockHasOutputsPerInput(state)
    );
};
