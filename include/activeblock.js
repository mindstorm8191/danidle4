// activeblock.js
// Just a place to put all the add-on function groups we have created

const blockOutputsItems = state => ({
    // Add-on code block for all blocks that output items

    onhand: [], // Array containing all items produced by this block, which is ready for output

    getItem: function(findlist, debug = false) {
        // Add-on function for all block types. Returns a target item with a matching name, or null if none was found in this block.
        // Not all blocks will use this specific function; special cases will be managed internal to the blocks (such as those blocks
        // that don't output anything).
        // state - state object of the block we are using.
        //         Must contain an onhand array, containing output items of this block
        //         Must also contain an allowOutput variable; set to true to allow the block to output items
        // findlist - Array of potential items we want to find
        if (state.allowOutput === false) {
            console.log("This block (" + state.name + ") has outputs disabled");
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
                //if (debug === true) console.log("Did not find " + findlist[i] + " in list");
                continue;
            }
            return state.onhand.splice(spot, 1)[0];
        }
        return null;
    }
});

const blockShowsOutputItems = state => ({
    // Add-on unit for blocks that show multiple output items in drawpanel.  Note this only includes one function; two different
    // add-on units use this already

    displayItemsOnHand: function() {
        // Handles generating the content displayed for the items available on hand

        // Providing a count of the items in the onhand array is harder than simply iterating through all the items.
        // We will create a list of items, coupled with the number of occurrences of that item
        let itemslist = [];
        state.onhand.forEach(function(ele) {
            const myspot = itemslist.find(function(inlist) {
                return inlist.name === ele.name;
            });
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
            .map(function(ele) {
                return '<span style="margin-left:30px">' + ele.name + ": <b>" + ele.count + "</b></span><br />";
            })
            .join("");
    }
});

const blockHasWorkerPriority = state => ({
    // Add-on unit for any blocks that use workers, and thus have work priority levels. Provides buttons to allow a user to
    // change the block's priority value
    // state - state object of the block we are using
    //      adds a priority value to the state, which can be adjusted

    priority: blocklist.lastpriority() + 1,

    setPriority: function(direction) {
        state.priority = Math.max(0, state.priority + direction);
        // Note we cannot have priority values below zero
        // Also note that 'direction' can be any positive or negative value (that will help when jumping by 10 or 100)
        $("#sidepanelpriority").html(state.priority);
        blocklist.sort(blocklist.compare); // With the new priority level, sort all the blocks again
    },

    showPriority: function() {
        // Returns a string that can be shown in drawpanel. Note that the number of arrows shown will change, based on last-used priority
        let output = "Priority: ";
        const top = blocklist.lastpriority();
        if (state.priority > 111) output += '<img src="img/arrowleft3.png" onclick="blockselect.setPriority(-100)"> ';
        if (state.priority > 11) output += '<img src="img/arrowleft2.png" onclick="blockselect.setPriority(-10)"> ';
        output +=
            '<img src="img/arrowleft.png" onclick="blockselect.setPriority(-1)"> ' +
            '<span id="sidepanelpriority">' +
            state.priority +
            "</span> " +
            '<img src="img/arrowright.png" onclick="blockselect.setPriority(1)">';
        if ((top > 11) & (state.priority < top - 10))
            output += '<img src="img/arrowright2.png" onclick="blockselect.setPriority(10)"> ';
        if ((top > 111) & (state.priority < top - 100))
            output += '<img src="img/arrowright3.png" onclick="blockselect.setPriority(100)"> ';
        return output + "<br />";
    }
});

// We will also need a block where tools are optional - call it blockVoluntaryTool
const blockRequiresTool = state => ({
    // Add-on unit for blocks that require one (and only one) tool before it can complete any tasks. Allows the user to select
    // which tool to use in this block. New tools are grabbed automatically when one breaks.
    // state - state object of the block we are using
    //      Must contain a toolChoices array, containing the name (only) of all possible tools that can be used by this block.
    //          Any tools that have not been unlocked will not be displayed for selection.  This array must contain a 'None'
    //          option (capitalized), which is what users will start with, and allow them to disable picking up tools

    currentTool: null, // Loaded tool that is being used
    targetTool: "None", // Which tool the user wants to use when the current tool breaks

    checkTool: function() {
        // Used in the block's update() function. Returns the efficiency value for this tool, or null if no tool is available.
        // If a tool can be used, its endurance counter is deducted from. Once a tool's endurance reaches zero, it will be destroyed;
        // another tool can then be loaded automatically at that point (if one is selected)

        if (state.currentTool === null) {
            if (state.targetTool === "None") return null; // We are currently not after any tools
            state.currentTool = blocklist.getInStorage(state.targetTool);
            if (state.currentTool === null) return null; // No matching tool was found anywhere
        }
        // Now, use the tool
        state.currentTool.endurance--;
        if (state.currentTool.endurance <= 0) {
            let eff = state.currentTool.efficiency;
            state.currentTool = null;
            return eff;
            // Note that, even after the tool is deleted, the block can still progress. We will load a new tool at the next cycle
        }

        return state.currentTool.efficiency;
    },

    showTools: function() {
        // Provides a list of tools for the user to select

        $("#sidepanel").append("<br />" + "<b>Tools:</b><br />");
        $("#sidepanel").append(
            state.toolChoices
                .filter(function(tool) {
                    if (tool === "None") return true; // This one gets a free pass
                    if (unlockeditems.includes(tool)) return true;
                    return false;
                })
                .map(function(ele) {
                    let color = ele === state.targetTool ? "green" : "red";
                    return (
                        '<span class="sidepanelbutton" ' +
                        'id="sidepaneltool' +
                        multireplace(ele, " ", "") +
                        '" ' +
                        'style="background-color:' +
                        color +
                        ';" ' +
                        'onclick="blocklist.getById(' +
                        state.id +
                        ").picktool('" +
                        ele +
                        "')\">" +
                        ele +
                        "</span>"
                    );
                })
                .join("")
        );
    },

    // Note, we don't have a function to be used in updatepanel(); we have nothing to update in there that is specific to tools

    picktool: function(newtool) {
        // Handles updating which tool the user wants to make use of. This is called through the DOM; the block doesn't
        // need to access it directly

        $("#sidepaneltool" + multireplace(state.targetTool, " ", "")).css({ "background-color": "red" });
        state.targetTool = newtool;
        $("#sidepaneltool" + multireplace(state.targetTool, " ", "")).css({ "background-color": "green" });
    }
});

const blockHandlesFood = state => ({
    // Add-on block for any block that handles food items
    // The block will require an onhand array, which will hold all food items. (This is mostly a work-around until we find a better way
    // to determine where food items could be).

    consumeFood: function(foodID) {
        let foodspot = state.onhand.findIndex(ele => {
            return ele.id === foodID;
        });
        if (foodspot === -1) return false;
        state.onhand.splice(foodspot, 1);
        return true;
    }
});
