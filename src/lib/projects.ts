export const projects = [
  '/projects/flap.sb3',
  '/projects/sweetboy.sb3',
  '/projects/honse.sb3',
  '/projects/poke.sb3',
  '/projects/grid.sb3',
  '/projects/Add Yourself RIGHT NOW QUICK DO IT YOU HAVE SIX SECONDS.sb3',
  '/projects/splode them rocks 3 i gotta pee.sb3',
  '/projects/operation gurt.sb3',
];

export const pickRandom = (exclude?: string) => {
  const pool = projects.filter(p => p !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
};