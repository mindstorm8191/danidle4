const campfire = mapsquare => {
    let state = {
        name: "campfire",
        tile: mapsquare,
        id: lastblockid,
        counter: 0,
        allowOutput: true,
        onhand: [], // This is only for output items
        toBurn: [], // This holds the fuels we need to run the fire
        toCook: [], // This holds any item we plan to cook
        burnTime: 0, // How many ticks remain for the current fuel item to burn. Increases the fire's temperature until this
        // reaches zero
        temp: 0, // Current temperature of the fire

        // itemsConversion handles determinine what items are accepted as input, as well as what it generated by each item
        itemsConversion: [
            {
                name: "Dead Deer",
                craftTime: 40,
                output: [{ name: "Deer Meat", qty: 4 }]
            },
            {
                name: "Dead Wolf",
                craftTime: 20,
                output: [{ name: "Wolf Meat", qty: 2 }]
            },
            {
                name: "Dead Chicken",
                craftTime: 15,
                output: [{ name: "Chicken Meat", qty: 1 }]
            },
            // Once we have the butcher shop set up, we can also handle raw chopped meats
            {
                name: "Raw Deer Meat",
                craftTime: 6,
                output: [{ name: "Deer Meat", qty: 1 }]
            },
            {
                name: "Raw Wolf Meat",
                craftTime: 6,
                output: [{ name: "Wolf Meat", qty: 1 }]
            },
            {
                name: "Raw Chicken Meat",
                craftTime: 6,
                output: [{ name: "Chicken Meat", qty: 1 }]
            }
            // There will also be other non-food things to cook
        ],
        fuelTypes: [
            { name: "Small Firewood", burnTime: 5 },
            { name: "Medium Firewood", burnTime: 10 },
            { name: "Large Firewood", burnTime: 20 }
        ],

        possibleoutputs: function() {
            // we should probably update this to generate output based on the itemsConversion structure instead
            return ["Deer Meat", "Wolf Meat", "Chicken Meat"];
        },

        update: function() {
            // Unlike other block types, we will have to manage the temperature of the fire. Here's the plan:
            // 1) The fire will loose 2 heat every tick, whether there's wood, food or not. Temperature cannot drop below zero
            // 2) Adding wood to the fire will increase heat by 5 every tick.
            // 3) Various wood types will burn for different time spans (sticks will last 10 ticks, logs will last 30)
            // 4) Colonists will continue adding wood to the fire until a target temperature is reached (probably 250)
            // 5) Foods will cook at a regular rate at a temperature of 200. Foods will not cook at all at/below 50. Between
            //    these temperatures, food will cook more slowly, at a ratio rate. So, something like
            //    counter += (temp-50)/150, min=0, max=1

            // Start by updating the fire's temperature
            state.temp = Math.max(0, state.temp - 2);
            if (state.burnTime > 0) {
                state.temp += 5;
                state.burnTime--;
            }

            // Allow anything cooking to make progress
            if (state.toCook.length > 0) {
                const cooking = state.toCook[0];
                // Determine how long this current item will take to cook
                const totalTime = state.itemsConversion.find(function(ele) {
                    return ele.name === cooking.name;
                }).craftTime;

                // Make progress on this item. Note that we don't check if the item has finished yet; that is handled later
                state.counter += Math.min(1, Math.max(0, (state.temp - 50) / 150.0));
                $("#" + state.tile.id + "progress").css({ width: (state.counter / totalTime) * 60 });

                // At this point, we determine if there are work points available to use
                if (workpoints <= 0) return;

                // Next, determine if our current item can be removed from the fire
                if (state.counter >= totalTime) {
                    // The output of this block is determined by the itemsConversion structure.  Start by getting the conversion
                    // information
                    state.counter = 0; // don't forget to reset this!
                    const conversion = state.itemsConversion.find(function(ele) {
                        return ele.name === cooking.name;
                    });
                    conversion.output.forEach(function(ele) {
                        console.log(ele);
                        for (let i = 0; i < ele.qty; i++) {
                            state.onhand.push(food(ele.name, 500, state));
                        }
                    });
                    // Now delete the existing item from our cook array
                    state.toCook.splice(0, 1);
                    $("#" + state.tile.id + "progress").css({ width: 0 });
                    // Since our worker can only do one thing per tick, we cannot do any of the lower tasks. Go ahead and
                    // exit the function now
                    workpoints--;
                    return;
                }
            }
            if (workpoints <= 0) return; // Anything after this point will require work points (aka someone to do work)

            // Next, determine if we need to add any more wood to the fire
            if (state.burnTime <= 0 && state.temp < 250 && state.toBurn.length > 0 && state.toCook.length > 0) {
                const getFuel = state.toBurn.splice(0, 1)[0]; // Pull out the next fuel we will burn in this fire
                state.burnTime += state.fuelTypes.find(function(ele) {
                    return (ele.name = getFuel.name);
                }).burnTime;
                // This gets the burn time based on what type of fuel this is, then apply it to the item
                workpoints--;
                return;
            }

            // Since we don't have to manage the fire, start searching neighbor blocks for items to collect. We can't look for
            // both fuel and food at the same time, so start with the fuels
            if (state.toBurn.length < 15) {
                const burnables = state.fuelTypes.map(function(ele) {
                    return ele.name;
                });
                if (
                    blocklist.neighbors(state.tile).find(function(neighbor) {
                        let pickup = neighbor.getItem(burnables);
                        if (pickup === null) return false;
                        // Since we have access to the item here, go ahead and add it to our storage
                        state.toBurn.push(pickup);
                        return true;
                    })
                ) {
                    workpoints--;
                    return true; // Our search returns true only if it finds an item. At this point, we can exit the function.
                }
            }
            if (state.toCook.length >= 15) return;

            const cookables = state.itemsConversion.map(function(ele) {
                return ele.name;
            });
            if (
                blocklist.neighbors(state.tile).find(function(neighbor) {
                    let pickup = neighbor.getItem(cookables);
                    if (pickup === null) {
                        return false;
                    }
                    state.toCook.push(pickup);
                    return true;
                })
            )
                workpoints--;
        },

        drawpanel: function() {
            // Before starting, determine how much progress to show in the item progress (even if we're working on nothing)
            $("#sidepanel").html(
                "<b>Fire Pit</b><br />" +
                    "<br />" +
                    "Fire is man's ultimate tool, even in primitive times. Not only does it provide warmth, it " +
                    "cooks food, unlocking nutrients that would otherwise be inaccessible to the body. Easy access " +
                    "to nutrients allows humans to do more.<br />" +
                    "<br />" +
                    "Provides a place to cook foods and other things. Requires constant supply of firewood (such as " +
                    "sticks) to maintain heat. Provide raw foods (like meats) to be cooked; butchering is optional " +
                    "but recommended.<br />" +
                    "<br />" +
                    state.showPriority() +
                    'Fire temperature: <span id="sidepaneltemp">' +
                    state.temp +
                    "</span><br />" +
                    'Current item progress: <span id="sidepanelprogress">' +
                    state.getCookProgress() +
                    "</span>%<br />" +
                    'Firewood on hand: <span id="sidepanelfuel">' +
                    state.toBurn.length +
                    "</span><br />" +
                    'Cookable items on hand: <span id="sidepanelcook">' +
                    state.toCook.length +
                    "</span><br />" +
                    'Completed items on hand: <span id="sidepanelonhand">' +
                    state.onhand.length +
                    "</span><br />"
            );
        },

        updatepanel: function() {
            $("#sidepaneltemp").html(state.temp);
            $("#sidepanelprogress").html(state.getCookProgress());
            $("#sidepanelfuel").html(state.toBurn.length);
            $("#sidepanelcook").html(state.toCook.length);
            $("#sidepanelonhand").html(state.onhand.length);
        },

        getCookProgress: function() {
            // Determines what cook time to show in the side panel. This is delegated to a function since we'll need it both in
            // the initial display of the side panel, and again when updating it.
            // Returns the percent value of progress on completing the current cooking process, or "N/A" if there's nothing to cook.

            if (state.toCook.length === 0) return "N/A";
            return Math.floor(
                (state.counter * 100) /
                    state.itemsConversion.find(function(ele) {
                        return ele.name === state.toCook[0].name;
                    }).craftTime
            );
        }
    };

    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/campfire.png" />');
    return Object.assign(state, blockOutputsItems(state), blockHasWorkerPriority(state), blockHandlesFood(state));
};
