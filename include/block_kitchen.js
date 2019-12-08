// Kitchen
// for DanIdle version 4
// provides a place where foods can be processed and prepared to be eaten. Since we're starting with very limited technology, this assumes the
// only real tools you have (to start with) is a knife

import { game } from "./game.js";
import { item, food } from "../index.js";
import {
    blockOutputsItems,
    blockHasWorkerPriority,
    blockHandlesFood,
    blockDeletesClean,
    blockShowsOutputItems
} from "./activeblock.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
import { blockHasOutputsPerInput } from "./blockAddon_HasOutputsPerInput.js";
import $ from "jquery";

export const kitchen = mapsquare => {
    let state = {
        name: "kitchen",
        tile: mapsquare,
        id: game.getNextBlockId(),
        counter: 0,
        alloutOutput: true,
        outputItems: [
            {
                name: "Whole Wheat",
                craftTime: 5,
                output: [
                    { name: "Wheat Seeds", qty: 1 },
                    { name: "Wheat Stems", qty: 1 }
                ]
            }
        ],
        toolChoices: [
            {
                groupName: "Cutter",
                isRequired: true,
                choices: ["None", "Flint Knife"]
            }
        ],

        // getItem() is already defined in blockOutputsItems
        // possibleoutputs() is already defined in blockHasOutputsPerInput
        // inputsAccepted() is already defined in blockHasOutputsPerInput
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasOutputsPerInput
        // receiveItem() is already defined in blockHasOutputsPerInput

        update() {
            // Yes, this is copied directly from the ButcherShop block. But they behave exactly the same

            if (!state.readyToCraft()) {
                if (game.workPoints <= 0) return; // We have no workers to work this block anyway
                state.searchForItems();
                return;
            }
            if (game.workPoints <= 0) return;
            const eff = state.checkTool(true);
            if (eff === null) return;

            game.workPoints--;
            state.processCraft(1);
        },

        drawpanel() {
            let curjob = "n/a";
            let craftPercent = "n/a";
            if (state.inItems.length > 0) {
                curjob = state.inItems[0].name;
                craftPercent = Math.floor(
                    (state.counter * 100) /
                        state.outputItems.find(
                            ele => ele.name === state.inItems[0].name
                        ).craftTime
                );
            }
            $("#sidepanel").html(`
                <b><center>Kitchen</center></b><br />
                <br />
                <p>As more food options become available, preparing foods before cooking becomes necessary.</p>
                <p>
                    Actions available:
                    <ul>
                        <li>Cut whole wheat into stems and seeds
                        <li>Other options to come later
                    </ul>
                </p>
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Items to process:<span id="sidepanelinput">${state.inItems.length}</span><br />
                Current work: <span id="sidepanelworking">${curjob}</span><br />
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
                            state.outputItems.find(
                                ele => ele.name === state.inItems[0].name
                            ).craftTime
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
            // Nothing extra to do here
            state.finishDelete();
        }
    };

    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html(
        '<img src="img/kitchen.png" />'
    );
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
