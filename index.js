// DanIdle Version 4
// This time we want to use more functional programming concepts, and continue to find ways to improve the overall formatting of the code

// Instead of rewriting from the ground up, we have a lot of code that's already working (namely the map system) and we need to reuse
// that (or whatever parts of it we are able to)

// Task List
// 1) Search for places where array.some() would work better than array.find()
// 1) Update the receiveItem function of blockHasOutputsPerInput to check that the received item is allowed in the block or not
// 2) In the blockCooksItems addon, modify the progress bar to show a different effect whenever a food starts to cook for too long
// 2) Build some kind of test to determine when a new block output becomes available from an existing block. Use that to show when logs are
//    craftable in the stickmaker.
// 3) Have the HasSelectableCrafting module account for tools required for a job. Make this optional
// 1) Push forward in building new blocks, so we can start processing metals. Next step is to build the fire mining post
// 2) Update the hauler block to accept input items for specific things they are searching for
// 2) Create an add-on block for all blocks that have no inputs (blockHasNoInput)
// 6) Modify the block constructors to pass in a pre-set ID value. This will free some amount of dependencies on requiring 'game' for all blocks
// 2) Start setting up farming (this will be a major opportunity towards automation in late-game)
// 3) Start working on building the item hauler block. This will be critical for early work, especially with the butcher shop
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
// index.html                block_leanto.js             block_campfire.js        activeblock.js
//    index.js                   block_foragepost.js         block_firewoodmaker.js   blockAddon_CooksItems.js
//        dancommon.js               block_rockknapper.js       block_butchershop.js      blockAddon_HasOutputsPerInput.js
//           game.js                     block_twinemaker.js        block_woodcrafter.js      blockAddon_HasRandomizedOutput.js
//               mapmanager.js               block_stickmaker.js        block_waterfiller.js     blockAddon_HasSelectableCrafting.js
//                   block_hauler.js             block_flinttoolmaker.js   block_fireminer.js        blockAddon_RequiresTool.js
//                       block_storage.js            block_huntingpost.js     block_autoprovider.js
// 41+271+38+338+321+395+177+129+111+133+113+106+175+105+201+94+137+125+87+48+106+202+212+117+70+320+156
// 3/14/19 - 2683 lines
// 3/17/19 - 3342 lines
// 3/21/19 - 3768 lines
// 3/24/19 - 4050 lines

// Tech directions to go that are left open:
// -----------------------------------------
// Rafts and sleds - enable haulers to haul larger objects
// Tables - increase output speed of crafting blocks (such as flint tool-maker)
// Flint hatchets - Increase endurance value of lean-to's so they stay standing longer
// Bone and skin materials - produce needles from bones, then clothing from animal hides
// Feathers - produce bow and arrows, to get better results from hunting
// Flint Hoe - Start farming to produce more food sources
// Wet Firewood - Use Woodcrafter to build a wood shelter to dry out chopped logs
// Clay mixing - Use water & dirt to produce clay, then dry it in various shapes for other tasks
// Wood bowls - Collect water to dowse fires on rocks, to start mining - This is our fastest direction toward automation

import $ from "jquery";
import { game } from "./include/game.js";
import { mapchunk } from "./include/mapmanager.js";
import { autoprovider } from "./include/block_autoprovider.js";

const cheatenabled = true; // Set this to true to allow the AutoProvider to be displayed.
const TILE_GRASS = 1; // land type of grass
const TILE_FOREST = 2; // land type of forest
const TILE_ROCK = 3; // land type of rocks
const TILE_WATER = 4; // land type of water

if (cheatenabled === true) {
    // This is only added on if cheats have been enabled
    game.blockDemands.push({
        name: "autoprovider",
        canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK, TILE_WATER], // We don't really care where this is put
        image: "img/axe_flint.png",
        state: 0,
        highlight: "Auto-Provider, a cheat block. Its game effects are decided by code ",
        prereq: [],
        generate: autoprovider
    });
}

function updatemapsize() {
    // A simple function to adjust the height of the drawn map whenever the size of the screen is changed.
    // I found that in other browsers (such as Firefox) the div for the map, using flexboxes, would not expand to fill the screen
    // by using "height:100%;", and instead would assume a size of zero, showing none of the map. Rather than setting the displayed
    // map to a fixed size, this will expand the map to full screen height.
    // This is called whenever the window size changes, and immediately after startup
    $("#centermapbox").css("height", $(window).height());
}

export function setcursor(newvalue) {
    // Changes the value of cursorselect, based on which square (on the left) the user clicks on
    //console.log("Change cursor to " + newvalue);
    $("#cursor" + game.cursorSelect).css("background-color", "white");
    game.cursorSelect = newvalue;
    $("#cursor" + game.cursorSelect).css("background-color", "red");
    game.tutorial.checkAdvance("cursor=" + newvalue);
    // To ensure no confusion, go ahead and clear this setting if it is set
    game.haulerPickTarget = 0;
}

function start() {
    // Called when the window finishes loading

    $("#game").html(""); // Clear the game section, and display a new map chunk
    new mapchunk(0, 0);
    updatemapsize();
    document.getElementById("blockselector").innerHTML = "";
    game.blockDemands.unlock();
    game.cursorSelect = "selector";
    setInterval(updateblocks, 1000);
}

function updateblocks() {
    // Handles updating all blocks each second (or game tick).

    // Start by managing food consumption
    game.foodConsumerTimer--;
    while (game.foodConsumerTimer <= 0) {
        // The while loop is for when population is above 120
        // Pick one of our food items at random
        if (game.foodList.length === 0) {
            // Reduce the total population, to allow others to have a chance to eat. Basically, if your workers don't
            // get fed, they quit
            game.population--;
            if (game.population <= 0) {
                game.foodConsumerTimer = 120;
                game.population = 1;
            } else {
                game.foodConsumerTimer = 120 / game.population;
            }
        } else {
            let foodSlot = Math.floor(Math.random() * game.foodList.length);
            let foodItem = game.foodList[foodSlot];

            // Now, we need to find the same item in the associated block. We will keep an ID on this food item, and
            // in the array, keep the ID of the block we need to find it in
            let holder = game.blockList.getById(foodItem.location);
            if (holder === null) {
                console.log("Error in food consumption: did not find block with ID=" + foodItem.location);
                // Note that this means we need to remove any food entries when deleting a block... we haven't added controls
                // to remove blocks yet, though
            } else {
                if (holder.consumeFood(foodItem.id) === false) {
                    console.log("Error in food consumption: block.consumeFood returned fail state");
                } else {
                    // Now, remove the item from the foodList array as well.
                    game.foodList.splice(foodSlot, 1);
                }
            }
            if (game.population <= 0) {
                game.foodConsumerTimer = 120;
            } else {
                game.foodConsumerTimer += 120 / game.population;
            }
            if (game.foodList.length > game.population * 2) game.population++;
        }
    }

    // Next, run through all blocks and update them. Note that not all blocks will need a worker to be updated
    game.workPoints = game.population;
    game.blockList.forEach(block => {
        block.update();
    });

    // While we're here, let's update the currently selected block's side panel
    if (game.blockSelect != null) game.blockSelect.updatepanel();

    // Also, update the stats shown on the top left of the screen
    $("#showpopulation").html(game.workPoints + " / " + game.population);
    $("#showfood").html(game.foodList.length);
    // There are other variables to consider here, but we don't yet have data to fill them out with.
}

export function handlegameboxclick(xpos, ypos) {
    // Handles all clicks on the game map

    let mappos = game.chunkList[0][0].map[ypos][xpos];
    if (game.haulerPickTarget === 1) {
        // By this definition (being the first thing to check), there's no way anything else can happen until
        // they have attempted to pick a target
        //console.log("Picked a target...");
        game.haulerPickTarget = 0;
        return game.blockSelect.accepttarget(mappos);
    }

    if (game.cursorSelect === "selector") {
        // Use the cursor to decide where to center the screen at
        // This is probably not the most ideal setup, but will do for now
        $("#game").css("top", 330 - ypos * 66 + "px");
        $("#game").css("left", 330 - xpos * 66 + "px");
        if (mappos.structure != null) {
            game.blockSelect = mappos.structure;
            game.blockSelect.drawpanel();
        }
        return;
    }

    if (mappos.structure === null) {
        // Nothing is here yet. Add the selected building type (if possible)

        let toBuild = game.blockDemands.find(ele => {
            return ele.name === game.cursorSelect;
        });
        if (!toBuild.canBuildOn.includes(mappos.tile)) {
            console.log("Alert! Wrong land type. Try somewhere else");
            return;
        }
        //blockselect = leanto(mappos);
        //blockselect = item("fun");
        game.blockSelect = toBuild.generate(mappos);

        // Now that this has been constructed, let's show this on the right panel
        game.blockSelect.drawpanel();
        game.tutorial.checkAdvance("build=" + game.cursorSelect);
    }
}

// Manages each item in the game
export const item = itemname => {
    let state = {
        name: itemname,
        kind: "item" // this is a classification (but 'class' is a keyword)
    };
    // Now, add this to the list of unlocked items, if not already in it
    if (!game.unlockedItems.some(ele => ele === itemname)) {
        game.unlockedItems.push(itemname);
        // Now, run the unlock function of the blockdemands structure. This will enable new blocks whenever available
        game.blockDemands.unlock();
    }
    return Object.assign(state);
};

// Tools are very much like items, but have additional properties
export const tool = (toolname, efficiency, endurance) => {
    let state = {
        name: toolname,
        efficiency,
        endurance,
        kind: "tool" // item classification
    };
    if (!game.unlockedItems.some(ele => ele === toolname)) {
        game.unlockedItems.push(toolname);
        // Also, run the unlock function of the blockdemands structure. This will enable new blocks whenever available
        game.blockDemands.unlock();
    }
    return Object.assign(state);
};

export const food = (foodname, lifespan, inBlock) => {
    // Like an item, but somebody's gonna eat it! Also has a shelflife... we haven't fully coded that in yet, though
    let state = {
        name: foodname,
        life: lifespan,
        id: game.lastFoodID,
        location: inBlock.id,
        kind: "food" // item classification
    };
    game.lastFoodID++;
    game.foodList.push(state);
    // This is a global list, holding all the food items we have. Foods are selected at random for consumption. This list
    // allows us to select any of the food items to eat.
    if (!game.unlockedItems.some(ele => ele === foodname)) {
        game.unlockedItems.push(foodname);
        game.blockDemands.unlock();
    }
    return Object.assign(state);
};

document.body.onload = start;
document.body.onresize = updatemapsize;
