let rockknapper = (mapsquare) => {
    let state = {
        name: 'rockknapper',
        tile: mapsquare,
        priority: blocklist.lastpriority(),
        id: lastblockid,
        counter: 0,
        allowOutput: true,
        onhand: [],
        currentcraft: 'None',  // What this block is currently working on. Note that this is only changed when the crafting cycle resets
        targetcraft: 'None',    // What the user wants this block to work on.
        outputitems: [{name: "None",               prereq: ''},
                      {name: "Flint Knife",        prereq: '',      crafttime:20, endurance:50},
                      {name: "Flint Stabber",      prereq: '',      crafttime:20, endurance:40},
                      {name: "Flint Hatchet Head", prereq: 'Twine', crafttime:40, endurance:80},
                      {name: "Flint Spear Head",   prereq: 'Twine', crafttime:30, endurance:80},
                      {name: "Flint Hoe Head",     prereq: 'Twine', crafttime:40, endurance:80}],
            // This is the Single Source of Truth to determine what can be built by this block
        possibleoutputs: function() {
            return state.outputitems.map(function(ele) {
                return ele.name;
            }).filter(function(ele) {
                return (ele!='None');
            });
        },
        update: function() {
            if(state.onhand.length>15) return; // We have no room for more equipment anyway

            if(state.currentcraft==='None') {
                if(state.targetcraft==='None') return; // We are not currently building anything, and we have nothing to build
                state.currentcraft = state.targetcraft;
            }

            let crafttime = state.outputitems.find(function(ele) {
                return (ele.name===state.currentcraft);
            }).crafttime;

            state.counter++;
            if(state.counter>=crafttime) {
                state.counter-=crafttime;
                    // Build the item we're currently crafting - what that is depends on other code
                state.onhand.push(tool(state.currentcraft, 1.0, 100));
                    // Now, switch to whatever next tool we need to craft here
                state.currentcraft = state.targetcraft;
            }
            $("#"+ state.tile.id +"progress").css({"width": state.counter*3});
        },

        drawpanel: function() {
            $("#sidepanel").html('<b>Rock Knapper</b><br />'+
                                 '<br />'+
                                 'Tools are critical to survival, and rocks are your first tool. Knapping is the art of smashing '+
                                 'rocks into the shapes you need.<br />'+
                                 '<br />'+
                                 'Knapp rocks to craft either knives or stabbers - you must select one before crafting can begin. '+
                                 'Once crafted, place into a storage unit to use where-ever needed.<br />'+
                                 '<br />'+
                                 'Items on hand: <span id="sidepanelonhand">'+ state.onhand.length +'</span><br />'+
                                 'Currently building: <span id="sidepaneltarget">'+ state.currentcraft +'</span><br />'+
                                 'Current progress: <span id="sidepanelprogress">'+ (Math.floor((state.counter/20)*100)) +'</span>%<br />'+
                                 '<br />'+
                                 '<b>Select an output:</b><br />');
            $("#sidepanel").append(
                state.outputitems.filter(function(ele) {
                    // start by filtering out the blocks we cannot craft
                    if(ele.prereq==='') return true;
                    return unlockeditems.includes(ele.prereq);
                }).map(function(ele) {
                    // For each one, generate a string to return, containing our target output, specific to this item
                    let color = (state.targetcraft===ele.name)? 'green' : 'grey';
                    return '<span class="sidepanelbutton" '+
                                 'id="sidepanelchoice'+ multireplace(ele.name, ' ', '') +'" '+
                                 'style="background-color:'+ color +';" '+
                                 'onclick="blocklist.getById('+ state.id +').pickcraft(\''+ ele.name +'\')">'+ ele.name +'</span>';
                }).join('') // combine all the elements into a single string to pass to .append()
                    // array.join()'s default sparator is ',', so give it a null string for a separator here
            );
        },
        updatepanel: function() {
                // This only manages the few stats shown before the output selection
            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepaneltarget").html(state.currentcraft);
            $("#sidepanelprogress").html(Math.floor((state.counter/20)*100));
        },
        pickcraft: function(newcraft) {
                // This handles the actual task of changing the target output (by user selection)
            $("#sidepanelchoice"+ multireplace(state.targetcraft, ' ', '')).css({'background-color': 'grey'});
            state.targetcraft = newcraft; 
            $("#sidepanelchoice"+ multireplace(state.targetcraft, ' ', '')).css({'background-color': 'green'});
        }
    }
    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#"+ state.tile.id +"imageholder").html('<img src="img/rockknapper.png" />');
    return Object.assign(state, blockHandlesItems(state));
}