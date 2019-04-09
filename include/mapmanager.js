// mapmanager.js
// Classes and other functions to help manage the map

import $ from "jquery";
import { handlegameboxclick } from "../index.js";
import { game } from "./game.js";
// These are essentially input parameters for our code

const directionmap = [
    [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }],
    [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }],
    [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }],
    [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }],
    [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
    [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }],
    [{ x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }],
    [{ x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }, { x: -1, y: 0 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }],
    [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }],
    [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }],
    [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }],
    [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }],
    [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }],
    [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }],
    [{ x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }],
    [{ x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }],
    [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
    [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }, { x: 1, y: 0 }],
    [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }],
    [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }],
    [{ x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
    [{ x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 0 }]
];

const imageSelector = [
    { value: 1, img: "img/grass.png" },
    { value: 2, img: "img/forest.png" },
    { value: 3, img: "img/rocktile.png" },
    { value: 4, img: "img/watertile.png" }
];

const oreRates = [
    { name: "Copper Ore", rate: 100 },
    { name: "Tin Ore", rate: 50 },
    { name: "Iron Ore", rate: 60 },
    { name: "Aluminum Ore", rate: 25 }
];

function pickOre() {
    // Selects an ore to used, based on the oreRates array
    let target = Math.random() * oreRates.map(e => e.rate).reduce((sum, value) => sum + value);
    return oreRates.find(ele => {
        if (target <= ele.rate) return true;
        target -= ele.rate;
        return false;
    }).name;
}

let lastMapTileId = 0;
function nextMapTileId() {
    // Returns a new unique for a new tile to be used
    lastMapTileId++;
    return lastMapTileId;
}

class maptile {
    // Individual tiles on the final map.  Note that these exist and are functional during the game
    constructor(chunk, x, y) {
        this.chunk = chunk;
        this.xpos = x;
        this.ypos = y;
        this.tile = 0; // When generating new land areas, tiles won't be able to contain a land type yet. This will have to be set later
        this.structure = null;
        this.id = nextMapTileId();

        this.vegetation = Math.random(); // we'll store a value between 0 and 1 for this
        // Vegetation determines how quickly weeds and additional trees regrow.  Does not apply to all blocks (such as rocks or water)
        this.growth = Math.random() * 20000; // This will be a tracking rate of weed growth on this tile.  Every tick, this will go up an
        // amount based on the vegetation value (capped at 20,000).
        // We may also have 'spill-over', where tiles will pass growth values to other tiles. This might be harder to achieve, though
    }

    update() {
        // Handles updating this block once every tick
        if (this.structure != null) return; // Cannot update vegetation if there's something growing here
        if (this.growth < 20000) this.growth += this.vegetation;
        if (this.tile === 2 && this.growth >= 20000 && this.numTrees < 4) {
            console.log("New tree sprouted!");
            this.growth -= 10000;
            this.numTrees++;
            this.chooseImage();
            $("#" + this.id + "gametile").css({ "background-image": "url(" + this.image + ")" });
        }
    }

    chooseImage() {
        // Selects which image to use for this tile, based on the block's settings
        this.image = imageSelector.find(ele => ele.value === this.tile).img;
        if (this.tile === 2) {
            // This is a forest tile, it gets more selection parameters
            //            if (this.numTrees > 0) {
            this.image = "img/tree" + Math.max(1, this.numTrees) + ".png";
            //          } else {
            //            this.image = "img/grass.png";
            //      }
        }
    }

    settile(color) {
        this.tile = color;
        if (color === 3) {
            this.ore = pickOre();
            console.log("Using ore " + this.ore);
        }
        if (color === 2) {
            this.numTrees = Math.floor(Math.random() * 4) + 1;
        }
        //this.image = imageSelector.find(ele => ele.value === color).img;
        this.chooseImage();

        // Now we are able to draw the tile on the screen
        $("#game").append(`
            <div id="${this.id}gametileholder"
                class="gametileholder"
                style="top:${this.ypos * 66}px; left:${this.xpos * 66}px;">
                <div class="gametile" id="${this.id}gametile"
                    style="background-image:url(${this.image});">
                    <div id="${this.id}imageholder"
                        style="display:block; width:60px; height:60px; margin:auto; position:absolute; top:3px; left:3px">
                    </div>
                    <div id="${this.id}progress" style="z-index:4" class="progressbar"></div>
                </div>
            </div>
        `);
        document
            .getElementById(this.id + "gametileholder")
            .addEventListener("click", () => handlegameboxclick(this.xpos, this.ypos));
        //$("#"+ this.id +"gametile").css("background-image", "url("+ this.image +")");
    }
}

class mapchunk {
    // Class to manage map chunks. Chunks (at this time) are 50 squares tall by 50 squares wide. Whenever a new chunk is generated that is a neighbor of another existing chunk,
    // it will generate boimepoints for all shared edges, so the map is more seamless
    constructor(chunkxpos, chunkypos) {
        if (game.chunkList[chunkypos] === undefined) {
            console.log("Generating 1d array...");
            //chunkList = [];
            game.chunkList[chunkypos] = [];
        }
        if (game.chunkList[chunkypos][chunkxpos] === undefined) {
            console.log("Generating 2d array...");
            game.chunkList[chunkypos] = [];
        }

        game.chunkList[chunkypos][chunkxpos] = this;
        this.map = [];
        for (let y = 0; y < game.chunkSize; y++) {
            this.map[y] = [];
            for (let x = 0; x < game.chunkSize; x++) {
                this.map[y][x] = new maptile(this, x, y);
            }
        }

        this.biomepoints = [];
        // Now check to see if there are any neighboring chunks to use for generating biomepoints
        // start with the top direction
        if (game.chunkList[chunkypos - 1] != undefined && game.chunkList[chunkypos - 1][chunkxpos] != undefined) {
            // At this point, we can assume that chunkList[y-1][x] is another mapchunk. Run across its bottom edge and generate new biomepoints
            console.log("New chunk has a northern neighbor");
            let sourcechunk = game.chunkList[chunkypos - 1][chunkxpos];
            let lastcolormatch = -1;
            let lastpoint = 0;
            for (let x = 0; x < game.chunkSize; x++) {
                if (sourcechunk.map[game.chunkSize][x].tile == lastcolormatch) {
                    lastpoint.stretchcount++; // Same color as last square. Expand that point's range
                } else {
                    if (lastpoint != 0) {
                        // Finished with this biomepoint - but we need to wrap that one up.
                        lastpoint.x = Math.floor(lastpoint.stretchcount / 2);
                        lastpoint.points = [{ x: lastpoint.x, y: lastpoint.y }];
                    }
                    lastpoint = new biomepoint(this, x, 0, sourcechunk.map[game.chunkSize][x].tile);
                    this.biomepoints.push(lastpoint);
                    lastpoint.stretchcount = 1;
                    lastcolormatch = lastpoint.c;
                }
            }
            // We will also need to adjust the last new biomepoint
            lastpoint.x = Math.floor(lastpoint.stretchcount / 2);
            lastpoint.points = [{ x: lastpoint.x, y: lastpoint.y }];
        }
        // now do the bottom direction
        if (game.chunkList[chunkypos + 1] != undefined && game.chunkList[chunkypos + 1][chunkxpos] != undefined) {
            console.log("New chunk has a southern neighbor");
            let sourcechunk = game.chunkList[chunkypos + 1][chunkxpos];
            let lastcolormatch = -1;
            let lastpoint = 0;
            for (let x = 0; x < game.chunkSize; x++) {
                if (sourcechunk.map[0][x].tile == lastcolormatch) {
                    lastpoint.stretchcount++;
                } else {
                    if (lastpoint != 0) {
                        // adjust the last point
                        lastpoint.x = Math.floor(lastpoint.stretchcount / 2);
                        lastpoint.points = [{ x: lastpoint.x, y: lastpoint.y }];
                    }
                    lastpoint = new biomepoint(this, x, game.chunkSize, sourcechunk.map[0][x].tile);
                    this.biomepoints.push(lastpoint);
                    lastpoint.stretchcount = 1;
                    lastcolormatch = lastpoint.c;
                }
            }
            lastpoint.x = Math.floor(lastpoint.stretchcount / 2);
            lastpoint.points = [{ x: lastpoint.x, y: lastpoint.y }];
        }
        // left side... we can assume that chunkList[chunkypos] already exists
        if (game.chunkList[chunkypos][chunkxpos - 1] != undefined) {
            console.log("New chunk has a western neighbor");
            let sourcechunk = game.chunkList[chunkypos][chunkxpos - 1];
            let lastcolormatch = -1;
            let lastpoint = 0;
            for (let y = 0; y < game.chunkSize; y++) {
                if (sourcechunk.map[y][game.chunkSize].tile == lastcolormatch) {
                    lastpoint.stretchcount++;
                } else {
                    if (lastpoint != 0) {
                        lastpoint.y = Math.floor(lastpoint.stretchcount / 2);
                        lastpoint.points = [{ x: lastpoint.x, y: lastpoint.y }];
                    }
                    lastpoint = new biomepoint(this, 0, y, sourcechunk.map[y][game.chunkSize].tile);
                    this.biomepoints.push(lastpoint);
                    lastpoint.stretchcount = 1;
                    lastcolormatch = lastpoint.c;
                }
            }
            lastpoint.y = Math.floor(lastpoint.stretchcount / 2);
            lastpoint.points = [{ x: lastpoint.x, y: lastpoint.y }];
        }
        // right side
        if (game.chunkList[chunkypos][chunkxpos + 1] != undefined) {
            console.log("New chunk has an eastern neighbor");
            let sourcechunk = game.chunkList[chunkypos][chunkxpos + 1];
            let lastcolormatch = -1;
            let lastpoint = 0;
            for (let y = 0; y < game.chunkSize; y++) {
                if (sourcechunk.map[y][0].tile == lastcolormatch) {
                    lastpoint.stretchcount++;
                } else {
                    if (lastpoint != 0) {
                        lastpoint.y = Math.floor(lastpoint.stretchcount / 2);
                        lastpoint.points = [{ x: lastpoint.x, y: lastpoint.y }];
                    }
                    lastpoint = new biomepoint(this, game.chunkSize, y, sourcechunk.map[y][0].tile);
                    this.biomepoints.push(lastpoint);
                    lastpoint.stretchcount = 1;
                    lastcolormatch = lastpoint.c;
                }
            }
            lastpoint.y = Math.floor(lastpoint.stretchcount / 2);
            lastpoint.points = [{ x: lastpoint.x, y: lastpoint.y }];
        }

        // With all the sides considered, we can now generate points for inside the chunk
        let count = Math.floor((game.chunkSize * game.chunkSize) / game.mapKindDensity);
        console.log("We have " + count + " new points to generate");
        for (let i = 0; i < count; i++) {
            this.biomepoints.push(
                new biomepoint(
                    this,
                    Math.floor(Math.random() * (game.chunkSize - 2)) + 1,
                    Math.floor(Math.random() * (game.chunkSize - 2)) + 1,
                    Math.floor(Math.random() * 4) + 1
                )
            );
        }

        // With all our biomepoints generated, we can start filling in our area, until they are all finished.
        while (this.biomepoints.length > 0) {
            for (let i = 0; i < this.biomepoints.length; i++) {
                //console.log('Processing point '+ i +" of "+ this.biomepoints.length);
                //console.log(this.biomepoints[i].x);
                if (this.biomepoints[i].advance() == 0) {
                    this.biomepoints.splice(i, 1); // This one has no work left. Remove it
                    i--; // Also, back up the iterator, so we will still see the next one in line
                }
            }
        }
    }
}

class biomepoint {
    constructor(chunk, x, y, c) {
        //console.log('New biomepoint at ['+ x +','+ y +']');
        this.chunk = chunk;
        this.x = x;
        this.y = y;
        this.c = c;
        this.points = [{ x: x, y: y }];
        // When generating new points, we also need to set the tile type for this block
        chunk.map[y][x].settile(c);
    }

    advance() {
        // picks one filled location at random and checks around it for a valid location to add in. The direction is chosen at random (with help from the directionmap array)
        // Returns 1 if successful (and will keep going), or 0 if there is nothing left for this to process
        if (this.points.length == 0) {
            // This boime area has no points left to work with.  Delete itself from the list and exit
            return 0;
        }
        if (this.c == 3 && Math.random() > 0.25) {
            // If this is rock, we want it to have only 25% chance of expanding
            return 1;
        }
        let pickedspot = Math.floor(Math.random() * this.points.length);
        let pickeddir = Math.floor(Math.random() * 24);
        for (let i = 0; i < 4; i++) {
            let targetx = this.points[pickedspot].x + directionmap[pickeddir][i].x;
            let targety = this.points[pickedspot].y + directionmap[pickeddir][i].y;
            //console.log("Trying ["+ targetx +","+ targety +"]");
            if (targety < 0) continue;
            if (targety >= game.chunkSize) continue;
            if (targetx < 0) continue;
            if (targetx >= game.chunkSize) continue;
            //console.log('Trying at ['+ targetx +','+ targety +'], curtile='+ map[targety][targetx].tile);
            if (this.chunk.map[targety][targetx].tile == 0) {
                this.chunk.map[targety][targetx].settile(this.c);
                this.points.push({ x: targetx, y: targety });
                return;
            }
        }
        this.points.splice(pickedspot, 1);
        return 1;
    }
}

// Now, export these classes so they can be used elsewhere
module.exports = {
    maptile,
    mapchunk,
    nextMapTileId
};
