// DanIdle Version 4
// This time we want to use more functional programming concepts, and continue to find ways to improve the overall formatting of the code

// Instead of rewriting from the ground up, we have a lot of code that's already working (namely the map system) and we need to reuse
// that (or whatever parts of it we are able to)

// Task List
// 2) Start setting up farming (this will be a major opportunity towards automation in late-game)
// 3) Start working on building the item hauler block. This will be critical for early work, especially with the butcher shop
// 4) Determine why the population isn't growing when using cheats, even with plenty of food on hand
// 5) Update the campfire block to use HasOutputsPerInput. That add-on was built based on the campfire block anyway
// 5) Add a field to all blocks using tools, to determine how much tool endurance to drain per usage
// 6) Add an update function to the RequiresTool add-on, to change the displayed color based on whether tools are available or not.
//    Change its tooltip text at the same time.

// Things to look up:
// ESLint
// ES6 Modules - https://medium.freecodecamp.org/how-to-use-es6-modules-and-why-theyre-important-a9b20b480773
// JSDocs

// Code Fragility: When making a change to one piece of code causes other parts of the code to no longer work

// code size calculation
// index.html                             block_stickmaker.js
//     mapmanager.js                         block_flinttoolmaker.js
//         activeblock.js                        block_huntingpost.js
//             blockAddon_HasRandomizedOutput.js    block_campfire.js
//                blockAddon_HasSelectableCrafting.js   block_firewoodmaker.js
//                    blockAddon_HasOutputsPerInput.js     block_butchershop.js
//                       block_storage.js                      block_autoprovider.js
//                           block_leanto.js
//                              block_foragepost.js
//                                 block_rockknapper.js
//                                     block_twinemaker.js
// 593+259+209+61+236+82+130+88+61+109+67+92+153+68+226+60+110+79 = 2683 lines

import $ from "jquery";
import { maptile, mapchunk } from "./include/mapmanager.js";
import { hauler } from "./include/block_hauler.js";
import { storage } from "./include/block_storage.js";
import { leanto } from "./include/block_leanto.js";
import { foragepost } from "./include/block_foragepost.js";
import { rockknapper } from "./include/block_rockknapper.js";
import { twinemaker } from "./include/block_twinemaker.js";
import { stickmaker } from "./include/block_stickmaker.js";
import { flinttoolmaker } from "./include/block_flinttoolmaker.js";
import { huntingpost } from "./include/block_huntingpost.js";
import { campfire } from "./include/block_campfire.js";
import { firewoodmaker } from "./include/block_firewoodmaker.js";
import { butchershop } from "./include/block_butchershop.js";
import { autoprovider } from "./include/block_autoprovider.js";

/* This is the old includes list
<script src="include/jquery.js" type="text/javascript"></script>
<script src="include/json2.js" type="text/javascript"></script>
<script src="include/tippy.all.min.js" type="text/javascript"></script>
<script src="include/mapmanager.js" type="text/javascript"></script>
<script src="include/activeblock.js" type="text/javascript"></script>
<script src="include/blockAddon_HasRandomizedOutput.js" type="text/javascript"></script>
<script src="include/blockAddon_HasSelectableCrafting.js" type="text/javascript"></script>
<script src="include/blockAddon_HasOutputsPerInput.js" type="text/javascript"></script>
<script src="include/block_hauler.js" type="text/javascript"></script>
<script src="include/block_storage.js" type="text/javascript"></script>
<script src="include/block_leanto.js" type="text/javascript"></script>
<script src="include/block_foragepost.js" type="text/javascript"></script>
<script src="include/block_rockknapper.js" type="text/javascript"></script>
<script src="include/block_twinemaker.js" type="text/javascript"></script>
<script src="include/block_stickmaker.js" type="text/javascript"></script>
<script src="include/block_flinttoolmaker.js" type="text/javascript"></script>
<script src="include/block_huntingpost.js" type="text/javascript"></script>
<script src="include/block_campfire.js" type="text/javascript"></script>
<script src="include/block_firewoodmaker.js" type="text/javascript"></script>
<script src="include/block_butchershop.js" type="text/javascript"></script>
<script src="include/block_autoprovider.js" type="text/javascript"></script>
*/

const cheatenabled = true; // Set this to true to enable the AutoProvider to be displayed.
const mapkinddensity = 10; // Determines how many land types are placed down, when generating maps
const chunksize = 32; // Determines how large each map chunk is, squared
const TILE_GRASS = 1; // land type of grass
const TILE_FOREST = 2; // land type of forest
const TILE_ROCK = 3; // land type of rocks
const TILE_WATER = 4; // land type of water

const blockdemands = [
    {
        name: "selector",
        canBuildOn: [],
        image: "img/cursormove.png",
        state: 0,
        highlight: "Move cursor: Recenter the map to the square clicked",
        prereq: []
    },
    {
        name: "hauler",
        canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
        image: "img/bucketline_right.png",
        state: 0,
        highlight: "Item hauler: Move items between blocks",
        prereq: [],
        generate: hauler
    },
    {
        name: "storage",
        canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
        image: "img/storage.png",
        state: 0,
        highlight: "Storage: Keep items (like tools)",
        prereq: [],
        generate: storage
    }, // Uses blockOutputsItems, blockHasWorkerPriority
    {
        name: "leanto",
        canBuildOn: [TILE_FOREST],
        image: "img/leanto.png",
        state: 0,
        highlight: "Lean-to: Basic shelter of sticks and leaves",
        prereq: [],
        generate: leanto
    }, // Uses blockHasWorkerPriority
    {
        name: "foragepost",
        canBuildOn: [TILE_GRASS],
        image: "img/foragepost.png",
        state: 0,
        highlight: "Forage Post; College food from surrounding lands",
        prereq: [],
        generate: foragepost
    }, // uses blockOutputsItems, blockHasRandomizedOutput, blockHasWorkerPriority, blockShowsOutputItems
    {
        name: "rockknapper",
        canBuildOn: [TILE_ROCK],
        image: "img/rockknapper.png",
        state: 0,
        highlight: "Rock Knapper; Smash rocks into basic tools",
        prereq: [],
        generate: rockknapper
    }, // uses blockOutputsItems, blockHasSelectableCrafting, blockHasWorkerPriority
    {
        name: "firewoodmaker",
        canBuildOn: [TILE_FOREST],
        image: "img/firewoodmaker.png",
        state: 0,
        highlight: "Firewood Collector; collect dead wood for fires",
        prereq: [],
        generate: firewoodmaker
    }, // uses blockOutputsItems, blockHasRandomizedOutput, blockHasWorkerPriority, blockShowsOutputItems
    {
        name: "twinemaker",
        canBuildOn: [TILE_FOREST],
        image: "img/twinemaker.png",
        state: 0,
        highlight: "Twine Maker; cuts bark from trees to make rope",
        prereq: [["Flint Knife"]],
        generate: twinemaker
    }, // uses blockOutputsItems, blockRequiresTools, blockHasWorkerPriority
    {
        name: "stickmaker",
        canBuildOn: [TILE_FOREST],
        image: "img/stickmaker.png",
        state: 0,
        highlight: "Stick Maker; cuts branches from trees for sticks",
        prereq: [["Flint Stabber"]],
        generate: stickmaker
    }, // uses blockOutputsItems, blockRequiresTools, blockHasSelectableCrafting, blockHasWorkerPriority
    {
        name: "flinttoolmaker",
        canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
        image: "img/flinttoolset.png",
        state: 0,
        highlight: "Flint Toolshop; makes larger tools from flint, wood & twine",
        prereq: [["Twine"], ["Short Stick", "Long Stick"]],
        generate: flinttoolmaker
    }, // uses blockOutputsItems, blockHasSelectableCrafting, blockHasWorkerPriority
    {
        name: "huntingpost",
        canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
        image: "img/huntingpost.png",
        state: 0,
        highlight: "Hunting Post; Hunts for animals in local area",
        prereq: [["Flint Spear"]],
        generate: huntingpost
    }, // uses blockOutputsItems, blockRequiresTools, blockHasRandomizedOutput, blockHasWorkerPriority, blockShowsOutputItems
    {
        name: "campfire",
        canBuildOn: [TILE_GRASS, TILE_ROCK], // We don't want to be building fires in forest areas - too dangerous
        image: "img/campfire.png",
        state: 0,
        highlight: "Campfire; build fires to cook foods and keep warm",
        prereq: [["Dead Deer", "Dead Wolf", "Dead Chicken"]],
        generate: campfire
    }, // uses blockOutputsItems, blockHasWorkerPriority. Needs blockHasOutputsPerInput
    {
        name: "butchershop",
        canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
        image: "img/butcher.png",
        state: 0,
        highlight: "Butcher Shop: turn dead animals into meats & byproducts",
        prereq: [["Dead Deer", "Dead Wolf", "Dead Chicken"]],
        generate: butchershop
    } // uses blockOutputsItems, blockHasWorkerPriority, blockHasOutputsPerInput, blockShowsOutputItems
];
if (cheatenabled === true) {
    blockdemands.push({
        name: "autoprovider",
        canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK, TILE_WATER], // We don't really care where this is put
        image: "img/axe_flint.png",
        state: 0,
        highlight: "Auto-Provider, a cheat block. Requires ",
        prereq: [],
        generate: autoprovider
    });
}

blockdemands.unlock = function() {
    // Determines when a new block can be displayed on the left side of the screen.  This depends heavily on the contents of the
    // unlockeditems array
    blockdemands
        .filter(slot => {
            if (slot.state == 1) return false; // This has already been listed

            if (slot.prereq.length == 0) return true; // This has no prereq's; this item should be available at the start of the game
            // Now, work with the prereqs structure that is tied to this element
            return slot.prereq.every(outele => {
                // Determine that all elements in the array passed the test
                return outele.some(inele => {
                    // Determine that at least one hit was found in the array
                    return unlockeditems.includes(inele);
                });
            });
        })
        .map(element => {
            // With the misses filtered out, we now focus on processing the elements, which is adding them to the
            // left side of the screen

            element.state = 1;
            document.getElementById("blockselector").innerHTML +=
                '<div id="cursor' +
                element.name +
                '" ' +
                'class="blockchoice" ' +
                "onclick=\"setcursor('" +
                element.name +
                "')\" " +
                'title="' +
                element.highlight +
                '"> ' +
                '<img src="' +
                element.image +
                '" /> ' +
                "</div>";
        });
};

// This tutorial object is set up to handle what is displayed at the top for the tutorial section, as well as when that section
// moves to the next tutorial task
let tutorial = {
    curlevel: 0,
    choices: [
        {
            level: 0,
            unlock: "cursor=selector",
            show:
                "Welcome! I'll help you get started. Step 1: Select the center-screen tool (with the 4 arrows). Click the map to re-center"
        },
        {
            level: 1,
            unlock: "build=leanto",
            show:
                "Step 2: Shelter. Find a wide area of grass with neighboring trees. Place a lean-to within the trees. You'll need two for " +
                "your 4 current colonists, more as your population grows"
        },
        {
            level: 2,
            unlock: "build=foragepost",
            show: "Step 3: Food. Place a foraging post in a nearby grass area"
        },
        {
            level: 3,
            unlock: "build=rockknapper",
            show:
                "Step 4: Tools. Find a rock area and place a Rock Knapper. Start building Flint Knives and Stabbers (you may want 2 Rock " +
                "Knappers with different outputs)"
        },
        {
            level: 4,
            unlock: "I dont know what to put here yet",
            show:
                "Step 5: Tool Storage. Place a Storage unit beside your Rock Knapper. Set it to receive the tool you are crafting. Only " +
                "when it is in storage can another block use it."
        }
    ],
    checkadvance: function(action) {
        // Handles updating whether the displayed tutorial mode is advanced or not, based on the action recieved
        if (tutorial.choices[tutorial.curlevel].unlock != action) return;

        tutorial.curlevel++;
        $("#tutorialblock").html(tutorial.choices[tutorial.curlevel].show);
    }
};

let unlockeditems = []; // Array of all
let lastblockid = 1; // Last used ID for created activeblocks
let cursorselect = "selector"; // Which item in the selection list (at left) the user currently has selected
let haulerpicktarget = 0; // This is used by the hauler block to allow the user to select a block to deliver items to
let blockselect = null; // Which block is currently being shown on the right side of the screen
let workpoints = 0; // This determines how much work can be done (by workers) each game tick. This is set to the number of workers
// at the start of each tick cycle. The total idle workers is determined by this value after the tick cycle

let foodConsumerTimer = 180; // Determines when additional food should be consumed.
// We will give the users 3 minutes to get food sources working before colonists start needing food
const foodList = []; // Instead of consuming foods based on which block an item is in, we will keep this list as a way
// to locate existing foods in our colony.
let lastFoodID = 0; // Allows individual IDs to be given to edible items
let population = 4; // How many workers we have (aka how many mouths we have to feed)

let chunklist = [];
let maptileid; // Used to allow individual map tiles to have unique ids
let blocklist = []; // This is the list of all blocks actively in play in the game
blocklist.compare = function(a, b) {
    if (a.priority === undefined) {
        if (b.priority === undefined) {
            return 0;
        }
        return 1; // b gets priority, since it has a value
    }
    if (b.priority === undefined) {
        return -1; // a gets priority, since it has a value
    }
    return a.priority - b.priority;
};
blocklist.lastpriority = function() {
    // Not all blocks are guaranteed to have a priority level.  Search through blocks until we find one that will do. I believe
    // all blocks without priority will be sorted to the end... so start there and work backwards. This should only be called
    // when placing new blocks or showing existing ones, so we should be alright on speed
    if (blocklist.length <= 1) return 0; // Either there are no blocks here, or this is the only block in existence
    let slot = blocklist.length - 1;

    while (blocklist[slot].priority === undefined) {
        slot--;
        if (slot == -1) return 0; // Nothing we have has a priority value
    }
    return blocklist[slot].priority;
};
blocklist.findOnGrid = function(xpos, ypos) {
    // Returns an Activeblock based on its coordinates, or undefined if it isn't found
    return blocklist.find(function(ele) {
        // find() returns the first element that the attached function returns true for
        return ele.tile.xpos === xpos && ele.tile.ypos === ypos;
    });
};
blocklist.neighbors = function(mappos) {
    // Returns a list of all blocks that neighbor the provided block
    return [
        blocklist.findOnGrid(mappos.xpos, mappos.ypos - 1),
        blocklist.findOnGrid(mappos.xpos + 1, mappos.ypos),
        blocklist.findOnGrid(mappos.xpos, mappos.ypos + 1),
        blocklist.findOnGrid(mappos.xpos - 1, mappos.ypos)
    ].filter(function(ele) {
        return !(typeof ele === "undefined");
    });
};
blocklist.getById = function(id) {
    return blocklist.find(function(ele) {
        return ele.id === id;
    });
};
blocklist.getInStorage = function(targetitem) {
    let hold = blocklist.find(function(ele) {
        // find will only return elements, but we're not really after that, this time
        if (ele.name === "Storage") return false; // ignore any non-storage blocks
        if (typeof ele.onhand === "undefined") return false; // Not all activeblocks will contain an onhand array (such as housing)
        return ele.onhand.some(function(item) {
            return item.name == targetitem;
        });
    });
    // hold now contains the storage block which has the tool we are after
    if (hold === undefined) return null; // aka the item was not found in any storage unit
    let item = hold.onhand.splice(hold.onhand.findIndex(ele => ele.name === targetitem), 1)[0];
    // Here, we need to add the storage source to the item before returning it
    item.storageSource = hold.id;
    return item;
};
blocklist.isInStorage = function(targetitem) {
    return blocklist.includes(function(ele) {
        // we want to return true if any activeblock satisfies the search function
        if (ele.name == "Storage") return false;
        if (typeof ele.onhand === "undefined") return false;
        return ele.onhand.includes(function(item) {
            // return true if any item matches the search function
            return item.name === targetitem;
        });
    });
};

function getRandomFrom(choicelist) {
    // Selects a random item from a list of choices.
    // choicelist - list of objects to select from
    // Example useage: myfood = randomfrom(['apple', 'mushroom', 'berry', 'treenut']); has 1 in 4 chance to return berry
    return choicelist[Math.floor(Math.random() * choicelist.length)];
}

function multireplace(workstring, target, replacewith) {
    // Works like string.replace(), but replaces all instances, instead of just one.
    // We need this function to turn output options (which is full item names with spaces) into DOM ids (which cannot contain spaces)
    let updated = workstring.replace(target, replacewith);
    while (updated != workstring) {
        workstring = updated;
        updated = workstring.replace(target, replacewith);
    }
    return updated;
}

function flatten(multidimlist) {
    // Flattens a 2D array into a 1D array. Useful when combining multiple lists (in a list) into one.
    return [].concat.apply([], multidimlist);
}

function removeduplicates(list) {
    // Removes duplicate items within an array.
    return [...new Set(list)];
}

function updatemapsize() {
    // A simple function to adjust the height of the drawn map whenever the size of the screen is changed.
    // I found that in other browsers (such as Firefox) the div for the map, using flexboxes, would not expand to fill the screen
    // by using "height:100%;", and instead would assume a size of zero, showing none of the map. Rather than setting the displayed
    // map to a fixed size, this will expand the map to full screen height.
    // This is called whenever the window size changes, and immediately after startup
    $("#centermapbox").css("height", $(window).height());
}

function setcursor(newvalue) {
    // Changes the value of cursorselect, based on which square (on the left) the user clicks on
    $("#cursor" + cursorselect).css("background-color", "white");
    cursorselect = newvalue;
    $("#cursor" + cursorselect).css("background-color", "red");
    tutorial.checkadvance("cursor=" + newvalue);
    // To ensure no confusion, go ahead and clear this setting if it is set
    haulerpicktarget = 0;
}

function start() {
    // Called when the window finishes loading

    $("#game").html(""); // Clear the game section, and display a new map chunk
    new mapchunk(0, 0);
    updatemapsize();
    document.getElementById("blockselector").innerHTML = "";
    blockdemands.unlock();
    cursorselect = "selector";
    //let maker = leanto(2, 5);
    //maker.update(4);
    setInterval(updateblocks, 1000);
}

function updateblocks() {
    // Handles updating all blocks each second (or game tick).

    // Start by managing food consumption
    foodConsumerTimer--;
    while (foodConsumerTimer <= 0) {
        // The while loop is for when population is above 120
        // Pick one of our food items at random
        if (foodList.length === 0) {
            // Reduce the total population, to allow others to have a chance to eat. Basically, if your workers don't
            // get fed, they quit
            population--;
            if (population <= 0) {
                foodConsumerTimer = 120;
            } else {
                foodConsumerTimer = 120 / population;
            }
        } else {
            let foodSlot = Math.floor(Math.random() * foodList.length);
            let foodItem = foodList[foodSlot];

            // Now, we need to find the same item in the associated block. We will keep an ID on this food item, and
            // in the array, keep the ID of the block we need to find it in
            let holder = blocklist.getById(foodItem.location);
            if (holder === null) {
                console.log("Error in food consumption: did not find block with ID=" + foodItem.location);
                // Note that this means we need to remove any food entries when deleting a block... we haven't added controls
                // to remove blocks yet, though
            } else {
                if (holder.consumeFood(foodItem.id) === false) {
                    console.log("Error in food consumption: block.consumeFood returned fail state");
                } else {
                    // Now, remove the item from the foodList array as well.
                    foodList.splice(foodSlot, 1);
                }
            }
            if (population <= 0) {
                foodConsumerTimer = 120;
            } else {
                foodConsumerTimer += 120 / population;
            }
            if (foodList.length > population * 2) population++;
        }
    }

    // Next, run through all blocks and update them. Note that not all blocks will need a worker to be updated
    workpoints = population;
    blocklist.forEach(ele => {
        ele.update();
    });

    // While we're here, let's update the currently selected block's side panel
    if (blockselect != null) blockselect.updatepanel();

    // Also, update the stats shown on the top left of the screen
    $("#showpopulation").html(workpoints + " / " + population);
    $("#showfood").html(foodList.length);
}

function handlegameboxclick(xpos, ypos) {
    // Handles all clicks on the game map

    let mappos = chunklist[0][0].map[ypos][xpos];
    if (haulerpicktarget === 1) {
        // By this definition (being the first thing to check), there's no way anything else can happen until
        // they have attempted to pick a target
        haulerpicktarget = 0;
        return blockselect.accepttarget(mappos);
    }

    if (cursorselect === "selector") {
        // Use the cursor to decide where to center the screen at
        // This is probably not the most ideal setup, but will do for now
        $("#game").css("top", 330 - ypos * 66 + "px");
        $("#game").css("left", 330 - xpos * 66 + "px");
        if (mappos.structure != null) {
            blockselect = mappos.structure;
            blockselect.drawpanel();
        }
        return;
    }

    if (mappos.structure === null) {
        // Nothing is here yet. Add the selected building type (if possible)

        let toBuild = blockdemands.find(ele => {
            return ele.name === cursorselect;
        });
        if (!toBuild.canBuildOn.includes(mappos.tile)) {
            console.log("Alert! Wrong land type. Try somewhere else");
            return;
        }
        blockselect = toBuild.generate(mappos);

        // Now that this has been constructed, let's show this on the right panel
        blockselect.drawpanel();
        tutorial.checkadvance("build=" + cursorselect);
    }
}

// Manages each item in the game
let item = itemname => {
    let state = {
        name: itemname,
        kind: "item" // this is a classification (but 'class' is a keyword)
    };
    // Now, add this to the list of unlocked items, if not already in it
    if (
        !unlockeditems.some(function(ele) {
            return ele === itemname;
        })
    ) {
        unlockeditems.push(itemname);
        // Now, run the unlock function of the blockdemands structure. This will enable new blocks whenever available
        blockdemands.unlock();
    }
    return Object.assign(state);
};

// Tools are very much like items, but have additional properties
let tool = (toolname, efficiency, endurance) => {
    let state = {
        name: toolname,
        efficiency,
        endurance,
        kind: "tool" // item classification
    };
    if (
        !unlockeditems.some(function(ele) {
            return ele === toolname;
        })
    ) {
        unlockeditems.push(toolname);
        // Also, run the unlock function of the blockdemands structure. This will enable new blocks whenever available
        blockdemands.unlock();
    }
    return Object.assign(state);
};

let food = (foodname, lifespan, inBlock) => {
    // Like an item, but somebody's gonna eat it! Also has a shelflife... we haven't fully coded that in yet, though
    let state = {
        name: foodname,
        life: lifespan,
        id: lastFoodID,
        location: inBlock.id,
        kind: "food" // item classification
    };
    lastFoodID++;
    foodList.push(state);
    // This is a global list, holding all the food items we have. Foods are selected at random for consumption. This list
    // allows us to select any of the food items to eat.
    if (
        !unlockeditems.some(ele => {
            return ele === foodname;
        })
    ) {
        unlockeditems.push(foodname);
    }
    return Object.assign(state);
};