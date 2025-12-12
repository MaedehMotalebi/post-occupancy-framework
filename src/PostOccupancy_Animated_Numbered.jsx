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
  PackageCheck,
} from "lucide-react";

/**
 * IMPORTANT:
 * We now enforce: Reveal order === Process number.
 * Therefore, processes appear in strict numeric order on screen.
 */
const MAX_ORDER = 20;

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
  "po-packaging": [
    {
      type: "Practice",
      label:
        "Option packaging and prioritisation practice for FM interventions (scope, risk, disruption, benefit)",
    },
    {
      type: "Governance",
      label:
        "Version-controlled evidence packs and decision records for auditable POE outcomes",
    },
  ],
};

// ---------------------------------------------------------------------------
// DB events (which layers light up at which reveal steps)
// NOTE: Triggers are aligned with the corrected process numbers.
// ---------------------------------------------------------------------------

const DB_EVENTS = {
  // L1 – as-built brief and configuration
  l1_brief_read: [4],

  // L2 – resident & operational input
  l2_feedback_write: [9, 12, 16],
  l2_feedback_read: [11],

  // L3 – decision log and option catalogue
  l3_decision_read: [4, 15],
  l3_decision_write: [17, 20],

  // L4 – performance & cost metrics
  l4_metrics_read: [4, 8, 15],
  l4_metrics_write: [5, 8, 15],

  // L5 – post-occupancy performance records
  l5_po_write: [5, 6, 9],
  l5_po_read: [8, 11, 15],

  // L6 – knowledge hub & patterns
  l6_learning_read: [4, 8, 15],
  l6_learning_update: [19, 20],

  // L7 – governance, roles & standards
  l7_governance_update: [3, 17, 19, 20],
};

const isDbActive = (eventKey, currentStep) => {
  const triggers = DB_EVENTS[eventKey] || [];
  if (currentStep >= MAX_ORDER) return triggers.length > 0;
  return triggers.includes(currentStep);
};

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

const NumberBadge = ({ n, color = "gray" }) => (
  <span className={`badge-circle badge-${color}`}>{n}</span>
);

const TimeTag = ({ label }) => <span className="time-tag">{label}</span>;

const Card = ({ color, title, icon, stepNo, children, supportKey, detail }) => {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
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

      {children}

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
        <div className="step-label">{label}</div>

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

  useEffect(() => setHasAppeared(false), [resetToken]);

  useEffect(() => {
    if (!hasAppeared && currentStep >= order) setHasAppeared(true);
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
  const [deliveryModel, setDeliveryModel] = useState("BTS");
  const [resetToken, setResetToken] = useState(0);

  const isBTR = deliveryModel === "BTR";
  const responsibleColor = isBTR ? "yellow" : "purple";

  useEffect(() => {
    if (!isPlaying) return;
    let timeout;

    const tick = () => {
      setCurrentStep((prev) => (prev >= MAX_ORDER ? MAX_ORDER : prev + 1));
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
              The platform closes the loop in use by comparing{" "}
              <strong>actual performance and resident experience</strong> with
              design promises, then writing learning back into the Knowledge Hub
              and the next planning cycle.
            </p>
            <div className="chip-row">
              <span className="chip">
                Phase time-box: cyclical, with{" "}
                <strong>6–12 month review windows</strong>
              </span>
            </div>
          </div>

          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setIsPlaying(true)}>
              <Play size={16} />
              <span>Play</span>
            </button>
            <button className="btn btn-ghost" onClick={() => setIsPlaying(false)}>
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
                Start with the <strong>responsibility gate</strong> – it differs
                between BTS and BTR.
              </li>
              <li>
                Follow the <strong>numbered processes</strong> in order:
                yellow = developer/asset owner, blue = platform, green =
                consultants, purple = operations and residents.
              </li>
              <li>
                Hover (or tap) to see the <strong>full explanation</strong> and
                supporting standards.
              </li>
            </ol>
          </div>

          <div className="legend-card">
            <h2>Legend &amp; roles</h2>
            <div className="legend-grid">
              <div className="legend-item">
                <span className="legend-dot legend-dev" />
                <span>Developer / asset owner (BTR) or sponsor (BTS)</span>
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
                <span>Operations team and residents</span>
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
                <span className="legend-db-desc">Add records</span>
              </div>
              <div className="legend-db-row">
                <RefreshCcw size={14} />
                <span>UPDATE</span>
                <span className="legend-db-desc">Update patterns/rules</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gate cards (1–2) */}
        <div className="gate-grid">
          <Card
            color="amber"
            title="Responsibility gate in post-occupancy"
            icon={<Home />}
            stepNo={1}
          >
            <p className="card-inline">
              In <strong>BTR</strong>, the <strong>developer/asset owner</strong>{" "}
              remains responsible for resident experience. In <strong>BTS</strong>,
              responsibility shifts to the <strong>operational team</strong>{" "}
              (strata/owners corporation/building manager).
            </p>
            <div className="delivery-toggle">
              <span>Delivery model:</span>
              <button
                className={`btn-chip ${
                  deliveryModel === "BTS" ? "btn-chip-bts-active" : "btn-chip-bts"
                }`}
                onClick={() => setDeliveryModel("BTS")}
              >
                <Home size={12} />
                <span>Build to Sell / strata</span>
              </button>
              <button
                className={`btn-chip ${
                  deliveryModel === "BTR" ? "btn-chip-btr-active" : "btn-chip-btr"
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
              The platform orchestrates <strong>performance data</strong>,{" "}
              <strong>complaints</strong> and <strong>resident feedback</strong>,
              triangulates evidence, and produces an auditable improvement record
              that feeds the next planning cycle.
            </p>
            <TimeTag label="6–12 month review windows (cyclical)" />
          </Card>
        </div>

        {/* Main layout */}
        <div className="phase-layout">
          <div className="phase-main">
            <div className="phase-cols">
              {/* Responsible party column */}
              <div className="phase-col">
                <Reveal order={3} currentStep={currentStep} resetToken={resetToken}>
                  <Card
                    color={responsibleColor}
                    title={isBTR ? "Developer / asset owner — set POE goals" : "Operations / strata — set POE goals"}
                    icon={<Target />}
                    stepNo={3}
                    supportKey="po-intake"
                    detail={
                      <>
                        <p>
                          Defines how success will be judged in use and how often
                          POE cycles run. Responsibility sits with{" "}
                          <strong>{isBTR ? "the owner (BTR)" : "operations/strata (BTS)"}</strong>.
                        </p>
                        <ul className="card-list">
                          <li>Confirms comfort, complaints and sustainability thresholds.</li>
                          <li>Sets observation windows (seasonal/annual).</li>
                          <li>Confirms cohorts to be included each cycle.</li>
                        </ul>
                      </>
                    }
                  >
                    <p className="card-inline">
                      Confirms what “good in use” looks like and how often review happens.
                    </p>
                  </Card>
                </Reveal>

                <Reveal order={14} currentStep={currentStep} resetToken={resetToken}>
                  <Card
                    color={responsibleColor}
                    title="Review findings & agree priorities"
                    icon={<BarChart3 />}
                    stepNo={14}
                    supportKey="po-actions"
                    detail={
                      <>
                        <p>
                          Reviews the evidence pack and agrees what is strategic,
                          what is local, and what is feasible within budgets and constraints.
                        </p>
                        <ul className="card-list">
                          <li>Separates “must-fix” from optional enhancements.</li>
                          <li>Balances cost, disruption and benefit.</li>
                          <li>Records decisions in the log.</li>
                        </ul>
                      </>
                    }
                  >
                    <p className="card-inline">
                      Reviews evidence and agrees which improvements to pursue.
                    </p>
                  </Card>
                </Reveal>

                <Reveal order={17} currentStep={currentStep} resetToken={resetToken}>
                  <Card
                    color={responsibleColor}
                    title="Approve preferred improvement package"
                    icon={<CheckCircle2 />}
                    stepNo={17}
                    supportKey="po-actions"
                    detail={
                      <>
                        <p>
                          Formal approval moment to keep POE controlled and traceable.
                          Confirms scope, budget and sequencing before implementation.
                        </p>
                        <ul className="card-list">
                          <li>Approves the preferred package and time-box for delivery.</li>
                          <li>Locks the approved scope in the decision log.</li>
                          <li>Sets re-measurement requirements for the learning loop.</li>
                        </ul>
                      </>
                    }
                  >
                    <p className="card-inline">
                      Approves the package so implementation and re-measurement can proceed.
                    </p>
                  </Card>
                </Reveal>

                <Reveal order={20} currentStep={currentStep} resetToken={resetToken}>
                  <Card
                    color={responsibleColor}
                    title="Decide on capital works & feed next brief"
                    icon={<CheckCircle2 />}
                    stepNo={20}
                    supportKey="po-governance"
                    detail={
                      <>
                        <p>
                          Confirms any capital works programme and instructs the platform to
                          update records so the next planning brief starts smarter.
                        </p>
                        <ul className="card-list">
                          <li>Locks decisions and rationales.</li>
                          <li>Flags stable patterns for future rules.</li>
                          <li>Closes the cycle to prevent endless re-opening.</li>
                        </ul>
                      </>
                    }
                  >
                    <p className="card-inline">
                      Locks decisions and writes learning into the next planning cycle.
                    </p>
                  </Card>
                </Reveal>
              </div>

              {/* Digital platform column */}
              <div className="phase-col phase-col-wide">
                <Card color="blue" title="Digital platform" icon={<Database />}>
                  <p className="card-inline">
                    Pulls together <strong>as-built information</strong>, performance data,
                    complaints and resident feedback, then generates{" "}
                    <strong>evidence-based improvement options</strong>.
                  </p>

                  <Reveal order={4} currentStep={currentStep} resetToken={resetToken}>
                    <Step
                      stepNo={4}
                      icon={<FileText size={18} />}
                      label="Read as-built brief & expectations"
                      detail="Reads L1 (brief/addenda), L3 (design decisions) and L4 (targets) to set the baseline for comparison."
                      supportKey="po-intake"
                    />
                  </Reveal>

                  <Reveal order={5} currentStep={currentStep} resetToken={resetToken}>
                    <Step
                      stepNo={5}
                      icon={<LineChart size={18} />}
                      label="Ingest operational and sensor data"
                      detail="Collects utility data, BMS/IoT feeds and key logs into L4 and L5 as structured records."
                      supportKey="po-metrics"
                    />
                  </Reveal>

                  <Reveal order={8} currentStep={currentStep} resetToken={resetToken}>
                    <Step
                      stepNo={8}
                      icon={<AlertTriangle size={18} />}
                      label="Run performance diagnostics"
                      detail="Compares actual energy, comfort and complaints against thresholds; flags hotspots and trends."
                      supportKey="po-metrics"
                    />
                  </Reveal>

                  <Reveal order={10} currentStep={currentStep} resetToken={resetToken}>
                    <Step
                      stepNo={10}
                      icon={<ClipboardList size={18} />}
                      label="Design resident & ops surveys"
                      detail="Builds short, targeted instruments to explain causes and capture acceptable trade-offs."
                      supportKey="po-surveys"
                    />
                  </Reveal>

                  <Reveal order={11} currentStep={currentStep} resetToken={resetToken}>
                    <Step
                      stepNo={11}
                      icon={<SlidersHorizontal size={18} />}
                      label="Triangulate feedback with data"
                      detail="Combines survey input with telemetry and operational logs so conclusions reflect behaviour and experience."
                      supportKey="po-triangulation"
                    />
                  </Reveal>

                  <Reveal order={13} currentStep={currentStep} resetToken={resetToken}>
                    <Step
                      stepNo={13}
                      icon={<Settings2 size={18} />}
                      label="Generate improvement options"
                      detail="Creates a structured set of tuning measures, minor works and potential capital projects linked to evidence."
                      supportKey="po-actions"
                    />
                  </Reveal>

                  {/* NEW: Process 15 to fix missing number and improve logic */}
                  <Reveal order={15} currentStep={currentStep} resetToken={resetToken}>
                    <Step
                      stepNo={15}
                      icon={<PackageCheck size={18} />}
                      label="Package options into an evidence pack"
                      detail="Ranks options, estimates benefit vs disruption, and prepares a clear ‘evidence pack’ and preferred package candidates for governance review."
                      supportKey="po-packaging"
                    />
                  </Reveal>

                  <Reveal order={18} currentStep={currentStep} resetToken={resetToken}>
                    <Step
                      stepNo={18}
                      icon={<RefreshCcw size={18} />}
                      label="Post-occupancy learning loop (bounded)"
                      detail="Implements selected tweaks, re-measures key metrics and sentiment, and updates the evidence pack within a fixed time window."
                      supportKey="po-loop"
                    />
                  </Reveal>

                  <Reveal order={19} currentStep={currentStep} resetToken={resetToken}>
                    <Step
                      stepNo={19}
                      icon={<Upload size={18} />}
                      label="Write back to hub & next brief"
                      detail="Updates L6 (patterns/rules) and L7 (roles/standards) and prepares a structured bundle to seed the next planning brief."
                      supportKey="po-governance"
                    />
                  </Reveal>
                </Card>
              </div>

              {/* Advisory & technical column */}
              <div className="phase-col">
                <Reveal order={6} currentStep={currentStep} resetToken={resetToken}>
                  <Card
                    color="green"
                    title="FM, ESD & services consultants"
                    icon={<Settings2 />}
                    stepNo={6}
                    supportKey="po-consultants"
                    detail={
                      <>
                        <p>
                          Provide technical diagnosis and feasible measures, from tuning systems to targeted retrofits.
                        </p>
                        <ul className="card-list">
                          <li>Interpret diagnostics from the platform and BMS.</li>
                          <li>Propose feasible options with constraints and risks.</li>
                          <li>Record assumptions and dependencies in L3.</li>
                        </ul>
                      </>
                    }
                  >
                    <p className="card-inline">
                      Translate diagnostics into practical tuning and retrofit options.
                    </p>
                  </Card>
                </Reveal>

                <Reveal order={7} currentStep={currentStep} resetToken={resetToken}>
                  <Card
                    color="green"
                    title="Cost & programme planning"
                    icon={<Database />}
                    stepNo={7}
                    supportKey="po-cost"
                    detail={
                      <>
                        <p>
                          Builds cost, programme and disruption views for the proposed interventions.
                        </p>
                        <ul className="card-list">
                          <li>Estimates capex/opex and simple payback.</li>
                          <li>Flags staging and resident disruption risks.</li>
                          <li>Attaches estimates to options in L3/L4.</li>
                        </ul>
                      </>
                    }
                  >
                    <p className="card-inline">
                      Builds cost, disruption and programme views for proposed actions.
                    </p>
                  </Card>
                </Reveal>
              </div>

              {/* Operations & residents column */}
              <div className="phase-col">
                <Reveal order={9} currentStep={currentStep} resetToken={resetToken}>
                  <Card
                    color="purple"
                    title="Operations team"
                    icon={<Users />}
                    stepNo={9}
                    supportKey="po-ops"
                    detail={
                      <>
                        <p>
                          Day-to-day teams log friction points, maintain service tickets and interpret issues in context.
                        </p>
                        <ul className="card-list">
                          <li>Maintain complaint and ticket logs feeding L2 and L5.</li>
                          <li>Provide practical constraints and work-arounds.</li>
                          <li>Help identify low-cost, high-impact tweaks.</li>
                        </ul>
                      </>
                    }
                  >
                    <p className="card-inline">
                      Logs issues, constraints and opportunities from daily operations.
                    </p>
                  </Card>
                </Reveal>

                {/* FIXED: Residents now appear at Process 12 (after 10 and 11) */}
                <Reveal order={12} currentStep={currentStep} resetToken={resetToken}>
                  <Card
                    color="purple"
                    title="Residents & user panels"
                    icon={<Send />}
                    stepNo={12}
                    supportKey="po-residents"
                    detail={
                      <>
                        <p>
                          Residents describe comfort, noise, security and service experience and react to proposed changes.
                        </p>
                        <ul className="card-list">
                          <li>Participate in short surveys, interviews or digital panels.</li>
                          <li>Compare options with simple explanations of cost, disruption and benefit.</li>
                          <li>Feedback is stored in L2 with links to affected spaces and systems.</li>
                        </ul>
                      </>
                    }
                  >
                    <p className="card-inline">
                      Provide structured feedback on living experience and proposed changes.
                    </p>
                  </Card>
                </Reveal>

                <Reveal order={16} currentStep={currentStep} resetToken={resetToken}>
                  <Card
                    color="purple"
                    title="Validate preferred package"
                    icon={<ListChecks />}
                    stepNo={16}
                    supportKey="po-validate"
                    detail={
                      <>
                        <p>
                          Before implementation, runs a short validation round with residents and operations to confirm fit and surface unintended consequences.
                        </p>
                        <ul className="card-list">
                          <li>Confirms the package addresses real pain points.</li>
                          <li>Surfaces unintended consequences early.</li>
                          <li>Captures final comments for the decision record.</li>
                        </ul>
                      </>
                    }
                  >
                    <p className="card-inline">
                      Runs a bounded validation round on the preferred package.
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
                <span style={{ marginLeft: 6 }}>Database layers (Post-occupancy)</span>
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
                <p>Final brief and as-built configuration used as the reference point for comparison.</p>
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
                <p>Structured feedback and operational logs used to explain performance patterns.</p>
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
                <p>Traceable record of decisions with links to evidence and responsible parties.</p>
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
                <p>Utility, comfort and cost metrics, including before/after comparisons for interventions.</p>
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
                <p>Detailed POE records, complaint histories and BMS/IoT traces tied to spaces and systems.</p>
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
                <p>Cross-project patterns updated so future briefs start smarter.</p>
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
                <p>Records POE responsibility (BTS vs BTR) and applicable standards and approval requirements.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
