// Firewood collector
// For DanIdle Version 4
// Allows colonists to collect loose dried wood from the local area, for burning in fires

let firewoodmaker = mapsquare => {
    let state = {
        name: "firewoodmaker",
        tile: mapsquare,
        id: lastblockid,
        counter: 0,
        allowOutput: true,
        craftTime: 6,

        outputItems: [
            { name: "Small Firewood", isFood: false },
            { name: "Medium Firewood", isFood: false },
            { name: "Large Firewood", isFood: false }
        ],

        update: function() {
            if (state.onhand.length >= 15) return; // We already have a bunch of sticks. Time to stop
            state.processCraft(1);
        },

        drawpanel: function() {
            $("#sidepanel").html(
                "<b><center>Firewood Collector</center></b><br />" +
                    "<br />" +
                    "Fires don't burn on their own. You need to collect firewood from the surrounding lands. Dead wood is dry " +
                    "and burns much better than freshly cut wood.<br />" +
                    "<br />" +
                    "Collects firewood from the surrounding lands. Place next to a campfire to provide the fire with fuel.<br />" +
                    "<br />" +
                    state.showPriority() +
                    'Current progress: <span id="sidepanelprogress">' +
                    Math.floor((state.counter / state.craftTime) * 100) +
                    "</span>%<br />" +
                    'Wood on hand: <span id="sidepanelonhand">' +
                    state.onhand.length +
                    "</span>"
            );
        },

        updatepanel: function() {
            $("#sidepanelprogress").html(Math.floor((state.counter / state.craftTime) * 100));
            $("#sidepanelonhand").html(state.onhand.length);
        }
    };
    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/firewoodmaker.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockHasRandomizedOutput(state),
        blockHasWorkerPriority(state),
        blockShowsOutputItems(state)
    );
};
