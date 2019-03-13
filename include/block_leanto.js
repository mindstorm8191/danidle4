let leanto = mapsquare => {
    let state = {
        name: "leanto",
        tile: mapsquare,
        id: lastblockid,
        counter: 0,
        endurance: 0, // Rather than using the counter to count down, we will use a second variable to determine how much
        // total endurance we can generate within the 'construction' time (based on what tools are used)
        status: 0,

        update: function() {
            // Handles updating this block every tick

            if (state.status == 0) {
                // This device is currently under construction
                // We may add a check for the availability of tools later, but for now we will simply assume none are available

                if (workpoints <= 0) return; // Unable to build this without a worker
                workpoints--;

                state.counter++;
                state.endurance += 5;
                $("#" + state.tile.id + "progress").css({ width: state.counter * 0.5 });
                if (state.counter >= 120) {
                    // aka 2 minutes
                    state.status = 1;
                    state.counter = state.endurance; // this will be 5 minutes if no tools are used (it will be longer with tools)
                    $("#" + state.tile.id + "progress").css({ "background-color": "brown" });
                }
            } else {
                state.counter--;
                $("#" + state.tile.id + "progress").css({ width: (state.counter * 60.0) / state.endurance });
                //console.log('Counter '+ state.counter +', endurance '+ state.endurance);
                if (state.counter <= 0) {
                    state.status = 0; // Go back to building this again
                    state.endurance = 0;
                    state.counter = 0;
                    $("#" + state.tile.id + "progress").css({ "background-color": "green" });
                }
            }
        },
        drawpanel: function() {
            $("#sidepanel").html(
                "<b>Lean-To</b><br />" +
                    "Before food, even before water, one must find shelter from the elements. It is the first requirement for survival; " +
                    "for the elements, at their worst, can defeat you faster than anything else.<br />" +
                    "<br />" +
                    "Consisting of a downed branch with leaves on top, this is easy to set up, needing no tools - but wont last long in " +
                    "the elements itself. With luck, youll be able to upgrade this soon enough<br />" +
                    "<br />" +
                    "Once set up, will require regular maintenance to remain functional.<br />" +
                    "<br />" +
                    state.showPriority() +
                    "<br />"
            );
            if (state.status == 0) {
                $("#sidepanel").append(
                    'Status: <span id="sidepanelstatus">Building: ' +
                        Math.floor(state.counter / 1.2) +
                        "% complete</span>"
                );
            } else {
                $("#sidepanel").append(
                    'Status: <span id="sidepanelstatus">In use. ' +
                        Math.floor(state.endurance / 6) +
                        "% lifespan remaining</span>"
                );
            }
        },
        updatepanel: function() {
            if (state.status == 0) {
                $("#sidepanelstatus").html("Building: " + Math.floor(state.counter / 1.2) + "% complete");
            } else {
                $("#sidepanelstatus").html(
                    "In use. " + Math.floor((state.counter * 100.0) / state.endurance) + "% lifespan remaining"
                );
            }
        },
        getItem: function(itemlist) {
            return null; // This block has no items and outputs no items
        }
    };
    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/leanto.png" />');
    return Object.assign(state, blockHasWorkerPriority(state));
};
