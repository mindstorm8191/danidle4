const twinemaker = (mapsquare) => {
    // Early tech block to produce twine rope.  Minimum tool is a flint knife. Has no automation abilities
    let state = {
        name: 'Twine Maker',
        tile: mapsquare,
        priority: blocklist.lastpriority(),
        id: lastblockid,
        counter: 0,
        allowOutput: true,
        onhand: [],         // items we have on hand here
        toolchoices: ['None', 'Flint Knife'],   // List of tools this block can use. There's only one possible tool at this time.
                                                // Later on we will move this list to an external source, and utilize all knives possible
        currenttool: null,  // which tool is currently being used
        targettool: 'None',     // next tool to pick up, when this one breaks

        possibleoutputs: function() {
            // Unlike other block types, this will only have one available output item
            return ['Twine'];
        },

        update: function() {
            // Start by ensuring we have enough space, and a tool selected

            if(state.onhand.length>=15) return;
            if(state.currenttool===null) {
                if(state.targettool==='None') return; // No tool is loaded, or selected. Nothing to do here
                // We already have a function to load tools when they are available
                state.currenttool = blocklist.getInStorage(state.targettool);
                if(state.currenttool===null) return; // getInStorage() returned null - no tools are available
            }

            state.currenttool.endurance--;
            state.counter += state.currenttool.efficiency;
            if(state.currenttool.endurance<=0) state.currenttool = null; // This sets things up for the next round to load another tool
            if(state.counter>20) {
                state.onhand.push(item('Twine'));
                state.counter-=20;
            }
            $("#"+ state.tile.id +"progress").css({"width": state.counter*3});
        },

        drawpanel: function() {
            $("#sidepanel").html('<b>Twine Maker</b><br />'+
                                 '<br />'+
                                 'Rope is an essential tool for survival, providing hundreds of potential uses to get things done. '+
                                 'Twine isn\'t a very effective rope, but it is available, and will do for now.<br />'+
                                 '<br />'+
                                 'Produces twine from vines of the forest and tree bark.<br />'+
                                 '<br />'+
                                 'Twine on hand: <span id="sidepanelonhand">'+ state.onhand.length +'</span><br />'+
                                 'Progress: <span id="sidepanelprogress">'+ Math.floor(state.counter*100/20) +'</span>%<br />'+
                                 '<br />'+
                                 '<b>Tools (Knife):</b><br />');
            // Now, let's handle some tool options.
            $("#sidepanel").append(
                state.toolchoices.filter(function (tool) {
                    if(tool==='None') return true; // This one gets a free pass
                    if(unlockeditems.includes(tool)) return true; // This one has been made available
                    return false;
                }).map(function (ele) {
                    let color = (ele===state.targettool) ? 'green' : 'red';
                    return '<span class="sidepanelbutton" '+
                                'id="sidepaneltool'+ multireplace(ele, ' ', '') +'" '+
                                'style="background-color:'+ color +';" '+
                                'onclick="blocklist.getById('+ state.id +').picktool(\''+ ele +'\')">'+ ele +'</span>';
                }).join(''));
        },

        updatepanel: function() {
            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepanelprogress").html(Math.floor(state.counter*100/20));
        },

        picktool: function(newtool) {
            $("#sidepaneltool"+ multireplace(state.targettool, ' ', '')).css({"background-color": 'red'});
            state.targettool = newtool;
            $("#sidepaneltool"+ multireplace(state.targettool, ' ', '')).css({"background-color": 'green'});
        }
    }
    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#"+ state.tile.id +"imageholder").html('<img src="img/twinemaker.png" />');
    return Object.assign(state, blockHandlesItems(state));
}