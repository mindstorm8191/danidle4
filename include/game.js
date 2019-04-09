// Game.js
// for DanIdle version 4
// Contains all the management code that is shared with all the other blocks

import $ from "jquery";
import { setcursor } from "../index.js";
import { hauler } from "./block_hauler.js";
import { storage } from "./block_storage.js";
import { leanto } from "./block_leanto.js";
import { foragepost } from "./block_foragepost.js";
import { rockknapper } from "./block_rockknapper.js";
import { twinemaker } from "./block_twinemaker.js";
import { stickmaker } from "./block_stickmaker.js";
import { flinttoolmaker } from "./block_flinttoolmaker.js";
import { huntingpost } from "./block_huntingpost.js";
import { campfire } from "./block_campfire.js";
import { firewoodmaker } from "./block_firewoodmaker.js";
import { butchershop } from "./block_butchershop.js";
import { woodcrafter } from "./block_woodcrafter.js";
import { waterfiller } from "./block_waterfiller.js";
import { fireminer } from "./block_fireminer.js";
import { gravelroad } from "./block_gravelroad.js";

const TILE_GRASS = 1; // land type of grass
const TILE_FOREST = 2; // land type of forest
const TILE_ROCK = 3; // land type of rocks
const TILE_WATER = 4; // land type of water

export const game = {
    chunkList: [],
    mapKindDensity: 10,
    chunkSize: 32, // how large each game-chunk is
    blockList: [], // List of all blocks placed in the game
    unlockedItems: [], // Array of names of all items the player has produced thus far.
    lastBlockId: 1, // Last ID used for a new block. Used to provide unique block IDs for each block
    haulerPickTarget: 0, // This is used exclusively by the Item Hauler block, to trigger a different response when clicking a
    cursorSelect: "none", // Which block on the left side of the screen is selected
    blockSelect: null, // What block is selected by the user. Its contents will be shown on the right side of the screen.

    workPoints: 0, // This determines how much work can be done (by workers) each game tick. This is set to the number of workers
    // at the start of each tick cycle. The total idle workers is determined by this value after the tick cycle

    foodConsumerTimer: 180, // Determines when additional food should be consumed.
    // We will give the users 3 minutes to get food sources working before colonists start needing food
    foodList: [], // Instead of consuming foods based on which block an item is in, we will keep this list as a way
    // to locate existing foods in our colony.  Foods consumed will be selected at random
    lastFoodID: 0, // Allows individual IDs to be given to edible items
    population: 4, // How many workers we have (aka how many mouths we have to feed)
    housingSpace: 0, // How much space the player has available for housing workers. Housing will be required to gain more than 4 workers.

    // blockDemands provides us with an easy way to determine when new blocks are displayed on the left side.  We can also create the
    // respective block type by the generate field.
    // Note that this structure is modified by some block types, which adds a hasNewOptions function. This function will return true
    // whenever that block type has newly available functionality (whenever new item types become available). This is called within
    // blockDemands.unlock(), and will then set that block's border green (on the left side panel)
    blockDemands: [
        {
            name: "selector",
            canBuildOn: [],
            image: "img/cursormove.png",
            state: 0,
            highlight: "Move cursor: Recenter the map to the square clicked",
            prereq: [],
            generate: () => {
                console.log(
                    "Error: attempted to use game.blockDemands[...].generate for the selector block - this shouldn't have one!"
                );
            }
        },
        {
            name: "hauler",
            canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
            image: "img/bucketline_right.png",
            state: 0,
            highlight: "Item hauler: Move items between blocks",
            prereq: [],
            generate: hauler
        }, // uses blockDeletes clean, and... that's about it
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
        }, // uses blockOutputsItems, blockHasWorkerPriority, blockHasOutputsPerInput, blockShowsOutputItems, blockRequiresTool
        {
            name: "woodcrafter",
            canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
            image: "img/woodcrafter.png",
            state: 0,
            highlight: "Woodcrafter: craft stuff out of wood",
            prereq: [["Log"]],
            generate: woodcrafter
        }, // uses blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockDeletesClean, blockHasSelectableCrafting, blockRequiresTool
        {
            name: "waterfiller",
            canBuildOn: [TILE_WATER],
            image: "img/watercup.png",
            state: 0,
            highlight: "Water Filler: fills liquid-holding items with water. Place in water",
            prereq: [["Wooden Bowl"]],
            generate: waterfiller
        }, // users blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockDeletesClean, blockHasOutputsPerInput
        {
            name: "fireminer",
            canBuildOn: [TILE_ROCK],
            image: "img/minerspost.png",
            state: 0,
            highlight: "Fire Miner: Use fire & water to cut through rocks",
            prereq: [["Wooden Bowl"]],
            generate: fireminer
        },
        {
            name: "gravelroad",
            canBuildOn: [TILE_ROCK, TILE_GRASS],
            image: "img/gravelroad.png",
            state: 0,
            highlight: "Gravel road, to make travel easier",
            prereq: [["Gravel"]],
            generate: gravelroad
        }
    ],

    // This tutorial object is set up to handle what is displayed at the top for the tutorial section, as well as when that section
    // moves to the next tutorial task
    tutorial: {
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
                    "Step 4: Tools. Find a rock area and place a Rock Knapper. Set them to build Flint Knives and Stabbers (you may want 2 Rock " +
                    "Knappers with different outputs)"
            },
            {
                level: 4,
                unlock: "I dont know what to put here yet",
                show:
                    "Step 5: Tool Storage. Tools travel differently than items. Place a Storage unit beside your Rock Knapper, and set it to " +
                    "receive the tool you are crafting. Only when it is in storage can another block use it."
            }
        ]
    }
};

game.blockList.compare = function(a, b) {
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

game.blockList.lastPriority = function() {
    // Not all blocks are guaranteed to have a priority level.  Search through blocks until we find one that will do. I believe
    // all blocks without priority will be sorted to the end... so start there and work backwards. This should only be called
    // when placing new blocks or showing existing ones, so we should be alright on speed
    if (game.blockList.length <= 1) return 0; // Either there are no blocks here, or this is the only block in existence
    let slot = game.blockList.length - 1;

    while (game.blockList[slot].priority === undefined) {
        slot--;
        if (slot == -1) return 0; // Nothing we have has a priority value
    }
    return game.blockList[slot].priority;
};

game.blockList.findOnGrid = function(xpos, ypos) {
    // Returns an Activeblock based on its coordinates, or undefined if it isn't found
    return game.blockList.find(ele => ele.tile.xpos === xpos && ele.tile.ypos === ypos);
    // find() returns the first element that the attached function returns true for
};

game.blockList.neighbors = function(mappos) {
    // Returns a list of all blocks that neighbor the provided block
    return [
        game.blockList.findOnGrid(mappos.xpos, mappos.ypos - 1),
        game.blockList.findOnGrid(mappos.xpos + 1, mappos.ypos),
        game.blockList.findOnGrid(mappos.xpos, mappos.ypos + 1),
        game.blockList.findOnGrid(mappos.xpos - 1, mappos.ypos)
    ].filter(ele => !(typeof ele === "undefined"));
};

game.blockList.getById = function(id) {
    return game.blockList.find(ele => ele.id === id);
};

game.blockList.getInStorage = function(targetitem) {
    let hold = game.blockList.find(ele => {
        // find will only return elements, but we're not really after that, this time
        if (ele.name !== "storage") return false; // ignore any non-storage blocks
        return ele.onhand.some(item => item.name == targetitem);
    });
    // 'hold' now contains the storage block which has the tool we are after
    if (hold === undefined) return null; // aka the item was not found in any storage unit
    let item = hold.onhand.splice(hold.onhand.findIndex(ele => ele.name === targetitem), 1)[0];
    // Here, we need to add the storage source to the item before returning it
    item.storageSource = hold.id;
    return item;
};

game.blockList.isInStorage = function(targetitem) {
    return game.blockList.includes(ele => {
        // we want to return true if any activeblock satisfies the search function
        if (ele.name !== "storage") return false;
        return ele.onhand.find(item => item.name === targetitem);
        // return true if any item matches the search function
    });
};

game.blockDemands.unlock = function(itemname) {
    // Determines when a new block can be displayed on the left side of the screen.  This depends heavily on the contents of the
    // unlockeditems array

    // Some existing blocks may allow new crafting options when new items become available. We want to highlight the block choices
    // with green whenever this happens. Run through all (enabled) blocks and see if there are any new crafting options
    game.blockDemands
        .filter(slot => slot.state === 1)
        .filter(slot => !(slot.hasNewOptions === undefined))
        .filter(slot => slot.hasNewOptions(itemname))
        .map(slot => {
            $("#cursor" + slot.name).css("background-color", "green");
        });

    game.blockDemands
        .filter(slot => {
            if (slot.state == 1) return false; // This has already been listed

            if (slot.prereq.length == 0) return true; // This has no prereq's; this item should be available at the start of the game
            // Now, work with the prereqs structure that is tied to this element
            return slot.prereq.every(outele => {
                // Determine that all elements in the array passed the test
                return outele.some(inele => {
                    // Determine that at least one hit was found in the array
                    return game.unlockedItems.includes(inele);
                });
            });
        })
        .forEach(element => {
            // With the misses filtered out, we now focus on processing the elements, which is adding them to the
            // left side of the screen

            element.state = 1;
            $("#blockselector").append(
                //document.getElementById("blockselector").append(
                '<div id="cursor' +
                    element.name +
                    '" class="blockchoice" title="' +
                    element.highlight +
                    '"> ' +
                    '<img src="' +
                    element.image +
                    '" /> ' +
                    "</div>"
            );
            document.getElementById("cursor" + element.name).addEventListener("click", () => setcursor(element.name));
        });
};

game.tutorial.checkAdvance = function(action) {
    // Handles updating whether the displayed tutorial mode is advanced or not, based on the action recieved
    if (game.tutorial.choices[game.tutorial.curlevel].unlock != action) return;

    game.tutorial.curlevel++;
    $("#tutorialblock").html(game.tutorial.choices[game.tutorial.curlevel].show);
};
