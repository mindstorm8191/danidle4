// WoodCrafter
// for DanIdle version 4
// Cuts wood from logs into various items

import { game } from "./game.js";
import { blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockDeletesClean } from "./activeBlock.js";
import { blockHasSelectableCrafting } from "./blockAddon_HasSelectableCrafting.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import $ from "jquery";

export const woodCrafter = mapSquare => {
    let state = {
        name: "woodCrafter",
        tile: mapSquare,
        id: game.getNextBlockId(),
        counter: 0,
        maxOutput: 5,
        allowOutput: true,
        toolChoices: [{ groupName: "Chopper", isRequired: true, choices: ["None", "Flint Hatchet"] }],
        outputItems: [
            { name: "None", prereq: [], parts: [], isTool: false },
            {
                name: "Log Chunk",
                info: "Cut a log down to size",
                prereq: [],
                parts: [{ name: "Log", qty: 1 }],
                isTool: false,
                craftTime: 200,
                craftQty: 8
            },
            {
                name: "Wooden Bowl",
                info: "Carries liquids, like water",
                prereq: [],
                parts: [{ name: "Log Chunk", qty: 1 }],
                isTool: false,
                craftTime: 40
            },
            // a craftTime of 40 might seem like a lot, but the Flint Hatchet has double production speed
            {
                name: "Firewood Log Wet",
                info: "Chop wood for fire. Requires drying",
                prereq: [],
                parts: [{ name: "Log Chunk", qty: 1 }],
                isTool: false,
                craftTime: 40,
                craftQty: 7
            }, // Wet firewood will need time to dry. We will need another block to put this in for it to dry out (that block will need a roof!)
            {
                name: "Pole",
                info: "Cut logs into long poles for more construction options",
                prereq: [],
                parts: [{ name: "Log", qty: 1 }],
                isTool: false,
                craftTime: 250,
                craftQty: 4
            },
            {
                name: "Basic Crane",
                info: "Pick up heavy objects (like boulders)",
                prereq: [],
                parts: [
                    { name: "Pole", qty: 1 },
                    { name: "Long Stick", qty: 9 },
                    { name: "Short Stick", qty: 8 },
                    { name: "Twine", qty: 8 }
                ],
                isTool: true,
                endurance: 20,
                enduranceGain: 1,
                enduranceTaper: 0.01,
                efficiency: 1,
                efficiencyGain: 0,
                efficiencyTaper: 0,
                craftTime: 400,
                craftQty: 1
            }
            // And... I'm not sure what else we should craft with this block - yet - I'm sure we'll think of something
        ],

        // getItem() is already defined in blockOutputsItems
        // possibleOutputs() is already defined in blockHasSelectableCrafting
        // inputsAccepted() is already defined in blockHasSelectableCrafting
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasSelectableCrafting
        // receiveItem() is already defined in blockHasSelectableCrafting

        update() {
            // Handles updating this block once every turn
            if (state.onhand.length > 15) return;
            if (!state.readyToCraft()) {
                state.searchForItems(true); // Managing the availability of workPoints is now handled in searchForItems
                return;
            }
            const eff = state.checkTool();
            if (eff === null) return;
            state.processCraft(eff);
        },

        drawPanel() {
            $("#sidepanel").html(`
                <center><b>Woodcrafter</b></center>
                <br />
                Crafting things out of sticks can only get you so far. Eventually you will need to craft wood from larger wood portions,
                such as whole logs.<br />
                <br />
                Uses a hatchet to cut logs into other things, such as bowls.<br />
                <br />
            `);
            state.showPriority();
            $("#sidepanel").append("<br />");
            state.showDeleteLink();
            $("#sidepanel").append(`
                <br />
                <b>Items Needed</b>:
                <div id="sidepanelparts">${state.drawStocks()}</div>
                <br />
                Current progress: <span id="sidepanelprogress">${state.drawProgressPercent()} </span>%<br />
                <b>Output Items on hand:</b>
                <div id="sidepanelonhand">${state.displayItemsOnHand()}</div>
                <br />
            `);
            state.drawOutputChoices();
            state.showTools();
        },

        updatePanel() {
            // Handles updating the side panel, once every tick
            // Update the sections that require updating
            // Priority doesn't need anything changed, unless interacted with
            $("#sidepanelparts").html(state.drawStocks());
            $("#sidepanelonhand").html(state.displayItemsOnHand());
            $("#sidepanelprogress").html(state.drawProgressPercent());
            state.updateOutputChoices();
            state.updateToolPanel();
        },

        deleteBlock() {
            // Handles deleting this block when the user chooses to delete it.
            // This block doesn't do anything special when deleting
            state.finishDelete();
        }
    };

    game.blockList.push(state);
    mapSquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/woodCrafter.png" />');

    return Object.assign(
        state,
        blockOutputsItems(state),
        blockShowsOutputItems(state),
        blockHasWorkerPriority(state),
        blockRequiresTool(state),
        blockDeletesClean(state),
        blockHasSelectableCrafting(state)
    );
};
