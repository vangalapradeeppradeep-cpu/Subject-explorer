window.MODULES = window.MODULES || {};
window.MODULES.physics = (H) => {
  const { THREE, V, group, sphere, box, cyl, cone, arrow, tube, flow, glow, label, clickable, upd, compass, fieldAt, dipoleLines } = H;
  const FIELD = '#67e8f9', CUR = '#fde047', FORCE = '#f472b6', COPPER = '#f59e0b';

  function barMagnet(xray) {
    const g = group();
    const op = xray ? { opacity: 0.28 } : {};
    box(1.6, 0.7, 0.7, '#ef4444', V(0.8, 0, 0), { rough: 0.35, metal: 0.2, ...op }, g);
    box(1.6, 0.7, 0.7, '#3b82f6', V(-0.8, 0, 0), { rough: 0.35, metal: 0.2, ...op }, g);
    label('N', V(0.8, 0.78, 0), { color: '#ef4444', size: 0.32 }, g);
    label('S', V(-0.8, 0.78, 0), { color: '#3b82f6', size: 0.32 }, g);
    dipoleLines(1.45, 0.45, [70, 92, 118, 142], [0, 1, 2, 3, 4, 5].map((i) => (i * Math.PI) / 3), FIELD, g);
    if (xray) {
      for (const [y, z] of [[0, 0], [0.18, 0], [-0.18, 0], [0, 0.18], [0, -0.18]]) {
        const m = tube([V(-1.45, y, z), V(1.45, y, z)], 0.02, CUR, { glow: 0.8 }, { seg: 8, radial: 4 }, g);
        cone(V(0.2, y, z), V(1, 0, 0), CUR, 0.16, {}, g);
        flow(m.userData.curve, 2, '#fff7cc', 0.9, 0.04, g);
      }
      label('Inside the magnet: S → N', V(0, -0.85, 0), { color: CUR, size: 0.2 }, g);
    }
    for (let i = 0; i < 10; i++) {
      const t = (i / 10) * Math.PI * 2;
      const c = compass(V(3.0 * Math.cos(t), 2.0 * Math.sin(t), 0), 0.9, g);
      c.point(fieldAt(c.position, 1.45));
    }
    const mc = compass(V(), 1.6, g);
    upd((t) => {
      const a = t * 0.35;
      mc.position.set(4.4 * Math.cos(a), 2.9 * Math.sin(a), 0);
      mc.point(fieldAt(mc.position, 1.45));
    });
    label('Compass N-end follows the field', V(0, -3.6, 0), { color: '#ef4444', size: 0.2 }, g);
  }

  function circlePts(r, y, n = 48) {
    const p = [];
    for (let i = 0; i < n; i++) { const t = -(i / n) * Math.PI * 2; p.push(V(r * Math.cos(t), y, r * Math.sin(t))); }
    return p;
  }

  function wire() {
    const g = group();
    cyl(V(0, -3.2, 0), V(0, 3.2, 0), 0.1, COPPER, { metal: 0.6, rough: 0.3 }, g);
    box(6.5, 0.04, 6.5, '#cbd5e1', V(0, 0, 0), { opacity: 0.08 }, g);
    label('Cardboard', V(2.9, 0.15, 2.9), { size: 0.16, color: '#94a3b8' }, g);
    flow(new THREE.LineCurve3(V(0, -3.2, 0), V(0, 3.2, 0)), 8, CUR, 1.4, 0.06, g);
    cone(V(0, 3.4, 0), V(0, 1, 0), CUR, 0.35, {}, g);
    label('Current (I) ↑', V(1.0, 3.3, 0), { color: CUR, size: 0.22 }, g);
    for (const [y, rs] of [[0, [0.7, 1.3, 2.0, 2.8]], [1.8, [0.8, 1.5]], [-1.8, [0.8, 1.5]]]) {
      for (const r of rs) {
        const m = tube(circlePts(r, y), 0.02, FIELD, { glow: 0.5 }, { closed: true, seg: 64, radial: 4 }, g);
        const c = m.userData.curve;
        for (const u of [0.1, 0.6]) cone(c.getPointAt(u), c.getTangentAt(u), FIELD, 0.16, {}, g);
        flow(c, 3, '#e0f2fe', 0.9, 0.04, g);
      }
    }
    for (let i = 0; i < 8; i++) {
      const t = (i / 8) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      const cp = compass(V(1.0 * c, 0.12, 1.0 * s), 0.6, g);
      cp.point(V(s, 0, -c));
    }
    const rh = group(g); rh.position.set(-4.6, -0.5, 0);
    arrow(V(0, -1.2, 0), V(0, 1.6, 0), CUR, 0.09, rh);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 6, 40, Math.PI * 1.5), H.mat(FIELD, { glow: 0.7 }));
    arc.rotation.x = -Math.PI / 2; rh.add(arc);
    cone(V(0, 0, 0.7), V(1, 0, 0), FIELD, 0.28, {}, rh);
    label('Right-Hand Thumb Rule', V(0, 2.2, 0), { color: '#fff', size: 0.22 }, rh);
    label('Thumb → Current', V(0, 1.85, 0), { color: CUR, size: 0.17 }, rh);
    label('Curled fingers → Field', V(0, -1.6, 0), { color: FIELD, size: 0.17 }, rh);
  }

  function loop() {
    const g = group(); const R = 1.7;
    const pts = [];
    for (let i = 0; i < 64; i++) { const t = (i / 64) * Math.PI * 2; pts.push(V(R * Math.cos(t), R * Math.sin(t), 0)); }
    const ring = tube(pts, 0.07, COPPER, { metal: 0.6, rough: 0.3 }, { closed: true, seg: 96, radial: 8 }, g);
    const rc = ring.userData.curve;
    flow(rc, 12, CUR, 1.4, 0.06, g);
    for (const u of [0.125, 0.625]) cone(rc.getPointAt(u), rc.getTangentAt(u), CUR, 0.3, {}, g);
    for (const t of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
      const u = V(Math.cos(t), Math.sin(t), 0), P = u.clone().multiplyScalar(R);
      for (const rho of [0.4, 0.8]) {
        const cp = [];
        for (let i = 0; i < 40; i++) { const s = -(i / 40) * Math.PI * 2; cp.push(P.clone().addScaledVector(u, rho * Math.cos(s)).add(V(0, 0, rho * Math.sin(s)))); }
        const m = tube(cp, 0.02, FIELD, { glow: 0.5 }, { closed: true, seg: 48, radial: 4 }, g);
        const c = m.userData.curve;
        cone(c.getPointAt(0.25), c.getTangentAt(0.25), FIELD, 0.14, {}, g);
        flow(c, 2, '#e0f2fe', 0.6, 0.035, g);
      }
    }
    for (const [x, y] of [[0, 0], [0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35]]) {
      const m = tube([V(x, y, -4), V(x, y, 4)], 0.025, FIELD, { glow: 0.7 }, { seg: 8, radial: 4 }, g);
      cone(V(x, y, 2.4), V(0, 0, 1), FIELD, 0.2, {}, g);
      flow(m.userData.curve, 3, '#e0f2fe', 1.0, 0.045, g);
    }
    label('Current: anticlockwise (front view)', V(0, 2.4, 0), { color: CUR, size: 0.2 }, g);
    label('At centre: field ≈ straight, ⟂ to loop', V(0, -2.4, 1.5), { color: FIELD, size: 0.2 }, g);
  }

  class Helix extends THREE.Curve {
    constructor(r, len, turns) { super(); this.r = r; this.len = len; this.turns = turns; }
    getPoint(t, o = new THREE.Vector3()) { const a = t * this.turns * Math.PI * 2; return o.set(-this.len / 2 + t * this.len, Math.cos(a) * this.r, Math.sin(a) * this.r); }
  }

  function solenoid(core) {
    const g = group(); const L = 5, R = 1.0, N = 11;
    const hc = new Helix(R, L, N);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(hc, N * 36, 0.05, 6, false), H.mat(COPPER, { metal: 0.6, rough: 0.3 })));
    flow(hc, 30, CUR, 2.4, 0.05, g);
    for (const [y, z] of [[0, 0], [0.45, 0], [-0.45, 0], [0, 0.45], [0, -0.45]]) {
      const m = tube([V(-2.5, y, z), V(2.5, y, z)], 0.022, FIELD, { glow: 0.7 }, { seg: 8, radial: 4 }, g);
      cone(V(1.0, y, z), V(1, 0, 0), FIELD, 0.18, {}, g);
      flow(m.userData.curve, 3, '#e0f2fe', 1.0, 0.04, g);
    }
    dipoleLines(2.45, 0.95, [75, 100, 125], [0, 1, 2, 3, 4, 5].map((i) => (i * Math.PI) / 3), FIELD, g);
    label('N', V(3.0, 1.3, 0), { color: '#ef4444', size: 0.34 }, g);
    label('S', V(-3.0, 1.3, 0), { color: '#3b82f6', size: 0.34 }, g);
    label('Uniform field inside (parallel lines)', V(0, -1.7, 0), { color: FIELD, size: 0.19 }, g);
    if (core) {
      cyl(V(-2.9, 0, 0), V(2.9, 0, 0), 0.62, '#94a3b8', { metal: 0.8, rough: 0.35, opacity: 0.55 }, g);
      for (let i = 0; i < 5; i++) {
        const y = -0.5 + i * 0.25;
        cyl(V(3.05, y, 0.1 * i - 0.2), V(3.7, y * 1.25, 0.15 * i - 0.3), 0.035, '#cbd5e1', { metal: 0.9, rough: 0.3 }, g);
      }
      glow(V(2.9, 0, 0), '#67e8f9', 2.2, g); glow(V(-2.9, 0, 0), '#67e8f9', 2.2, g);
      label('Soft iron core → strong Electromagnet', V(0, 2.3, 0), { color: '#cbd5e1', size: 0.21 }, g);
      label('Iron nails attracted', V(4.1, -0.9, 0), { size: 0.16, color: '#cbd5e1' }, g);
    }
  }

  function force(rev) {
    const g = group(); const s = rev ? -1 : 1;
    box(2.6, 0.6, 1.8, '#ef4444', V(0, 1.4, 0), { rough: 0.4, metal: 0.2 }, g);
    box(2.6, 0.6, 1.8, '#3b82f6', V(0, -1.4, 0), { rough: 0.4, metal: 0.2 }, g);
    box(2.6, 3.4, 0.4, '#475569', V(0, 0, -1.1), { metal: 0.5, rough: 0.4 }, g);
    label('N', V(0, 1.4, 1.0), { color: '#ef4444', size: 0.3 }, g);
    label('S', V(0, -1.4, 1.0), { color: '#3b82f6', size: 0.3 }, g);
    for (const x of [-0.9, 0, 0.9]) for (const z of [-0.5, 0.45]) arrow(V(x, 1.08, z), V(x, -1.08, z), FIELD, 0.025, g);
    box(6, 0.12, 0.12, '#64748b', V(0, 3.2, 0), { metal: 0.5 }, g);
    const rod = group(g);
    cyl(V(-2.8, 0, 0), V(2.8, 0, 0), 0.08, COPPER, { metal: 0.6, rough: 0.3 }, rod);
    for (const x of [-2.6, 2.6]) cyl(V(x, 0, 0), V(x, 3.2, 0), 0.012, '#cbd5e1', {}, rod);
    flow(rev ? new THREE.LineCurve3(V(2.8, 0, 0), V(-2.8, 0, 0)) : new THREE.LineCurve3(V(-2.8, 0, 0), V(2.8, 0, 0)), 10, CUR, 1.5, 0.05, rod);
    arrow(V(s * 1.5, 0.32, 0), V(s * 2.7, 0.32, 0), CUR, 0.04, rod);
    label('Current (I)', V(s * 2.1, 0.75, 0), { color: CUR, size: 0.19 }, rod);
    arrow(V(-2.25, 0, 0), V(-2.25, 0, -s * 1.5), FORCE, 0.05, rod);
    label('Force (F)', V(-2.25, -0.45, -s * 1.0), { color: FORCE, size: 0.19 }, rod);
    label('Field (B): N → S', V(1.9, -1.0, 0.9), { color: FIELD, size: 0.17 }, g);
    upd((t) => { const k = Math.min(1, t / 1.2); rod.position.z = -s * (0.4 * (1 - Math.pow(1 - k, 3)) + 0.04 * Math.sin(t * 3)); });
    const tr = group(g); tr.position.set(4.2, -1.6, 1.2);
    arrow(V(0, 0, 0), V(0, 0, -s * 1.2), FORCE, 0.045, tr);
    arrow(V(0, 0, 0), V(0, -1.2, 0), FIELD, 0.045, tr);
    arrow(V(0, 0, 0), V(s * 1.2, 0, 0), CUR, 0.045, tr);
    sphere(0.09, '#fff', V(0, 0, 0), { glow: 0.6 }, tr);
    label("Fleming's Left-Hand Rule", V(0, 0.9, 0), { size: 0.2 }, tr);
    label('Thumb: Force', V(0.2, 0.35, -s * 1.3), { color: FORCE, size: 0.15 }, tr);
    label('Forefinger: Field', V(0.3, -1.45, 0), { color: FIELD, size: 0.15 }, tr);
    label('Middle finger: Current', V(s * 1.3, -0.3, 0), { color: CUR, size: 0.15 }, tr);
  }

  function circuit() {
    const g = group();
    const Ly = 1.6, Ny = 0.8, Ey = 0, xs = -2.0, xe = 5.2, RED = '#ef4444', NEU = '#60a5fa', EAR = '#22c55e';
    cyl(V(-6.2, -3, 0), V(-6.2, 2.6, 0), 0.12, '#78716c', {}, g);
    label('Supply\n220 V AC, 50 Hz', V(-6.2, 3.3, 0), { size: 0.17 }, g);
    tube([V(-6.2, 2.4, 0), V(-5.4, 2.0, 0), V(-4.9, Ly, 0)], 0.035, RED, { glow: 0.3 }, {}, g);
    tube([V(-6.2, 2.1, 0), V(-5.5, 1.3, 0), V(-4.9, Ny, 0)], 0.035, NEU, { glow: 0.3 }, {}, g);
    const meter = box(0.9, 1.6, 0.5, '#334155', V(-4.4, 1.1, 0), { metal: 0.4 }, g);
    label('Meter', V(-4.4, 2.15, 0), { size: 0.16 }, g);
    clickable(meter, { title: 'Electricity Meter', body: 'Records the electrical energy consumed (in kWh / units). Placed right after the supply enters the house.' });
    tube([V(-3.95, Ly, 0), V(-3.55, Ly, 0)], 0.035, RED, { glow: 0.3 }, {}, g);
    tube([V(-3.95, Ny, 0), V(xs, Ny, 0)], 0.035, NEU, { glow: 0.3 }, {}, g);
    const fuse = cyl(V(-3.55, Ly, 0), V(-2.85, Ly, 0), 0.13, '#e2e8f0', { opacity: 0.3 }, g);
    const fil = cyl(V(-3.5, Ly, 0), V(-2.9, Ly, 0), 0.02, '#fb923c', { glow: 1.4 }, g);
    const fg = glow(V(-3.2, Ly, 0), '#fb923c', 0.9, g);
    upd((t) => { fg.material.opacity = 0.5 + 0.5 * Math.sin(t * 3); });
    label('Fuse (series, live)', V(-3.2, 2.15, 0), { color: '#fb923c', size: 0.16 }, g);
    clickable(fuse, { title: 'Fuse', body: 'A wire of low melting point connected in series with the live wire. During a short circuit or overloading the current rises sharply; the fuse wire heats up, melts and breaks the circuit, protecting appliances and preventing fire.' });
    clickable(fil, fuse.userData.info);
    tube([V(-2.85, Ly, 0), V(xs, Ly, 0)], 0.035, RED, { glow: 0.3 }, {}, g);
    const sw = box(0.4, 1.3, 0.4, '#475569', V(xs, 1.2, 0), { metal: 0.3 }, g);
    label('Main switch', V(xs, 2.15, 0), { size: 0.15 }, g);
    clickable(sw, { title: 'Main Switch', body: 'Cuts off the supply to the whole house in an emergency or during repairs.' });
    const live = tube([V(xs + 0.2, Ly, 0), V(xe, Ly, 0)], 0.045, RED, { glow: 0.4 }, { seg: 20 }, g);
    const neu = tube([V(xe, Ny, 0), V(xs + 0.2, Ny, 0)], 0.045, NEU, { glow: 0.4 }, { seg: 20 }, g);
    const ear = tube([V(-3.6, -2.95, 0), V(-3.6, Ey, 0), V(xe, Ey, 0)], 0.045, EAR, { glow: 0.4 }, { seg: 30, tension: 0 }, g);
    flow(live.userData.curve, 14, '#fecaca', 1.3, 0.05, g);
    flow(neu.userData.curve, 14, '#dbeafe', 1.3, 0.05, g);
    clickable(live, { title: 'Live wire (red)', body: 'Carries current at a high potential of 220 V. Switches and fuses are always placed in the live wire.' });
    clickable(neu, { title: 'Neutral wire (black / blue)', body: 'Return path of current; at zero potential. Live and neutral have a potential difference of 220 V.' });
    clickable(ear, { title: 'Earth wire (green)', body: 'Safety wire connected to a metal plate buried deep in the ground. If the metal body of an appliance becomes live due to leakage, current flows safely to the earth instead of through a person.' });
    label('Live (red) · 220 V', V(xe + 0.3, Ly + 0.3, 0), { color: RED, size: 0.17 }, g);
    label('Neutral (black/blue) · 0 V', V(xe + 0.3, Ny + 0.3, 0), { color: NEU, size: 0.17 }, g);
    label('Earth (green) · safety', V(xe + 0.3, Ey + 0.3, 0), { color: EAR, size: 0.17 }, g);
    const plate = box(1.0, 0.08, 0.6, COPPER, V(-3.6, -3.0, 0), { metal: 0.7 }, g);
    box(2.6, 0.9, 1.2, '#78350f', V(-3.6, -3.1, 0), { opacity: 0.25 }, g);
    label('Earth plate (buried)', V(-3.6, -3.75, 0), { color: EAR, size: 0.16 }, g);
    clickable(plate, ear.userData.info);
    const z = 0.25;
    const drop = (x, y1, y2, c, dir) => { const m = tube(dir > 0 ? [V(x, y1, z), V(x, y2, z)] : [V(x, y2, z), V(x, y1, z)], 0.035, c, { glow: 0.3 }, { seg: 8 }, g); return m; };
    flow(drop(0.4, Ly, -1.2, RED, 1).userData.curve, 4, '#fecaca', 1, 0.04, g);
    flow(drop(0.8, Ny, -1.2, NEU, -1).userData.curve, 3, '#dbeafe', 1, 0.04, g);
    box(0.22, 0.32, 0.22, '#e2e8f0', V(0.4, 0.2, z), {}, g);
    label('Switch', V(-0.2, 0.2, z), { size: 0.13 }, g);
    const bulb = sphere(0.42, '#fde047', V(0.6, -1.65, z), { glow: 1.6 }, g);
    glow(V(0.6, -1.65, z), '#fde047', 2.6, g);
    cyl(V(0.6, -1.2, z), V(0.6, -1.0, z), 0.16, '#94a3b8', { metal: 0.6 }, g);
    label('Bulb (5 A circuit)', V(0.6, -2.4, z), { size: 0.15 }, g);
    clickable(bulb, { title: 'Parallel connection', body: 'Each appliance is connected in parallel between live and neutral, so each gets the full 220 V and can be switched on/off independently. Light circuits use 5 A; heavy appliances use 15 A.' });
    flow(drop(3.1, Ly, -1.1, RED, 1).userData.curve, 4, '#fecaca', 1, 0.04, g);
    flow(drop(3.5, Ny, -1.1, NEU, -1).userData.curve, 3, '#dbeafe', 1, 0.04, g);
    drop(3.9, Ey, -1.1, EAR, 1);
    const fr = box(1.3, 1.8, 0.8, '#cbd5e1', V(3.5, -2.0, 0), { metal: 0.7, rough: 0.3 }, g);
    label('Metal-body appliance\n(earthed, 15 A)', V(3.5, -3.3, 0), { size: 0.15 }, g);
    clickable(fr, { title: 'Earthing a metal appliance', body: 'Electric iron, fridge, toaster, geyser have metal bodies connected to the earth wire. It provides a low-resistance path for leakage current and keeps the body at earth potential, preventing severe shocks.' });
  }

  return {
    name: 'Physics', chapter: 'Magnetic Effects of Electric Current', color: '#38bdf8',
    topics: [
      {
        label: 'Bar Magnet & Field Lines',
        variants: [
          {
            label: 'Field Lines', cam: [0, 2.5, 11.5], build: () => barMagnet(false),
            title: 'Bar Magnet & Magnetic Field Lines',
            desc: 'Field lines leave the North pole, curve around and enter the South pole. The compasses show the local field direction; the big compass moves around the magnet and keeps re-aligning.',
            legend: [['#ef4444', 'North pole'], ['#3b82f6', 'South pole'], [FIELD, 'Field lines (N → S outside)'], ['#ef4444', 'Compass red end = north-seeking']],
            notes: ['Field lines emerge from the North pole and merge at the South pole outside the magnet.', 'Inside the magnet they run from South to North, so field lines are closed curves.', 'Two field lines never intersect (a compass cannot point two ways at once).', 'Crowded lines = stronger field; the field is strongest near the poles.', 'The north end of a compass needle points along the tangent to a field line.', 'Magnetic field has both magnitude and direction.'],
          },
          {
            label: 'X-Ray Inside', cam: [0, 2.5, 11.5], build: () => barMagnet(true),
            title: 'Inside the Magnet: S → N',
            desc: 'Make the magnet see-through to show that field lines continue inside it, from South to North, so that every field line is a closed loop.',
            legend: [[CUR, 'Inside: South → North'], [FIELD, 'Outside: North → South']],
            notes: ['Field lines form closed, continuous loops.', 'Outside the magnet: N → S. Inside the magnet: S → N.', 'Relative strength is shown by how close the lines are.', 'Iron filings sprinkled near a magnet arrange themselves along the field lines.'],
          },
        ],
      },
      {
        label: 'Wire, Loop & Solenoid',
        variants: [
          {
            label: 'Straight Wire', cam: [2.5, 4, 10], build: wire,
            title: 'Field Around a Straight Conductor',
            desc: 'Current flows upward through the wire. The field lines are concentric circles around it, anticlockwise when viewed from above. Compasses on the cardboard follow the circles.',
            legend: [[CUR, 'Current (I)'], [FIELD, 'Concentric field lines'], [COPPER, 'Copper wire']],
            notes: ['Field lines around a straight wire are concentric circles centred on the wire.', 'Right-Hand Thumb Rule: thumb points along the current, curled fingers show the field direction.', 'Field strength increases with current and decreases with distance from the wire.', 'Reversing the current reverses the direction of the field.', 'This rule is also called Maxwell\'s corkscrew rule.'],
          },
          {
            label: 'Circular Loop', cam: [4.5, 2.5, 7.5], build: loop,
            title: 'Field Due to a Circular Loop',
            desc: 'Every small part of the loop makes its own concentric circles. Near the centre these add up and the lines become nearly straight and perpendicular to the plane of the loop.',
            legend: [[CUR, 'Current (anticlockwise)'], [FIELD, 'Field lines']],
            notes: ['At every point of the loop the field lines are concentric circles around the wire.', 'At the centre of the loop the field lines look like straight lines.', 'Field at the centre ∝ current and ∝ number of turns (n).', 'Field from each turn adds up, so a coil of n turns gives n times the field.'],
          },
          {
            label: 'Solenoid', cam: [3, 3, 11], build: () => solenoid(false),
            title: 'Solenoid',
            desc: 'A long coil of many circular turns of insulated copper wire. Its field looks like a bar magnet: one end acts as a North pole and the other as a South pole.',
            legend: [[COPPER, 'Coil (current flows along it)'], [FIELD, 'Field lines'], ['#ef4444', 'N end'], ['#3b82f6', 'S end']],
            notes: ['Solenoid = coil of many circular turns of insulated copper wire wound like a cylinder.', 'The field pattern is like a bar magnet, with N and S ends.', 'Inside a solenoid the field lines are parallel straight lines, so the field is uniform.', 'Reversing the current swaps the N and S ends.'],
          },
          {
            label: 'Electromagnet', cam: [3, 3, 11], build: () => solenoid(true),
            title: 'Electromagnet (Solenoid + Soft Iron Core)',
            desc: 'Placing a soft iron core inside the solenoid makes a strong magnet that works only while current flows. It is a temporary magnet.',
            legend: [['#94a3b8', 'Soft iron core'], [COPPER, 'Coil'], [FIELD, 'Field lines']],
            notes: ['Electromagnet = solenoid + soft iron core; magnetised only while current flows.', 'Strength depends on number of turns, the current and the core material.', 'Soft iron is used because it magnetises and demagnetises easily.', 'Uses: electric bells, cranes for lifting scrap, relays, MRI machines.'],
          },
        ],
      },
      {
        label: 'Force & Domestic Circuit',
        variants: [
          {
            label: "Fleming's LHR", cam: [5.5, 3, 8.5], build: () => force(false),
            title: 'Force on a Current-Carrying Conductor',
            desc: 'An aluminium/copper rod carrying current between the poles of a horseshoe magnet is pushed sideways. Current, field and force are mutually perpendicular.',
            legend: [[CUR, 'Current (I) → middle finger'], [FIELD, 'Field (B) → forefinger'], [FORCE, 'Force (F) → thumb']],
            notes: ['A current-carrying conductor in a magnetic field experiences a force.', 'The force is largest when the current is perpendicular to the field.', "Fleming's Left-Hand Rule: Forefinger = Field, Middle finger = Current, Thumb = Force (motion).", 'Reversing either the current or the field reverses the force.', 'Used in electric motors, loudspeakers, galvanometers.'],
          },
          {
            label: 'Reverse Current', cam: [5.5, 3, 8.5], build: () => force(true),
            title: 'Reversing the Current',
            desc: 'With the current reversed, the force (and the rod\'s displacement) flips direction. Watch the rod swing out of the magnet instead of into it.',
            legend: [[CUR, 'Current reversed'], [FORCE, 'Force reversed']],
            notes: ['Reverse current → force reverses.', 'Reverse field (swap N and S) → force reverses.', 'Reverse both → force stays the same direction.', 'Displacement increases if current or field strength increases.'],
          },
          {
            label: 'Domestic Circuit', cam: [0, 0, 13], build: circuit,
            title: 'Domestic Electric Circuit',
            desc: 'Mains supply enters through the meter, fuse and main switch, then runs as live, neutral and earth wires. Appliances are connected in parallel. Tap the fuse, wires or appliances for details.',
            legend: [['#ef4444', 'Live (220 V)'], ['#60a5fa', 'Neutral (0 V)'], ['#22c55e', 'Earth (safety)'], ['#fb923c', 'Fuse']],
            notes: ['India\'s mains supply: 220 V AC at 50 Hz.', 'Live wire: red insulation, 220 V. Neutral: black (or blue), 0 V. Earth: green.', 'Fuse: low melting-point wire in series with the live wire; melts during overloading or a short circuit.', 'Earthing gives leakage current a low-resistance path to the ground and prevents electric shock.', 'Appliances are in parallel, so each gets 220 V and can be switched independently.', 'Short circuit: live and neutral touch directly. Overloading: too many appliances on one socket.', '15 A circuit for geysers and ACs; 5 A circuit for bulbs and fans.'],
          },
        ],
      },
    ],
  };
};
