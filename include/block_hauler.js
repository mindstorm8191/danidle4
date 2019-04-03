// Item Hauler
// for DanIdle version 4
// Uses workers to move single items from one place to another. Worker-expensive, but still very versatile, and requires no tech

import { game } from "./game.js";
import { blockDeletesClean } from "./activeblock.js";
import { danCommon } from "./dancommon.js";
import $ from "jquery";

export const hauler = mapsquare => {
    let state = {
        name: "Item Hauler",
        tile: mapsquare,
        id: game.lastBlockId,
        counter: 0,
        //allowOutput: true,  // This block won't be using the getItem function
        mode: "idle",
        jobList: [], // This will be filled out with tasks this block can complete
        targetitem: "", // This is used on when users are adding a new route. This is the name of the item they want to move
        targetx: 0,
        targety: 0,
        distancetogo: 0,

        getItem() {
            // Returns an item for output when given an itemname, or null if that isn't available here
            // This block does not output any items this way

            return null;
        },

        possibleoutputs() {
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
                        state.jobList.find(itemgroup => {
                            // Hmm. We could put the blockID in with this item, but that would force us to use a certain source, when there
                            // could be multiple.  Therefore, search the local blocks for one that will output the item we need.
                            //console.log("Check route for " + itemgroup.name);
                            const source = game.blockList.neighbors(state.tile).find(neighbor => {
                                return neighbor.willOutput(itemgroup.name);
                            });
                            if (source === undefined) return false;
                            console.log("Ready to share " + itemgroup.name);
                            let cutslot = -1;
                            // This block has an item which we can send to another block. Now, search the targets for some place to send it to
                            const dest = itemgroup.targets.find((target, index) => {
                                const block = game.blockList.getById(target.blockid);
                                if (block === undefined) {
                                    console.log(
                                        "Error - failed to locate block " +
                                            target.blockname +
                                            " (id=" +
                                            target.blockid +
                                            ")"
                                    );
                                    // We need to remove this item from our list.  However, doing so here will cause issues with our
                                    // array.find() function (it passes you items in each slot, not caring what got deleted where).
                                    // Go ahead and remove this target from this list
                                    cutslot = index;
                                    return false;
                                }
                                console.log("Check if block accepts " + itemgroup.name);
                                return block.willAccept(itemgroup.name);
                            });
                            if (cutslot != -1) itemgroup.targets.splice(cutslot, 1);
                            if (dest === undefined) return false;

                            // so, we have a source block to grab an item from, and a dest block to send the item to.
                            // We now need to set up this block to grab the item, then start moving to the target location
                            state.mode = "deliver";
                            state.targetx = dest.xpos;
                            state.targety = dest.ypos;
                            state.carry = source.getItem([itemgroup.name]);
                            state.counter = 0;
                            state.distancetogo = danCommon.manhattanDist(
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
                                    '<img src="img/movingitem.png" /></div>'
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
                    if (state.counter >= state.distancetogo) {
                        // We have reached our destination. Place our item into the target block
                        const dest = game.blockList.findOnGrid(state.targetx, state.targety);
                        if (dest === undefined) {
                            // Something went wrong. Lets turn around and head back
                            state.mode = "return";
                            return;
                        }
                        if (!dest.receiveItem(state.carry)) {
                            console.log("Error - item refused from block (name=" + dest.name + ")");
                            state.mode = "return";
                            return;
                        }
                        state.carry = null;
                        state.mode = "return";
                        // Also update the displayed image to have put down the crate
                        $("#haulerimage" + state.id).html('<img src="img/movingempty.png" />');
                        // We need to adjust the counter a bit here. Otherwise the hauler 'guy' will linger at the destination
                        // for an extra cycle
                        state.counter--;
                        return;
                    }
                    // Now, make progress on getting our token to the user

                    if (state.counter <= Math.abs(state.tile.xpos - state.targetx)) {
                        // Working on moving left or right
                        if (state.targetx > state.tile.xpos) {
                            console.log("xpos=" + (state.tile.xpos + state.counter));
                            $("#haulerimage" + state.id).css("left", (state.tile.xpos + state.counter) * 66 + 3 + "px");
                        } else {
                            console.log("xpos=" + (state.tile.xpos + state.counter));
                            $("#haulerimage" + state.id).css("left", (state.tile.xpos - state.counter) * 66 + 3 + "px");
                        }
                    } else {
                        if (state.targety > state.tile.ypos) {
                            console.log("ypos=" + (state.tile.ypos + state.counter));
                            $("#haulerimage" + state.id).css(
                                "top",
                                (state.tile.ypos + (state.counter - Math.abs(state.tile.xpos - state.targetx))) * 66 +
                                    3 +
                                    "px"
                            );
                        } else {
                            console.log("ypos=" + (state.tile.ypos + state.counter));
                            $("#haulerimage" + state.id).css(
                                "top",
                                (state.tile.ypos - (state.counter - Math.abs(state.tile.xpos - state.targetx))) * 66 +
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
                    if (state.counter < Math.abs(state.tile.xpos - state.targetx)) {
                        if (state.targetx > state.tile.xpos) {
                            $("#haulerimage" + state.id).css("left", (state.tile.xpos + state.counter) * 66 + 3 + "px");
                        } else {
                            $("#haulerimage" + state.id).css("left", (state.tile.xpos - state.counter) * 66 + 3 + "px");
                        }
                    } else {
                        if (state.targety > state.tile.ypos) {
                            $("#haulerimage" + state.id).css(
                                "top",
                                (state.tile.ypos + (state.counter - Math.abs(state.tile.xpos - state.targetx))) * 66 +
                                    3 +
                                    "px"
                            );
                        } else {
                            $("#haulerimage" + state.id).css(
                                "top",
                                (state.tile.ypos - (state.counter - Math.abs(state.tile.xpos - state.targetx))) * 66 +
                                    3 +
                                    "px"
                            );
                        }
                    }
                    return;
            }
        },

        drawpanel() {
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
            state.showDeleteLink();
            $("#sidepanel").append(`
                <br />
                <b>Items Available:</b><br />
            `);
            // Now, generate a list of potential blocks this block can carry to the other blocks
            const sharelist = state.getReachableItems();
            sharelist.forEach(item => {
                // Now, search for existing routes for each of the items, as they are shown
                $("#sidepanel").append(`
                    ${item}: <a href="#" id="sidepanelnewtarget${danCommon.multiReplace(item, " ", "")}">Add Target</a>
                    <div id="sidepaneltargetlist${danCommon.multiReplace(item, " ", "")}"></div>
                `);
                document
                    .getElementById("sidepanelnewtarget" + danCommon.multiReplace(item, " ", ""))
                    .addEventListener("click", () => game.blockSelect.startadd(item));

                // With the basic information shown, now we need to show any existing routes.
                // Since we need to do this later too, we delegated this to a function
                state.showTargets(item);
            });
        },

        updatepanel() {
            // Handles updating the side panel of this block.
            // We don't have anything to update here (yet).
        },

        getReachableItems() {
            // Internal-use function. Returns a list of item names that this block is able to get items from
            return danCommon.removeDuplicates(
                danCommon.flatten(
                    game.blockList.neighbors(state.tile).map(ele => {
                        return ele.possibleoutputs();
                        // Since possibleoutputs outputs an array, we will end up with an array holding arrays. We will have to
                        // convert it to a one-dimensional array.  It might also contain the same item type from multiple blocks,
                        // so we need to remove duplicate entries
                    })
                )
            );
        },

        showTargets(item) {
            // Lists all targets (selected in order). Assumes there's a div block specific for this item, to be filled out.
            // Start by determining if we have any targets to begin with
            const itemgroup = state.jobList.find(ele => ele.name === item);
            if (!itemgroup) {
                $("#sidepaneltargetlist" + danCommon.multiReplace(item, " ", "")).html(
                    '<span style="margin-left:20px;">No entries</span><br />'
                );
            } else {
                // Before we can start filling this out, we need to blank out the existing data - then append new content to it
                $("#sidepaneltargetlist" + danCommon.multiReplace(item, " ", "")).html(" ");
                itemgroup.targets.forEach(target => {
                    $("#sidepaneltargetlist" + danCommon.multiReplace(item, " ", "")).append(`
                        <span style="margin-left:20px;">${target.blockname}
                            (d=${danCommon.manhattanDist(state.tile.xpos, state.tile.ypos, target.xpos, target.ypos)})
                            <a href="#" id="sidepaneldelete${danCommon.multiReplace(itemgroup.name, " ", "") +
                                target.blockid}">X</a><br />
                    `);
                    document
                        .getElementById(
                            "sidepaneldelete" + danCommon.multiReplace(itemgroup.name, " ", "") + target.blockid
                        )
                        .addEventListener("click", () => game.blockSelect.removelink(itemgroup.name, target.blockid));
                });
            }
        },

        startadd(itemname) {
            // User-called function to start the process of adding a new route
            if (itemname === "") return; // ensure we're doing things right

            // We need to modify the game board interface to allow us to select another block to send items to
            game.haulerPickTarget = 1;
            state.targetitem = itemname; // Store the item name so we can use it later
            $("#sidepanel").append("<br /><b>Pick a target</b>");
        },

        accepttarget(mappos) {
            // Triggered from handlegameboxclick (at the game core) to accept a map location
            if (mappos === undefined || mappos === null) {
                $("#sidepanel").append("<br />Fail - Invalid target");
                return;
            }
            if (mappos.structure === null) {
                $("#sidepanel").append("<br />Fail - Nothing is built here");
                return;
            }
            // Now, ensure that this item can be accepted by the target block
            const allowed = mappos.structure.inputsAccepted();
            if (allowed != "any") {
                if (!allowed.includes(state.targetitem)) {
                    console.log(
                        "Target " + mappos.structure.name + ", match " + state.targetitem + " against " + allowed.join()
                    );
                    $("#sidepanel").append("<br />Fail - That item is not allowed");
                    return;
                }
            }

            // Now we are ready to add this target as a route
            const itemgroup = state.jobList.find(ele => ele.name === state.targetitem);
            console.log(itemgroup);
            if (itemgroup === undefined) {
                // We found no existing groups for this item.  Time to create a new one
                state.jobList.push({
                    name: state.targetitem,
                    targets: [
                        {
                            blockid: mappos.structure.id,
                            blockname: mappos.structure.name,
                            xpos: mappos.xpos,
                            ypos: mappos.ypos
                        }
                    ]
                });
                //$("#sidepanel").append("<br />Success");
                state.showTargets(state.targetitem);
                return;
            }

            // Add this new target to this group
            itemgroup.targets.push({
                blockid: mappos.structure.id,
                blockname: mappos.structure.name,
                xpos: mappos.xpos,
                ypos: mappos.ypos
            });
            state.showTargets(state.targetitem);
            console.log(state.jobList);
            //$("#sidepanel").append("<br />Success");
        },

        removelink(itemname, blockid) {
            // Handles removing a route from the list.  This is triggered by user input
            const itemgroup = state.jobList.find(ele => ele.name === itemname);
            if (!itemgroup) {
                console.log("Error - did not find item group in jobList (itemname=" + itemname + ")");
                return;
            }
            // Now find the blockid in the list of targets
            const spot = itemgroup.targets.findIndex(ele => ele.blockid === blockid);
            if (spot === -1) {
                console.log("Error - did not find block id in targets list (blockid=" + blockid + ")");
                return;
            }
            itemgroup.targets.splice(spot, 1);
            if (itemgroup.targets.length === 0) {
                // There are no more targets in this group. Go ahead and clean up this itemgroup
                state.jobList.splice(state.jobList.findIndex(ele => ele.name === itemname), 1);
            }
            state.showTargets(itemname);
        },

        deleteblock() {
            state.finishDelete();
        }
    };
    game.lastBlockId++;
    game.blockList.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/bucketline_right.png" />');
    return Object.assign(state, blockDeletesClean(state));
};
