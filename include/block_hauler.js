export const hauler = mapsquare => {
    let state = {
        name: "Item Hauler",
        tile: mapsquare,
        id: lastblockid,
        counter: 0,
        //allowOutput: true,  // This block won't be using the getItem function
        mode: "idle",
        jobList: [], // This will be filled out with tasks this block can complete
        targetitem: "", // This is used on when users are adding a new route. This is the name of the item they want to move

        possibleoutputs() {
            // This block doesn't have any outputs (or inputs) in itself
            return [];
        },

        inputsAccepted() {
            // We need this because other hauler blocks might be right next to this one. We have nothing to share though
            return [];
        },

        willOutput(itemname) {
            // Returns true if the specific item will be output if getItem is called for that specific target.
            // This block won't have any items that it can output directly
            return false;
        },

        update() {
            // Handles updating this block's activities
            switch (state.mode) {
                case "idle":
                // Nothing currently being held. Find something to ship

                // Start by determining if the given item can output the target item (no point in doing more work if they can't even
                // send it).

                case "deliver":
                case "return":
            }
        },

        drawpanel() {
            // draws the content on the right side of the screen, when this block is selected
            $("#sidepanel").html(
                "<center><b>Item Hauler</b></center>" +
                    "<br />" +
                    "No matter how well you organize your factory, you' still need to transport items around. This uses man-power to move any " +
                    "item from one block to another.<br />" +
                    "<br />" +
                    "<b>Items Available:</b><br />"
            );
            // Now, generate a list of potential blocks this block can carry to the other blocks
            const sharelist = removeduplicates(
                flatten(
                    blocklist.neighbors(state.tile).map(ele => {
                        return ele.possibleoutputs();
                    })
                )
            );
            sharelist.forEach(item => {
                // Now, search for existing routes for each of the items, as they are shown
                $("#sidepanel").append(
                    item + ': <a href="#" onclick="blockselect.startadd(\'' + item + "');\">Add Target</a><br />"
                );
            });
        },

        updatepanel() {
            // Handles updating the side panel of this block.
            // We don't have anything to update here (yet).
        },

        startadd(itemname) {
            // User-called function to start the process of adding a new route
            if (itemname === "") return; // ensure we're doing things right

            // We need to modify the game board interface to allow us to select another block to send items to
            haulerpicktarget = 1;
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
            }
            // Now, ensure that this item can be accepted by the target block
            const allowed = mappos.structure.inputsAccepted();
            if (allowed != "any") {
                if (!allowed.includes(state.targetitem)) {
                    $("#sidepanel").append("<br />Fail - That item is not allowed");
                }
            }

            // Now we are ready to add this target as a route
            const itemgroup = state.jobList.find(ele => ele.name === state.targetitem);
            if (!itemgroup) {
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
                return;
            }

            // Add this new target to this group
            itemgroup.targets.push({
                blockid: mappos.structure.id,
                blockname: mappos.structure.name,
                xpos: mappos.xpos,
                ypos: mappos.ypos
            });
        }
    };
    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/bucketline_right.png" />');
    return Object.assign(state);
};
