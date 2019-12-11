// blockHasNoOutput
// for DanIdle version 4
// Provides functionality for any block that doesn't output items

export const blockHasNoOutput = state => ({
    getItem() {
        // Returns an output item, when given the target item name
        // This block doesn't return anything anyway
        return null;
    },

    possibleOutputs() {
        // Returns a list of items that this block can output.
        // This block won't have anything to return
        return [];
    },

    // inputsAccepted() is not defined here

    willOutput() {
        // Returns true if this block will output the specified item right now.
        // This block won't output anything
        return false;
    }

    // willAccept() is not defined here
    // receiveItem() is not defined here
});

// Hmm. After putting this together, I'm no longer sure it is useful. After all, we could just add all these to the block directly. No need to
// complicate things
