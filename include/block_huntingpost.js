// block_huntingpost.js
// The place where players hunt for nearby game animals. Produces meats, along with other animal-based resources (such as )

const huntingpost = mapsquare => {
    let state = {
        name: "huntingpost",
        tile: mapsquare,
        id: lastblockid,
        counter: 0,
        allowOutput: true,
        //outputitems: [{name: "None"}] - but wait - this has randomized output - not user-selected output
        outputItems: [
            { name: "Dead Deer", isFood: false },
            { name: "Dead Wolf", isFood: false },
            { name: "Dead Chicken", isFood: false }
        ],
        toolChoices: ["None", "Flint Spear"],
        craftTime: 30,

        update: function() {
            // Start by checking the size of our onhand array
            if (state.onhand.length > 15) return;
            // Next, verify our tools will allow us to continue
            if (workpoints <= 0) return;
            const eff = state.checkTool();
            if (eff === null) return;
            state.processCraft(eff);
        },

        drawpanel: function() {
            $("#sidepanel").html(
                "<b>Hunting Post</b><br />" +
                    "<br />" +
                    "Humans are not herbivores.  They require meats equally as much as plants. Without good sources of both, " +
                    "the body will struggle to survive.<br />" +
                    "<br />" +
                    "Uses weapons to hunt game animals in the area. Once killed, brings the animals back here for further uses.<br />" +
                    "<br />" +
                    state.showPriority() +
                    'Hunting progress: <span id="sidepanelprogress">' +
                    Math.floor((this.counter * 100) / state.craftTime) +
                    "</span><br />" +
                    "<br />" +
                    "<br />"
            );
            state.showOutput();
            state.showTools();
        },

        updatepanel: function() {
            // Handle updating any fields in the side panel that may change between ticks
            $("#sidepanelprogress").html(Math.floor((this.counter * 100) / state.craftTime));
            state.updateOutput();
        }
    };
    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/huntingpost.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockRequiresTool(state),
        blockHasRandomizedOutput(state),
        blockHasWorkerPriority(state),
        blockShowsOutputItems(state)
    );
};
