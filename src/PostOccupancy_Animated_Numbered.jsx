"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Database,
  ClipboardList,
  Users,
  FileText,
  Layers,
  Settings2,
  Send,
  ListChecks,
  RefreshCcw,
  SlidersHorizontal,
  Target,
  LineChart,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Home,
  BarChart3,
} from "lucide-react";

const MAX_ORDER = 24;

// ---------------------------------------------------------------------------
// Supporting standards / documents (tooltip content) — POST-OCCUPANCY
// ---------------------------------------------------------------------------

const SUPPORTING_SOURCES = {
  "po-intake": [
    {
      type: "Framework",
      label:
        "ISO 19650-3 – Information management during the operational phase of assets",
    },
    {
      type: "Guidance",
      label:
        "UK BIM Framework – CDE states for as-built information and operations handover",
    },
    {
      type: "Planning code",
      label:
        "NCC 2022 & State planning controls – as-built compliance constraints carried into use",
    },
  ],
  "po-metrics": [
    {
      type: "Standard",
      label:
        "RICS Whole-Life Carbon Assessment (2nd ed.) – in-use and replacement carbon",
    },
    {
      type: "Standard",
      label:
        "NABERS & Green Star Performance – operational energy, water and IEQ ratings",
    },
    {
      type: "Standard",
      label:
        "EN 16798-1 & ASHRAE 55 – indoor environment categories and comfort criteria",
    },
  ],
  "po-surveys": [
    {
      type: "Guideline",
      label:
        "Building Use Studies & BCO POE guidance – structured resident and user surveys",
    },
    {
      type: "Checklist",
      label:
        "CHERRIES & AAPOR – consent, sampling and bias management for online POE work",
    },
  ],
  "po-triangulation": [
    {
      type: "Evidence",
      label:
        "Survey-methods literature on satisficing, panel effects and non-response bias",
    },
    {
      type: "Practice",
      label:
        "Best practice on combining survey, complaint and telemetry data before acting",
    },
  ],
  "po-actions": [
    {
      type: "Guidance",
      label:
        "Continuous-improvement guidance in FM and housing management (plan–do–check–act cycles)",
    },
    {
      type: "Standard",
      label:
        "ISO 41001 – Facility management: performance, risk and opportunity management",
    },
  ],
  "po-loop": [
    {
      type: "Practice",
      label:
        "Lean and set-based design – short improvement cycles with explicit cut-off points",
    },
    {
      type: "Governance",
      label:
        "Time-boxed iteration windows and version-controlled decision logs for POE loops",
    },
  ],
  "po-consultants": [
    {
      type: "Framework",
      label:
        "ESD, services and maintenance consultant guidance on tuning existing buildings",
    },
    {
      type: "Standard",
      label:
        "Manufacturer and installer guidance for retrofits, repairs and system rebalancing",
    },
  ],
  "po-cost": [
    {
      type: "Standard",
      label:
        "RICS NRM – life-cycle costing and operational expenditure planning for interventions",
    },
    {
      type: "Guideline",
      label:
        "Portfolio-level investment planning and business-case practice for capital works",
    },
  ],
  "po-residents": [
    {
      type: "Guideline",
      label:
        "Resident engagement guidance in social and build-to-rent housing (e.g. co-design, resident panels)",
    },
    {
      type: "Standard",
      label:
        "WCAG 2.2 – accessibility for web-based feedback tools and dashboards",
    },
  ],
  "po-ops": [
    {
      type: "Standard",
      label:
        "ISO 41001 – facility management system requirements for operations planning",
    },
    {
      type: "Guideline",
      label:
        "FM and housing management practice on complaints, ticketing and service logs",
    },
  ],
  "po-validate": [
    {
      type: "Guideline",
      label:
        "POE follow-up cycles – validating proposed interventions with users before implementation",
    },
  ],
  "po-governance": [
    {
      type: "Principle",
      label:
        "FAIR data principles and portfolio-level governance for keeping a traceable POE record",
    },
  ],
};

// ---------------------------------------------------------------------------
// DB events (which layers light up at which reveal steps)
// ---------------------------------------------------------------------------

const DB_EVENTS = {
  // L1 – as-built brief and configuration (read, rarely written)
  l1_brief_read: [4],

  // L2 – resident & operational input
  l2_feedback_write: [9, 12, 16],
  l2_feedback_read: [11],

  // L3 – decision log and option catalogue
  l3_decision_read: [4],
  l3_decision_write: [20],

  // L4 – performance & cost metrics
  l4_metrics_read: [4, 8],
  l4_metrics_write: [5, 8],

  // L5 – post-occupancy performance
  l5_po_write: [5, 6],
  l5_po_read: [8, 11],

  // L6 – knowledge hub & patterns
  l6_learning_read: [4, 8],
  l6_learning_update: [19],

  // L7 – governance, roles & standards
  l7_governance_update: [3, 15, 21],
};

// Show DB tags only at the exact step(s) we specify,
// BUT once we reach MAX_ORDER we show all tags at once (final snapshot).
const isDbActive = (eventKey, currentStep) => {
  const triggers = DB_EVENTS[eventKey] || [];
  if (currentStep >= MAX_ORDER) {
    return triggers.length > 0;
  }
  return triggers.includes(currentStep);
};

// ---------------------------------------------------------------------------
// Small UI helpers (same style as Design phase)
// ---------------------------------------------------------------------------

const NumberBadge = ({ n, color = "gray" }) => (
  <span className={`badge-circle badge-${color}`}>{n}</span>
);

const TimeTag = ({ label }) => <span className="time-tag">{label}</span>;

const Card = ({ color, title, icon, stepNo, children, supportKey, detail }) => {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false); // tap on mobile
  const sources = supportKey ? SUPPORTING_SOURCES[supportKey] : null;
  const showTooltip = (hovered || open) && (detail || sources);

  return (
    <div
      className={`card card-${color}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setOpen((prev) => !prev)}
    >
      <div className="card-header">
        <div className="card-header-left">
          {stepNo != null && <NumberBadge n={stepNo} color={color} />}
          <div className={`card-title card-title-${color}`}>{title}</div>
        </div>
        {icon && <div className="card-icon">{icon}</div>}
      </div>

      {/* Short, always-visible content */}
      {children}

      {/* Hover tooltip: extra explanation + standards/frameworks */}
      {showTooltip && (
        <div className="support-tooltip">
          {detail && (
            <>
              <div className="support-title">Process explanation</div>
              <div className="support-detail">{detail}</div>
            </>
          )}
          {sources && (
            <>
              <div
                className="support-title"
                style={{ marginTop: detail ? 6 : 0 }}
              >
                Supporting standards and frameworks
              </div>
              <ul className="support-list">
                {sources.map((src) => (
                  <li key={src.label}>
                    <span className="support-type">{src.type}:</span>{" "}
                    <span className="support-link">{src.label}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const Step = ({ icon, label, detail, stepNo, supportKey }) => {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const sources = supportKey ? SUPPORTING_SOURCES[supportKey] : null;
  const showTooltip = (hovered || open) && (detail || sources);

  return (
    <div
      className="step-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setOpen((prev) => !prev)}
    >
      <NumberBadge n={stepNo} color="blue" />
      <div className="step-icon">{icon}</div>
      <div>
        {/* Short label always visible */}
        <div className="step-label">{label}</div>

        {/* Extra explanation + standards only on hover */}
        {showTooltip && (
          <div className="support-tooltip">
            {detail && (
              <>
                <div className="support-title">Process explanation</div>
                <p>{detail}</p>
              </>
            )}
            {sources && (
              <>
                <div
                  className="support-title"
                  style={{ marginTop: detail ? 6 : 0 }}
                >
                  Supporting standards and frameworks
                </div>
                <ul className="support-list">
                  {sources.map((src) => (
                    <li key={src.label}>
                      <span className="support-type">{src.type}:</span>{" "}
                      <span className="support-link">{src.label}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Reveal = ({ order, currentStep, resetToken, children }) => {
  const [hasAppeared, setHasAppeared] = useState(false);

  // When resetToken changes (Replay), forget previous appearance
  useEffect(() => {
    setHasAppeared(false);
  }, [resetToken]);

  useEffect(() => {
    if (!hasAppeared && currentStep >= order) {
      setHasAppeared(true);
    }
  }, [currentStep, hasAppeared, order]);

  return (
    <motion.div
      className="reveal-block"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: hasAppeared ? 1 : 0.15, y: hasAppeared ? 0 : 8 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT – POST-OCCUPANCY PHASE
// ---------------------------------------------------------------------------

export default function PostOccupancy_Animated_Numbered() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [deliveryModel, setDeliveryModel] = useState("BTS"); // "BTS" or "BTR"
  const [resetToken, setResetToken] = useState(0);

  const isBTR = deliveryModel === "BTR";
  const responsibleColor = isBTR ? "yellow" : "purple";

  useEffect(() => {
    if (!isPlaying) return;
    let timeout;

    const tick = () => {
      setCurrentStep((prev) => {
        const next = prev >= MAX_ORDER ? MAX_ORDER : prev + 1;
        return next;
      });
      timeout = window.setTimeout(tick, 1100);
    };

    timeout = window.setTimeout(tick, 900);
    return () => window.clearTimeout(timeout);
  }, [isPlaying]);

  const handleReplay = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setResetToken((prev) => prev + 1);
    setTimeout(() => setIsPlaying(true), 80);
  };

  return (
    <div className="phase-page">
      <div className="phase-inner">
        {/* Header */}
        <header className="phase-header">
          <div className="header-left">
            <h1>Phase three — Post-occupancy &amp; learning</h1>
            <p>
              The same platform now closes the loop in use. It compares{" "}
              <strong>actual performance and resident experience</strong> with
              the promises made in the brief and design, and it writes learning
              back into the Knowledge Hub and the next planning cycle.
            </p>
            <div className="chip-row">
              <span className="chip">
                Phase time-box: cyclical, with{" "}
                <strong>6–12 month review windows</strong>
              </span>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setIsPlaying(true)}
            >
              <Play size={16} />
              <span>Play</span>
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setIsPlaying(false)}
            >
              <Pause size={16} />
              <span>Pause</span>
            </button>
            <button className="btn btn-secondary" onClick={handleReplay}>
              <RotateCcw size={16} />
              <span>Replay</span>
            </button>
          </div>
        </header>

        {/* Guidance + legend */}
        <div className="guidance-row">
          <div className="guidance-card">
            <h2>How to read this diagram</h2>
            <ol>
              <li>
                Start with the{" "}
                <strong>responsibility gate for post-occupancy</strong> – it
                differs between BTS and BTR.
              </li>
              <li>
                Follow the <strong>numbered steps</strong> from left to right:
                yellow = developer/asset owner, blue = digital platform, green =
                consultants and technical support, purple = operations and
                residents.
              </li>
              <li>
                <strong>Short labels</strong> are always visible. Hover on cards
                and steps to see detailed explanations and the standards and
                frameworks used.
              </li>
              <li>
                The right-hand panel shows which{" "}
                <strong>database layers (L1–L7)</strong> are active and how
                operational learning flows into the next project.
              </li>
            </ol>
          </div>

          <div className="legend-card">
            <h2>Legend &amp; roles</h2>
            <div className="legend-grid">
              <div className="legend-item">
                <span className="legend-dot legend-dev" />
                <span>
                  Developer / asset owner (BTR) or strategic sponsor (BTS)
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-platform" />
                <span>Digital platform (POE engine + database)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-advisory" />
                <span>FM, ESD and services consultants, trades</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-users" />
                <span>
                  Operations team (on-site or strata management) and residents
                </span>
              </div>
            </div>
            <div className="legend-db">
              <div className="legend-db-row">
                <Download size={14} />
                <span>READ</span>
                <span className="legend-db-desc">Pull from a layer</span>
              </div>
              <div className="legend-db-row">
                <Upload size={14} />
                <span>WRITE</span>
                <span className="legend-db-desc">Add records to a layer</span>
              </div>
              <div className="legend-db-row">
                <RefreshCcw size={14} />
                <span>UPDATE</span>
                <span className="legend-db-desc">
                  Update patterns and rules
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Responsibility gate + phase overview */}
        <div className="gate-grid">
          <Card
            color="amber"
            title="Responsibility gate in post-occupancy"
            icon={<Home />}
            stepNo={1}
          >
            <p className="card-inline">
              Accountability differs by delivery model. In{" "}
              <strong>Build to Rent (BTR)</strong>, the{" "}
              <strong>developer / asset owner</strong> remains responsible for
              resident experience and long-term performance. In{" "}
              <strong>Build to Sell (BTS)</strong>, day-to-day responsibility
              shifts to the <strong>operational team</strong> (for example
              strata manager, owners corporation and building manager).
            </p>
            <div className="delivery-toggle">
              <span>Delivery model:</span>
              <button
                className={`btn-chip ${
                  deliveryModel === "BTS"
                    ? "btn-chip-bts-active"
                    : "btn-chip-bts"
                }`}
                onClick={() => setDeliveryModel("BTS")}
              >
                <Home size={12} />
                <span>Build to Sell / strata</span>
              </button>
              <button
                className={`btn-chip ${
                  deliveryModel === "BTR"
                    ? "btn-chip-btr-active"
                    : "btn-chip-btr"
                }`}
                onClick={() => setDeliveryModel("BTR")}
              >
                <Database size={12} />
                <span>Build to Rent / single owner</span>
              </button>
            </div>
          </Card>

          <Card
            color="blue"
            title="Post-occupancy phase overview"
            icon={<ClipboardList />}
            stepNo={2}
          >
            <p className="card-inline">
              The platform orchestrates{" "}
              <strong>performance data, resident feedback and operations
              insight</strong>. It identifies gaps against the design promises,
              proposes improvement packages and writes learning back for the
              next scheme.
            </p>
            <ul className="card-list">
              <li>
                Metrics, complaints and surveys are{" "}
                <strong>triangulated</strong> before action.
              </li>
              <li>
                Improvement loops are <strong>bounded in time</strong> (for
                example 6–12 months) and recorded in the decision log.
              </li>
              <li>
                Stable patterns feed directly into the{" "}
                <strong>next planning brief</strong> via the Knowledge Hub.
              </li>
            </ul>
            <TimeTag label="Approx. 6–12 month review windows" />
          </Card>
        </div>

        {/* Main layout */}
        <div className="phase-layout">
          <div className="phase-main">
            <div className="phase-cols">
              {/* Responsible party column */}
              <div className="phase-col">
                <Reveal
                  order={3}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color={responsibleColor}
                    title={
                      isBTR
                        ? "Developer / asset owner — set POE goals"
                        : "Operations / strata — set POE goals"
                    }
                    icon={<Target />}
                    stepNo={3}
                    supportKey="po-intake"
                    detail={
                      <>
                        <p>
                          Defines how success will be judged in use, and how
                          often the platform will run full POE cycles.
                          Responsibility sits with the{" "}
                          <strong>
                            developer/asset owner in BTR, operations/strata in
                            BTS
                          </strong>
                          .
                        </p>
                        <ul className="card-list">
                          <li>
                            Confirms comfort, complaints, utility and
                            sustainability thresholds.
                          </li>
                          <li>
                            Sets the length of observation windows (for example
                            annual or seasonal).
                          </li>
                          <li>
                            Confirms which resident and operations cohorts must
                            be heard in each cycle.
                          </li>
                        </ul>
                        <TimeTag label="1–2 weeks at the start of each POE cycle" />
                      </>
                    }
                  >
                    <p className="card-inline">
                      Confirms what “good in use” looks like and how often the
                      building will be reviewed.
                    </p>
                  </Card>
                </Reveal>

                <Reveal
                  order={15}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color={responsibleColor}
                    title="Review findings & agree priorities"
                    icon={<BarChart3 />}
                    stepNo={14}
                    supportKey="po-actions"
                    detail={
                      <>
                        <p>
                          Reviews the dashboards and evidence pack produced by
                          the platform and agrees which issues are strategic
                          versus local, and which can be realistically
                          addressed.
                        </p>
                        <ul className="card-list">
                          <li>
                            Distinguishes “must fix” issues from desirable
                            enhancements.
                          </li>
                          <li>
                            Balances capital and operational budgets against
                            resident and sustainability benefits.
                          </li>
                          <li>
                            Records accepted, deferred and rejected actions in
                            the decision log.
                          </li>
                        </ul>
                        <TimeTag label="2–3 weeks including governance cycles" />
                      </>
                    }
                  >
                    <p className="card-inline">
                      Reviews the evidence pack and agrees which improvements to
                      pursue.
                    </p>
                  </Card>
                </Reveal>

                <Reveal
                  order={21}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color={responsibleColor}
                    title="Decide on capital works & feed next brief"
                    icon={<CheckCircle2 />}
                    stepNo={20}
                    supportKey="po-governance"
                    detail={
                      <>
                        <p>
                          Confirms any capital works programme and instructs the
                          platform to update L1, L3, L6 and L7 so that the next
                          planning brief reflects what has been learned.
                        </p>
                        <ul className="card-list">
                          <li>
                            Locks a traceable record of decisions and
                            rationales.
                          </li>
                          <li>
                            Flags stable patterns (for example recurrent layout
                            or comfort issues) as rules for future schemes.
                          </li>
                          <li>
                            Marks the POE cycle as closed to avoid endless
                            re-opening.
                          </li>
                        </ul>
                        <TimeTag label="Gated decision event at the end of the cycle" />
                      </>
                    }
                  >
                    <p className="card-inline">
                      Locks decisions, programmes any capital works and writes
                      learning into the next brief.
                    </p>
                  </Card>
                </Reveal>
              </div>

              {/* Digital platform column */}
              <div className="phase-col phase-col-wide">
                <Card color="blue" title="Digital platform" icon={<Database />}>
                  <p className="card-inline">
                    Pulls together <strong>as-built information</strong>,
                    performance data, complaints, service tickets and resident
                    feedback, then proposes{" "}
                    <strong>evidence-based improvement options</strong>.
                  </p>

                  <Reveal
                    order={4}
                    currentStep={currentStep}
                    resetToken={resetToken}
                  >
                    <Step
                      stepNo={4}
                      icon={<FileText size={18} />}
                      label="Read as-built brief & expectations"
                      detail="Reads L1 (brief and addenda), L3 (design decisions) and L4 (target performance) to understand what was promised and what constraints apply."
                      supportKey="po-intake"
                    />
                  </Reveal>

                  <Reveal
                    order={5}
                    currentStep={currentStep}
                    resetToken={resetToken}
                  >
                    <Step
                      stepNo={5}
                      icon={<LineChart size={18} />}
                      label="Ingest operational and sensor data"
                      detail="Collects utility data, BMS and IoT feeds, and key maintenance/complaint logs into L4 and L5 as structured records."
                      supportKey="po-metrics"
                    />
                  </Reveal>

                  <Reveal
                    order={8}
                    currentStep={currentStep}
                    resetToken={resetToken}
                  >
                    <Step
                      stepNo={8}
                      icon={<AlertTriangle size={18} />}
                      label="Run performance diagnostics"
                      detail="Compares actual energy, comfort and complaints against thresholds, flags hotspots and trends, and estimates whole-life carbon impacts."
                      supportKey="po-metrics"
                    />
                  </Reveal>

                  <Reveal
                    order={10}
                    currentStep={currentStep}
                    resetToken={resetToken}
                  >
                    <Step
                      stepNo={10}
                      icon={<ClipboardList size={18} />}
                      label="Design resident & ops surveys"
                      detail="Builds short, targeted instruments for residents and operations to understand why issues occur and what trade-offs are acceptable."
                      supportKey="po-surveys"
                    />
                  </Reveal>

                  <Reveal
                    order={11}
                    currentStep={currentStep}
                    resetToken={resetToken}
                  >
                    <Step
                      stepNo={11}
                      icon={<SlidersHorizontal size={18} />}
                      label="Triangulate feedback with data"
                      detail="Combines survey responses, digital engagement patterns and telemetry so that improvement ideas reflect behaviour as well as stated preferences."
                      supportKey="po-triangulation"
                    />
                  </Reveal>

                  <Reveal
                    order={13}
                    currentStep={currentStep}
                    resetToken={resetToken}
                  >
                    <Step
                      stepNo={13}
                      icon={<Settings2 size={18} />}
                      label="Generate improvement options"
                      detail="Bundles tuning measures, minor works and potential capital projects into costed, prioritised packages, each linked to evidence and projected benefit."
                      supportKey="po-actions"
                    />
                  </Reveal>

                  <Reveal
                    order={18}
                    currentStep={currentStep}
                    resetToken={resetToken}
                  >
                    <Step
                      stepNo={15}
                      icon={<RefreshCcw size={18} />}
                      label="Post-occupancy learning loop (bounded)"
                      detail="Runs up to two short cycles: implement selected tweaks, re-measure key metrics and sentiment, and update the evidence pack. Loops are time-boxed and version-controlled so POE does not become an endless process."
                      supportKey="po-loop"
                    />
                  </Reveal>

                  <Reveal
                    order={19}
                    currentStep={currentStep}
                    resetToken={resetToken}
                  >
                    <Step
                      stepNo={16}
                      icon={<Upload size={18} />}
                      label="Write back to hub & next brief"
                      detail="Updates L6 (patterns and rules) and L7 (roles and standards), and prepares a summary bundle ready to seed the next planning brief."
                      supportKey="po-governance"
                    />
                  </Reveal>
                </Card>
              </div>

              {/* Advisory & technical column */}
              <div className="phase-col">
                <Reveal
                  order={6}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="green"
                    title="FM, ESD & services consultants"
                    icon={<Settings2 />}
                    stepNo={6}
                    supportKey="po-consultants"
                    detail={
                      <>
                        <p>
                          Provide technical diagnosis and feasible measures,
                          from tuning existing systems to planning targeted
                          retrofits.
                        </p>
                        <ul className="card-list">
                          <li>
                            Interpret diagnostics from the platform and BMS.
                          </li>
                          <li>
                            Propose technical options with constraints and
                            risks.
                          </li>
                          <li>
                            Record assumptions and dependencies in L3.
                          </li>
                        </ul>
                        <TimeTag label="Targeted input early in each cycle" />
                      </>
                    }
                  >
                    <p className="card-inline">
                      Translate diagnostics into practical tuning and retrofit
                      options.
                    </p>
                  </Card>
                </Reveal>

                <Reveal
                  order={7}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="green"
                    title="Cost & programme planning"
                    icon={<Database />}
                    stepNo={7}
                    supportKey="po-cost"
                    detail={
                      <>
                        <p>
                          Quantity surveyor and FM leadership build cost and
                          programme views for proposed interventions.
                        </p>
                        <ul className="card-list">
                          <li>
                            Estimate capital and operational expenditure and
                            simple paybacks.
                          </li>
                          <li>
                            Flag staging issues and resident-disruption risks.
                          </li>
                          <li>
                            Attach structured estimates to each option in L3/L4.
                          </li>
                        </ul>
                        <TimeTag label="2–4 weeks depending on scope" />
                      </>
                    }
                  >
                    <p className="card-inline">
                      Builds cost, disruption and programme views for proposed
                      actions.
                    </p>
                  </Card>
                </Reveal>
              </div>

              {/* Operations & residents column */}
              <div className="phase-col">
                <Reveal
                  order={8}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="purple"
                    title="Operations team"
                    icon={<Users />}
                    stepNo={9}
                    supportKey="po-ops"
                    detail={
                      <>
                        <p>
                          Day-to-day building managers, leasing and resident
                          services teams log friction points and help interpret
                          data in context.
                        </p>
                        <ul className="card-list">
                          <li>
                            Maintain structured complaint and service-ticket
                            logs feeding L2 and L5.
                          </li>
                          <li>
                            Provide practical constraints and work-arounds.
                          </li>
                          <li>
                            Help prioritise low-cost, high-impact tweaks.
                          </li>
                        </ul>
                        <TimeTag label="Continuous, surfaced at each POE cycle" />
                      </>
                    }
                  >
                    <p className="card-inline">
                      Logs issues, constraints and opportunities from daily
                      operations.
                    </p>
                  </Card>
                </Reveal>

                <Reveal
                  order={9}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="purple"
                    title="Residents & user panels"
                    icon={<Send />}
                    stepNo={11}
                    supportKey="po-residents"
                    detail={
                      <>
                        <p>
                          Residents describe comfort, noise, security and
                          service experiences and react to proposed changes.
                        </p>
                        <ul className="card-list">
                          <li>
                            Participate in short surveys, interviews or digital
                            panels.
                          </li>
                          <li>
                            Compare options with simple explanations of cost,
                            disruption and benefit.
                          </li>
                          <li>
                            Feedback is stored in L2 with links to affected
                            spaces and systems.
                          </li>
                        </ul>
                        <TimeTag label="2–3 week feedback windows" />
                      </>
                    }
                  >
                    <p className="card-inline">
                      Provide structured feedback on living experience and
                      proposed changes.
                    </p>
                  </Card>
                </Reveal>

                <Reveal
                  order={16}
                  currentStep={currentStep}
                  resetToken={resetToken}
                >
                  <Card
                    color="purple"
                    title="Validate preferred package"
                    icon={<ListChecks />}
                    stepNo={16}
                    supportKey="po-validate"
                    detail={
                      <>
                        <p>
                          Before implementation, the platform runs a short
                          validation round with residents and operations for the
                          preferred improvement package.
                        </p>
                        <ul className="card-list">
                          <li>
                            Confirms that proposed changes address real pain
                            points.
                          </li>
                          <li>
                            Surfaces any unintended consequences early.
                          </li>
                          <li>
                            Captures final comments to attach to the decision
                            log.
                          </li>
                        </ul>
                        <TimeTag label="Short, bounded validation loop" />
                      </>
                    }
                  >
                    <p className="card-inline">
                      Runs a short validation round on the preferred improvement
                      package.
                    </p>
                  </Card>
                </Reveal>
              </div>
            </div>
          </div>

          {/* Side panel: database layers */}
          <aside className="phase-side">
            <div className="side-card">
              <h2>
                <Layers size={16} />
                <span style={{ marginLeft: 6 }}>
                  Database layers (Post-occupancy)
                </span>
              </h2>

              <div className="db-layer">
                <div className="db-layer-head">
                  <span>L1 – As-built brief &amp; configuration</span>
                  {isDbActive("l1_brief_read", currentStep) && (
                    <span className="db-tag db-tag-read">
                      <Download size={10} /> READ
                    </span>
                  )}
                </div>
                <p>
                  Final brief, design addenda and as-built configuration used as
                  the reference point for post-occupancy comparisons.
                </p>
              </div>

              <div className="db-layer">
                <div className="db-layer-head">
                  <span>L2 – Resident &amp; operations input</span>
                  {isDbActive("l2_feedback_write", currentStep) && (
                    <span className="db-tag db-tag-write">
                      <Upload size={10} /> WRITE
                    </span>
                  )}
                  {isDbActive("l2_feedback_read", currentStep) && (
                    <span className="db-tag db-tag-read">
                      <Download size={10} /> READ
                    </span>
                  )}
                </div>
                <p>
                  Structured feedback from residents, building management,
                  leasing and service teams used to explain performance patterns.
                </p>
              </div>

              <div className="db-layer">
                <div className="db-layer-head">
                  <span>L3 – Decision log &amp; options</span>
                  {isDbActive("l3_decision_read", currentStep) && (
                    <span className="db-tag db-tag-read">
                      <Download size={10} /> READ
                    </span>
                  )}
                  {isDbActive("l3_decision_write", currentStep) && (
                    <span className="db-tag db-tag-update">
                      <RefreshCcw size={10} /> UPDATE
                    </span>
                  )}
                </div>
                <p>
                  Records of which POE actions were accepted, deferred or
                  rejected, with links to evidence and responsible parties.
                </p>
              </div>

              <div className="db-layer">
                <div className="db-layer-head">
                  <span>L4 – Performance &amp; cost data</span>
                  {isDbActive("l4_metrics_write", currentStep) && (
                    <span className="db-tag db-tag-write">
                      <Upload size={10} /> WRITE
                    </span>
                  )}
                  {isDbActive("l4_metrics_read", currentStep) && (
                    <span className="db-tag db-tag-read">
                      <Download size={10} /> READ
                    </span>
                  )}
                </div>
                <p>
                  Utility, comfort and cost metrics for each POE cycle, including
                  before/after comparisons for interventions.
                </p>
              </div>

              <div className="db-layer">
                <div className="db-layer-head">
                  <span>L5 – Post-occupancy performance</span>
                  {isDbActive("l5_po_write", currentStep) && (
                    <span className="db-tag db-tag-write">
                      <Upload size={10} /> WRITE
                    </span>
                  )}
                  {isDbActive("l5_po_read", currentStep) && (
                    <span className="db-tag db-tag-read">
                      <Download size={10} /> READ
                    </span>
                  )}
                </div>
                <p>
                  Detailed POE records, complaint histories and BMS/IoT traces
                  tied to locations, systems and time periods.
                </p>
              </div>

              <div className="db-layer">
                <div className="db-layer-head">
                  <span>L6 – Knowledge hub &amp; patterns</span>
                  {isDbActive("l6_learning_read", currentStep) && (
                    <span className="db-tag db-tag-read">
                      <Download size={10} /> READ
                    </span>
                  )}
                  {isDbActive("l6_learning_update", currentStep) && (
                    <span className="db-tag db-tag-update">
                      <RefreshCcw size={10} /> UPDATE
                    </span>
                  )}
                </div>
                <p>
                  Cross-project patterns and “do / do not” rules updated at the
                  end of each POE cycle so future briefs start smarter.
                </p>
              </div>

              <div className="db-layer">
                <div className="db-layer-head">
                  <span>L7 – Governance, roles &amp; standards</span>
                  {isDbActive("l7_governance_update", currentStep) && (
                    <span className="db-tag db-tag-update">
                      <RefreshCcw size={10} /> UPDATE
                    </span>
                  )}
                </div>
                <p>
                  Records who is responsible for POE in BTS and BTR, along with
                  applicable standards, rating tools and approval requirements.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

