// blockRequiresTool
// for DanIdle version 4
// Provides functionality for any block that requires a tool to function

import { game } from "./game.js";
import { danCommon } from "./dancommon.js";
import $ from "jquery";

// We will also need a block where tools are optional - call it blockVoluntaryTool
export const blockRequiresTool = state => ({
    // Add-on unit for blocks that require one (and only one) tool before it can complete any tasks. Allows the user to select
    // which tool to use in this block. New tools are grabbed automatically when one breaks.
    // state - state object of the block we are using
    //      Must contain a toolChoices array, containing objects, one for each tool slot:
    //          slotName: name of the slot, as shown to the user
    //          isRequired: set to true if this tool is required before this block can begin working, or false if not.
    //          choices: the name (only) of all possible tools that can be used by this block. Any tools that have not been unlocked will
    //              not be displayed here. (Currently) This array must contain a 'None' option, which is what all users will start with.
    //              Users may choose to select this later to avoid picking up a tool for this block.
    //          This code will add the following fields to this object, while in use:
    //          currentTool: which tool is currently being used by this block
    //          targetTool: which tool to fill this slot with next, once the current tool breaks

    // These are no longer in use, since these variables are kept within each of the slots now.
    //currentTool: null, // Loaded tool that is being used
    //targetTool: "None", // Which tool the user wants to use when the current tool breaks

    checkTool() {
        // Used in the block's update() function. Returns the efficiency value for this tool, or null if no tool is available.
        // If a tool can be used, its endurance counter is deducted from. Once a tool's endurance reaches zero, it will be destroyed;
        // another tool can then be loaded automatically at that point (if one is selected)

        // With having multiple choices for tools, we need to account for current and target tools for each possible slot.  currentTool
        // and targetTool should now be kept within the toolChoices array.
        // To make things easier for setting up blocks, we will check for the existence of currentTool and targetTool, and add them
        // if needed.

        // We will now have to make two passes: one to ensure all required tools have been loaded, and a second one to calculate the
        // total efficiency of these tools, while alos using up endurance
        if (
            !state.toolChoices.every(ele => {
                // Check that this slot has the additional fields we need to function.
                if (ele.targetTool === undefined) {
                    ele.targetTool = "None";
                    ele.currentTool = null;
                }

                if (ele.currentTool === null) {
                    if (ele.targetTool === "None") return !ele.isRequired;
                    ele.currentTool = game.blockList.getInStorage(ele.targetTool);
                    if (ele.currentTool === null) {
                        console.log("Could not find tool " + ele.targetTool);
                        return !ele.isRequired;
                    } else {
                        console.log("Tool (target " + ele.targetTool + ") loaded (got " + ele.currentTool.name + ")");
                    }
                }
                return true;
            })
        )
            return null;

        // Now, reduce the total endurance of each tool we're using here
        state.toolChoices
            .filter(group => !(group.currentTool === null))
            .forEach(group => group.currentTool.endurance--);

        // Now return the sum of efficiency that all the tools provide
        return state.toolChoices
            .filter(group => !(group.currentTool === null))
            .map(group => group.currentTool.efficiency)
            .reduce((sum, value) => {
                return sum + value;
            }, 0);
        /*
        if (state.currentTool === null) {
            if (state.targetTool === "None") return null; // We are currently not after any tools
            state.currentTool = game.blockList.getInStorage(state.targetTool);
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
        //console.log("Tool " + state.currentTool.name + " outputs " + state.currentTool.efficiency + " efficiency");
        return state.currentTool.efficiency;
*/
    },

    showTools() {
        // For the side panel, appends content showing what tools the user can select. Also provides a means for the user to select
        // one of those tools

        // Start by showing the user a header section for this tool type
        state.toolChoices.forEach(group => {
            if (group.targetTool === undefined) {
                group.targetTool = "None";
                group.currentTool = null;
            }
            $("#sidepanel").append(
                "<br />" +
                    "<b>" +
                    group.groupName +
                    ":</b> " +
                    (group.isRequired ? "Required" : "Not Required") +
                    " (selected: " +
                    (group.currentTool === null ? "None" : group.currentTool.name) +
                    ")<br />"
            );
            // Next, run through all choosable tools and display them, including a way to select them
            group.choices
                .filter(tool => {
                    if (tool === "None") return true; // This gets a free pass
                    return game.unlockedItems.includes(tool);
                })
                .forEach(choice => {
                    $("#sidepanel").append(
                        '<span class="sidepanelbutton" id="sidepaneltool' +
                            danCommon.multiReplace(choice, " ", "") +
                            '" ' +
                            'style="background-color:' +
                            state.chooseToolColor(group.groupName, choice) +
                            ';">' +
                            choice +
                            "</span>"
                    );
                    document
                        .getElementById("sidepaneltool" + danCommon.multiReplace(choice, " ", ""))
                        .addEventListener("click", () => game.blockSelect.picktool(group.groupName, choice));
                });
        });
        /*
        state.toolChoices
            .filter(function(tool) {
                if (tool === "None") return true; // This one gets a free pass
                if (game.unlockedItems.includes(tool)) return true;
                return false;
            })
            .forEach(function(ele) {
                if (ele.targetTool === undefined) {
                    ele.targetTool = "None";
                    ele.currentTool = null;
                }
                //let color = ele === state.targetTool ? "green" : "red";
                $("#sidepanel").append(
                    '<span class="sidepanelbutton" ' +
                        'id="sidepaneltool' +
                        danCommon.multiReplace(ele, " ", "") +
                        '" ' +
                        'style="background-color:' +
                        state.chooseToolColor(ele) +
                        ';">' +
                        ele +
                        "</span>"
                );
                document
                    .getElementById("sidepaneltool" + danCommon.multiReplace(ele, " ", ""))
                    .addEventListener("click", () => game.blockSelect.picktool(ele));
            });
*/
    },

    updateToolPanel() {
        // Handles updating the color of the tools that are shown on the side panel.  Call this during updatepanel().
        state.toolChoices.forEach(group => {
            group.choices
                .filter(tool => {
                    if (tool === "None") return true;
                    return game.unlockedItems.includes(tool);
                })
                .forEach(tool => {
                    $("#sidepaneltool" + danCommon.multiReplace(tool, " ", "")).css({
                        "background-color": state.chooseToolColor(group.groupName, tool)
                    });
                });
        });
    },

    chooseToolColor(groupName, toolname) {
        // Returns a color name that should be used to show this tool. Color is decided on whether it is selected and if any are available

        // We should start by 'resolving' the toolname to a tool group (we use that a lot here, to determine if it's the current one in use)
        const group = state.toolChoices.find(g => (g.groupName = groupName));

        if (toolname === "None") {
            // 'none' fits a different category than other tools. It is always available
            if (group.targetTool === "None") {
                return "green"; // active & in use, available
            }
            return "grey"; // not active, but available
        }

        // Search for an outputItems structure. Not all blocks will have this; those that won't will have all possible
        // tools available.  For those that do, blocks may have minimum tool requirements for each craft option, which must be put into
        // consideration.
        if (!(state.outputItems === undefined || state.currentCraft === undefined)) {
            const crafting = state.outputItems.find(ele => ele.name === state.currentCraft);
            if (crafting === undefined) {
                console.log(
                    "Error in blockRequiresTool->chooseToolColor: did not find current state.currentCraft in state.outputItems"
                );
            } else {
                if (!(crafting.toolsUsable === undefined)) {
                    // We only want to show white when a tool isn't available for this crafting option. Anything else will be as normal
                    if (!crafting.toolsUsable.includes(toolname)) return "white";
                    // Any other condition will behave as normal
                }
            }
        }

        if (game.blockList.isInStorage(toolname)) {
            //console.log("Tool found in storage");
            if (group.targetTool === toolname) {
                return "green"; // active & in use, with more available
            }
            return "grey"; // not active, but available
        }
        //console.log("Tool " + toolname + " not found in storage");
        if (group.targetTool === toolname) {
            return "orange"; // active in use, but no more are available
        }
        return "red"; // not in use, none are available
    },

    // Note, we don't have a function to be used in updatepanel(); we have nothing to update in there that is specific to tools

    picktool(toolgroup, newtool) {
        // Handles updating which tool the user wants to make use of. This is called through the DOM; the block doesn't
        // need to access it directly
        const group = state.toolChoices.find(group => group.groupName === toolgroup);
        const lasttool = group.targetTool;
        group.targetTool = newtool;
        $("#sidepaneltool" + danCommon.multiReplace(lasttool, " ", "")).css({
            "background-color": state.chooseToolColor(lasttool)
        });
        $("#sidepaneltool" + danCommon.multiReplace(group.targetTool, " ", "")).css({
            "background-color": state.chooseToolColor(group.targetTool)
        });
        console.log("Group " + toolgroup + ", tool " + group.targetTool);
    },

    returnTool() {
        // Manages returning a used tool when this block is being deleted
        state.toolChoices.forEach(group => {
            if (group.currentTool === null) return; // No tool is loaded anyway. Nothing to do here

            var storageSource = game.blockList.getById(group.currentTool.storageSource);
            if (storageSource === undefined) return; // failed to find the source block to store this in. We'll just have to drop the tool.
            if (storageSource.onhand.length > 10) return; // We have the block, but we have no space left in it. Loosing a used
            // We could correct the storage source (or blank it out), but if the tool is selected again, it will be set anyway
            storageSource.onhand.push(group.currentTool);
        });
    }
});
