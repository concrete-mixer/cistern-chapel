export const loopFade = 4;
export const reverseProbability = 0.25;

// Gain constants - the idea is loops should be in the background because they're constant,
// OneShot concrete sounds slightly louder to peek over the background loops, and OneShot
// instrumentals should be in the foreground.
// For now we differentiate in 3db increments. This is not an exact science, but seems to be ok
// 90% of the time to my ears.
export const loopVolume = -12;
export const concreteVolume = -9;
export const instrumentalVolume = -6;
