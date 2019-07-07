// Dryer
// for DanIdle version 4
// provides a place for drying things, that is covered (to protect from rain)

import { game } from "./game.js";
import { blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockDeletesClean } from "./activeblock.js";
import { blockHasOutputsPerInput } from "./blockAddon_HasOutputsPerInput.js";
import { blockRequiresTool } from "./blockAddon_RequiresTool.js";
//import { blockIsStructure } from "./blockAddon_IsStructure.js"; We still cannot use blockIsStructure here, as that would conflict with the
// declared functions that blockHasOutputsPerInput has

export const dryer = mapsquare => {
    let state = {
        name: "dryer",
        tile: mapsquare,
        id: game.getNextBlockId(),
        counter: 0,
        allowOutput: true,

        // Since this block requires parts to be provided before it can be built, we can't simply disable inputs through blockHasOutputsPerInput.
        // Instead, we should use two different functions to define structure-type input verses production-type input. We will use these functions
        // to swap out what input values this function expects.

        // getItem() is already defined in blockOutputsItems
        // possibleOutputs() is already defined in blockHasOutputsPerInput
        // inputsAccepted() is already defined in blockHasOutputsPerInput
        // willOutput() is already defined in blockOutputsItems
        // willAccept() is already defined in blockHasOutputsPerInput
        // receiveItem() is already defined in blockHasOutputsPerInput

        setupBuilding() {
            // Handles setting the input parameters to accept structure based items, for when the building is being built (or replaced)
        },

        setupProduction() {
            // Handles setting the input parameters to accept productino based items, for when the building can be used
        },

        update() {
            state.handleUpdate();
            if (state.mode === "use") {
            }
        }
    };
};
