const flinttoolmaker = mapsquare => {
    let state = {
        name: "Item Hauler",
        tile: mapsquare,
        id: lastblockid,
        counter: 0,
        //allowOutput: true,  // This block won't be using the getItem function
        mode: "idle",

        update() {
            // Handles updating this block's activities
            switch (state.mode) {
                case "idle":
                // Nothing currently being held. Search the destination blocks to determine if there's anything on hand we can pick up
                case "deliver":
                case "return":
            }
        },

        drawpanel() {
            // draws the content on the right side of the screen, when this block is selected
            $("#sidepanel").html(
                "<center><b>Item Hauler</b></center>" +
                    "<br />" +
                    "No matter how well you organize your factory, you' still need to transport items around. This uses man-power to move any " +
                    "item from one block to another.<br />" +
                    "<br />"
            );
            // Now, generate a list of potential blocks this block can carry to the other blocks
        },

        updatepanel() {}
    };
    lastblockid++;
    blocklist.push(state);
    mapsquare.structure = state;
    $("#" + state.tile.id + "imageholder").html('<img src="img/flinttoolset.png" />');
    return Object.assign(state);
};
