// The detailed workout plan structure
export const PPL_WORKOUT_PLAN = [
    { day: "Sunday", muscleGroup: "REST", exercises: [] }, // Day 0
    {
      day: "Monday", muscleGroup: "PUSH", exercises: [
        { name: "Incline Dumbbell Press", sets: 3, reps: "8-10", rationale: "Builds foundational upper chest strength.", cues: "Control the negative; stop just short of lockout to maintain tension." },
        { name: "Cable Chest Press", sets: 3, reps: "10-15", rationale: "Constant tension throughout.", cues: "Squeeze pecs together at the end of the movement." },
        { name: "Low-to-High Cable Fly", sets: 3, reps: "12-15", rationale: "Isolates the clavicular (upper) head of the pec.", cues: "Focus on the stretch at the bottom." },
        { name: "Cable Lateral Raise", sets: 4, reps: "12-20", rationale: "The ultimate constant tension exercise for shoulder width.", cues: "Don't use momentum; lead with the elbows." },
        { name: "Overhead Cable Rope Extension", sets: 3, reps: "10-15", rationale: "Puts the long head under maximum stretch for superior growth.", cues: "Keep elbows stationary." },
        { name: "Cable Rope Pushdown", sets: 3, reps: "12-15", rationale: "Hits the lateral and medial heads.", cues: "Squeeze and spread the rope apart at the bottom." },
      ]
    },
    {
      day: "Tuesday", muscleGroup: "PULL", exercises: [
        { name: "Neutral Grip Pull-Up", sets: 3, reps: "6-10", rationale: "Builds back width. Can be substituted with Lat Pulldowns.", cues: "Pull to the upper chest, leading with elbows." },
        { name: "Seated Cable Row", sets: 3, reps: "10-12", rationale: "Builds back thickness.", cues: "Drive elbows back and squeeze shoulder blades together." },
        { name: "Face Pull", sets: 4, reps: "15-20", rationale: "Crucial for shoulder health and posture.", cues: "Pull the rope towards your face, aiming to get your hands by your ears." },
        { name: "Bayesian Cable Curl", sets: 3, reps: "10-12", rationale: "Perform a standard cable curl but lean back slightly.", cues: "Places a greater stretch on the long head of the bicep." },
        { name: "Cable Spider Curl", sets: 3, reps: "12-15", rationale: "Isolates the short head at peak contraction.", cues: "Lie chest-down on an incline bench facing a low cable pulley." },
        { name: "Cable Reverse Curl", sets: 3, reps: "12-15", rationale: "Hits the brachioradialis for thicker forearms.", cues: "Use an EZ-bar or straight bar attachment." },
      ]
    },
    {
      day: "Wednesday", muscleGroup: "LEGS", exercises: [
          { name: "Hack Squat", sets: 3, reps: "8-12", rationale: "Constant tension on the quads with great stability.", cues: "Control the negative and drive through your mid-foot." },
          { name: "Single-Leg Leg Extension", sets: 3, reps: "12-15", rationale: "Isolates the quadriceps.", cues: "Squeeze for a 2-second hold at the top of each rep." },
          { name: "Romanian Deadlift (Dumbbell)", sets: 3, reps: "10-12", rationale: "Emphasizes the stretch in the hamstrings.", cues: "Hinge at the hips, keeping your back straight." },
          { name: "Lying Leg Curl Machine", sets: 4, reps: "12-15", rationale: "Pure isolation with constant tension.", cues: "Focus on pulling with your hamstrings, not your lower back." },
          { name: "Cable Pull-Through", sets: 3, reps: "15-20", rationale: "A constant tension hip hinge.", cues: "Squeeze your glutes hard at the top of the movement." },
          { name: "Seated Calf Raise", sets: 4, reps: "15-25", rationale: "Hits the soleus muscle.", cues: "Pause for 2 seconds at the bottom (stretch) and 2 seconds at the top (contraction)." },
      ]
    },
    { day: "Thursday", muscleGroup: "PUSH", exercises: [/* Same as Day 1 */] },
    { day: "Friday", muscleGroup: "PULL", exercises: [/* Same as Day 2 */] },
    { day: "Saturday", muscleGroup: "LEGS", exercises: [/* Same as Day 3 */] },
  ];
  
  // Populate repeat days
  PPL_WORKOUT_PLAN[4].exercises = PPL_WORKOUT_PLAN[1].exercises;
  PPL_WORKOUT_PLAN[5].exercises = PPL_WORKOUT_PLAN[2].exercises;
  PPL_WORKOUT_PLAN[6].exercises = PPL_WORKOUT_PLAN[3].exercises;