// activeblock.js
// Just a place to put all the add-on function groups we have created

import { game } from "./game.js";
import $ from "jquery";

export const blockOutputsItems = state => ({
    // Add-on code block for all blocks that output items

    onhand: [], // Array containing all items produced by this block, which is ready for output

    getItem(findlist, debug = false) {
        // Add-on function for all block types. Returns a target item with a matching name, or null if none was found in this block.
        // Not all blocks will use this specific function; special cases will be managed internal to the blocks (such as those blocks
        // that don't output anything).
        // state - state object of the block we are using.
        //         Must contain an onhand array, containing output items of this block
        //         Must also contain an allowOutput variable; set to true to allow the block to output items
        // findlist - Array of potential items we want to find
        if (state.allowOutput === false) {
            if (debug === true) console.log("This block (" + state.name + ") has outputs disabled");
            return null;
        }
        if (debug === true)
            console.log(
                "Searching for: " + findlist.join(",") + " within " + state.onhand.length + " elements of " + state.name
            );
        for (let i = 0; i < findlist.length; i++) {
            let spot = state.onhand
                .map(function(ele) {
                    return ele.name;
                })
                .indexOf(findlist[i]);
            //console.log("Comparing " + findlist[i] + ", found at " + spot);
            if (spot === -1) {
                if (debug === true) console.log("Did not find " + findlist[i] + " in list");
                continue;
            }
            if (debug === true) console.log("Found " + state.onhand[spot].name + ", sending away");
            return state.onhand.splice(spot, 1)[0];
        }
        return null;
    },

    willOutput(itemname) {
        // Returns true if the specific item will be output, if getItem is called for that specific item
        // Anything in the onhand array can be output here.
        if (state.allowOutput === false) return false;
        return state.onhand.some(ele => ele.name === itemname);
    }
});

export const blockShowsOutputItems = state => ({
    // Add-on unit for blocks that show multiple output items in drawpanel.  Note this only includes one function; two different
    // add-on units use this already

    displayItemsOnHand() {
        // Handles generating the content displayed for the items available on hand

        // Providing a count of the items in the onhand array is harder than simply iterating through all the items.
        // We will create a list of items, coupled with the number of occurrences of that item
        let itemslist = [];
        state.onhand.forEach(ele => {
            const myspot = itemslist.find(inlist => inlist.name === ele.name);
            if (myspot === undefined) {
                // This item is not in the list already. Add it now.
                itemslist.push({ name: ele.name, count: 1 });
            } else {
                // This item is already in the list. Increment that item instead of adding it
                myspot.count++;
            }
        });
        // Note that any items in our outputItems list we don't currently have, they won't be listed here

        if (itemslist.length === 0) {
            // Nothing was in our array. Show something besides blank content
            return '<span style="margin-left:30px">Nothing yet!</span><br />';
        }

        // With our list generated, run through it and output the content we're after
        return itemslist
            .map(ele => `<span style="margin-left:30px">${ele.name}: <b>${ele.count}</b></span><br />`)
            .join("");
    }
});

export const blockHasWorkerPriority = state => ({
    // Add-on unit for any blocks that use workers, and thus have work priority levels. Provides buttons to allow a user to
    // change the block's priority value
    // state - state object of the block we are using
    //      adds a priority value to the state, which can be adjusted

    priority: game.blockList.lastPriority() + 1,

    setPriority(direction) {
        state.priority = Math.max(0, state.priority + direction);
        // Note we cannot have priority values below zero
        // Also note that 'direction' can be any positive or negative value (that will help when jumping by 10 or 100)
        $("#sidepanelpriority").html(state.priority);
        game.blockList.sort(game.blockList.compare); // With the new priority level, sort all the blocks again
    },

    showPriority() {
        // Appends data to the side panel to show a priority value, along with arrow buttons to update its value.
        // Note that the number of arrows shown will change, based on last-used priority

        $("#sidepanel").append("Priority: ");
        const top = game.blockList.lastPriority();
        if (state.priority > 111) {
            $("#sidepanel").append('<img src="img/arrowleft3.png" id="sidepanelprioritydown3" /> ');
            document
                .getElementById("sidepanelprioritydown3")
                .addEventListener("click", () => game.blockSelect.setPriority(-100));
        }
        if (state.priority > 11) {
            $("#sidepanel").append('<img src="img/arrowleft2.png" id="sidepanelprioritydown2" /> ');
            document
                .getElementById("sidepanelprioritydown2")
                .addEventListener("click", () => game.blockSelect.setPriority(-10));
        }
        $("#sidepanel").append(`
            <img src="img/arrowleft.png" id="sidepanelprioritydown1" />
            <span id="sidepanelpriority">${state.priority}</span>
            <img src="img/arrowright.png" id="sidepanelpriorityup1" />
        `);
        document
            .getElementById("sidepanelprioritydown1")
            .addEventListener("click", () => game.blockSelect.setPriority(-1));
        document
            .getElementById("sidepanelpriorityup1")
            .addEventListener("click", () => game.blockSelect.setPriority(1));
        if (top > 11 && state.priority < top - 10) {
            $("#sidepanel").append('<img src="img/arrowright2.png" id="sidepanelpriorityup2" /> ');
            document
                .getElementById("sidepanelpriorityup2")
                .addEventListener("click", () => game.blockSelect.setPriority(10));
        }
        if (top > 111 && state.priority < top - 100) {
            $("#sidepanel").append('<img src="img/arrowright3.png" id="sidepanelpriorityup3" /> ');
            document
                .getElementById("sidepanelpriorityup3")
                .addEventListener("click", () => game.blockSelect.setPriority(100));
        }
        $("#sidepanel").append("<br />");
    }
});

export const blockHandlesFood = state => ({
    // Add-on block for any block that handles food items
    // The block will require an onhand array, which will hold all food items. (This is mostly a work-around until we find a better way
    // to determine where food items could be).

    consumeFood(foodID) {
        let foodspot = state.onhand.findIndex(ele => ele.id === foodID);
        if (foodspot === -1) return false;
        state.onhand.splice(foodspot, 1);
        return true;
    },

    deleteWithFood() {
        // Handles all blocks that may be deleted while it contains food. Call this before actually deleting the block in question

        for (let i = 0; i < state.onhand.length; i++) {
            let pos = game.foodList.findIndex(ele => state.onhand[i].id === ele.id);
            if (pos === -1) {
                console.log(`Failed to find ${state.onhand[i].name} (id=${state.onhand[i].id}) in foodList`);
                continue;
            }
            game.foodList.splice(pos, 1);
        }
        // This doesn't null out anything in the onhand array, but once deleted, this block won't have any back-references
    }
});

export const blockDeletesClean = state => ({
    //Add-on block for any block that can be deleted without any remaining parts left behind

    showDeleteLink() {
        // Adds a string to the sidepanel to allow the user to delete the displayed block
        //return '<a href="#" onclick="blockselect.deleteblock()">Delete Block</a>';
        $("#sidepanel").append('<a href="#" id="sidepaneldelete">Delete Block</a>');
        document.getElementById("sidepaneldelete").addEventListener("click", () => game.blockSelect.deleteblock());
    },

    finishDelete() {
        // Handles removing the block from the game.

        // Rather than have each block call these functions manually, we'll just run them if they can be found here.
        if (state.deleteWithFood !== undefined) state.deleteWithFood();
        if (state.returnTool !== undefined) state.returnTool();

        // While deleting this block, let's make sure we clear out the progress bar as well.
        $("#" + state.tile.id + "progress").css({ width: 0, "background-color": "green" });
        $("#" + state.tile.id + "imageholder").html("");
        state.tile.structure = null;
        $("#sidepanel").html(" ");
        game.blockList.splice(game.blockList.indexOf(this), 1);
        game.blockSelect = null;
    }
});
