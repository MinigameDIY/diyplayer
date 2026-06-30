export const projects = [
  '/projects/flap.sb3',
  '/projects/sweetboy.sb3',
  '/projects/honse.sb3',
];

export const pickRandom = (exclude?: string) => {
  const pool = projects.filter(p => p !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
};