
/**
 *  This function calculates the final XP to be awarded to a user for completing a task.
 *  It takes into account the task's base XP, the estimated duration in days, the difficulty level,
 * @param {*} taskXP - The base XP of the task
 * @param {*} estimatedDays - The estimated duration of the task in days
 * @param {*} difficulty - The difficulty level of the task, which can be 'easy', 'medium', or 'hard'
 * @param {*} startedDate - The start date of the task
 * @param {*} endDate - The end date of the task
 * @returns The final XP to be awarded to the user
 */
export const calculateXPGamification = (
  taskXP,
  estimatedDays,
  difficulty,
  startedDate,
  endDate,
) => {
  // We convert the start date and end date to Date objects
  const startDate = new Date(startedDate);
  const endDateObj = new Date(endDate);

  // We calculate the real duration of the task in days
  const durationRealDays = Math.ceil(
    (endDateObj - startDate) / (1000 * 60 * 60 * 24),
  );

  // Calcular el multiplicador por dificultad
  const difficultyMultiplier = (() => {
    switch (difficulty.toLowerCase()) {
    case 'easy':
      return 0.8; // Less XP for easy tasks
    case 'medium':
      return 1.0; // Normal XP
    case 'hard':
      return 1.5; // More XP for hard tasks
    default:
      throw new Error(
        'Invalid difficulty level. Choose from: easy, medium, hard.',
      );
    }
  })();

  // Calculates the penalty or bonus based on the task duration
  const durationMultiplier = durationRealDays <= estimatedDays ? 1.2 : 0.9;

  // Calculate the final XP to be awarded
  const finalXP = Math.round(
    taskXP * difficultyMultiplier * durationMultiplier,
  );

  return finalXP;
};
