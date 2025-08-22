export const RoyalJelly = {
  onCompleteUse(arg) {
    const player = arg.source;
    player.addEffect("absorption", 480 * 20, {
      amplifier: 2,
      showParticles: false,
    });
    player.addEffect("regeneration", 5 * 20, { amplifier: 1 });
  },
};
