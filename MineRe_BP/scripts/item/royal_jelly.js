export const RoyalJelly = {
  onCompleteUse(arg) {
    const player = arg.source;
    player.addEffect("absorption", 900 * 20, {
      amplifier: 3,
      showParticles: false,
    });
    player.addEffect("regeneration", 5 * 20, { amplifier: 1 });
  },
};
