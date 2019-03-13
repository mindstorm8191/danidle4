// Storage space for users to put things (especially tools)
let storage = (mapsquare) => {
    let state = {
        name: 'leanto',
        tile: mapsquare,
        priority: blocklist.lastpriority(),
        id: lastblockid,
        counter: 0,
        allowOutput: false, // Determines if this block will output items. Note that this setting can be adjusted within this block
        onhand: [],         // items we have on hand here
        targetitems: [],    // list of items we want to store here
        possibleoutputs: function() {
            // This only outputs the names of the items
            if(state.outputtoggle===0) return [];
            // I couldn't come up with a reasonable way to do this with functional programming (besides using Set(), which just feels
            // like a hack), so I decided to do it my own way.  .map() might be useful in other cases here, but we're already running
            // through all the data anyway
            let build = [];
            for(let i=0; i<state.onhand.length; i++) {
                if(!build.includes(state.onhand[i].name)) build.push(state.onhand[i].name);
            }
            return build;
        },
        update: function() {
            // Here, we will search nearby blocks for items to pull in, if they are allowed

            if(state.targetitems.length==0) return; // There's nothing here to collect anyway, don't bother
            if(state.onhand.length>=10) return; // This storage space is full

            // Run through all the neighbors and see if we can pick up one of our target items
            blocklist.neighbors(state.tile).find(function(neighbor) {
                let pickup = neighbor.getItem(state.targetitems);
                console.log('Checking against '+ state.targetitems.length +' items');
                if(pickup==null) return false;
                console.log('Picking up '+ pickup.name);
                state.onhand.push(pickup);
                return true;
            });
        },
        drawpanel: function() {
            $("#sidepanel").html('<b>Storage Unit</b><br />'+
                                    '<br />'+
                                    'So many items, where to put them?  This is your place to put things. The fact that its nothing '+
                                    'but a spot on the ground isnt a problem yet.<br />'+
                                    '<br />'+
                                    'Use this to hold items (especially tools). This can be upgraded with shelves and other things to '+
                                    'hold more items<br />'+
                                    '<br />'+
                                    'Items on hand: <span id="sidepanelonhand">'+ state.onhand.length +'</span><br />'+
                                    '<br />'+
                                    '<b>Items to store</b><br />');
            // Now for the real work of this block. Run through the neighbors of this block to list all available items (once).
            // This will mainly be tied to what each block might output.
            let alreadyseen = [];
            let list = blocklist.neighbors(state.tile).map(function(ele) {
                return ele.possibleoutputs();
            });
            let built = [... new Set([].concat.apply([], list))];
                // This flattens our 2D array, converts it to a Set (dropping duplicates), then converts back to an array (since a
                // set isn't an array)
            if(built.length===0) {
                $("#sidepanel").append('None available');
                return;
            }
                // Now, display the actual options
            built.forEach(function(ele) {
                $("#sidepanel").append('<span id="sidepanelpick'+ multireplace(ele, ' ', '') +'" '+
                                                'class="sidepanelbutton" '+
                                                'style="background-color:'+ (state.targetitems.includes(ele) ? "green" : "red") +';" '+
                                                'onclick="blocklist.getById('+ state.id +').toggleinput(\''+ ele +'\')">'+ ele +'</span>')
            });
                // Note that this list can be changed when a new block gets placed nearby and this is loaded again.

        },
        updatepanel: function() {
            $("#sidepanelonhand").html(state.onhand.length);
        },
        toggleinput: function(itemname) {

            if(state.targetitems.includes(itemname)) {
                // Item is currently in the grab-list. Remove it now
                state.targetitems.splice(state.targetitems.indexOf(itemname), 1);
                $("#sidepanelpick"+ multireplace(itemname, ' ', '')).css({'background-color': 'red'});
            }else{
                // Item is not currently in the list. Add it now
                state.targetitems.push(itemname);
                $("#sidepanelpick"+ multireplace(itemname, ' ', '')).css({'background-color': 'green'});
            }
        }
    }
    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#"+ state.tile.id +"imageholder").html('<img src="img/storage.png" />');
    return Object.assign(state, blockHandlesItems(state));
}