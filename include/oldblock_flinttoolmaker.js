const flinttoolmaker = mapSquare => {
    let state = {
        name: "Flint Tool Maker",
        tile: mapSquare,
        priority: blocklist.lastpriority(),
        id: lastblockid,
        counter: 0,
        allowOutput: true,
        onhand: [], // This handles output items only
        outputitems: ["None", "Short Stick", "Long Stick"],
        currentCraft: "None",
        targetcraft: "None",
        stocklist: [
            { name: "Short Stick", hold: [] }, // This manages holding input items
            { name: "Long Stick", hold: [] },
            { name: "Twine", hold: [] },
            { name: "Flint Hatchet Head", hold: [] },
            { name: "Flint Hoe Head", hold: [] },
            { name: "Flint Spear Head", hold: [] }
        ],
        itemsneeded: [
            { tool: "None", needs: [] }, // 'none' is included so we can simply list all the items later
            {
                tool: "Flint Hatchet",
                needs: [
                    { item: "Short Stick", qty: 1 },
                    { item: "Twine", qty: 1 },
                    { item: "Flint Hatchet Head", qty: 1 }
                ]
            },
            {
                tool: "Flint Hoe",
                needs: [{ item: "Long Stick", qty: 1 }, { item: "Twine", qty: 1 }, { item: "Flint Hoe Head", qty: 1 }]
            },
            {
                tool: "Flint Spear",
                needs: [{ item: "Long Stick", qty: 1 }, { item: "Twine", qty: 1 }, { item: "Flint Spear Head", qty: 1 }]
            },
            {
                tool: "Twine Table",
                needs: [{ item: "Long Stick", qty: 5 }, { item: "Short Stick", qty: 16 }, { item: "Twine", qty: 5 }]
            },
            {
                tool: "Twine Sled",
                needs: [{ item: "Long Stick", qty: 8 }, { item: "Short Stick", qty: 8 }, { item: "Twine", qty: 5 }]
            },
            {
                tool: "Twine Raft",
                needs: [{ item: "Long Stick", qty: 6 }, { item: "Short Stick", qty: 3 }, { item: "Twine", qty: 3 }]
            }
        ],

        possibleOutputs: function() {
            // Rather than returning a fixed array, let's feed data from our tables. If those tables change, we won't
            // have to modify this to update its output
            return state.itemsneeded.map(function(inner) {
                return inner.tool;
            });
        },

        update: function() {
            // Start by ensuring we have something to work on
            if (state.targetcraft === "None" && state.currentCraft === "None") return;
            if (state.currentCraft === "None") state.currentCraft = state.targetcraft;

            // Get to the tool type we are trying to craft
            const crafting =
                state.itemsneeded[
                    state.itemsneeded.findIndex(function(ele) {
                        return ele.tool === state.currentCraft;
                    })
                ];

            // Now, determine if we have all the resources we need to produce this
            const needs = crafting.needs
                .filter(function(listing) {
                    // This section runs through each element in the itemsneeded, for the particular tool we're using
                    // Return true if we have enough items in the stock list to match this needed part
                    return (
                        state.stocklist.find(function(ele) {
                            // Returns the object within stocklist which matches the name of the itemsneeded entry we're viewing
                            return listing.item === ele.name;
                        }).hold.length < listing.qty
                    ); // What we actually need here is to include any items we are short on
                })
                .map(function(ele) {
                    return ele.item;
                });
            // 'needs' now contains only the item names that we still need before building the target tool
            console.log(needs);
            if (needs.length > 0) {
                let continuestate = 1;
                blocklist.neighbors(state.tile).find(function(neighbor) {
                    let pickup = neighbor.getItem(needs);
                    if (pickup === null) return false;
                    if (continuestate === 0) return false;
                    // Since we don't have a standard input list here, we need to do a bit more work to determine which
                    // slot to put our captured item into
                    // At this point, successful storing of the item is basically guaranteed. We don't need to worry ourselves
                    // with continuestate inside this sub-function
                    state.stocklist
                        .find(function(ele) {
                            if (ele.name !== pickup.name) return false;
                            return true;
                        })
                        .hold.push(pickup);
                    continuestate = 0;
                    return true;
                });
                return; // Whether we find anything or not, we will have to wait till next round to actually begin processing
            }

            // With assurance that we have all the parts needed, go ahead and start building the target item
            state.counter++;
            if (state.counter > 20) {
                state.counter -= 20;
                // Now, we need to remove items from our stock lists based on what this particular item needs
                crafting.needs.forEach(function(used) {
                    state.stocklist
                        .find(function(ele) {
                            return ele.name === used.item;
                        })
                        .hold.splice(0, used.qty);
                });
                state.onhand.push(tool(state.currentCraft, 1.0, 100));
                state.currentCraft = state.targetcraft;
            }
            $("#" + state.tile.id + "progress").css({ width: state.counter * 3 });
        },

        drawpanel: function() {
            $("#sidepanel").html(
                "<b>Flint Tool Maker</b><br />" +
                    "<br />" +
                    "Flint tools might get you started, but before long you're going to need better tools. Crafting " +
                    "wooden handles onto your flint blades gives you a few better tools.<br />" +
                    "<br />" +
                    "Provide with twine, sticks and flint tool heads to produce a new variety of tools<br />" +
                    "<br />" +
                    "<b>Items Needed</b><br />" +
                    '<div id="sidepanelparts"></div>'
            );
            // To provide information about what parts this block currently has, we'll have to do a bit more than other blocks
            // do. Run through the list of all pieces the target tool needs, and provide an amount of that part

            // We also need to do this in updatepanel(), so we have moved this to a function
            state.showstocks();

            // Now, provide some production options. This will ultimately decide what 'targetcraft' can be set to
            $("#sidepanel").append("<br /><b>Choose an output:</b><br />");
            $("#sidepanel").append(
                state.itemsneeded
                    .map(function(ele) {
                        const color = state.targetcraft === ele.tool ? "green" : "grey";
                        return (
                            '<span class="sidepanelbutton" ' +
                            'id="sidepanelcraft' +
                            multireplace(ele.tool, " ", "") +
                            '" ' +
                            'style="background-color:' +
                            color +
                            ';" ' +
                            'onclick="blocklist.getById(' +
                            state.id +
                            ").pickcraft('" +
                            ele.tool +
                            "')\">" +
                            ele.tool +
                            "</span>"
                        );
                    })
                    .join("")
            );
        },

        showstocks: function() {
            if (state.targetcraft === "None") {
                $("#sidepanelparts").html("Pick a tool to craft, first");
            } else {
                $("#sidepanelparts").html(
                    state.itemsneeded
                        .find(function(ele) {
                            return ele.tool === state.targetcraft;
                        })
                        .needs.map(function(ele) {
                            return (
                                ele.item +
                                ": " +
                                state.stocklist.find(function(get) {
                                    return get.name === ele.item;
                                }).hold.length +
                                " of " +
                                ele.qty +
                                "<br />"
                            );
                        })
                        .join("")
                );
            }
        },

        updatepanel: function() {
            state.showstocks();
        },

        pickcraft: function(newcraft) {
            $("#sidepanelchoice" + multireplace(state.targetcraft, " ", "")).css({
                "background-color": "grey"
            });
            state.targetcraft = newcraft;
            $("#sidepanelchoice" + multireplace(state.targetcraft, " ", "")).css({
                "background-color": "green"
            });
        }
    };

    lastblockid++;
    blocklist.push(state);
    mapSquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/flintToolMaker.png" />');
    return Object.assign(state, blockHandlesItems(state));
};
