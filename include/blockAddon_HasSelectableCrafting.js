const blockHasSelectableCrafting = state => ({
    // Add-on unit to handle blocks that have multiple output items.
    // state - state object of the block we are using.
    //         Must contain an outputItems array. This should be in the following structure:
    //            name - exact name of the item to output. Case-sensitive
    //            prereq - Array containing names of any item that must have been reached by the player before this item can be crafted.
    //                  If none, provide an empty array (aka []). Items which have not met their prerequisites will not be visible
    //                  to the user until such as been met
    //            parts - Array of object pairings to determine what items are needed before item crafting can be started. Inner objects
    //                    consist of:
    //                name - Item name needed to produce this item
    //                qty - How many of that item is needed before it can be crafted
    //            isTool - Set to true if this output item is a tool. If not, the enduance and efficiency variables below need not exist
    //            craftTime - how many ticks this item will take to complete
    //            endurance - Endurance value to provide to this item, once complete
    //            enduranceGain - How much endurance is gained on each completed crafting
    //            enduranceTaper - Reduces the amount of gain on endurance, per each completed crafting, causing gains to eventually
    //                             level off
    //            efficiency - Efficiency value to provide to this item, once complete
    //            efficiencyGain - How much efficiency is gained on each completed crafting.  This will change the value of efficiency.
    //            efficiencyTaper - Reduces the amount of gain on efficiency, per each completed crafting, causing gains to eventually
    //                              level off
    //         Must also contain an onhand array. This will store items completed by this block and is ready for output.

    currentCraft: "None",
    targetCraft: "None",
    stockList: [],
    // Stores all the items that are stored in this block. This list will (well, should) be filled out as items are collected by the block.
    // This will contain objects with name and qty values. When the item is crafted, these items will be removed as needed

    possibleoutputs: function() {
        // Rather than returning a fixed array, let's feed data from our tables. If those tables change, we won't
        // have to modify this to update its output
        return state.outputItems
            .filter(function(inner) {
                if (inner.name === "None") return false; // we don't need to show this item to other blocks
                // Determine if the prerequisite items has been reached for this possible output
                if (inner.prereq.length == 0) return true; // This block has no prerequisites anyway
                return inner.prereq.every(function(needed) {
                    // ensure that every item in this prereqs list has been unlocked
                    return unlockeditems.includes(needed);
                });
            })
            .map(function(inner) {
                // Output the only name
                return inner.name;
            });
    },

    readyToCraft: function() {
        // Determines if this block is ready to start crafting an item.  This mainly checks that an item has been selected.
        // Use this in the update() function. Returns true if this block can proceed with crafting, or false if not.

        if (state.currentCraft === "None") {
            if (state.targetCraft === "None") return false;
            state.currentCraft = state.targetCraft;
        }

        // Also report if we have work points available
        if (workpoints <= 0) return false;

        // Now, we need to determine if we have all the parts needed. Doing so can be difficult, but we have a function that
        // returns an array of each item we need. We can simply re-purpose that
        return state.partsPending().length === 0;
    },

    partsPending: function() {
        // Returns an array containing the names of all items we still need before crafting the current part

        if (state.currentCraft === "None") return [];

        return state.outputItems
            .find(function(ele) {
                return ele.name === state.currentCraft;
            })
            .parts.filter(function(listing) {
                // Here, we should return true whenever there isn't enough of that element on-hand to produce the target item
                const inStock = state.stockList.find(function(ele) {
                    return listing.name === ele.name;
                });
                // Since stockList is built on an as-needed basis, we might not have results from this
                if (!inStock) return true;
                return inStock.hold.length < listing.qty;
            })
            .map(function(ele) {
                // With our array of part objects, we need to convert this into single item names
                return ele.name;
            });
    },

    processCraft: function(efficiency) {
        // Handles advancing the crafting process. Use this in update().
        //      efficiency - how much progress to apply to the production of the current item. Use one for most processes. If a tool
        //                   is being used, you will provide that tool's efficiency value

        // Before starting, determine if this block is currently crafting anything
        if (state.currentCraft === "None") return;

        // Next, we should get access to the object we are crafting, since we'll be reaching for this information frequently
        const crafting = state.outputItems.find(function(ele) {
            return ele.name === state.currentCraft;
        });

        workpoints--;
        state.counter += efficiency;
        if (state.counter >= crafting.craftTime) {
            state.counter -= crafting.craftTime;
            if (crafting.isTool === false) {
                state.onhand.push(item(crafting.name));
            } else {
                state.onhand.push(tool(crafting.name, crafting.efficiency, crafting.endurance));
                // Adjust the endurance (and gains) amounts
                crafting.endurance += crafting.enduranceGain;
                crafting.efficiency += crafting.efficiencyGain;
                crafting.enduranceGain = Math.max(0, crafting.enduranceGain - crafting.enduranceTaper);
                crafting.efficiencyGain = Math.max(0, crafting.efficiencyGain - crafting.efficiencyTaper);
                // Now, switch to the next item the user wants us to craft
            }
            state.currentCraft = state.targetCraft;

            // Run through all parts this item needs, and remove those items from the stockList
            crafting.parts.forEach(function(ele) {
                state.stockList
                    .find(function(inner) {
                        return inner.name === ele.name;
                    })
                    .hold.splice(0, ele.qty);
            });
        }
        // Now update the displayed progress bar for this block. This will be highly dependent on what is being crafted here
        $("#" + state.tile.id + "progress").css({ width: (state.counter / crafting.craftTime) * 60 });
    },

    searchForItems: function() {
        // Searches neighbor blocks for items that this block needs before it can craft its target item

        const needed = state.partsPending();
        if (needed.length === 0) return; // We already have everything we need here
        blocklist.neighbors(state.tile).find(function(neighbor) {
            // Here, we want to return on the first instance where we find a matching item
            let pickup = neighbor.getItem(needed);
            if (pickup === null) return false; // we found no items from this block
            // Since we don't have a standard input array here, we need to do a bit more work to determine where this item gets
            // stored.
            let mybox = state.stockList.find(function(ele) {
                return ele.name === pickup.name;
            });
            //console.log(mybox);
            if (mybox === undefined) {
                state.stockList.push({ name: pickup.name, hold: [pickup] }); // the picked up item will be the first item in the array
            } else {
                mybox.hold.push(pickup);
            }
            return true;
        });
    },

    drawStocks: function() {
        // Returns a string for the drawPanel to show the items remaining that this block needs, before it can craft the target item
        // Note that this does not provide the 'header' of the section, or the div block. You will have to provide that yourself
        // However, with this format, it can be used within updatepanel too - simply feed its result to the correct div.

        // Start by checking if we have selected anything to craft
        if (state.targetCraft === "None") {
            return "First, pick a tool to craft!";
        }
        console.log(state.targetCraft);
        return state.outputItems
            .find(function(ele) {
                // start by finding the matching output item we are trying to craft
                return ele.name === state.targetCraft;
            })
            .parts.map(function(ele) {
                // Unlike before, we need to check that our target item has a space in stockList. If not, simply give it zero
                let onhand = 0;
                const slot = state.stockList.find(function(get) {
                    return get.name === ele.name;
                });
                if (slot !== undefined) onhand = slot.hold.length;

                return ele.name + ": " + onhand + " of " + ele.qty + "<br />";
            })
            .join("");
    },

    drawOutputChoices: function() {
        // Appends content to the side panel. Use this in drawpanel(); assumes any other content has been generated
        return (
            "<b>Select an output:</b><br />" +
            state.outputItems
                .filter(function(ele) {
                    // start by filtering out the blocks we cannot craft
                    //console.log(ele);
                    if (ele.name === "None") return true; // This one gets a free pass...
                    if (ele.prereq.length === 0) return true; // This one has no prerequisites anyway
                    return ele.prereq.every(function(needed) {
                        // ensure that every item in this prereqs list has been unlocked
                        return unlockeditems.includes(needed);
                    });
                })
                .map(function(ele) {
                    // For each one, generate a string to return, containing our target output, specific to this item
                    let color = state.targetCraft === ele.name ? "green" : "grey";
                    return (
                        '<span class="sidepanelbutton" ' +
                        'id="sidepanelchoice' +
                        multireplace(ele.name, " ", "") +
                        '" ' +
                        'style="background-color:' +
                        color +
                        ';" ' +
                        'onclick="blocklist.getById(' +
                        state.id +
                        ").pickcraft('" +
                        ele.name +
                        "')\">" +
                        ele.name +
                        "</span>"
                    );
                })
                .join("") // combine all the elements into a single string to pass to .append()
            // array.join()'s default sparator is ',', so give it a null string for a separator here
        );
    },

    pickcraft: function(newcraft) {
        // Handles changing state.targetcraft, which decides what is crafted next
        $("#sidepanelchoice" + multireplace(state.targetCraft, " ", "")).css({
            "background-color": "grey"
        });
        state.targetCraft = newcraft;
        $("#sidepanelchoice" + multireplace(state.targetCraft, " ", "")).css({
            "background-color": "green"
        });
    }
});
