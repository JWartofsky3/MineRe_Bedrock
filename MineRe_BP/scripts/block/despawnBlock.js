export const despawnBlock = {
    onTick(arg) {
        arg.block.setType("minecraft:air");
    },
};
