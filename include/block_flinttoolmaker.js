const flinttoolmaker = mapsquare => {
    let state = {
        name: "Flint Tool Maker",
        tile: mapsquare,
        id: lastblockid,
        counter: 0,
        allowOutput: true,

        outputItems: [
            { name: "None", needs: [] }, // 'none' is included so we can simply list all the items later
            {
                name: "Flint Hatchet",
                prereq: [],
                parts: [
                    { name: "Short Stick", qty: 1 },
                    { name: "Twine", qty: 1 },
                    { name: "Flint Hatchet Head", qty: 1 }
                ],
                craftTime: 20,
                isTool: true,
                endurance: 100,
                enduranceGain: 2,
                enduranceTaper: 0.05,
                efficiency: 2,
                efficiencyGain: 0.05,
                efficiencyTaper: 0.001
            },
            {
                name: "Flint Hoe",
                prereq: [],
                parts: [{ name: "Long Stick", qty: 1 }, { name: "Twine", qty: 1 }, { name: "Flint Hoe Head", qty: 1 }],
                craftTime: 20,
                isTool: true,
                endurance: 100,
                enduranceGain: 1.8,
                enduranceTaper: 0.05,
                efficiency: 1,
                efficiencyGain: 0.05,
                efficencyTaper: 0.001
            },
            {
                name: "Flint Spear",
                prereq: [],
                parts: [
                    { name: "Long Stick", qty: 1 },
                    { name: "Twine", qty: 1 },
                    { name: "Flint Spear Head", qty: 1 }
                ],
                craftTime: 20,
                isTool: true,
                endurance: 100,
                enduranceGain: 1.6,
                enduranceTaper: 0.05,
                efficiency: 1,
                efficiencyGain: 0.05,
                efficiencyTaper: 0.01
            },
            {
                name: "Twine Table",
                prereq: [],
                parts: [{ name: "Long Stick", qty: 5 }, { name: "Short Stick", qty: 16 }, { name: "Twine", qty: 5 }],
                craftTime: 20,
                isTool: true,
                endurance: 100,
                enduranceGain: 1,
                enduranceTaper: 0.001,
                efficiency: 1,
                efficiencyGain: 0,
                efficiencyTaper: 0
            },
            {
                name: "Twine Sled",
                prereq: [],
                parts: [{ name: "Long Stick", qty: 8 }, { name: "Short Stick", qty: 8 }, { name: "Twine", qty: 5 }],
                craftTime: 20,
                isTool: true,
                endurance: 100,
                enduranceGain: 1,
                enduranceTaper: 0.0001,
                efficiency: 1,
                efficiencyGain: 0,
                efficiencyTaper: 0
            },
            {
                name: "Twine Raft",
                prereq: [],
                parts: [{ name: "Long Stick", qty: 6 }, { name: "Short Stick", qty: 3 }, { name: "Twine", qty: 3 }],
                craftTime: 20,
                isTool: true,
                endurance: 100,
                enduranceGain: 1,
                enduranceTaper: 0.0001,
                efficiency: 1,
                efficiencyGain: 0,
                efficiencyTaper: 0
            }
        ],

        update: function() {
            // Handles updating the stats of this block
            if (!state.readyToCraft()) {
                return state.searchForItems();
            }
            state.processCraft(1);
        },

        drawpanel: function() {
            $("#sidepanel").html(
                "<b>Flint Tool Maker</b><br />" +
                    "<br />" +
                    "Flint tools might get you started, but before long you're going to need better tools. Crafting " +
                    "wooden handles onto your flint blades gives you a few better tools.<br />" +
                    "<br />" +
                    "Provide with twine, sticks and flint tool heads to produce a new variety of tools<br />" +
                    "<br />" +
                    state.showPriority() +
                    "<b>Items Needed</b><br />" +
                    '<div id="sidepanelparts">' +
                    state.drawStocks() +
                    "</div>" +
                    'Finished tools on hand: <span id="sidepanelonhand">' +
                    state.onhand.length +
                    "</span><br />" +
                    state.drawOutputChoices()
            );
        },

        updatepanel: function() {
            $("#sidepanelparts").html(state.drawStocks());
        },

        pickcraft: function(newcraft) {
            $("#sidepanelchoice" + multireplace(state.targetcraft, " ", "")).css({
                "background-color": "grey"
            });
            state.targetcraft = newcraft;
            $("#sidepanelchoice" + multireplace(state.targetcraft, " ", "")).css({
                "background-color": "green"
            });
        }
    };

    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/flinttoolset.png" />');
    return Object.assign(
        state,
        blockOutputsItems(state),
        blockHasSelectableCrafting(state),
        blockHasWorkerPriority(state)
    );
};
