import { Link } from "react-router-dom";
import type { Product } from "../data/types";

const FLOW_STAGES = [
  {
    kicker: "01 · MATERIAL",
    title: "Choose the right compound",
    copy: "PVC, HDPE and CPVC are selected for the pressure, temperature and installation ahead.",
    tag: "FORMULATION",
  },
  {
    kicker: "02 · FORM",
    title: "Shape every dimension",
    copy: "Extrusion and precision moulding create consistent walls, threads and joints across every run.",
    tag: "PRECISION FORMING",
  },
  {
    kicker: "03 · PROVE",
    title: "Test the weak points",
    copy: "Pressure, fit and batch checks catch problems before a fitting reaches a hard-working site.",
    tag: "QUALITY CONTROL",
  },
  {
    kicker: "04 · STANDARD",
    title: "Make compliance visible",
    copy: "National-standard checks turn a good-looking part into a dependable water-system component.",
    tag: "NS / ISO READY",
  },
  {
    kicker: "05 · DELIVER",
    title: "Ready for the network",
    copy: "Packed, labelled and dispatched as a complete line — from the first joint to the final tank.",
    tag: "NATIONWIDE SUPPLY",
  },
] as const;

export function ProcessJourney({ products = [] }: { products?: Product[] }) {
  return (
    <section className="process-journey" aria-labelledby="process-journey-title">
      <div className="process-journey-grid" aria-hidden="true" />
      <div className="wrap process-journey-head">
        <div>
          <div className="kicker-future"><span className="kf-dot" /> THE JAGADAMBA METHOD</div>
          <h2 id="process-journey-title">From compound <span>to confidence.</span></h2>
        </div>
        <div>
          <p>
            A clear path from raw material to a finished water system. Follow the checkpoints that
            make every Jagadamba product ready for real-world installation.
          </p>
          <div className="process-journey-catalog-link">
            <span><b>{products.length}</b> products in the complete catalog</span>
            <Link to="/products">View all products <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>

      <div className="wrap process-journey-track">
        <div className="process-journey-line" aria-hidden="true"><span /></div>
        <div className="process-journey-stages">
          {FLOW_STAGES.map((stage, index) => (
            <article className={`process-stage process-stage-${index + 1}`} key={stage.kicker}>
              <div className="process-stage-marker" aria-hidden="true">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i />
              </div>
              <div className="process-stage-copy">
                <span className="process-stage-kicker">{stage.kicker}</span>
                <h3>{stage.title}</h3>
                <p>{stage.copy}</p>
                <span className="process-stage-tag">{stage.tag}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
