// DanIdle Version 4
// This time we want to use more functional programming concepts, and continue to find ways to improve the overall formatting of the code

// Instead of rewriting from the ground up, we have a lot of code that's already working (namely the map system) and we need to reuse
// that (or whatever parts of it we are able to)

// Task List
// 1) Set up the game to where, instead of searching for food items to apply decay to, find all items that have a lifetime attribute and
//    reduce that. Have some set behavior when the item's lifetime hits zero.
// 1) General: Update ALL blocks to have a status field. Use this to show the status of the block, most notably why the block is not progressing
//    with its work. Examples include 'need workers', 'need tools', 'need parts', and of course 'working'. These will usually be set during
//    an exit state within update(), and read during display.
// 2) General: When selecting a target with the item hauler block, keep the interface from jumping to the new target. It should be a simple
//    mode check.
// 3) Fire Miner: Add a delete-block button. We will have to wait for the fire to cool off before removing it (or, if there's sufficient water
//    on hand, we can skip that step)
// 4) Mobile users: Find a reliable way to detect when a user is using a cellphone, instead of a desktop
// 5) Mobile users: Add buttons on the sides of the map to allow users to scroll around the screen manually by clicking them
// 5) Mobile users: Figure out how we can organize the page properly for cellphones. We plan to have all the block types in a popup menu, and right
//    side bar content will be displayed as a popup that can be closed. I think we can show the general stats (and load & save) as a block
//    directly above the map, with the tutorial instructions (make this one hideable)
// 6) Deeper Tech: Before we can build a dryer structure, we need players to be able to produce & harvest straw
// 7) Environment: Set up code to update all of the blocks in a given chunk. Our plans were to update forage rates every second
// 8) UX: Get the housing and food counts (or both) to turn red whenever they are the limitations on increasing population
// 9) Environment: Add a base land type to map tiles. Use this to determine what will develop there whenever it is left abandoned. Use the
//    main land type to describe more than just the 4 types. We can then include farm-dirt, gravel, stone, wall, wooden, carpeted, laminate,
//    marble, etc
// 10) General: For tools, create a function to return any tools that are listed as not in use
// 11) General: Add a worker effectiveness variable, which will affect how much work a worker can do for one block (maybe we can use partial
//    workpoints if work amount is fixed?). Use this to add additional colonist happiness variables to the game.
// 12) Set up a way for block haulers to use certain tools. Require them to use twine sleds for moving large objects (like logs or boulders)
// 13) Determine a way to allow tool slots to be flagged for returning to the source storage block, when they are not in use
// 14) Figure out how to display icons on the blocks to help determine what they are waiting on before processing.
// 15) Search for places where array.some() would work better than array.find()
// 16) Update the receiveItem function of blockHasOutputsPerInput to check that the received item is allowed in the block or not
// 17) In the blockCooksItems addon, modify the progress bar to show a different effect whenever a food starts to cook for too long
// 18) Update the hauler block to accept input items for specific things they are searching for
// 19) Create an add-on block for all blocks that have no inputs (blockHasNoInput)
// 20) Start setting up farming (this will be a major opportunity towards automation in late-game)
// 21) Add a field to all blocks using tools, to determine how much tool endurance to drain per usage

// Things to look up:
// JSDocs

// Code Fragility: When making a change to one piece of code causes other parts of the code to no longer work

// code size calculation
// index.html                block_leanto.js             block_campfire.js         block_gravelroad.js     blockAddon_CooksItems.js
//    index.js                   block_foragepost.js         block_firewoodmaker.js   block_boulderwall.js     blockAddon_HasOutputsPerInput.js
//        dancommon.js               block_rockknapper.js       block_butchershop.js     block_dirtmaker.js        blockAddon_HasRandomizedOutput.js
//           game.js                     block_twinemaker.js        block_farm.js            block_claymaker.js       blockAddon_HasSelectableCrafting.js
//               mapmanager.js               block_stickmaker.js        block_woodcrafter.js    block_clayformer.js       blockAddon_IsStructure.js
//                   block_hauler.js             block_flinttoolmaker.js    block_waterfiller.js   block_autoprovider.js      blockAddon_RequiresTool.js
//                       block_storage.js            block_huntingpost.js      block_fireminer.js      activeblock.js
// 41+407+49+466+359+402+193+100+172+141+112+107+175+105+190+92+129+290+158+84+221+76+71+111+98+94+134+200+220+121+68+383+162+271
// 3/14/19 - 2683 lines
// 3/17/19 - 3342 lines
// 3/21/19 - 3768 lines
// 3/24/19 - 4050 lines
// 3/29/19 - 4544 lines
// 4/01/19 - 4616 lines
// 4/08/19 - 4964 lines
// 4/28/19 - 5814 lines
// 7/04/19 - 5582 lines
// 7/22/19 - 6002 lines

// Tech directions to go that are left open:
// -----------------------------------------
// Rafts and sleds - enable haulers to haul larger objects
// Tables - increase output speed of crafting blocks (such as flint tool-maker)
// Bone and skin materials - produce needles from bones, then clothing from animal hides
// Feathers - produce bow and arrows, to get better results from hunting
// Wet Firewood - Use Woodcrafter to build a wood shelter to dry out chopped logs
// Clay mixing - Using clay to produce various shapes for other tasks

// Future ideas
// Manual rock drill: A worker turns a wheel, and a set of hammers on the wheel pound the back of a drill. The wheel turns the drill
//      at the same time. Needs lots of metal, though
// Windmills: This will first require fabric of some kind.  The easiest to acquire is wool.  Sheep can be domesticated, and if fed, can
//      provide sufficient quantities of wool.  Note, however, that wild sheep did not shed their wool naturally; it grew to a stable point
//      (like a bear's fur) and stopped. Heavy wool production has been bread into sheep over thousands of years. For this game, that means
//      players will need shears before being able to work with wool.  Shears will require metal.

//-------------------------------
//----- How to start server -----
// from command prompt run: parcel index.html (NOT index.js)

//import $ from "jquery";
import $ from "./include/jquery-3.4.1.min.js";
import { game } from "./include/game.js";
import { mapchunk } from "./include/mapmanager.js";
import { autoprovider } from "./include/block_autoprovider.js";
import { danCommon } from "./include/dancommon.js";
//import {} from "./img/*";

const cheatenabled = true; // Set this to true to allow the AutoProvider to be displayed.
const TILE_GRASS = 1; // land type of grass
const TILE_FOREST = 2; // land type of forest
const TILE_ROCK = 3; // land type of rocks
const TILE_WATER = 4; // land type of water
let mouseState = 0; // This is set to 1 if the user clicks on something, then to 2 if the user has moved the mouse more than 20 pixels away
let selectedX = 0; // which block in the map that was selected
let selectedY = 0; // which block in the map that was selected
let mouseStartX = 0; // X position where mousedown was triggered
let mouseStartY = 0; // Y position where mousedown was triggered

if (cheatenabled === true) {
    // This is only added on if cheats have been enabled
    game.blockDemands.push({
        name: "autoprovider",
        canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK, TILE_WATER], // We don't really care where this is put
        image: "img/axe_flint.png",
        state: 0,
        highlight:
            "Auto-Provider, a cheat block. Its game effects are decided by code ",
        prereq: [],
        sourcePath: "./block_autoprovider.js",
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
    game.blockDemands.unlock(); // Unlock all the basic items, which have no requirements
    game.cursorSelect = "selector";
    setInterval(updateblocks, 1000);

    document.addEventListener("mousemove", handlegameboxmove);
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
                console.log(
                    "Error in food consumption: did not find block with ID=" +
                        foodItem.location
                );
                // Note that this means we need to remove any food entries when deleting a block... we haven't added controls
                // to remove blocks yet, though
            } else {
                if (holder.consumeFood(foodItem.id) === false) {
                    console.log(
                        "Error in food consumption: block.consumeFood returned fail state"
                    );
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

    // Next, run through all the blocks to determine how much housing space we have available
    game.housingSpace = game.blockList
        .filter(block => block.housingSpace != undefined)
        .map(block => block.housingSpace)
        .reduce((sum, val) => sum + val, 0);
    if (game.housingSpace < 4) game.housingSpace = 4;
    if (game.population > game.housingSpace)
        game.population = game.housingSpace;
    //game.population = Math.min(game.population, Math.max(game.housingSpace, 4)); // Sets max population based on housing space, but ignores
    // housing if it's under 4

    // Go through all blocks in every chunk and update the maptile instance. This will be a lot of blocks, but the code involved isn't very much

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
    $("#showhousingspace").html(game.housingSpace);
    // There are other variables to consider here, but we don't yet have data to fill them out with.
}

export function handlegameboxdown(event, gridx, gridy) {
    mouseState = 1;

    selectedX = gridx + 3;
    selectedY = gridy;
    mouseStartX = event.clientX - parseInt($("#centermapbox").css("left")); // These need to be relative to the game div
    mouseStartY = event.clientY; // - parseInt($("#centermapbox").css("top"));
    //console.log(`Compare [${event.clientX},${event.clientY}] vs [${selectedX * 66},${selectedY * 66}]`);
    event.preventDefault();
}

export function handlegameboxmove(event) {
    if (mouseState === 0) return;

    // Here, we want to use mouseState to also determine if the user has gone beyond the 10-pixel range threshhold
    if (mouseState === 1) {
        //console.log(`Event: [${event.clientX},${event.clientY}], start: [${mouseStartX},${mouseStartY}]`);
        if (
            !(
                danCommon.within(event.clientX, mouseStartX, 10) &&
                danCommon.within(event.clientY, mouseStartY, 10)
            )
        ) {
            //console.log("Time to handle moving!");
            mouseState = 2; // With this value we may fall-through to the next section
            game.tutorial.checkAdvance("movemap");
        }
    }

    if (mouseState === 2) {
        // Here, we need to use the difference between event.offsetX and mouseX to determine how far to move the game's map. We also need
        // to get the current game div's offset, so we can provide a proper adjustment amount
        //console.log("X position currently at " + $("#game").css("top"));
        //console.log(`Coords are [${myNewX},${myNewY}] vs [${$("#game").css("left")},${$("#game").css("top")}]`);
        //console.log(`Event: [${event.offsetX},${event.offsetY}], prev location: [${mouseX},${mouseY}]`);

        // Instead of calculating how far to move the mouse, based on offset difference, we want to place the game's coordinates
        // relative to the mouse's current position. The offset will be based on the square of the map selected

        // With selectedX and selectedY, we need to determine the X and Y coordinate of that block, and then translate further to get to the
        // center of that block

        $("#game").css("left", event.clientX - selectedX * 66 - 33 + "px");
        $("#game").css("top", event.clientY - selectedY * 66 - 33 + "px");
    }
    event.preventDefault();
}

export function handlegameboxup(event, mapx, mapy) {
    mouseState = 0;
    //console.log(`mouse up: [${event.clientX},${event.clientY}] (previously at [${mouseStartX},${mouseStartY}]`);
    if (
        danCommon.within(event.clientX, mouseStartX, 10) &&
        danCommon.within(event.clientY, mouseStartY, 10)
    ) {
        handlegameboxclick(mapx, mapy);
    }
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

    if (mappos.structure != null) {
        game.blockSelect = mappos.structure;
        game.blockSelect.drawpanel();
    }
    /*
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
    */

    if (mappos.structure === null) {
        // Nothing is here yet. Add the selected building type (if possible)

        let toBuild = game.blockDemands.find(ele => {
            return ele.name === game.cursorSelect;
        });
        if (!toBuild.canBuildOn.includes(mappos.tile)) {
            console.log("Alert! Wrong land type. Try somewhere else");
            return;
        }

        /*
        We are trying to get this code to work, which is known as lazy loading, or code splitting, which Parcel supports. It allows us to load our
        block code on an as-needed basis.  As the code base continues to grow, and we accumulate more block types, it will take additional time for
        the game to complete its initial loading. This would correct that.

        However, I continue to get errors related to this. When running locally, I get:
        Failed to load module script: The server responded with a non-JavaScript MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.
        Uncaught (in promise) TypeError: Failed to fetch dynamically imported module: http://localhost:1234/include/block_leanto.js
        Uncaught (in promise) TypeError: Failed to fetch dynamically imported module: http://localhost:1234/include/block_leanto.js

        Remotely, I get a similar error:
        GET https://danidle.netlify.com/include/block_leanto.js net::ERR_ABORTED 404
        Uncaught (in promise) TypeError: Failed to fetch dynamically imported module: https://danidle.netlify.com/include/block_leanto.js
        Uncaught (in promise) TypeError: Failed to fetch dynamically imported module: https://danidle.netlify.com/include/block_leanto.js

        It appears that the browser is unable to find the target file, despite the path being correct. A friend on Discord's TheProgrammerHangout
        (credit to Kanosaki) thought it was a 404 error, but both of us were unable to fix the issue. I have decided to revert back to the old
        code style (for now).

        import(toBuild.sourcePath).then(() => {
            game.blockSelect = toBuild.generate(mappos);
            // Now that this has been constructed, show this on the right panel
            game.blockSelect.drawpanel();
            game.tutorial.checkAdvance("build=" + game.cursorSelect);
        });
        */

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
    if (!game.unlockedItems.includes(itemname)) {
        game.unlockedItems.push(itemname);
        // Now, run the unlock function of the blockdemands structure. This will enable new blocks whenever available
        game.blockDemands.unlock(itemname);
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
    if (!game.unlockedItems.includes(toolname)) {
        game.unlockedItems.push(toolname);
        // Also, run the unlock function of the blockdemands structure. This will enable new blocks whenever available
        game.blockDemands.unlock(toolname);
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
    if (!game.unlockedItems.includes(foodname)) {
        game.unlockedItems.push(foodname);
        game.blockDemands.unlock(foodname);
    }
    return Object.assign(state);
};

document.body.onload = start;
document.body.onresize = updatemapsize;
