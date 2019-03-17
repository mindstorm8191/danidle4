// blockHasRandomizedOutput
// for DanIdle version 4
// Provides extra functionality for any blocks where their output is picked at random from a fixed list

export const blockHasRandomizedOutput = state => ({
    // Add-on unit to handle blocks that produce randomized output. This will assume each output has random chance of success
    // state - state object of the block we are using
    //      Must contain an array outputItems. This will contain objects for each possible output
    //          name: name of the item to output,
    //          isFood: set to true if this is a food item
    //          shelfLife: how long (in ticks) this item will last before it will be destroyed automatically. This is only needed if
    //              isFood is set to true
    //      Must also contain a craftTime int, which is the number of ticks before an item is generated

    possibleoutputs() {
        // Returns any potential items that this block can output.
        if (state.allowOutput === false) return []; // Output items aren't allowed here anyway

        return state.outputItems.map(ele => {
            return ele.name;
        });
    },

    // We cannot place an acceptsinput function here, as other block types may choose to accept items yet still have randomized output.

    processCraft(efficiency) {
        // Handles advancing the crafting process. Use this in update().
        // efficiency - How much progress to make with this item. Added so that tools could impact production. If not using tools, pass 0.

        if (state.outputItems[0].name === undefined) {
            console.log(
                "Error: block type of " +
                    state.name +
                    " has not updated to most recent version of blockHasRandomizedOutput (the outputItems structure needs additional content"
            );
        }
        // Start by making sure we have a free worker
        if (workpoints <= 0) return;
        workpoints--;

        state.counter += efficiency;
        if (state.counter >= state.craftTime) {
            state.counter -= state.craftTime;
            const selected = getRandomFrom(state.outputItems);
            if (selected.isFood === true) {
                state.onhand.push(food(selected.name, selected.shelfLife, state));
            } else {
                state.onhand.push(item(selected.name));
            }
        }
        // Let's also update the displayed progress bar for this block
        $("#" + state.tile.id + "progress").css({ width: (state.counter / state.craftTime) * 60 });
    },

    showOutput() {
        // Handles showing all existing items that have been generated by this block.  This is to be used in the drawpanel function

        $("#sidepanel").append(
            'Items on hand:<br /><div id="sidepanelonhand">' + state.displayItemsOnHand() + "</div>"
        );
    },

    updateOutput() {
        // Handles updating the
        $("#sidepanelonhand").html(state.displayItemsOnHand());
    }
});
