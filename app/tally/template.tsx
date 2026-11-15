/**
 * Re-mounts on every navigation inside /tally, so moving between the app, the
 * sign-in page, account and the marketing site fades in instead of snapping.
 *
 * Opacity only — a transform here would become the containing block for the
 * app's fixed elements (the coach button, the sticky header) and break them.
 */
export default function TallyTemplate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes tally-route-in{from{opacity:0}to{opacity:1}}
        .tally-route{animation:tally-route-in 180ms ease-out backwards}
        @media (prefers-reduced-motion:reduce){.tally-route{animation:none}}
      `}</style>
      <div className="tally-route">{children}</div>
    </>
  )
}
