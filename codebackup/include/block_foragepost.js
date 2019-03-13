let foragepost = (mapsquare) => {
    let state = {
        name: 'foragepost',
        tile: mapsquare,
        priority: blocklist.lastpriority(),
        id: lastblockid,
        counter: 0,
        allowOutput: false, // Determines if this block will output items. Later in the game, we will allow this item to output items,
                            // and potentially other output types (like seeds to plant)
        onhand: [],
        possibleoutputs: function() {
            return [];
        },
        update: function() {
            if(state.onhand.length>=15) return; // cannot proceed if this inventory is full

            state.counter++;
            if(state.counter>=30) {
                state.onhand.push(item(getRandomFrom(['Apple', 'Berry', 'Tree Nut', 'Mushroom'])));
                state.counter-=30;
            }
            $("#"+ state.tile.id +"progress").css({"width": state.counter*2});
        },
        drawpanel: function() {
            $("#sidepanel").html('<b>Foraging Post</b><br />'+
                                 '<br />'+
                                 'All around you is a world teeming with life - and food. It is there for the taking, you just '+
                                 'have to find it first.<br />'+
                                 '<br />'+
                                 'Collects edible foods from the surrounding environment.  Local supplies can only support up to '+
                                 '4 workers. Cannot place another one in this area<br />'+
                                 '<br />'+
                                 'Food on-hand: <span id="sidepanelonhand">'+ state.onhand.length +'</span><br />'+
                                 'Progress to next: <span id="sidepanelprogress">'+ (Math.floor((state.counter/30)*100)) +'</span>%');
        },
        updatepanel: function() {
            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepanelprogress").html(Math.floor((state.counter/30)*100));
        }
    }
    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#"+ state.tile.id +"imageholder").html('<img src="img/foragepost.png" />');
    return Object.assign(state, blockHandlesItems(state));
}