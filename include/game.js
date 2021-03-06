// Game.js
// for DanIdle version 4
// Contains all the management code that is shared with all the other blocks

import $ from "jquery";
import { setCursor } from "../index.js";
import { hauler } from "./block_hauler.js";
import { storage } from "./block_storage.js";
import { leanto } from "./block_leanto.js";
import { foragePost } from "./block_foragePost.js";
import { rockKnapper } from "./block_rockKnapper.js";
import { twineMaker } from "./block_twineMaker.js";
import { stickMaker } from "./block_stickMaker.js";
import { flintToolMaker } from "./block_flintToolMaker.js";
import { huntingPost } from "./block_huntingPost.js";
import { campfire } from "./block_campfire.js";
import { firewoodMaker } from "./block_firewoodMaker.js";
import { butcherShop } from "./block_butcherShop.js";
import { farm } from "./block_farm.js";
import { kitchen } from "./block_kitchen.js";
import { woodCrafter } from "./block_woodCrafter.js";
import { waterFiller } from "./block_waterFiller.js";
import { fireMiner } from "./block_fireMiner.js";
import { gravelRoad } from "./block_gravelRoad.js";
import { boulderWall } from "./block_boulderWall.js";
import { dirtMaker } from "./block_dirtMaker.js";
import { clayMaker } from "./block_clayMaker.js";
import { clayFormer } from "./block_clayFormer.js";
import { dryer } from "./block_dryer.js";

const TILE_GRASS = 1; // land type of grass
const TILE_FOREST = 2; // land type of forest
const TILE_ROCK = 3; // land type of rocks
const TILE_WATER = 4; // land type of water

let lastBlockId = 1;

export const game = {
    chunkList: [],
    mapKindDensity: 10,
    chunkSize: 32, // how large each game-chunk is
    blockList: [], // List of all blocks placed in the game
    unlockedItems: [], // Array of names of all items the player has produced thus far.
    //lastBlockId: 1, // Last ID used for a new block. Used to provide unique block IDs for each block
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
        // We no longer need the selector block, since the map allows us to scroll around
        {
            name: "hauler",
            canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
            image: "img/hauler.png",
            state: 0,
            highlight: "Item hauler: Move items between blocks",
            prereq: [],
            sourcePath: "./block_hauler.js",
            generate: hauler
        }, // uses blockDeletesclean, and... that's about it
        {
            name: "storage",
            canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
            image: "img/storage.png",
            state: 0,
            highlight: "Storage: Keep items (like tools)",
            prereq: [],
            sourcePath: "./block_storage.js",
            generate: storage
        }, // Uses blockOutputsItems, blockHasWorkerPriority
        {
            name: "leanto",
            canBuildOn: [TILE_FOREST],
            image: "img/leanto.png",
            state: 0,
            highlight: "Lean-to: Basic shelter of sticks and leaves",
            prereq: [],
            sourcePath: "./include/block_leanto.js",
            generate: leanto
        }, // Uses blockHasWorkerPriority, blockDeletesClean, blockRequiresTool, blockIsStructure
        {
            name: "foragePost",
            canBuildOn: [TILE_GRASS],
            image: "img/foragePost.png",
            state: 0,
            highlight: "Forage Post; College food from surrounding lands",
            prereq: [],
            sourcePath: "./block_foragePost.js",
            generate: foragePost
        }, // uses blockOutputsItems, blockHasRandomizedOutput, blockHasWorkerPriority, blockShowsOutputItems
        {
            name: "rockKnapper",
            canBuildOn: [TILE_ROCK],
            image: "img/rockKnapper.png",
            state: 0,
            highlight: "Rock Knapper; Smash rocks into basic tools",
            prereq: [],
            sourcePath: "./block_rockKnapper.js",
            generate: rockKnapper
        }, // uses blockOutputsItems, blockHasSelectableCrafting, blockHasWorkerPriority
        {
            name: "firewoodMaker",
            canBuildOn: [TILE_FOREST],
            image: "img/firewoodMaker.png",
            state: 0,
            highlight: "Firewood Collector; collect dead wood for fires",
            prereq: [],
            sourcePath: "./block_firewoodMaker.js",
            generate: firewoodMaker
        }, // uses blockOutputsItems, blockHasRandomizedOutput, blockHasWorkerPriority, blockShowsOutputItems
        {
            name: "twineMaker",
            canBuildOn: [TILE_FOREST],
            image: "img/twineMaker.png",
            state: 0,
            highlight: "Twine Maker; cuts bark from trees to make rope",
            prereq: [["Flint Knife"]],
            sourcePath: "./block_twineMaker.js",
            generate: twineMaker
        }, // uses blockOutputsItems, blockRequiresTools, blockHasWorkerPriority
        {
            name: "stickMaker",
            canBuildOn: [TILE_FOREST],
            image: "img/stickMaker.png",
            state: 0,
            highlight: "Stick Maker; cuts branches from trees for sticks",
            prereq: [["Flint Stabber"]],
            sourcePath: "./block_stickMaker.js",
            generate: stickMaker
        }, // uses blockOutputsItems, blockRequiresTools, blockHasSelectableCrafting, blockHasWorkerPriority
        {
            name: "flintToolMaker",
            canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
            image: "img/flintToolMaker.png",
            state: 0,
            highlight:
                "Flint Toolshop; makes larger tools from flint, wood & twine",
            prereq: [["Twine"], ["Short Stick", "Long Stick"]],
            sourcePath: "./block_flintToolMaker.js",
            generate: flintToolMaker
        }, // uses blockOutputsItems, blockHasSelectableCrafting, blockHasWorkerPriority
        {
            name: "huntingPost",
            canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
            image: "img/huntingPost.png",
            state: 0,
            highlight: "Hunting Post; Hunts for animals in local area",
            prereq: [["Flint Spear"]],
            sourcePath: "./block_huntingPost.js",
            generate: huntingPost
        }, // uses blockOutputsItems, blockRequiresTools, blockHasRandomizedOutput, blockHasWorkerPriority, blockShowsOutputItems
        {
            name: "campfire",
            canBuildOn: [TILE_GRASS, TILE_ROCK], // We don't want to be building fires in forest areas - too dangerous
            image: "img/campfire.png",
            state: 0,
            highlight: "Campfire; build fires to cook foods and keep warm",
            prereq: [["Dead Deer", "Dead Wolf", "Dead Chicken"]],
            sourcePath: "./block_campfire.js",
            generate: campfire
        }, // uses blockOutputsItems, blockHasWorkerPriority. Needs blockHasOutputsPerInput
        {
            name: "butcherShop",
            canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
            image: "img/butcherShop.png",
            state: 0,
            highlight:
                "Butcher Shop: turn dead animals into meats & byproducts",
            prereq: [["Dead Deer", "Dead Wolf", "Dead Chicken"]],
            sourcePath: "./block_butcherShop.js",
            generate: butcherShop
        }, // uses blockOutputsItems, blockHasWorkerPriority, blockHasOutputsPerInput, blockShowsOutputItems, blockRequiresTool
        {
            name: "farm",
            canBuildOn: [TILE_GRASS],
            image: "img/farm.png",
            state: 0,
            highlight: "Farm: grow crops here",
            prereq: [["Flint Hoe"]],
            sourcePath: "./block_farm.js",
            generate: farm
        }, // uses blockOutputsItems, blockHasWorkerPriority, blockDeletesClean, blockRequiresTool, blockHandlesFood, blockShowsOutputItems
        {
            name: "kitchen",
            canBuildOn: [TILE_GRASS],
            image: "img/kitchen.png",
            state: 0,
            highlight: "Kitchen: prepare foods before eating. Cleaver optional",
            prereq: [["Whole Wheat", "Carrot", "Potato", "Bean"]],
            sourcePath: "./block_kitchen.js",
            generate: kitchen
        },
        {
            name: "woodCrafter",
            canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
            image: "img/woodCrafter.png",
            state: 0,
            highlight: "Woodcrafter: craft stuff out of wood",
            prereq: [["Log"]],
            sourcePath: "./block_woodCrafter.js",
            generate: woodCrafter
        }, // uses blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockDeletesClean, blockHasSelectableCrafting, blockRequiresTool
        {
            name: "waterFiller",
            canBuildOn: [TILE_WATER],
            image: "img/waterFiller.png",
            state: 0,
            highlight:
                "Water Filler: fills liquid-holding items with water. Place in water",
            prereq: [["Wooden Bowl"]],
            sourcePath: "./block_waterFiller.js",
            generate: waterFiller
        }, // uses blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockDeletesClean, blockHasOutputsPerInput
        {
            name: "fireMiner",
            canBuildOn: [TILE_ROCK],
            image: "img/fireMiner.png",
            state: 0,
            highlight: "Fire Miner: Use fire & water to cut through rocks",
            prereq: [["Wooden Bowl"], ["Basic Crane"]],
            sourcePath: "./block_fireMiner.js",
            generate: fireMiner
        }, // uses blockOutputsItems, blockShowsOutputItems, blockHasWorkerPriority, blockRequiresTool, blockCooksItems
        {
            name: "gravelRoad",
            canBuildOn: [TILE_ROCK, TILE_GRASS],
            image: "img/gravelRoad.png",
            state: 0,
            highlight: "Gravel road, to make travel easier",
            prereq: [["Gravel"]],
            sourcePath: "./block_gravelRoad.js",
            generate: gravelRoad
        }, // uses blockRequiresTool, blockHasWorkerPriority, blockIsStructure
        {
            name: "boulderWall",
            canBuildOn: [TILE_ROCK, TILE_GRASS],
            image: "img/boulderWall.png",
            state: 0,
            highlight: "Boulder wall, to protect your camp",
            prereq: [["Boulder", "Gravel"]],
            sourcePath: "./block_boulderWall.js",
            generate: boulderWall
        }, // uses blockRequiresTool, blockHasWorkerPriority, blockIsStructure
        {
            name: "dirtMaker",
            canBuildOn: [TILE_GRASS],
            image: "img/dirtMaker.png",
            state: 0,
            highlight: "Dirt maker, to craft with dirt",
            prereq: [["Flint Hoe"]],
            sourcePath: "./block_dirtMaker.js",
            generate: dirtMaker
        }, // uses blockOutputsitems, blockRequiresTool, blockHasWorkerPriority, blockDeletesClean
        {
            name: "clayMaker",
            canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
            image: "img/clayMaker.png",
            state: 0,
            highlight: "Clay maker, extract clay from dirt",
            prereq: [["Dirt"]],
            sourcePath: "./block_clayMaker.js",
            generate: clayMaker
        }, // uses blockOutputsItems, blockHasWorkerPriority, blockDeletesClean, blockHasSelectableCrafting
        {
            name: "clayFormer",
            canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
            image: "img/clayFormer.png",
            state: 0,
            highlight: "Clay former, turn clay into shapes for uses",
            prereq: [["Clay"]],
            sourcePath: "./block_clayFormer.js",
            generate: clayFormer
        }, // uses blockOutputsItems, blockHasWorkerPriority, blockDeletesClean, blockHasSelectableCrafting
        {
            name: "dryer",
            canBuildOn: [TILE_GRASS, TILE_FOREST, TILE_ROCK],
            image: "img/dryer.png",
            state: 0,
            highlight: "A covered area for drying things, like clay",
            prereq: [["Clay"]],
            sourcePath: "./block_dryer.js",
            generate: dryer
        }
    ],

    getNextBlockId() {
        // Returns the next available block ID, to be used in generating new blocks
        lastBlockId++;
        return lastBlockId;
    },

    // This tutorial object is set up to handle what is displayed at the top for the tutorial section, as well as when that section
    // moves to the next tutorial task
    tutorial: {
        curLevel: 0,
        choices: [
            {
                level: 0,
                unlock: "movemap",
                show:
                    "Welcome! I'll help you get started. Step 1: Click and drag on the map to move the view around"
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
                unlock: "build=foragePost",
                show:
                    "Step 3: Food. Place a foraging post in a nearby grass area"
            },
            {
                level: 3,
                unlock: "build=rockKnapper",
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
    return game.blockList.find(
        ele => ele.tile.xpos === xpos && ele.tile.ypos === ypos
    );
    // find() returns the first element that the attached function returns true for
};

game.blockList.neighbors = function(mapPos) {
    // Returns a list of all blocks that neighbor the provided block
    return [
        game.blockList.findOnGrid(mapPos.xpos, mapPos.ypos - 1),
        game.blockList.findOnGrid(mapPos.xpos + 1, mapPos.ypos),
        game.blockList.findOnGrid(mapPos.xpos, mapPos.ypos + 1),
        game.blockList.findOnGrid(mapPos.xpos - 1, mapPos.ypos)
    ].filter(ele => !(typeof ele === "undefined"));
};

game.blockList.getById = function(id) {
    return game.blockList.find(ele => ele.id === id);
};

game.blockList.getInStorage = function(targetItem) {
    let hold = game.blockList.find(ele => {
        // find will only return elements, but we're not really after that, this time
        if (ele.name !== "storage") return false; // ignore any non-storage blocks
        return ele.onhand.some(item => item.name == targetItem);
    });
    // 'hold' now contains the storage block which has the tool we are after
    if (hold === undefined) return null; // aka the item was not found in any storage unit
    let item = hold.onhand.splice(
        hold.onhand.findIndex(ele => ele.name === targetItem),
        1
    )[0];
    // Here, we need to add the storage source to the item before returning it
    item.storageSource = hold.id;
    return item;
};

game.blockList.isInStorage = function(targetItem) {
    return game.blockList.includes(ele => {
        // we want to return true if any activeBlock satisfies the search function
        if (ele.name !== "storage") return false;
        return ele.onhand.find(item => item.name === targetItem);
        // return true if any item matches the search function
    });
};

game.blockDemands.unlock = function(itemName) {
    // Determines when a new block can be displayed on the left side of the screen.  This depends heavily on the contents of the
    // unlockeditems array

    // Some existing blocks may allow new crafting options when new items become available. We want to highlight the block choices
    // with green whenever this happens. Run through all (enabled) blocks and see if there are any new crafting options
    game.blockDemands
        .filter(slot => slot.state === 1)
        .filter(slot => !(slot.hasNewOptions === undefined))
        .filter(slot => slot.hasNewOptions(itemName))
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
            $("#blockselector").append(`
                <div id="cursor${element.name}" class="blockchoice" title="${element.highlight}">
                    <img src="${element.image}" />
                </div>
            `);
            document
                .getElementById("cursor" + element.name)
                .addEventListener("click", () => setCursor(element.name));
        });
};

game.tutorial.checkAdvance = function(action) {
    // Handles updating whether the displayed tutorial mode is advanced or not, based on the action recieved
    if (game.tutorial.choices[game.tutorial.curLevel].unlock != action) return;

    game.tutorial.curLevel++;
    $("#tutorialblock").html(
        game.tutorial.choices[game.tutorial.curLevel].show
    );
};
