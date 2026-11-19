// Spec or Wreck render kit — component loader (PRODUCTION_SPEC §8). Each group in components/ is one small file;
// order matters (later groups use earlier helpers). Light flat backgrounds only.
const GROUPS = ["motion", "product", "text", "objects", "health", "measure", "map", "screen", "repair", "pc"];
module.exports = function makeKit(env) {
  const K = { FR: 1 / env.FPS };
  for (const g of GROUPS) require('./components/' + g)(K, env);
  K.SHADOW = K.SHADOW; return K;
};
