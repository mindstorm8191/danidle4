// Stick Maker
// Allows the user to

const stickmaker = mapsquare => {
    let state = {
        name: "Stick Maker",
        tile: mapsquare,
        id: lastblockid,
        counter: 0,
        allowOutput: true,
        toolChoices: ["None", "Flint Stabber", "Flint Hatchet"],
        currenttool: null,
        targettool: "None",
        outputItems: [
            { name: "None", prereq: [], parts: [], isTool: false },
            { name: "Short Stick", prereq: [], parts: [], isTool: false, craftTime: 30 },
            { name: "Long Stick", prereq: [], parts: [], isTool: false, craftTime: 30 },
            { name: "Log", prereq: ["Flint Hatchet"], parts: [], isTool: false, craftTime: 80 }
        ],

        possibleoutputs: function() {
            return outputItems.map(function(ele) {
                return ele.name;
            });
        },

        update: function() {
            if (state.onhand.length >= 15) return;
            if (!state.readyToCraft()) return;
            const eff = state.checkTool();
            if (eff === null) return;
            state.processCraft(eff);
        },

        drawpanel: function() {
            $("#sidepanel").html(
                "<b>Stick Maker</b><br />" +
                    "<br />" +
                    "The effective use of wood is crucial for continued expansion of your colony. Durable yet " +
                    "easily workable, and there's plenty to be made use of.<br />" +
                    "<br />" +
                    "Cuts down small trees and branches of larger ones to produce sticks of various sizes, including " +
                    "firewood.<br />" +
                    "<br />" +
                    state.showPriority() +
                    'Items on hand: <span id="sidepanelonhand">' +
                    state.onhand.length +
                    "</span><br />" +
                    'Currently building: <span id="sidepanelcurrent">' +
                    state.currentcraft +
                    "</span><br />" +
                    'Current progress: <span id="sidepanelprogress">' +
                    Math.floor((state.counter * 100) / 30) +
                    "</span>%<br />" +
                    "<br />" +
                    state.drawOutputChoices()
            );
            state.showTools();
        },

        updatepanel: function() {
            $("#sidepanelonhand").html(state.onhand.length);
            $("#sidepanelcurrent").html(state.currentcraft);
            $("#sidepanelprogress").html(Math.floor((state.counter * 100) / 30));
        }
        /*
        pickcraft: function(newcraft) {
            $("#sidepanelchoice" + multireplace(state.targetcraft, " ", "")).css({ "background-color": "grey" });
            state.targetcraft = newcraft;
            $("#sidepanelchoice" + multireplace(state.targetcraft, " ", "")).css({ "background-color": "green" });
        },

        picktool: function(newtool) {
            $("#sidepaneltool" + multireplace(state.targettool, " ", "")).css({ "background-color": "red" });
            state.targettool = newtool;
            $("#sidepaneltool" + multireplace(state.targettool, " ", "")).css({ "background-color": "green" });
        }
*/
    };

    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/stickmaker.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockRequiresTool(state),
        blockHasSelectableCrafting(state),
        blockHasWorkerPriority(state)
    );
};
