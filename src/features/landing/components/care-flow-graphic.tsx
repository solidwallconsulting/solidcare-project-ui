/** Care Flow — signature visuelle SolidCare (parcours de soins connecté). */
export function CareFlowGraphic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 120"
      className={className}
      role="img"
      aria-label="Parcours de soins SolidCare : patient, rendez-vous, consultation, ordonnance, paiement"
    >
      <defs>
        <linearGradient id="care-flow-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#163A7A" />
          <stop offset="100%" stopColor="#2456C8" />
        </linearGradient>
      </defs>
      <path
        d="M40 70 C120 70 140 30 220 30 S320 110 400 70 S520 20 600 55 S660 80 680 70"
        fill="none"
        stroke="url(#care-flow-line)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="care-flow-path"
      />
      {[
        { x: 40, y: 70, label: "Patient" },
        { x: 220, y: 30, label: "RDV" },
        { x: 400, y: 70, label: "Consultation" },
        { x: 560, y: 42, label: "Ordonnance" },
        { x: 680, y: 70, label: "Paiement" },
      ].map((node, index) => (
        <g key={node.label} className="care-flow-node" style={{ animationDelay: `${index * 180}ms` }}>
          <circle cx={node.x} cy={node.y} r="7" fill="#2456C8" />
          <circle cx={node.x} cy={node.y} r="12" fill="none" stroke="#163A7A" strokeOpacity="0.3" />
          <text
            x={node.x}
            y={node.y + 28}
            textAnchor="middle"
            className="fill-foreground"
            style={{ fontSize: 11, fontFamily: "Manrope, sans-serif" }}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
