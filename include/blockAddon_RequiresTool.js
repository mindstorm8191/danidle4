// blockRequiresTool
// for DanIdle version 4
// Provides functionality for any block that requires a tool to function

import { game } from "./game.js";
import { danCommon } from "./danCommon.js";
import $ from "jquery";

// We will also need a block where tools are optional - call it blockVoluntaryTool
export const blockRequiresTool = state => ({
    // Add-on unit for blocks that require one (and only one) tool before it can complete any tasks. Allows the user to select
    // which tool to use in this block. New tools are grabbed automatically when one breaks.
    // state - state object of the block we are using
    //      Must contain a toolChoices array, containing objects, one for each tool slot:
    //          slotName: name of the slot, as shown to the user
    //          isRequired: set to true if this tool is required before this block can begin working, or false if not.
    //          isUsed: set to true if this tool is to be used for the current crafting operation, or false if it is left out.
    //          choices: the name (only) of all possible tools that can be used by this block. Any tools that have not been unlocked will
    //              not be displayed here. (Currently) This array must contain a 'None' option, which is what all users will start with.
    //              Users may choose to select this later to avoid picking up a tool for this block.
    //          This code will add the following fields to this object, while in use:
    //          currentTool: which tool is currently being used by this block
    //          targetTool: which tool to fill this slot with next, once the current tool breaks

    // These are no longer in use, since these variables are kept within each of the slots now.
    //currentTool: null, // Loaded tool that is being used
    //targetTool: "None", // Which tool the user wants to use when the current tool breaks

    requiresTool_isSetup: false, // This is used within CheckTool, to allow additional setups on the first run

    checkTool(debug = false) {
        // Used in the block's update() function. Returns the efficiency value for this tool, or null if no tool is available.
        // If a tool can be used, its endurance counter is deducted from. Once a tool's endurance reaches zero, it will be destroyed;
        // another tool can then be loaded automatically at that point (if one is selected)

        // Start by ensuring all additional fields of each tool slot exists.
        // targetTool is the current tool that the user wishes to use
        // currentTool is the actual tool object, loaded here
        // isUsed is set to true or false if the tool is used for the current task.
        //      This can be changed manually by the parent block.
        if (!state.requiresTool_isSetup) {
            state.requiresTool_isSetup = true;
            state.toolChoices = state.toolChoices.map(ele => {
                return {
                    targetTool: "None",
                    currentTool: null,
                    isUsed: true,
                    ...ele
                };
                // The spread, in this way, will allow the existing properties in 'ele'
                // to overwrite any added here
            });
        }

        // With having multiple choices for tools, we need to account for current and target tools for each possible slot.  currentTool
        // and targetTool should now be kept within the toolChoices array.
        // To make things easier for setting up blocks, we will check for the existence of currentTool and targetTool, and add them
        // if needed.

        // We will now have to make two passes: one to ensure all required tools have been loaded, and a second one to calculate the
        // total efficiency of these tools, while alos using up endurance
        if (
            !state.toolChoices.every(ele => {
                // See if the tool is being used in the current task.
                //  If it's not used, the task can be done without it. This
                // is different than saying that the tool is required.
                if (ele.isUsed === false) return true;

                if (ele.currentTool === null) {
                    if (ele.targetTool === "None") return !ele.isRequired; // Return status based on if this tool is required or not
                    ele.currentTool = game.blockList.getInStorage(
                        ele.targetTool
                    );
                    if (ele.currentTool === null) {
                        //console.log("Could not find tool " + ele.targetTool);
                        return !ele.isRequired;
                    } else {
                        console.log(
                            "Tool (target " +
                                ele.targetTool +
                                ") loaded (got " +
                                ele.currentTool.name +
                                ")"
                        );
                    }
                }
                return true;
            })
        )
            return null;

        if (debug === true) {
            console.log(
                state.toolChoices
                    .filter(group => !(group.currentTool === null))
                    .map(group => group.currentTool.efficiency)
            );
        }

        // Now, reduce the total endurance of each tool we're using here
        state.toolChoices
            .filter(group => !(group.currentTool === null))
            .filter(group => group.isUsed === true)
            .forEach(group => group.currentTool.endurance--);

        // Now return the sum of efficiency that all the tools provide
        return state.toolChoices
            .filter(group => !(group.currentTool === null))
            .filter(group => group.isUsed === true)
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

    showTools(debugState = false) {
        // For the side panel, appends content showing what tools the user can select. Also provides a means for the user to select
        // one of those tools
        // debugState - set this to true to provide debugging information through this function, as it operates.  Debugging is
        //      currently on an as-needed basis

        // Start by showing the user a header section for this tool type
        state.toolChoices.forEach(group => {
            if (group.targetTool === undefined) {
                group.targetTool = "None";
                group.currentTool = null;
            }
            $("#sidepanel").append(`
                <br />
                <b>${group.groupName}:</b> ${
                group.isRequired ? "Required" : "Not Required"
            }
                    (selected: ${
                        group.currentTool === null
                            ? "None"
                            : group.currentTool.name
                    })<br />
            `);
            // Next, run through all choosable tools and display them, including a way to select them
            group.choices
                .filter(tool => {
                    if (tool === "None") return true; // This gets a free pass
                    let isUnlocked = game.unlockedItems.includes(tool);
                    if (!isUnlocked && debugState)
                        console.log(
                            "Target tool " + tool + " is not unlocked yet."
                        );
                    return isUnlocked;
                })
                .forEach(choice => {
                    $("#sidepanel").append(`
                        <span class="sidepanelbutton"
                              id="sidepaneltool${danCommon.multiReplace(
                                  choice,
                                  " ",
                                  ""
                              )}"
                              style="background-color: ${state.chooseToolColor(
                                  group.groupName,
                                  choice
                              )};">${choice}</span>
                    `);
                    console.log(group.groupName);
                    document
                        .getElementById(
                            "sidepaneltool" +
                                danCommon.multiReplace(choice, " ", "")
                        )
                        .addEventListener("click", () =>
                            game.blockSelect.picktool(group.groupName, choice)
                        );
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
        // Handles updating the color of the tools that are shown on the side panel.  Call this during updatePanel().
        state.toolChoices.forEach(group => {
            group.choices
                .filter(tool => {
                    if (tool === "None") return true;
                    return game.unlockedItems.includes(tool);
                })
                .forEach(tool => {
                    $(
                        "#sidepaneltool" + danCommon.multiReplace(tool, " ", "")
                    ).css({
                        "background-color": state.chooseToolColor(
                            group.groupName,
                            tool
                        )
                    });
                });
        });
    },

    chooseToolColor(gName, toolName) {
        // Returns a color name that should be used to show this tool. Color is decided on whether it is selected and if any are available

        // We should start by 'resolving' the toolName to a tool group (we use that a lot here, to determine if it's the current one in use)
        const group = state.toolChoices.find(g => g.groupName === gName);
        if (group === undefined) {
            console.log("Failed to find tool group (name given = " + gName);
            console.log(state.toolChoices);
            return;
        }
        if (group.targetTool === undefined) {
            console.log("Setting up targetTool in chooseToolColor (why?)");
            group.targetTool = "None";
            group.currentTool = null;
        }

        if (toolName === "None") {
            // 'none' fits a different category than other tools. It is always available
            if (group.targetTool === "None") {
                return "green"; // active & in use, available
            }
            return "grey"; // not active, but available
        }

        // Search for an outputItems structure. Not all blocks will have this; those that won't will have all possible
        // tools available.  For those that do, blocks may have minimum tool requirements for each craft option, which must be put into
        // consideration.
        if (
            !(
                state.outputItems === undefined ||
                state.currentCraft === undefined
            )
        ) {
            const crafting = state.outputItems.find(
                ele => ele.name === state.currentCraft
            );
            if (crafting === undefined) {
                console.log(
                    "Error in blockRequiresTool->chooseToolColor: did not find current state.currentCraft in state.outputItems"
                );
            } else {
                if (!(crafting.toolsUsable === undefined)) {
                    // We only want to show white when a tool isn't available for this crafting option. Anything else will be as normal
                    if (!crafting.toolsUsable.includes(toolName))
                        return "white";
                    // Any other condition will behave as normal
                }
            }
        }

        if (game.blockList.isInStorage(toolName)) {
            //console.log("Tool found in storage");
            if (group.targetTool === toolName) {
                return "green"; // active & in use, with more available
            }
            return "grey"; // not active, but available
        }
        //console.log("Tool " + toolName + " not found in storage");
        if (group.targetTool === toolName) {
            return "orange"; // active in use, but no more are available
        }
        return "red"; // not in use, none are available
    },

    // Note, we don't have a function to be used in updatePanel(); we have nothing to update in there that is specific to tools

    picktool(toolGroup, newTool) {
        // Handles updating which tool the user wants to make use of. This is called through the DOM; the block doesn't
        // need to access it directly
        const group = state.toolChoices.find(
            group => group.groupName === toolGroup
        );
        const lasttool = group.targetTool;
        group.targetTool = newTool;
        $("#sidepaneltool" + danCommon.multiReplace(lasttool, " ", "")).css({
            "background-color": state.chooseToolColor(group.groupName, lasttool)
        });
        $(
            "#sidepaneltool" + danCommon.multiReplace(group.targetTool, " ", "")
        ).css({
            "background-color": state.chooseToolColor(
                group.groupName,
                group.targetTool
            )
        });
        //console.log("Group " + toolGroup + ", tool " + group.targetTool);
    },

    returnTool() {
        // Manages returning a used tool when this block is being deleted
        state.toolChoices.forEach(group => {
            if (group.currentTool === null) return; // No tool is loaded anyway. Nothing to do here

            var storageSource = game.blockList.getById(
                group.currentTool.storageSource
            );
            if (storageSource === undefined) return; // failed to find the source block to store this in. We'll just have to drop the tool.
            if (storageSource.onhand.length > 10) return; // We have the block, but we have no space left in it. Loosing a used
            // We could correct the storage source (or blank it out), but if the tool is selected again, it will be set anyway
            storageSource.onhand.push(group.currentTool);
        });
    }
});
