import { useState } from "react";
import sensorConfig   from "../../utils/sensorConfig";
import { useBoxes }   from "../../hooks/useBoxes";
import { useToast }   from "../../context/ToastContext";

const defaultThresholds = {
  temperature: { min: 0,   max: 50  },
  humidity:    { min: 20,  max: 80  },
  uv:          { min: 0,   max: 8   },
  gas:         { min: 0,   max: 300 },
  soil:        { min: 20,  max: 90  },
  distance:    { min: 2,   max: 350 },
  ir:          null,
};

// Default chart axis ranges per sensor (Y axis)
const defaultAxisRanges = {
  temperature: { yMin: 0,   yMax: 50,   xPoints: 20 },
  humidity:    { yMin: 0,   yMax: 100,  xPoints: 20 },
  uv:          { yMin: 0,   yMax: 15,   xPoints: 20 },
  gas:         { yMin: 0,   yMax: 1023, xPoints: 20 },
  soil:        { yMin: 0,   yMax: 100,  xPoints: 20 },
  distance:    { yMin: 0,   yMax: 400,  xPoints: 20 },
  ir:          { yMin: 0,   yMax: 1,    xPoints: 20 },
};

function ThresholdModal({ device, defaultTab = "thresholds", onClose }) {
  const { updateThresholds, updateAxisRanges } = useBoxes();
  const { addToast }                           = useToast();

  // ── Active tab ────────────────────────────────────────────────────────────
  cconst [activeTab, setActiveTab] = useState(defaultTab); // "thresholds" | "axes"

  // ── Threshold state (unchanged) ───────────────────────────────────────────
  const [thresholds, setThresholds] = useState(() => {
    const initial = {};
    device.sensors.forEach((sensor) => {
      if (sensor === "ir") return;
      initial[sensor] =
        device.thresholds?.[sensor] ||
        defaultThresholds[sensor] ||
        { min: 0, max: 100 };
    });
    return initial;
  });

  // ── Axis range state (new) ────────────────────────────────────────────────
  const [axisRanges, setAxisRanges] = useState(() => {
    const initial = {};
    device.sensors.forEach((sensor) => {
      initial[sensor] =
        device.axisRanges?.[sensor] ||
        defaultAxisRanges[sensor] ||
        { yMin: 0, yMax: 100, xPoints: 20 };
    });
    return initial;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleThresholdChange = (sensor, field, value) => {
    setThresholds((prev) => ({
      ...prev,
      [sensor]: { ...prev[sensor], [field]: Number(value) },
    }));
  };

  const handleAxisChange = (sensor, field, value) => {
    setAxisRanges((prev) => ({
      ...prev,
      [sensor]: { ...prev[sensor], [field]: Number(value) },
    }));
  };

  const handleSave = () => {
    if (activeTab === "thresholds") {
      updateThresholds(device.id, thresholds);
      addToast({ message: `⚙️ Thresholds saved for ${device.name}`, type: "success" });
    } else {
      updateAxisRanges(device.id, axisRanges);
      addToast({ message: `📊 Chart axes saved for ${device.name}`, type: "success" });
    }
    onClose();
  };

  const thresholdSensors = device.sensors.filter((s) => s !== "ir");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="modal__header">
          <h2 className="modal__title">⚙️ {device.name}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        {/* ── Tab Toggle ──────────────────────────────────────────────────── */}
        <div style={styles.tabRow}>
          <button
            style={activeTab === "thresholds" ? styles.tabActive : styles.tabIdle}
            onClick={() => setActiveTab("thresholds")}
          >
            ⚠️ Alert Thresholds
          </button>
          <button
            style={activeTab === "axes" ? styles.tabActive : styles.tabIdle}
            onClick={() => setActiveTab("axes")}
          >
            📊 Chart Axes
          </button>
        </div>

        {/* ── THRESHOLDS TAB ──────────────────────────────────────────────── */}
        {activeTab === "thresholds" && (
          <>
            <p className="threshold-desc">
              Card will glow red when a sensor value goes outside its range.
            </p>

            {thresholdSensors.length === 0 && (
              <p className="modal__error">No threshold-supported sensors on this device.</p>
            )}

            {thresholdSensors.map((sensor) => {
              const config  = sensorConfig[sensor];
              const current = thresholds[sensor];
              return (
                <div key={sensor} className="threshold-row">
                  <div className="threshold-row__label">
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                    <span className="threshold-unit">({config.unit})</span>
                  </div>
                  <div className="threshold-row__inputs">
                    <div className="threshold-input-group">
                      <label>Min</label>
                      <input
                        type="number"
                        className="modal__input threshold-input"
                        value={current.min}
                        onChange={(e) => handleThresholdChange(sensor, "min", e.target.value)}
                      />
                    </div>
                    <span className="threshold-dash">—</span>
                    <div className="threshold-input-group">
                      <label>Max</label>
                      <input
                        type="number"
                        className="modal__input threshold-input"
                        value={current.max}
                        onChange={(e) => handleThresholdChange(sensor, "max", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── CHART AXES TAB ──────────────────────────────────────────────── */}
        {activeTab === "axes" && (
          <>
            <p className="threshold-desc">
              Control what range each chart displays. X-axis sets how many data
              points are shown. Y-axis sets the visible min/max on the chart.
            </p>

            {device.sensors.map((sensor) => {
              const config  = sensorConfig[sensor];
              const current = axisRanges[sensor];
              return (
                <div key={sensor} className="threshold-row">

                  {/* Sensor label */}
                  <div className="threshold-row__label">
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                    <span className="threshold-unit">({config.unit})</span>
                  </div>

                  {/* Y-axis row */}
                  <div style={styles.axisGroup}>
                    <span style={styles.axisGroupLabel}>Y — Axis</span>
                    <div className="threshold-row__inputs">
                      <div className="threshold-input-group">
                        <label>Min</label>
                        <input
                          type="number"
                          className="modal__input threshold-input"
                          value={current.yMin}
                          onChange={(e) => handleAxisChange(sensor, "yMin", e.target.value)}
                        />
                      </div>
                      <span className="threshold-dash">—</span>
                      <div className="threshold-input-group">
                        <label>Max</label>
                        <input
                          type="number"
                          className="modal__input threshold-input"
                          value={current.yMax}
                          onChange={(e) => handleAxisChange(sensor, "yMax", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* X-axis row — only for line/progressbar charts, not gauge/status */}
                  {config.chartType !== "gauge" && config.chartType !== "status" && (
                    <div style={styles.axisGroup}>
                      <span style={styles.axisGroupLabel}>X — Data Points</span>
                      <div style={styles.xRow}>
                        <input
                          type="number"
                          min={5}
                          max={200}
                          className="modal__input threshold-input"
                          value={current.xPoints}
                          onChange={(e) => handleAxisChange(sensor, "xPoints", e.target.value)}
                          style={{ width: "90px", textAlign: "center" }}
                        />
                        <span style={styles.xHint}>points visible on chart</span>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="modal__actions">
          <button className="modal__cancel" onClick={onClose}>Cancel</button>
          <button className="modal__submit" onClick={handleSave}>
            {activeTab === "thresholds" ? "Save Thresholds" : "Save Axes"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Local styles (no new CSS classes needed) ──────────────────────────────────
const styles = {
  tabRow: {
    display:       "flex",
    gap:           "8px",
    background:    "var(--bg-card)",
    padding:       "4px",
    borderRadius:  "10px",
    border:        "1px solid var(--border)",
  },
  tabIdle: {
    flex:          1,
    padding:       "8px",
    borderRadius:  "8px",
    border:        "none",
    background:    "transparent",
    color:         "var(--text-secondary)",
    fontSize:      "13px",
    cursor:        "pointer",
    transition:    "all 0.2s",
    fontWeight:    500,
  },
  tabActive: {
    flex:          1,
    padding:       "8px",
    borderRadius:  "8px",
    border:        "none",
    background:    "var(--bg-elevated)",
    color:         "var(--accent)",
    fontSize:      "13px",
    cursor:        "pointer",
    fontWeight:    600,
    boxShadow:     "0 1px 4px rgba(0,0,0,0.3)",
  },
  axisGroup: {
    display:       "flex",
    flexDirection: "column",
    gap:           "6px",
    paddingTop:    "10px",
    borderTop:     "1px solid var(--border)",
  },
  axisGroupLabel: {
    fontSize:      "10px",
    letterSpacing: "1.5px",
    color:         "var(--text-muted)",
    textTransform: "uppercase",
  },
  xRow: {
    display:       "flex",
    alignItems:    "center",
    gap:           "10px",
  },
  xHint: {
    fontSize:      "12px",
    color:         "var(--text-muted)",
  },
};

export default ThresholdModal;