import type { CoachActivityContext, CoachProfileContext } from "../client/src/lib/coachContext";

export function generateFallbackCoachAnswer(question: string, profile: CoachProfileContext, activity: CoachActivityContext): string {
  const role = profile.role || "Cricketer";
  const level = profile.level || "Club";
  const goal = profile.goal || "performance consistency";
  const q = question.toLowerCase();

  // 1. Cut Shot & Back-Foot Off-Side Play
  if (q.includes("cut") || q.includes("point") || q.includes("backward punch")) {
    return `**Coach note** For a crisp square or late cut, wait for width outside off-stump and move your back foot across towards off-stump, not backwards. Keep your hands high near your rear ear, let the ball travel deep under your eyeline, and roll your wrists over at contact with a horizontal blade to keep the ball firmly grounded.

**Next practice**
1. 20 drop-feed repetitions from a partner standing on the off-side, letting the ball bounce past your hips before cutting into a target cone gate.
2. 18 throw-downs back-of-a-length outside off, focusing on transferring weight onto your rear toe before punching down.
3. 15 match-scenario net balls where you leave any delivery within the fourth-stump line and punish anything wider through backward point.

**Watch** Do not reach for the ball with your arms; let the width come to you and ensure your head stays slightly over the contact zone.`;
  }

  // 2. Pull Shot & Hook Shot (Short-Pitch Bowling)
  if (q.includes("pull") || q.includes("hook") || q.includes("bouncer") || q.includes("short-pitch") || q.includes("short ball")) {
    return `**Coach note** The secret to mastering the pull shot at the ${level} tier is early head position and a balanced back-and-across trigger. Swivel smoothly on the ball of your front foot, strike the ball well in front of your chest with extended arms, and roll both wrists over the ball at the moment of impact to direct it down into the turf.

**Next practice**
1. 20 medicine-ball or tennis-ball side-toss pulls, catching the ball high in front of your eyes and rolling the top hand over.
2. 18 underarm drop-bounces struck with a short-handle bat or tennis racket to groove front-foot swivel balance.
3. 24 side-arm throw-downs at rib height, alternating between rolling wrists down along the carpet and high loft over midwicket when free to attack.

**Watch** Keep your weight forward-biased during the swivel; leaning backwards lifts the ball and creates top-edge catches.`;
  }

  // 3. Cover Drive, Straight Drive & Front-Foot Batting
  if (q.includes("drive") || q.includes("front foot") || q.includes("cover") || q.includes("straight") || q.includes("on drive") || q.includes("off drive")) {
    return `**Coach note** For pure drive execution, your head must lead your front stride towards the pitch of the ball before your hands begin the downswing. Anchor the stroke with a firm top-hand grip while the bottom hand acts merely as a relaxed guide, making contact directly beneath your eyes with a high front elbow pointing towards the target area.

**Next practice**
1. 20 shadow drives in front of a mirror, checking that your front knee bends directly over the toe and your head remains still at the imaginary contact point.
2. 24 stationary tee or drop-feed drives through target cones placed between extra cover and mid-off.
3. 18 half-volley throw-downs with strict instructions to hold your classical follow-through for 3 seconds on every stroke.

**Watch** Avoid pushing out with hard hands ahead of your front knee; let the ball come under your eyes before releasing the bat face.`;
  }

  // 4. Playing Spin (Sweep, Footwork, Soft Hands)
  if (q.includes("spin") && (q.includes("bat") || q.includes("play") || q.includes("sweep") || q.includes("step out") || q.includes("footwork") || q.includes("facing"))) {
    return `**Coach note** Playing quality spin requires decisive footwork—either commit fully forward to smother the spin at the pitch of the ball, or press right back to play off the back foot with soft hands. For the sweep, reach forward onto a bent front knee with your head down over the ball, striking from high to low to eliminate top edges.

**Next practice**
1. 20 stationary sweep repetitions off a low cone, ensuring your head dips over your front knee and the bat swings through an inclined plane.
2. 18 net balls against off-spin/leg-spin focusing purely on a sharp forward press with soft bottom hand, dropping defensive blocks at your feet.
3. 15 dance-down balls: take two compact, balanced steps out of your crease to convert good-length spin into a controlled half-volley drive.

**Watch** Read the bowler's seam revolutions out of the hand rather than reacting off the pitch; keep your bat in front of your pad.`;
  }

  // 5. Batting Defense, Edge Control & Leaving the Ball
  if (q.includes("defen") || q.includes("edge") || q.includes("leave") || q.includes("outswing") && q.includes("bat")) {
    return `**Coach note** Eliminating outside edges against moving balls requires discipline around the fourth-stump corridor. Play with exceptionally soft hands on the bat handle so that even if an edge occurs, the ball drops dead into the turf well before reaching slip fielders. Align your backlift towards second slip to keep the bat face straight through the line.

**Next practice**
1. 25 throw-downs specifically targeting fourth and fifth stump: practice leaving anything you do not have to play with high bat withdrawal.
2. 20 front-foot defensive drops using only your top hand on the handle to enforce soft grip pressure at impact.
3. 18 side-arm net deliveries on a testing good length, aiming to drop the ball softly within a 1-meter circle around your crease.

**Watch** Align your head outside off-stump to judge the off-stump line clearly; do not chase deliveries angling away from your body.`;
  }

  // 6. Swing Bowling (Outswing, Inswing, Reverse)
  if (q.includes("swing") || q.includes("outswing") || q.includes("inswing") || q.includes("seam")) {
    return `**Coach note** Swing bowling is governed by seam angle, wrist firmness, and shiny-side aerodynamics. For outswing, angle the seam towards first slip with your index and middle fingers slightly across the seam and wrist locked behind the ball. For inswing, tilt the seam towards fine leg and pull your non-bowling arm down firmly past your left hip (for right-arm bowlers).

**Next practice**
1. 15 walk-through release drills throwing a two-tone cricket ball from 10 yards, checking for clean 45-degree seam stability in the air.
2. 18 spot-deliveries off full run-up targeting a chalk target on the fourth-stump line to calibrate late movement through the air.
3. 12 match-intensity deliveries alternating between holding the seam upright for deck nip and angling the seam for orthodox swing.

**Watch** Keep your bowling wrist firm and upright at release; a floppy or broken wrist dissipates ball revolutions and destroys swing.`;
  }

  // 7. Yorker, Slower Ball & Death Bowling
  if (q.includes("yorker") || q.includes("death") || q.includes("slower") || q.includes("knuckle") || q.includes("cutter")) {
    return `**Coach note** Death bowling consistency demands repeatable execution under pressure. For yorkers, fix your eyes intensely on the popping crease at the base of the batsman's toes—not on the stumps. For deceptive slower balls (back-of-the-hand or off-cutter), maintain 100% arm speed throughout your delivery stride so the batsman cannot read the change of pace early.

**Next practice**
1. 18 target deliveries bowling at a small towel or flat marker placed right on the batting popping crease line.
2. 12 slower-ball deliveries with an assistant timing your arm speed on video to verify no deceleration occurs before release.
3. 18 death-over simulation balls: 6 wide yorkers outside off, 6 hard into-the-pitch cutters, and 6 stump-to-stump yorkers.

**Watch** Commit fully through your follow-through without shortening your stride when executing disguised slower deliveries.`;
  }

  // 8. Spin Bowling Mechanics (Off-Spin, Leg-Spin, Googly)
  if (q.includes("spin") && (q.includes("bowl") || q.includes("googly") || q.includes("doosra") || q.includes("drift") || q.includes("flight") || q.includes("turn"))) {
    return `**Coach note** Effective spin bowling comes from explosive finger/wrist revolutions coupled with a strong pivot over your braced front leg. Drive your non-bowling hip and shoulder towards the target to generate drift and dip through aerodynamic revolutions, landing the ball on a teasing length that draws the batter forward.

**Next practice**
1. 25 stationary pivot drills: stand at delivery stride and snap your wrist/fingers vigorously to impart maximum overspin and bite.
2. 20 spot-bowling overs targeting a dinner-plate target on fourth stump, varying the trajectory between flat dart and looped flight.
3. 15 variation balls (e.g. googly, flipper, or arm-ball) focusing on hiding the ball grip until the final gather step.

**Watch** Ensure your front foot lands pointing between 10 and 11 o'clock (for right-arm spin) to permit full hip rotation through release.`;
  }

  // 9. Fast Bowling Action, Pace & Run-up
  if (q.includes("pace") || q.includes("fast") || q.includes("run-up") || q.includes("action") || q.includes("speed") || q.includes("gather")) {
    return `**Coach note** Generating express pace without injury requires a rhythmic, accelerating approach and a braced front leg at delivery stride. Build momentum smoothly through your run-up, gather high with your non-bowling arm pulling violently downwards, and lock your front knee upon impact to act as a catapult propelling ball speed towards the target.

**Next practice**
1. 10 rhythm run-up accelerations without releasing the ball, ensuring your strides stay balanced and your speed peaks at the jump.
2. 15 medicine-ball chest and rotational throws to condition explosive core transfer and front-arm pull.
3. 18 full-throttle deliveries bowling off your full approach, with a partner verifying that your front knee stays braced at ball release.

**Watch** Never cross your feet in your final two strides; maintain linear momentum driving directly towards the wicket.`;
  }

  // 10. Wicketkeeping & Fielding (Catches, Ground Field, Direct Hits)
  if (q.includes("catch") || q.includes("field") || q.includes("keeper") || q.includes("glove") || q.includes("slip") || q.includes("throw")) {
    return `**Coach note** Elite fielding and wicketkeeping are built on low center of gravity, relaxed soft hands, and head stillness. At the moment the bowler releases the ball, take a light split-step ready to pounce in any direction. For slip and close catches, cup your hands softly and watch the ball right into the palms without jabbing forward.

**Next practice**
1. 30 reaction slip-catch simulations off an edge-board or reflex mat with soft, relaxed fingers.
2. 20 boundary-running ground pickups followed by explosive crow-hop throws targeting a single stump at the bowler's end.
3. 15 standing-up keeping takes on leg-stump with an assistant dropping low bounces to train soft, absorbing wrists.

**Watch** Keep your fingers pointed down or up depending on ball height, never pointing directly at the incoming ball.`;
  }

  // 11. Cricket Fitness, Nutrition, Stamina & Recovery
  if (q.includes("fit") || q.includes("stamina") || q.includes("diet") || q.includes("nutrition") || q.includes("recover") || q.includes("warm") || q.includes("strength")) {
    return `**Coach note** Cricket conditioning requires a blend of rotational power, sprint repeat endurance, and match-day nutritional discipline. Fuel up with complex carbohydrates (oats, brown rice, bananas) 2-3 hours before play, hydrate with electrolyte water every 30 minutes, and complete dynamic groin and thoracic mobility drills prior to taking the field.

**Next practice**
1. 6 sets of 20-meter sprint repeats with a 25-second jog recovery to replicate quick singles and bowling spells.
2. 3 sets of 12 rotational medicine-ball slams and Bulgarian split squats to build trunk stability and knee joint resilience.
3. 15 minutes of post-session static hip-flexor, hamstring, and lat stretching accompanied by 25g of fast-digesting protein and hydration.

**Watch** Avoid heavy, greasy meals within 3 hours of play; prioritize steady blood sugar and optimal neuromuscular freshness.`;
  }

  // Default Comprehensive Cricket Coaching Advice
  return `**Coach note** Consistent cricket performance at the ${level} tier comes from structured preparation, still balance at point of execution, and clear tactical clarity under match pressure. Prioritizing deliberate quality repetitions over mindless volume will accelerate your ${goal}.

**Next practice**
1. 15 minutes of dynamic cricket-specific agility, hip mobility, and rotational core activation.
2. 24 high-concentration skill repetitions with a clear scoring or line-and-length constraint tailored to your ${role} role.
3. 10 minutes of active reflection and hydration, noting what contact or release cues felt most repeatable under pressure.

**Watch** Monitor your balance and energy through the final third of the session to ensure technique remains sharp and fatigue does not degrade your mechanics.`;
}

export function generateFallbackDashboardInsight(profile: CoachProfileContext, activity: CoachActivityContext, filterLabel: string): string {
  const matches = activity.matches || [];
  const totalRuns = matches.reduce((sum, m) => sum + (Number(m.runs) || 0), 0);
  const totalBalls = matches.reduce((sum, m) => sum + (Number(m.ballsFaced) || 0), 0);
  const totalWickets = matches.reduce((sum, m) => sum + (Number(m.wickets) || 0), 0);
  const totalFours = matches.reduce((sum, m) => sum + (Number(m.fours) || 0), 0);
  const totalSixes = matches.reduce((sum, m) => sum + (Number(m.sixes) || 0), 0);
  const strikeRate = totalBalls ? Math.round((totalRuns / totalBalls) * 100) : 0;
  const boundaryRuns = (totalFours * 4) + (totalSixes * 6);
  const boundaryPercentage = totalRuns > 0 ? Math.round((boundaryRuns / totalRuns) * 100) : 0;

  return `**Strength** In "${filterLabel}", you logged ${matches.length} matches with ${totalRuns} total runs (strike rate: ${strikeRate || "active"}) and ${totalWickets} wickets. Boundary scoring accounted for ${boundaryPercentage}% of your total runs (${totalFours} fours, ${totalSixes} sixes), demonstrating reliable attacking intent.

**Opportunity** Focus on single conversion and middle-overs strike rotation to eliminate dot-ball pressure when boundaries are cut off by deep fielders, while maintaining bowling discipline on a fourth-stump line.

**Next session**
1. 18 scenario balls in the nets with field restrictions: practice rotating strike with soft-hands taps into vacant gap areas.
2. Bowl 12 pressure-phase deliveries (6 yorkers and 6 hard good-length balls) targeting a single stump.`;
}

