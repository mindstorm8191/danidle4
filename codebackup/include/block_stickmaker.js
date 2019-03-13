const stickmaker = (mapsquare) => {
    let state = {
        name: 'Stick Maker',
        tile: mapsquare,
        priority: blocklist.lastpriority(),
        id: lastblockid,
        counter: 0,
        allowOutput: true,
        onhand: [],
        toolchoices: ['None', 'Flint Stabber'],
        currenttool: null,
        targettool: 'None',
        outputitems: ['None', 'Short Stick', 'Long Stick'],
        currentcraft: 'None',
        targetcraft: 'None',

        possibleoutputs: function() {
            return ['Short Stick', 'Long Stick'];
                // Okay, so this block isn't a replica of a twine maker. We have to sort out what output item we really want
        },

        update: function() {
            if(state.onhand.length>=15) return;
            if(state.currentcraft==='None') {
                if(state.targetcraft==='None') return;
                state.currentcraft = state.targetcraft;
            }
            if(state.currenttool===null) {
                if(state.targettool==='None') return; // We are currently not after any tools
                state.currenttool = blocklist.getInStorage(state.targettool);
                if(state.currenttool===null) return; // No matching tool was found anywhere
            }
            
            state.currenttool.endurance--;
            state.counter += state.currenttool.efficiency;
            if(state.currenttool.endurance<=0) state.currentool = null;
            if(state.counter>=30) { // yes, both short & long sticks will take the same time (you still need just one cut, anyway)
                state.onhand.push(item(state.currentcraft));
                state.counter-=30;
            }
            $("#"+ state.tile.id +"progress").css({"width": state.counter*2});
        },

        drawpanel: function() {
            $("#sidepanel").html('<b>Stick Maker</b><br />'+
                                 '<br />'+
                                 'The effective use of wood is crucial for continued expansion of your colony. Durable yet '+
                                 'easily workable, and there\'s plenty to be made use of.<br />'+
                                 '<br />'+
                                 'Cuts down small trees and branches of larger ones to produce sticks of various sizes, including '+
                                 'firewood.<br />'+
                                 '<br />'+
                                 'Items on hand: <span id="sidepanelonhand">'+ state.onhand.length +'</span><br />'+
                                 'Currently building: <span id="sidepanelcurrent">'+ state.currentcraft +'</span><br />'+
                                 'Current progress: <span id="sidepanelprogress">'+ (Math.floor(state.counter*100/30)) +'</span>%<br />'+
                                 '<br />'+
                                 '<b>Select an output:</b><br />');
            $("#sidepanel").append(     // This doesn't need any filtering (at this time... that may change)
                state.outputitems.map(function (ele) {
                    let color = (state.targetcraft===ele)? 'green' : 'grey';
                    return '<span class="sidepanelbutton" '+
                                 'id="sidepanelchoice'+ multireplace(ele, ' ', '') +'" '+
                                 'style="background-color:'+ color +';" '+
                                 'onclick="blocklist.getById('+ state.id +').pickcraft(\''+ ele +'\')">'+ ele +'</span>';
                }).join(' ')
            );
                // Next, provide a way for the user to select a tool
            $("#sidepanel").append('<br />'+
                                   '<b>Tools (Woodcutter):</b><br />');
            $("#sidepanel").append(
                state.toolchoices.filter(function (tool) {
                    if(tool==='None') return true; // This one gets a free pass
                    if(unlockeditems.includes(tool)) return true;
                    return false;
                }).map(function (ele) {
                    let color = (ele===state.targettool) ? 'green' : 'red';
                    return '<span class="sidepanelbutton" '+
                                 'id="sidepaneltool'+ multireplace(ele, ' ', '') +'" '+
                                 'style="background-color:'+ color +';" '+
                                 'onclick="blocklist.getById('+ state.id +').picktool(\''+ ele +'\')">'+ ele +'</span>';
                }).join('')
            );
        },

        updatepanel: function() {
            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepanelcurrent").html(state.currentoutput);
            $("#sidepanelprogress").html(Math.floor(state.counter*100/30));
        },

        pickcraft: function(newcraft) {
            $("#sidepanelchoice"+ multireplace(state.targetcraft, ' ', '')).css({'background-color': 'grey'});
            state.targetcraft = newcraft; 
            $("#sidepanelchoice"+ multireplace(state.targetcraft, ' ', '')).css({'background-color': 'green'});
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
    $("#"+ state.tile.id +"imageholder").html('<img src="img/stickmaker.png" />');
    return Object.assign(state, blockHandlesItems(state));
}