const blockHasOutputsPerInput = state => ({
    // Add-on unit to handle blocks that have outputs based on input types
    // state - state block unit that this is to be added to
    //   must contain a itemsConversion array. This will consist of individual objects for each possible input:
    //      name: item name that is allowed as input
    //      craftTime: how long this item will take to produce
    //      output: array of objects for output items
    //          name: name of the item to output
    //          qty: how many of this item to output

    inItems: [],

    possibleoutputs: function() {
        // Returns all possible outputs that this block has
        const red = state.outputitems.map(ele => {
            return ele.output.map(inner => {
                return inner.name;
            });
        });
        // Since red is now a 2D array which may contain duplicates, we need to do some conversion on it before returning.
        return [...new Set([].concat.apply([], red))];
    },

    readyToCraft: function() {
        // Returns true if this block is ready to craft an item (aka there's something on hand to work on), or false if not
        if (state.inItems.length > 0) return true;
        return false;
    },

    searchForItems: function(useWorkPoints) {
        // Searches neighboring blocks for valid input items
        // useWorkPoints - Set to true to consume a work point if an item is found

        const searchList = state.outputItems.map(ele => {
            return ele.name;
        });
        blocklist.neighbors(state.tile).find(neighbor => {
            let pickup = neighbor.getItem(searchList);
            if (pickup === null) return false;
            // Unlike in blockHasSelectableCrafting, we only have one input list to add items to
            state.inItems.push(pickup);
            if (useWorkPoints === true) workpoints--; // Use a work point, if we're supposed to here
            return true;
        });
    },

    processCraft: function(efficiency) {
        // Handles progressing the construction of the item we are working on

        // Start by determining what we are currently crafting
        if (state.inItems.length === 0) return;
        state.counter += efficiency;
        const crafting = state.outputItems.find(ele => {
            return ele.name === state.inItems[0].name;
        });
        if (state.counter >= crafting.craftTime) {
            state.completeProduction();
            // Now, reduce the counter value by the correct amount
            state.counter -= crafting.craftTime;
        }
        // Now, update this block's scroll bar
        $("#" + state.tile.id + "progress").css({ width: (state.counter / crafting.craftTime) * 60 });
    },

    completeProduction: function() {
        // Handles completing the production of the target item. This is placed separately for blocks that don't follow the standard
        // object crafting process.
        // Assumes the first item in the inItems array will need to be produced

        if (state.inItems.length === 0) return;
        state.outputItems
            .find(ele => {
                return ele.name === state.inItems[0].name;
            })
            .output.forEach(ele => {
                for (let i = 0; i < ele.qty; i++) {
                    state.onhand.push(item(ele.name));
                }
            });
        state.inItems.splice(0, 1); // delete the current item here
    }
});
