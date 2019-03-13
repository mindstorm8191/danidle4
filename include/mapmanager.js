// mapmanager.js
// Classes and other functions to help manage the map

const directionmap = [
    [{"x": 0, "y":-1}, {"x": 1, "y": 0}, {"x": 0, "y": 1}, {"x":-1, "y": 0}],
    [{"x": 0, "y":-1}, {"x": 1, "y": 0}, {"x":-1, "y": 0}, {"x": 0, "y": 1}],
    [{"x": 0, "y":-1}, {"x": 0, "y": 1}, {"x": 1, "y": 0}, {"x":-1, "y": 0}],
    [{"x": 0, "y":-1}, {"x": 0, "y": 1}, {"x":-1, "y": 0}, {"x": 1, "y": 0}],
    [{"x": 0, "y":-1}, {"x":-1, "y": 0}, {"x": 1, "y": 0}, {"x": 0, "y": 1}],
    [{"x": 0, "y":-1}, {"x":-1, "y": 0}, {"x": 0, "y": 1}, {"x": 1, "y": 0}],
    [{"x": 1, "y": 0}, {"x": 0, "y":-1}, {"x": 0, "y": 1}, {"x":-1, "y": 0}],
    [{"x": 1, "y": 0}, {"x": 0, "y":-1}, {"x":-1, "y": 0}, {"x": 0, "y": 1}],
    [{"x": 1, "y": 0}, {"x": 0, "y": 1}, {"x": 0, "y":-1}, {"x":-1, "y": 0}],
    [{"x": 1, "y": 0}, {"x": 0, "y": 1}, {"x":-1, "y": 0}, {"x": 0, "y":-1}],
    [{"x": 1, "y": 0}, {"x":-1, "y": 0}, {"x": 0, "y":-1}, {"x": 0, "y": 1}],
    [{"x": 1, "y": 0}, {"x":-1, "y": 0}, {"x": 0, "y": 1}, {"x": 0, "y":-1}],
    [{"x": 0, "y": 1}, {"x": 0, "y":-1}, {"x": 1, "y": 0}, {"x":-1, "y": 0}],
    [{"x": 0, "y": 1}, {"x": 0, "y":-1}, {"x":-1, "y": 0}, {"x": 1, "y": 0}],
    [{"x": 0, "y": 1}, {"x": 1, "y": 0}, {"x": 0, "y":-1}, {"x":-1, "y": 0}],
    [{"x": 0, "y": 1}, {"x": 1, "y": 0}, {"x":-1, "y": 0}, {"x": 0, "y":-1}],
    [{"x": 0, "y": 1}, {"x":-1, "y": 0}, {"x": 0, "y":-1}, {"x": 1, "y": 0}],
    [{"x": 0, "y": 1}, {"x":-1, "y": 0}, {"x": 1, "y": 0}, {"x": 0, "y":-1}],
    [{"x":-1, "y": 0}, {"x": 0, "y":-1}, {"x": 1, "y": 0}, {"x": 0, "y": 1}],
    [{"x":-1, "y": 0}, {"x": 0, "y":-1}, {"x": 0, "y": 1}, {"x": 1, "y": 0}],
    [{"x":-1, "y": 0}, {"x": 1, "y": 0}, {"x": 0, "y":-1}, {"x": 0, "y": 1}],
    [{"x":-1, "y": 0}, {"x": 1, "y": 0}, {"x": 0, "y": 1}, {"x": 0, "y":-1}],
    [{"x":-1, "y": 0}, {"x": 0, "y": 1}, {"x": 1, "y": 0}, {"x": 0, "y": 1}],
    [{"x":-1, "y": 0}, {"x": 0, "y": 1}, {"x": 0, "y": 1}, {"x": 1, "y": 0}]];

class maptile {
    constructor(chunk, x, y) {
        this.chunk = chunk;
        this.xpos = x;
        this.ypos = y;
        this.tile = 0;  // When generating new land areas, tiles won't be able to contain a land type yet. This will have to be set later
        this.structure = null;
        if(typeof maptileid === 'undefined') {
            console.log('Fixed maptileid value');
            maptileid = 0;
        }
        this.id = maptileid; maptileid++;
        
        this.vegetation = Math.random();  // we'll store a value between 0 and 1 for this
            // Vegetation determines how quickly weeds and additional trees regrow.  Does not apply to all blocks (such as rocks or water)
        this.growth = 20000; // This will be a tracking rate of weed growth on this tile.  Every tick, this will go up an amount based on the vegetation value (capped at 20,000).
            // We may also have 'spill-over', where tiles will pass growth values to other tiles.
    }
    
    settile(color) {
        this.tile = color;
        switch(this.tile) {
            //case 1: this.image = 'img/dirttile.png'; break;
            case 1: this.image = 'img/grass.png'; break;
            case 2: this.image = 'img/forest.png'; break;
            case 3: this.image = 'img/rocktile.png'; break;
            case 4: this.image = 'img/watertile.png'; break;
        }
        //console.log(this.image);
        
        // Now we are able to draw the tile on the screen
        $("#game").append('<div id="' + this.id + 'gametileholder" class="gametileholder" style="top:' + (this.ypos * 66) + 'px; left:' + (this.xpos * 66) + 'px;" ' +
                          '     onclick="handlegameboxclick(' + this.xpos +','+ this.ypos +')">'+
                          '  <div class="gametile" id="'+ this.id +'gametile" style="background-image:url('+ this.image +');">'+
                          '    <div id="'+ this.id +'imageholder" style="display:block; width:60px; height:60px; margin:auto; position:absolute; top:3px; left:3px">'+
                          '    </div>'+
                          //'    <img id="' + this.id + 'img" src="' + this.image + '" /></div>' +
                          '    <div id="' + this.id + 'progress" style="z-index:4" class="progressbar"></div>'+
                          '  </div>'+
                          '</div>');
        //$("#"+ this.id +"gametile").css("background-image", "url("+ this.image +")");
    }
}


class mapchunk {
    // Class to manage map chunks. Chunks (at this time) are 50 squares tall by 50 squares wide. Whenever a new chunk is generated that is a neighbor of another existing chunk,
    // it will generate boimepoints for all shared edges, so the map is more seamless
    constructor(chunkxpos, chunkypos) {
        if(typeof chunklist[chunkypos] === 'undefined') {
            console.log('Generating 1d array...');
            chunklist = [];
            chunklist[chunkypos] = [];
        }
        if(typeof chunklist[chunkypos][chunkxpos] === 'undefined') {
            console.log('Generating 2d array...');
            chunklist[chunkypos] = [];
        }
        
        chunklist[chunkypos][chunkxpos] = this;
        this.map = [];
        for(let y=0; y<chunksize; y++) {
            this.map[y] = [];
            for(let x=0; x<chunksize; x++) {
                this.map[y][x] = new maptile(this, x, y);
        }  }
        
        this.biomepoints = [];
        // Now check to see if there are any neighboring chunks to use for generating biomepoints
        // start with the top direction
        if((typeof chunklist[chunkypos-1] != 'undefined') && (typeof chunklist[chunkypos-1][chunkxpos] != 'undefined')) {
            // At this point, we can assume that chunklist[y-1][x] is another mapchunk. Run across its bottom edge and generate new biomepoints
            console.log('New chunk has a northern neighbor');
            let sourcechunk = chunklist[chunkypos-1][chunkxpos];
            let lastcolormatch = -1;
            let lastpoint = 0;
            for(let x=0; x<chunksize; x++) {
                if(sourcechunk.map[chunksize][x].tile == lastcolormatch) {
                    lastpoint.stretchcount++;  // Same color as last square. Expand that point's range
                }else{
                    if(lastpoint!=0) {  // Finished with this biomepoint - but we need to wrap that one up.
                        lastpoint.x = Math.floor(lastpoint.stretchcount/2);
                        lastpoint.points = [{"x": lastpoint.x, "y": lastpoint.y}];
                    }
                    lastpoint = new biomepoint(this, x, 0, sourcechunk.map[chunksize][x].tile);
                    this.biomepoints.push(lastpoint);
                    lastpoint.stretchcount = 1;
                    lastcolormatch = lastpoint.c;
                }
            }
            // We will also need to adjust the last new biomepoint
            lastpoint.x = Math.floor(lastpoint.stretchcount/2);
            lastpoint.points = [{"x": lastpoint.x, "y": lastpoint.y}];
        }
        // now do the bottom direction
        if((typeof chunklist[chunkypos+1] != 'undefined') && (typeof chunklist[chunkypos+1][chunkxpos] != 'undefined')) {
            console.log('New chunk has a southern neighbor');
            let sourcechunk = chunklist[chunkypos+1][chunkxpos];
            let lastcolormatch = -1;
            let lastpoint = 0;
            for(let x=0; x<chunksize; x++) {
                if(sourcechunk.map[0][x].tile == lastcolormatch) {
                    lastpoint.stretchcount++;
                }else{
                    if(lastpoint!=0) {  // adjust the last point
                        lastpoint.x = Math.floor(lastpoint.stretchcount/2);
                        lastpoint.points = [{"x": lastpoint.x, "y": lastpoint.y}];
                    }
                    lastpoint = new biomepoint(this, x, chunksize, sourcechunk.map[0][x].tile);
                    this.biomepoints.push(lastpoint);
                    lastpoint.stretchcount = 1;
                    lastcolormatch = lastpoint.c;
                }
            }
            lastpoint.x = Math.floor(lastpoint.stretchcount/2);
            lastpoint.points = [{"x": lastpoint.x, "y": lastpoint.y}];
        }
        // left side... we can assume that chunklist[chunkypos] already exists
        if(typeof chunklist[chunkypos][chunkxpos-1] != 'undefined') {
            console.log('New chunk has a western neighbor');
            let sourcechunk = chunklist[chunkypos][chunkxpos-1];
            let lastcolormatch = -1;
            let lastpoint = 0;
            for(let y=0; y<chunksize; y++) {
                if(sourcechunk.map[y][chunksize].tile == lastcolormatch) {
                    lastpoint.stretchcount++;
                }else{
                    if(lastpoint!=0) {
                        lastpoint.y = Math.floor(lastpoint.stretchcount/2);
                        lastpoint.points = [{"x": lastpoint.x, "y": lastpoint.y}];
                    }
                    lastpoint = new biomepoint(this, 0, y, sourcechunk.map[y][chunksize].tile);
                    this.biomepoints.push(lastpoint);
                    lastpoint.stretchcount = 1;
                    lastcolormatch = lastpoint.c;
                }
            }
            lastpoint.y = Math.floor(lastpoint.stretchcount/2);
            lastpoint.points = [{"x": lastpoint.x, "y": lastpoint.y}];
        }
        // right side
        if(typeof chunklist[chunkypos][chunkxpos+1] != 'undefined') {
            console.log('New chunk has an eastern neighbor');
            let sourcechunk = chunklist[chunkypos][chunkxpos+1];
            let lastcolormatch = -1;
            let lastpoint = 0;
            for(let y=0; y<chunksize; y++) {
                if(sourcechunk.map[y][0].tile == lastcolormatch) {
                    lastpoint.stretchcount++;
                }else{
                    if(lastpoint!=0) {
                        lastpoint.y = Math.floor(lastpoint.stretchcount/2);
                        lastpoint.points = [{"x": lastpoint.x, "y": lastpoint.y}];
                    }
                    lastpoint = new biomepoint(this, chunksize, y, sourcechunk.map[y][0].tile);
                    this.biomepoints.push(lastpoint);
                    lastpoint.stretchcount = 1;
                    lastcolormatch = lastpoint.c;
                }
            }
            lastpoint.y = Math.floor(lastpoint.stretchcount/2);
            lastpoint.points = [{"x": lastpoint.x, "y": lastpoint.y}];
        }
        
        // With all the sides considered, we can now generate points for inside the chunk
        let count = Math.floor(chunksize * chunksize / mapkinddensity);
        console.log('We have '+ count +' new points to generate');
        for(let i=0; i<count; i++) {
            this.biomepoints.push(new biomepoint(this, Math.floor(Math.random()*(chunksize-2))+1, Math.floor(Math.random()*(chunksize-2))+1, Math.floor(Math.random()*4)+1));
        }
        
        // With all our biomepoints generated, we can start filling in our area, until they are all finished.
        while(this.biomepoints.length>0) {
            for(let i=0; i<this.biomepoints.length; i++) {
                //console.log('Processing point '+ i +" of "+ this.biomepoints.length);
                //console.log(this.biomepoints[i].x);
                if(this.biomepoints[i].advance()==0) {
                    this.biomepoints.splice(i, 1); // This one has no work left. Remove it
                    i--; // Also, back up the iterator, so we will still see the next one in line
                }
            }
        }
    }
}

class biomepoint {
    constructor(chunk, x,y,c) {
        //console.log('New biomepoint at ['+ x +','+ y +']');
        this.chunk = chunk;
        this.x = x;
        this.y = y;
        this.c = c;
        this.points = [{"x": x, "y": y}];
        // When generating new points, we also need to set the tile type for this block
        chunk.map[y][x].settile(c);
    }
    
    advance() {
        // picks one filled location at random and checks around it for a valid location to add in. The direction is chosen at random (with help from the directionmap array)
        // Returns 1 if successful (and will keep going), or 0 if there is nothing left for this to process
        if(this.points.length==0) {
            // This boime area has no points left to work with.  Delete itself from the list and exit
            return 0;
        }
        if(this.c==3 && Math.random()>0.25) {
            // If this is rock, we want it to have only 25% chance of expanding
            return 1;
        }
        let pickedspot = Math.floor(Math.random() * this.points.length);
        let pickeddir  = Math.floor(Math.random() * 24);
        for(let i=0; i<4; i++) {
            let targetx = this.points[pickedspot].x + directionmap[pickeddir][i].x;
            let targety = this.points[pickedspot].y + directionmap[pickeddir][i].y;
            //console.log("Trying ["+ targetx +","+ targety +"]");
            if(targety<0) continue;
            if(targety>=chunksize) continue;
            if(targetx<0) continue;
            if(targetx>=chunksize) continue;
            //console.log('Trying at ['+ targetx +','+ targety +'], curtile='+ map[targety][targetx].tile);
            if(this.chunk.map[targety][targetx].tile==0) {
                
                this.chunk.map[targety][targetx].settile(this.c);
                this.points.push({"x": targetx, "y": targety});
                return;
            }
        }
        this.points.splice(pickedspot, 1);
        return 1;
    }
}




