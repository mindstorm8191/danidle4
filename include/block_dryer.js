// Dryer
// for DanIdle version 4
// provides a place for drying things, that is covered (to protect from rain)

import { game } from "./game.js";
import {
    blockOutputsItems,
    blockHasWorkerPriority,
    blockDeletesClean
} from "./activeBlock.js";
import { item } from "../index.js";
import $ from "jquery";
//import { blockHasOutputsPerInput } from "./blockAddon_HasOutputsPerInput.js";
//import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
//import { blockIsStructure } from "./blockAddon_IsStructure.js"; We still cannot use blockIsStructure here, as that would conflict with the
// declared functions that blockHasOutputsPerInput has

export const dryer = mapSquare => {
    let state = {
        name: "dryer",
        tile: mapSquare,
        id: game.getNextBlockId(),
        counter: 3600,
        allowOutput: true,
        mode: "use",
        //debugOutput: true,

        hold: [],
        // This is what is being held by this block. When an item has finished, it will stay here until
        // it is picked up

        // Using blockHasOutputsPerInput with this block will just not work. This block will need the common functions to behave based on if
        // the block is completed or not.
        // So instead of trying to use blockHasOutputsPerInput, we will setup another block add-on type to handle this. Our next block
        // (the Bloomery) will require a very similar setup to this one.

        outputItems: [
            {
                name: "Wet Bloomery Block",
                craftTime: 30,
                output: "Bloomery Block" // Typical dried clay will output 'raw' items. But with the bloomery, we can just use the
                // finished raw items.
            },
            {
                name: "Firewood Log Wet",
                craftTime: 400,
                output: "Firewood Log"
            }
        ],

        buildParts: [
            { name: "Pole", qty: 4, have: [] },
            { name: "Long Stick", qty: 8, have: [] },
            { name: "Thatch Shingle", qty: 8, have: [] }
        ],
        // Hmm. It seems that, before we can really build this block, we'll need some straw, so we can make a thatch roof with it. So we have to
        // create a farming industry

        possibleOutputs() {
            // Returns an array of all possible output items this block will have
            return state.outputItems.map(e => e.output);
        },

        inputsAccepted() {
            // Returns an array of all items that this block will accept as input
            // For this block, we need to consider both the build requirements and the production items
            return [
                ...state.outputItems.map(e => e.name),
                ...state.buildParts.map(e => e.name)
            ];
        },

        // willOutput() is already defined in BlockOutputsItems
        // getItem() is already defined in blockOutputsItems (Yes, we will allow finished items to be output, even while this is being rebuilt).

        willAccept(itemName) {
            // Returns true if this block will accept the item specified right now, or false if not.
            // What this block will accept depends on the block's mode
            switch (state.mode) {
                case "gather":
                    return state.buildParts
                        .filter(e => e.qty > e.have.length)
                        .map(e => e.name)
                        .includes(itemName);
                case "build":
                    return false;
                case "use":
                    return (
                        state.hold.length < 10 &&
                        state.onhand.length < 10 &&
                        state.outputItems.map(e => e.name).includes(itemName)
                    );
                default:
                    return false;
            }
        },

        receiveItem(item) {
            // Allows this block to receive an item handed to it by another block (such as an item hauler)
            // We should be able to accept items to either structure, no matter what mode this block is in
            let buildPart = state.buildParts.find(e => e.name === item.name);
            if (buildPart != null) {
                buildPart.have.push(item);
                return true;
            }
            let outChoice = state.outputItems.find(e => e.name === item.name);
            if (outChoice != null) {
                // Don't forget to add the crafting time to the item!
                item.dryProcess = state.outputItems.find(
                    e => e.name === item.name
                ).craftTime;
                state.hold.push(item);
                return true;
            }
            console.log(
                "Error in include/block_dryer.js->receiveItem(): item type of " +
                    item.name +
                    " had no place to go. This item will be lost"
            );
            return false;
        },

        update() {
            // Like several other blocks, this block will have several modes to it. The first will be to gather equipment to build it
            switch (state.mode) {
                case "gather": // Search for materials to collect
                    // Start by determining if we have all the parts needed
                    if (
                        state.buildParts.every(
                            ele => ele.have.length >= ele.qty
                        )
                    ) {
                        // We are ready to move onto the next mode
                        state.mode = "build";
                        state.counter = 0;
                        // We need to call update again so that we can process this cycle correctly
                        return state.update();
                    }

                    // Now, we can search neighbor blocks for materials. We will need work points
                    // for this
                    if (game.workPoints <= 0) return;

                    game.blockList.neighbors(state.tile).some(neighbor => {
                        let pickup = neighbor.getItem(
                            // Only include parts which we don't have the full quantity of
                            state.buildParts
                                .filter(ele => ele.have.length < ele.qty)
                                .map(ele => ele.name)
                        );
                        if (pickup === null) return false; // No items were found from this neighbor

                        // Use workPoints to collect this item
                        game.workPoints--;

                        // Now store this into the correct location
                        state.buildParts
                            .find(e => e.name === pickup.name)
                            .have.push(pickup);
                    });
                    break;

                case "build":
                    // This is a simple process, but will require workers
                    if (game.workPoints <= 0) return;
                    game.workPoints--;
                    state.counter++;

                    if (state.counter > 120) {
                        state.mode = "use";
                        // At this point, counter elements will be tied to the items being
                        // dried. We can use the counter for this block to count down
                        // the block's lifetime
                        state.counter = 3600;
                        return state.update();
                    }
                    break;

                case "use":
                    // Whether users are around or not, any items stored here will proceed
                    // in their drying process
                    state.counter--;
                    state.hold.forEach(
                        ele =>
                            (ele.dryProcess = Math.max(0, ele.dryProcess - 1))
                    );

                    // Find any items that have been completed, and convert them to the output items
                    state.hold = state.hold.filter(ele => {
                        if (ele.dryProcess > 0) return true;
                        state.onhand.push(
                            item(
                                state.outputItems.find(e => e.name === ele.name)
                                    .output
                            )
                        );
                        return false;
                    });

                    // Next, we can search neighbor blocks for items to collect
                    if (
                        game.workPoints > 0 &&
                        state.hold.length < 10 &&
                        state.onhand.length < 10
                    ) {
                        game.blockList.neighbors(state.tile).some(neighbor => {
                            let pickup = neighbor.getItem(
                                state.outputItems.map(e => e.name)
                            );
                            if (pickup === null) return false;
                            game.workPoints--;
                            // While here, apply the dryProcess value to the item
                            pickup.dryProcess = state.outputItems.find(
                                e => e.name === pickup.name
                            ).craftTime;
                            state.hold.push(pickup);
                        });
                    }

                    if (state.counter <= 0) {
                        // This has worn out and needs replaced.
                        // Before changing the mode back to build, we need to empty the parts we have
                        state.buildParts = state.buildParts.map(e => {
                            return {
                                name: e.name,
                                qty: e.qty,
                                have: []
                            };
                        });
                        state.counter = 0;
                        state.mode = "gather";
                    }
                    break;
                default:
                    console.log(
                        "Error in include/block_dryer.js->update(): Block mode of " +
                            state.mode +
                            " not supported. No action taken"
                    );
            }
        },

        drawPanel() {
            // We want to show users a list of items that are currently drying, along with the time needed for them to complete.
            //let workingList = state.hold.map()

            $("#sidepanel").html(`
                <b>Dryer</b><br />
                <p>
                    A great many things in early tech require drying out, which can sometimes
                    take days. But doing so in the open may lead it to get rained on, ruining
                    any progress in drying. This basic covered structure offers plenty of
                    ventilation, no matter the weather.
                </p>
                <p>
                    Must be built before use. Needs 4 Poles, 8 Long Sticks, 8 Thatch Shingles.
                    Once built, dries out various materials. Clay must be dried before firing
                    or it will crack in the process. Also dries out wood for fires.
                </p>
            `);
            state.showPriority();
            $("#sidepanel").append(`
                <br />
                Finished Items:<span id="sidepanelfinished">${state.onhand.length}</span>
            `);

            // Now, show different content based on what mode this block is in
            switch (state.mode) {
                case "gather":
                    $("#sidepanel").append(`
                        Block State: <span id="sidepanelstate">Gather building materials</span>
                        <div id="sidepanelstatedetail">
                            Building parts pending:<br />
                            ${state.buildParts
                                .filter(e => e.have.length < e.qty)
                                .map(
                                    e => e.name + " x" + (e.qty - e.have.length)
                                )
                                .join("<br />")}
                        </div>
                    `);
                    break;
                case "build":
                    $("#sidepanel").append(`
                        Block State: <span id="sidepanelstate">Construct building</span>
                        <div id="sidepanelstatedetail">
                            Build progress: ${Math.floor(
                                (state.counter / 120) * 100
                            )}%
                        </div>
                    `);
                    break;
                case "use":
                    $("#sidepanel").append(`
                        Block State: <span id="sidepanelstate">Dry items</span>
                        <div id="sidepanelstatedetail">
                            Items drying:<br />
                            ${state.hold
                                .map(ele => ele.name + ": " + ele.dryProcess)
                                .join("<br />")}
                        </div>
                    `);
                    break;
            }
            state.showDeleteLink();
        },

        updatePanel() {
            // Most of this will depend on what mode the block is in
            $("#sidepanelfinished").html(state.onhand.length);
            switch (state.mode) {
                case "gather":
                    $("#sidepanelstate").html("Gather building materials");
                    $("#sidepanelstatedetail").html(`
                        Building parts pending:<br />
                        ${state.buildParts
                            .filter(e => e.have.length < e.qty)
                            .map(e => e.name + " x" + (e.qty - e.have.length))
                            .join("<br />")}
                    `);
                    break;
                case "build":
                    $("#sidepanelstate").html("Construct building");
                    $("#sidepanelstatedetail").html(
                        `Build progress: ${Math.floor(
                            (state.counter / 120) * 100
                        )}%`
                    );
                    break;
                case "use":
                    $("#sidepanelstate").html("Dry items");
                    $("#sidepanelstatedetail").html(`
                        Items drying:<br />
                        ${state.hold
                            .map(ele => ele.name + ": " + ele.dryProcess)
                            .join("<br />")}
                    `);
                    break;
            }
        },

        deleteBlock() {
            state.finishDelete();
        }
    };

    game.blockList.push(state);
    mapSquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/dryer.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockHasWorkerPriority(state),
        blockDeletesClean(state)
    );
};
