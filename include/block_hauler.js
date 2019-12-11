// Item Hauler
// for DanIdle version 4
// Uses workers to move single items from one place to another. Worker-expensive, but still very versatile, and requires no tech

import { game } from "./game.js";
import { blockDeletesClean, blockHasWorkerPriority } from "./activeBlock.js";
import { danCommon } from "./danCommon.js";
import $ from "jquery";

export const hauler = mapSquare => {
    let state = {
        name: "Item Hauler",
        tile: mapSquare,
        id: game.getNextBlockId(),
        counter: 0,
        //allowOutput: true,  // This block won't be using the getItem function
        mode: "idle",
        jobList: [], // This will be filled out with tasks this block can complete
        targetItem: "", // This is used on when users are adding a new route. This is the name of the item they want to move
        targetX: 0,
        targetY: 0,
        distanceToGo: 0,

        getItem() {
            // Returns an item for output when given an itemName, or null if that isn't available here
            // This block does not output any items this way

            return null;
        },

        possibleOutputs() {
            // This block doesn't have any outputs (or inputs) in itself
            return [];
        },

        inputsAccepted() {
            // Returns an array of items which this block will accept as input (at some point in time - does not have to accept the
            // item right away).
            // We need this because other hauler blocks might be right next to this one. We have nothing to share though
            return [];
        },

        willOutput() {
            // Returns true if the specific item will be output if getItem is called for that specific target.
            // This block won't have any items that it can output directly
            return false;
        },

        willAccept() {
            // Returns true if the specific item will be accepted as input, if recieved
            // This block won't accept any items directly.
            return false;
        },

        receiveItem() {
            // Accepts an item as input. Returns true on success, or false if not
            // This block does not allow any items to be input
            return false;
        },

        update() {
            // Handles updating this block's activities
            if (game.workPoints <= 0) return; // We can't do anything unless we have a worker available to use
            switch (state.mode) {
                case "idle":
                    // Nothing currently being held. Find something to ship

                    // Start by determining if the given item can output the target item (no point in doing more work if they can't even
                    // send it).
                    if (
                        state.jobList.find(itemGroup => {
                            // Hmm. We could put the blockID in with this item, but that would force us to use a certain source, when there
                            // could be multiple.  Therefore, search the local blocks for one that will output the item we need.
                            //console.log("Check route for " + itemGroup.name);
                            const source = game.blockList
                                .neighbors(state.tile)
                                .find(neighbor => {
                                    return neighbor.willOutput(itemGroup.name);
                                });
                            if (source === undefined) return false;
                            //console.log("Ready to share " + itemGroup.name);
                            let cutslot = -1;
                            // This block has an item which we can send to another block. Now, search the targets for some place to send it to
                            const dest = itemGroup.targets.find(
                                (target, index) => {
                                    const block = game.blockList.getById(
                                        target.blockId
                                    );
                                    if (block === undefined) {
                                        console.log(
                                            "Error - failed to locate block " +
                                                target.blockName +
                                                " (id=" +
                                                target.blockId +
                                                ")"
                                        );
                                        // We need to remove this item from our list.  However, doing so here will cause issues with our
                                        // array.find() function (it passes you items in each slot, not caring what got deleted where).
                                        // Go ahead and remove this target from this list
                                        cutslot = index;
                                        return false;
                                    }
                                    //console.log("Check if block accepts " + itemGroup.name);
                                    return block.willAccept(itemGroup.name);
                                }
                            );
                            if (cutslot != -1)
                                itemGroup.targets.splice(cutslot, 1);
                            if (dest === undefined) return false;

                            // so, we have a source block to grab an item from, and a dest block to send the item to.
                            // We now need to set up this block to grab the item, then start moving to the target location
                            state.mode = "deliver";
                            state.targetX = dest.xpos;
                            state.targetY = dest.ypos;
                            state.carry = source.getItem([itemGroup.name]);
                            state.counter = 0;
                            state.distanceToGo = danCommon.manhattanDist(
                                state.tile.xpos,
                                state.tile.ypos,
                                dest.xpos,
                                dest.ypos
                            );
                            // We need to go ahead and render the hauler object here, so we don't have to figure it out later
                            $("#game").append(
                                '<div id="haulerimage' +
                                    state.id +
                                    '" style="top:' +
                                    (state.tile.ypos * 66 + 3) +
                                    "px; left:" +
                                    (state.tile.xpos * 66 + 3) +
                                    'px; z-index:5; position:absolute; pointer-events:none;">' +
                                    '<img src="img/movingItem.png" /></div>'
                            );
                            return true;
                        })
                    ) {
                        game.workPoints--;
                    }
                    return;
                case "deliver":
                    state.counter++;
                    game.workPoints--;
                    if (state.counter >= state.distanceToGo) {
                        // We have reached our destination. Place our item into the target block
                        const dest = game.blockList.findOnGrid(
                            state.targetX,
                            state.targetY
                        );
                        if (dest === undefined) {
                            // Something went wrong. Lets turn around and head back
                            state.mode = "return";
                            return;
                        }
                        if (!dest.receiveItem(state.carry)) {
                            console.log(
                                "Error - item refused from block (name=" +
                                    dest.name +
                                    ")"
                            );
                            state.mode = "return";
                            return;
                        }
                        state.carry = null;
                        state.mode = "return";
                        // Also update the displayed image to have put down the crate
                        $("#haulerimage" + state.id).html(
                            '<img src="img/movingEmpty.png" />'
                        );
                        // We need to adjust the counter a bit here. Otherwise the hauler 'guy' will linger at the destination
                        // for an extra cycle
                        state.counter--;
                        return;
                    }
                    // Now, make progress on getting our token to the user

                    if (
                        state.counter <=
                        Math.abs(state.tile.xpos - state.targetX)
                    ) {
                        // Working on moving left or right
                        if (state.targetX > state.tile.xpos) {
                            //console.log("xpos=" + (state.tile.xpos + state.counter));
                            $("#haulerimage" + state.id).css(
                                "left",
                                (state.tile.xpos + state.counter) * 66 +
                                    3 +
                                    "px"
                            );
                        } else {
                            //console.log("xpos=" + (state.tile.xpos + state.counter));
                            $("#haulerimage" + state.id).css(
                                "left",
                                (state.tile.xpos - state.counter) * 66 +
                                    3 +
                                    "px"
                            );
                        }
                    } else {
                        if (state.targetY > state.tile.ypos) {
                            //console.log("ypos=" + (state.tile.ypos + state.counter));
                            $("#haulerimage" + state.id).css(
                                "top",
                                (state.tile.ypos +
                                    (state.counter -
                                        Math.abs(
                                            state.tile.xpos - state.targetX
                                        ))) *
                                    66 +
                                    3 +
                                    "px"
                            );
                        } else {
                            //console.log("ypos=" + (state.tile.ypos + state.counter));
                            $("#haulerimage" + state.id).css(
                                "top",
                                (state.tile.ypos -
                                    (state.counter -
                                        Math.abs(
                                            state.tile.xpos - state.targetX
                                        ))) *
                                    66 +
                                    3 +
                                    "px"
                            ); // the 3px offset is to allow us to place the hauler image correctly in the middle of the square
                        }
                    }
                    return;
                case "return":
                    // Now, we must account for time to travel back to where this needs to be.
                    state.counter--;
                    game.workPoints--;
                    if (state.counter <= 0) {
                        // We have made it back to our 'start' position
                        $("#haulerimage" + state.id).remove();
                        state.mode = "idle";
                        return;
                    }
                    if (
                        state.counter <
                        Math.abs(state.tile.xpos - state.targetX)
                    ) {
                        if (state.targetX > state.tile.xpos) {
                            $("#haulerimage" + state.id).css(
                                "left",
                                (state.tile.xpos + state.counter) * 66 +
                                    3 +
                                    "px"
                            );
                        } else {
                            $("#haulerimage" + state.id).css(
                                "left",
                                (state.tile.xpos - state.counter) * 66 +
                                    3 +
                                    "px"
                            );
                        }
                    } else {
                        if (state.targetY > state.tile.ypos) {
                            $("#haulerimage" + state.id).css(
                                "top",
                                (state.tile.ypos +
                                    (state.counter -
                                        Math.abs(
                                            state.tile.xpos - state.targetX
                                        ))) *
                                    66 +
                                    3 +
                                    "px"
                            );
                        } else {
                            $("#haulerimage" + state.id).css(
                                "top",
                                (state.tile.ypos -
                                    (state.counter -
                                        Math.abs(
                                            state.tile.xpos - state.targetX
                                        ))) *
                                    66 +
                                    3 +
                                    "px"
                            );
                        }
                    }
                    return;
            }
        },

        drawPanel() {
            // draws the content on the right side of the screen, when this block is selected
            $("#sidepanel").html(`
                <center><b>Item Hauler</b></center>
                <br />
                No matter how well you organize your factory, you' still need to transport items around. This uses man-power to move any
                item from one block to another.<br />
                <br />
                Place Item Haulers near blocks providing the item. Select an output, then click the block to send items to. Haulers can
                haul items any distance, but time needed depends on distance.
            `);
            state.showPriority();
            state.showDeleteLink();
            $("#sidepanel").append(`
                <br />
                <b>Items Available:</b><br />
            `);
            // Now, generate a list of potential blocks this block can carry to the other blocks
            const shareList = state.getReachableItems();
            shareList.forEach(item => {
                // Now, search for existing routes for each of the items, as they are shown
                $("#sidepanel").append(`
                    ${item}: <a href="#" id="sidepanelnewtarget${danCommon.multiReplace(
                    item,
                    " ",
                    ""
                )}">Add Target</a>
                    <div id="sidepaneltargetlist${danCommon.multiReplace(
                        item,
                        " ",
                        ""
                    )}"></div>
                `);
                document
                    .getElementById(
                        "sidepanelnewtarget" +
                            danCommon.multiReplace(item, " ", "")
                    )
                    .addEventListener("click", () =>
                        game.blockSelect.startAdd(item)
                    );

                // With the basic information shown, now we need to show any existing routes.
                // Since we need to do this later too, we delegated this to a function
                state.showTargets(item);
            });
        },

        updatePanel() {
            // Handles updating the side panel of this block.
            // We don't have anything to update here (yet).
        },

        getReachableItems() {
            // Internal-use function. Returns a list of item names that this block is able to get items from
            return danCommon.removeDuplicates(
                danCommon.flatten(
                    game.blockList.neighbors(state.tile).map(ele => {
                        return ele.possibleOutputs();
                        // Since possibleOutputs outputs an array, we will end up with an array holding arrays. We will have to
                        // convert it to a one-dimensional array.  It might also contain the same item type from multiple blocks,
                        // so we need to remove duplicate entries
                    })
                )
            );
        },

        showTargets(item) {
            // Lists all targets (selected in order). Assumes there's a div block specific for this item, to be filled out.
            // Start by determining if we have any targets to begin with
            const itemGroup = state.jobList.find(ele => ele.name === item);
            if (!itemGroup) {
                $(
                    "#sidepaneltargetlist" +
                        danCommon.multiReplace(item, " ", "")
                ).html(
                    '<span style="margin-left:20px;">No entries</span><br />'
                );
            } else {
                // Before we can start filling this out, we need to blank out the existing data - then append new content to it
                $(
                    "#sidepaneltargetlist" +
                        danCommon.multiReplace(item, " ", "")
                ).html(" ");
                itemGroup.targets.forEach(target => {
                    $(
                        "#sidepaneltargetlist" +
                            danCommon.multiReplace(item, " ", "")
                    ).append(`
                        <span style="margin-left:20px;">${target.blockName}
                            (d=${danCommon.manhattanDist(
                                state.tile.xpos,
                                state.tile.ypos,
                                target.xpos,
                                target.ypos
                            )})
                            <a href="#" id="sidepaneldelete${danCommon.multiReplace(
                                itemGroup.name,
                                " ",
                                ""
                            ) + target.blockId}">X</a><br />
                    `);
                    document
                        .getElementById(
                            "sidepaneldelete" +
                                danCommon.multiReplace(
                                    itemGroup.name,
                                    " ",
                                    ""
                                ) +
                                target.blockId
                        )
                        .addEventListener("click", () =>
                            game.blockSelect.removelink(
                                itemGroup.name,
                                target.blockId
                            )
                        );
                });
            }
        },

        startAdd(itemName) {
            // User-called function to start the process of adding a new route
            if (itemName === "") return; // ensure we're doing things right

            // We need to modify the game board interface to allow us to select another block to send items to
            game.haulerPickTarget = 1;
            state.targetItem = itemName; // Store the item name so we can use it later
            $("#sidepanel").append("<br /><b>Pick a target</b>");
        },

        acceptTarget(mapPos) {
            // Triggered from handlegameboxclick (at the game core) to accept a map location
            if (mapPos === undefined || mapPos === null) {
                $("#sidepanel").append("<br />Fail - Invalid target");
                return;
            }
            if (mapPos.structure === null) {
                $("#sidepanel").append("<br />Fail - Nothing is built here");
                return;
            }
            // Now, ensure that this item can be accepted by the target block
            const allowed = mapPos.structure.inputsAccepted();
            if (allowed != "any") {
                if (!allowed.includes(state.targetItem)) {
                    console.log(
                        "Target " +
                            mapPos.structure.name +
                            ", match " +
                            state.targetItem +
                            " against " +
                            allowed.join()
                    );
                    $("#sidepanel").append(
                        "<br />Fail - That item is not allowed"
                    );
                    return;
                }
            }

            // Now we are ready to add this target as a route
            const itemGroup = state.jobList.find(
                ele => ele.name === state.targetItem
            );
            //console.log(itemGroup);
            if (itemGroup === undefined) {
                // We found no existing groups for this item.  Time to create a new one
                state.jobList.push({
                    name: state.targetItem,
                    targets: [
                        {
                            blockId: mapPos.structure.id,
                            blockName: mapPos.structure.name,
                            xpos: mapPos.xpos,
                            ypos: mapPos.ypos
                        }
                    ]
                });
                //$("#sidepanel").append("<br />Success");
                state.showTargets(state.targetItem);
                return;
            }

            // Add this new target to this group
            itemGroup.targets.push({
                blockId: mapPos.structure.id,
                blockName: mapPos.structure.name,
                xpos: mapPos.xpos,
                ypos: mapPos.ypos
            });
            state.showTargets(state.targetItem);
            //console.log(state.jobList);
            //$("#sidepanel").append("<br />Success");
        },

        removelink(itemName, blockId) {
            // Handles removing a route from the list.  This is triggered by user input
            const itemGroup = state.jobList.find(ele => ele.name === itemName);
            if (!itemGroup) {
                console.log(
                    "Error - did not find item group in jobList (itemName=" +
                        itemName +
                        ")"
                );
                return;
            }
            // Now find the blockId in the list of targets
            const spot = itemGroup.targets.findIndex(
                ele => ele.blockId === blockId
            );
            if (spot === -1) {
                console.log(
                    "Error - did not find block id in targets list (blockId=" +
                        blockId +
                        ")"
                );
                return;
            }
            itemGroup.targets.splice(spot, 1);
            if (itemGroup.targets.length === 0) {
                // There are no more targets in this group. Go ahead and clean up this itemGroup
                state.jobList.splice(
                    state.jobList.findIndex(ele => ele.name === itemName),
                    1
                );
            }
            state.showTargets(itemName);
        },

        deleteBlock() {
            state.finishDelete();
        }
    };
    game.blockList.push(state);
    mapSquare.structure = state;
    $("#" + state.tile.id + "imageholder").html(
        '<img src="img/hauler.png" />'
    );
    return Object.assign(
        state,
        blockDeletesClean(state),
        blockHasWorkerPriority(state)
    );
};
