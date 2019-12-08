// blockHasSelectableCrafting
// for DanIdle version 4
// Provides functionality for any block that has multiple possible outputs, which are selected by the user

import { game } from "./game.js";
import { danCommon } from "./dancommon.js";
import { item, tool } from "../index.js";
import $ from "jquery";

export const blockHasSelectableCrafting = state => ({
    // Add-on unit to handle blocks that have multiple output items.
    // state - state object of the block we are using.
    //         Must contain an outputItems array. This should be in the following structure:
    //            name - exact name of the item to output. Case-sensitive
    //            info - short text to show in the tooltip. When shown, this
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
    //            craftQty - Optional field. How many of this item is to be generated upon completion of crafting. Defaults to 1.
    //            byProducts - Optional field. Array of object pairings to determine what is also produced when this item is finished.
    //                         These are (currently) not able to be tools. Object pairings are:
    //                name - Item name produced by this crafting
    //                qty - How many of this item is produced by this crafting
    //         Must also contain an onhand array. This will store items completed by this block and is ready for output. This is usually
    //            provided by thte blockOutputsItems add-on unit.
    //         Must also contain a maxOutput integer, which defines the maximum number of output items this block can have, before
    //            it stops producing more products

    currentCraft: "None",
    targetCraft: "None",
    stockList: [],
    // Stores all the items that are stored in this block. This list will (well, should) be filled out as items are collected by the block.
    // This will contain objects with name and qty values. When the item is crafted, these items will be removed as needed

    possibleoutputs() {
        // Rather than returning a fixed array, let's feed data from our tables. If those tables change, we won't
        // have to modify this to update its output

        // This gets more complicated when we add byproducts to our possible outputs. Filtering task is still the same, but we may have multiple
        // outputs from .map(). Therefore we should have .map() output arrays for all elements, then flatten it. Considering that byproduct outputs
        // may be in multiple craft options, we should remove duplicates before returning the array.
        return danCommon.removeDuplicates(
            danCommon.flatten(
                state.outputItems
                    .filter(inner => {
                        if (inner.name === "None") return false; // we don't need to show this item to other blocks
                        // Determine if the prerequisite items has been reached for this possible output
                        if (inner.prereq.length == 0) return true; // This block has no prerequisites anyway
                        // ensure that every item in this prereqs list has been unlocked
                        return inner.prereq.every(needed => game.unlockedItems.includes(needed));
                    })
                    .map(inner => {
                        if (inner.byProducts === undefined) return [inner.name];
                        return [inner.name, ...inner.byProducts.map(byp => byp.name)];
                    })
            )
        );
    },

    inputsAccepted() {
        // Returns an array containing any items that can be accepted here.
        // We have decided to return all possible items, instead of only the ones related to the current block
        return danCommon
            .removeDuplicates(
                danCommon.flatten(
                    state.outputItems.map(outitem => {
                        // Some elements (such as None) have no parts array. Check that one exists first
                        if (outitem.parts === undefined) return []; // not to worry, this will factor out through flatten
                        return outitem.parts.map(ele => ele.name);
                    })
                )
            )
            .filter(item => game.unlockedItems.includes(item));
        // We need to exclude any items that has not been unlocked yet.
    },

    willAccept(itemname) {
        // Returns true if this block will accept the specified item right now.

        return state.partsPending().includes(itemname);
        //... well THAT turned out to be easier than expected. The partsPending returns a list of everything we are currently waiting,
        // before we can craft the target item
    },

    receiveItem(item) {
        // Accepts an item as input. Returns true when successful, or false if not.
        //state.stockList.push(item);
        const slot = state.stockList.find(ele => ele.name == item.name);
        if (slot === undefined) {
            state.stockList.push({ name: item.name, hold: [item] });
            return true;
        }
        slot.hold.push(item);
        return true;
        // This works for now, but I worry that it may allow resources on-hand to grow to crazy amounts. Yet I'm not sure how to
        // prevent that. Setting a fixed limit on input resources may lead to some items being uncraftable (you could get 100 of
        // part A and be unable to receive part B).  However, the chances of this item getting over-filled (as of right now)
        // are kinda slim.
    },

    readyToCraft() {
        // Determines if this block is ready to start crafting an item.  This mainly checks that an item has been selected.
        // Use this in the update() function. Returns true if this block can proceed with crafting, or false if not.

        // Start by checking if there is enough room to hold more items
        if (state.maxOutput !== undefined) {
            if (state.onhand.length >= state.maxOutput) return false;
        }

        if (state.currentCraft === "None") {
            if (state.targetCraft === "None") return false;
            state.currentCraft = state.targetCraft;
        }

        // Also report if we have work points available
        if (game.workPoints <= 0) return false;

        // Now, we need to determine if we have all the parts needed. Doing so can be difficult, but we have a function that
        // returns an array of each item we need. We can simply re-purpose that
        return state.partsPending().length === 0;
    },

    partsPending() {
        // Returns an array containing the names of all items we still need before crafting the current part

        if (state.currentCraft === "None") return [];

        return state.outputItems
            .find(ele => ele.name === state.currentCraft)
            .parts.filter(listing => {
                // Here, we should return true whenever there isn't enough of that element on-hand to produce the target item
                const inStock = state.stockList.find(ele => listing.name === ele.name);
                // Since stockList is built on an as-needed basis, we might not have results from this
                if (!inStock) return true;
                return inStock.hold.length < listing.qty;
            })
            .map(ele => ele.name);
        // With our array of part objects, we need to convert this into only item names
    },

    processCraft(efficiency) {
        // Handles advancing the crafting process. Use this in update().
        //      efficiency - how much progress to apply to the production of the current item. Use one for most processes. If a tool
        //                   is being used, you will provide that tool's efficiency value

        // Before starting, determine if this block is currently crafting anything
        if (state.currentCraft === "None") return;

        // Next, we should get access to the object we are crafting, since we'll be reaching for this information frequently
        const crafting = state.outputItems.find(ele => ele.name === state.currentCraft);

        game.workPoints--;
        state.counter += efficiency;
        //console.log("Block " + state.name + " using " + efficiency + " efficiency");
        if (state.counter >= crafting.craftTime) {
            state.counter -= crafting.craftTime;
            // We need to account for the quantity of output items here. Not all items have a specified output quantity, so we
            // we need to check for a value first.
            let craftQty = 1;
            if (!(crafting.craftQty === undefined)) craftQty = crafting.craftQty;
            if (crafting.isTool === false) {
                for (let i = 0; i < craftQty; i++) {
                    state.onhand.push(item(crafting.name));
                }
            } else {
                for (let i = 0; i < craftQty; i++) {
                    state.onhand.push(tool(crafting.name, crafting.efficiency, crafting.endurance));
                    // Adjust the endurance (and gains) amounts
                    crafting.endurance += crafting.enduranceGain;
                    crafting.efficiency += crafting.efficiencyGain;
                    crafting.enduranceGain = Math.max(0, crafting.enduranceGain - crafting.enduranceTaper);
                    crafting.efficiencyGain = Math.max(0, crafting.efficiencyGain - crafting.efficiencyTaper);
                }
            }

            // Don't forget to run this through the unlock code as well.
            // - but wait - item and tool (even food) unlocking is handled at item generation
            // If there are issues with items not being available when needed, first determine if the names match (exactly, it's case sensitive)

            // Next, we need to handle adding byproduct items to the onhand array.  Not every block in our world has a byProducts array, though
            //console.log(crafting.byProducts);
            if (crafting.byProducts != undefined) {
                console.log("We have byproducts to produce");
                crafting.byProducts.forEach(ele => {
                    console.log("First byproduct: " + ele.name + " x" + ele.qty);
                    for (let i = 0; i < ele.qty; i++) {
                        state.onhand.push(item(ele.name));
                    }
                });
            }

            // Now, switch to the next item the user wants us to craft
            state.currentCraft = state.targetCraft;
            // Ensure we can start this.  If not, we should set the progress counter to zero. This will allow us to change crafting targets
            // if the current one cannot be done.
            if (!state.readyToCraft()) {
                state.counter = 0;
            }

            // Run through all parts this item needs, and remove those items from the stockList
            crafting.parts.forEach(ele => {
                state.stockList.find(inner => inner.name === ele.name).hold.splice(0, ele.qty);
            });
        }
        // Now update the displayed progress bar for this block. This will be highly dependent on what is being crafted here
        $("#" + state.tile.id + "progress").css({ width: (state.counter / crafting.craftTime) * 60 });
    },

    searchForItems(needsWorkPoint) {
        // Searches neighbor blocks for items that this block needs before it can craft its target item
        // needsWorkPoint - Set to true if this block must use a work point to receive an item

        if (needsWorkPoint && game.workPoints < 1) return;

        const needed = state.partsPending();
        let cyclecount = 0;
        if (needed.length === 0) return; // We already have everything we need here
        game.blockList.neighbors(state.tile).some(neighbor => {
            // Here, we want to return on the first instance where we find a matching item
            cyclecount++;
            if (neighbor === undefined) {
                console.log(`Error - neighbor not defined (working block ${state.name}, neighbor pass=${cyclecount})`);
            }
            let pickup = neighbor.getItem(needed);
            if (pickup === null) return false; // we found no items from this block

            // Item was accepted. Go ahead and use a workpoint, if necessary
            if (needsWorkPoint) game.workPoints--;

            // Since we don't have a standard input array here, we need to do a bit more work to determine where this item gets
            // stored.
            let mybox = state.stockList.find(ele => ele.name === pickup.name);
            //console.log(mybox);
            if (mybox === undefined) {
                state.stockList.push({ name: pickup.name, hold: [pickup] }); // the picked up item will be the first item in the array
            } else {
                mybox.hold.push(pickup);
            }
            return true;
        });
    },

    drawStocks() {
        // Returns a string for the drawPanel to show the items remaining that this block needs, before it can craft the target item
        // Note that this does not provide the 'header' of the section, or the div block. You will have to provide that yourself
        // However, with this format, it can be used within updatepanel too - simply feed its result to the correct div.

        // Start by checking if we have selected anything to craft
        if (state.targetCraft === "None") {
            return "First, pick something to craft!";
        }
        //console.log(state.targetCraft);
        // start by finding the matching output item we are trying to craft
        return state.outputItems
            .find(ele => ele.name === state.targetCraft)
            .parts.map(ele => {
                // Unlike before, we need to check that our target item has a space in stockList. If not, simply give it zero
                let onhand = 0;
                const slot = state.stockList.find(get => get.name === ele.name);
                if (slot !== undefined) onhand = slot.hold.length;

                return ele.name + ": " + onhand + " of " + ele.qty + "<br />";
            })
            .join("");
    },

    drawProgressPercent() {
        // Returns a value between 0 and 100, of the percentage of progress in completing the current crafting task.
        // Note that it'll be up to the block to display the percentage after the value

        if (state.targetCraft === "None") {
            return "---";
        }
        return Math.floor(
            (state.counter / state.outputItems.find(ele => ele.name === state.targetCraft).craftTime) * 100
        );
    },

    drawOutputChoices() {
        // Appends content to the side panel, showing all available output options this block has. Use this in drawpanel(); assumes any
        // other content has been generated

        // Before, we were returning a string that could be shown in drawPanel. However, since we must use addEventListener manually, we cannot
        // do that here. jQuery will ensure that the DOM element is generated correctly before trying to use addEventListener.
        $("#sidepanel").append("<b>Select an output:</b><br />");
        state.outputItems
            .filter(ele => {
                // start by filtering out the blocks we cannot craft
                //console.log(ele);
                if (ele.name === "None") return true; // This one gets a free pass...
                if (ele.prereq.length === 0) return true; // This one has no prerequisites anyway
                // ensure that every item in this prereqs list has been unlocked
                return ele.prereq.every(needed => game.unlockedItems.includes(needed));
            })
            .forEach(ele => {
                // For each one, generate a string to return, containing our target output, specific to this item
                //let color = state.targetCraft === ele.name ? "green" : "grey";
                let tooltip = "";
                if (ele.info != undefined) {
                    tooltip = ele.info;
                    if (ele.parts.length > 0) {
                        tooltip += " Needs " + ele.parts.map(ele => ele.qty + " " + ele.name).join(", ");
                    }
                }
                $("#sidepanel").append(`
                    <span class="sidepanelbutton"
                          id="sidepanelchoice${danCommon.multiReplace(ele.name, " ", "")}"
                          title="${tooltip}"
                          style="background-color: ${state.chooseCraftColor(ele.name)};" >${ele.name}</span>
                `);
                document
                    .getElementById("sidepanelchoice" + danCommon.multiReplace(ele.name, " ", ""))
                    .addEventListener("click", () => game.blockList.getById(state.id).pickcraft(ele.name));
            });
    },

    updateOutputChoices() {
        // Handles updating the displayed output choices shown on the side panel
        state.outputItems
            .filter(ele => {
                if (ele.name === "None") return true;
                if (ele.prereq.length === 0) return true;
                return ele.prereq.every(needed => {
                    return game.unlockedItems.includes(needed);
                });
            })
            .forEach(ele => {
                $("#sidepanelchoice" + danCommon.multiReplace(ele.name, " ", "")).css({
                    "background-color": state.chooseCraftColor(ele.name)
                });
            });
    },

    chooseCraftColor(craftname) {
        // Determines what color to render the given tool under (as the background to the span block).

        // The big deciding factor is whether or not the given tool can craft the selected item. However, not all blocks will list tools
        // needed to craft a given item.  Check for that first.
        const craftInfo = state.outputItems.find(ele => ele.name === craftname);
        if (craftInfo === undefined)
            console.log(
                `Error in blockHasSelectableCrafting->chooseCraftColor: failed to find item in state.outputItems (target=${craftname})`
            );
        if (!(craftInfo.toolsUsable === undefined)) {
            // At this point, we can assume that targetTool exists
            if (!craftInfo.toolsUsable.includes(state.targetTool)) return "white";
        }
        // With the case of tools out of the way, we can move onto standard procedures

        if (state.targetCraft === craftname) return "green";
        return "grey";
    },

    pickcraft(newcraft) {
        // Handles changing state.targetcraft, which decides what is crafted next
        const previousCraft = state.targetCraft;
        state.targetCraft = newcraft;
        $("#sidepanelchoice" + danCommon.multiReplace(previousCraft, " ", "")).css({
            "background-color": state.chooseCraftColor(previousCraft)
        });
        $("#sidepanelchoice" + danCommon.multiReplace(state.targetCraft, " ", "")).css({
            "background-color": state.chooseCraftColor(state.targetCraft)
        });
        // Now, determine if we can go ahead and change the current craft item to this.  This will only apply if the progress counter is zero
        if (state.counter === 0) {
            state.currentCraft = state.targetCraft;
        }
    }
});
