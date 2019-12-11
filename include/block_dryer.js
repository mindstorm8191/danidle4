// Dryer
// for DanIdle version 4
// provides a place for drying things, that is covered (to protect from rain)

import { game } from "./game.js";
import {
    blockOutputsItems,
    blockShowsOutputItems,
    blockHasWorkerPriority,
    blockDeletesClean
} from "./activeBlock.js";
import { blockHasOutputsPerInput } from "./blockAddon_HasOutputsPerInput.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
//import { blockIsStructure } from "./blockAddon_IsStructure.js"; We still cannot use blockIsStructure here, as that would conflict with the
// declared functions that blockHasOutputsPerInput has

export const dryer = mapSquare => {
    let state = {
        name: "dryer",
        tile: mapSquare,
        id: game.getNextBlockId(),
        counter: 0,
        allowOutput: true,

        // Using blockHasOutputsPerInput with this block will just not work. This block will need the common functions to behave based on if
        // the block is completed or not.
        // So instead of trying to use blockHasOutputsPerInput, we will setup another block add-on type to handle this. Our next block
        // (the Bloomery) will require a very similar setup to this one.

        outputItems: [
            {
                name: "Wet Bloomery Block",
                craftTime: 300,
                output: "Bloomery Block"
            },
            {
                name: "Firewood Log Wet",
                craftTime: 400,
                output: "Firewood Log"
            }
        ],

        buildParts: [
            { name: "Pole", qty: 4 },
            { name: "Long Stick", qty: 8 },
            { name: "Wood Shingle", qty: 64 }
        ],
        // Hmm. It seems that, before we can really build this block, we'll need some straw, so we can make a thatch roof with it. So we have to
        // create a farming industry

        // getItem() is already defined in blockOutputsItems (Yes, we will allow finished items to be output, even while this is being rebuilt).
        possibleOutputs() {
            // Returns an array of all possible output items this block will have
            return state.outputItems.map(ele => {
                return ele.output;
            });
        },

        inputsAccepted() {
            // Returns an array of all items that this block will accept as input
            // For this block, we need to consider both the build requirements and the production items
        },
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasOutputsPerInput
        // receiveItem() is already defined in blockHasOutputsPerInput

        update() {}

        // A great many things in early tech require drying out, which can sometimes take days. But
    };
};
