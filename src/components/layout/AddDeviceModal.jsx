import { useState } from "react";
import sensorConfig   from "../../utils/sensorConfig";
import { useSettings } from "../../context/SettingsContext";
import { useToast }    from "../../context/ToastContext";

const deviceTypes     = ["Arduino", "ESP32", "NodeMCU", "Raspberry Pi"];
const connectionTypes = ["WiFi", "USB-Serial"];
const allSensors      = Object.keys(sensorConfig);
const MAX_PER_SENSOR  = 4;

function AddDeviceModal({ onClose, onAdd }) {
  const { settings } = useSettings();
  const { addToast } = useToast();

  const [name,       setName]       = useState("");
  const [deviceType, setDeviceType] = useState("Arduino");
  const [connection, setConnection] = useState("WiFi");
  const [error,      setError]      = useState("");

  const [counts, setCounts] = useState(() =>
    Object.fromEntries(allSensors.map((s) => [s, 0]))
  );

  const increment = (sensor) => {
    setCounts((prev) => ({
      ...prev,
      [sensor]: Math.min(prev[sensor] + 1, MAX_PER_SENSOR),
    }));
  };

  const decrement = (sensor) => {
    setCounts((prev) => ({
      ...prev,
      [sensor]: Math.max(prev[sensor] - 1, 0),
    }));
  };

  const buildSensorList = () => {
    const list = [];
    allSensors.forEach((sensor) => {
      for (let i = 1; i <= counts[sensor]; i++) {
        list.push(`${sensor}_${i}`);
      }
    });
    return list;
  };

  const totalSelected = allSensors.reduce((sum, s) => sum + counts[s], 0);

  const handleSubmit = () => {
    if (!name.trim())        { setError("Please enter a device name"); return; }
    if (totalSelected === 0) { setError("Please add at least one sensor"); return; }
    onAdd({
      name:       name.trim(),
      deviceType,
      connection,
      sensors:    buildSensorList(),
      status:     "online",
      thresholds: settings.defaultThresholds,
    });
    addToast({ message: `✅ ${name.trim()} added successfully`, type: "success" });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal__header">
          <h2 className="modal__title">Add New Device</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        {/* ── Device Name ── */}
        <div className="modal__field">
          <label className="modal__label">Device Name</label>
          <input
            className="modal__input"
            type="text"
            placeholder="e.g. Lab Room Monitor"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* ── Device Type ── */}
        <div className="modal__field">
          <label className="modal__label">Device Type</label>
          <div className="modal__options">
            {deviceTypes.map((type) => (
              <button
                key={type}
                className={`option__btn ${deviceType === type ? "active" : ""}`}
                onClick={() => setDeviceType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* ── Connection ── */}
        <div className="modal__field">
          <label className="modal__label">Connection</label>
          <div className="modal__options">
            {connectionTypes.map((type) => (
              <button
                key={type}
                className={`option__btn ${connection === type ? "active" : ""}`}
                onClick={() => setConnection(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sensors ── */}
        <div className="modal__field">
          <label className="modal__label">
            Sensors
            {totalSelected > 0 && (
              <span style={styles.totalBadge}>{totalSelected} selected</span>
            )}
          </label>

          {/* full-width column list — no grid */}
          <div style={styles.sensorList}>
            {allSensors.map((sensor) => {
              const config = sensorConfig[sensor];
              const count  = counts[sensor];
              const active = count > 0;

              return (
                <div
                  key={sensor}
                  style={{
                    ...styles.sensorRow,
                    background:  active ? "var(--accent-dim)" : "var(--bg-card)",
                    borderColor: active ? "var(--accent)"     : "var(--border)",
                  }}
                >
                  <span style={styles.sensorIcon}>{config.icon}</span>

                  <span style={{
                    ...styles.sensorLabel,
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                  }}>
                    {config.label}
                  </span>

                  {config.unit ? (
                    <span style={styles.sensorUnit}>{config.unit}</span>
                  ) : null}

                  <div style={styles.counter}>
                    <button
                      style={{ ...styles.counterBtn, opacity: count === 0 ? 0.3 : 1 }}
                      onClick={(e) => { e.stopPropagation(); decrement(sensor); }}
                    >
                      −
                    </button>
                    <span style={{
                      ...styles.counterNum,
                      color: active ? "var(--accent)" : "var(--text-muted)",
                    }}>
                      {count}
                    </span>
                    <button
                      style={{ ...styles.counterBtn, opacity: count === MAX_PER_SENSOR ? 0.3 : 1 }}
                      onClick={(e) => { e.stopPropagation(); increment(sensor); }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preview */}
          {totalSelected > 0 && (
            <div style={styles.preview}>
              <span style={styles.previewLabel}>ESP32 will send: </span>
              <span style={styles.previewKeys}>
                {buildSensorList().join(", ")}
              </span>
            </div>
          )}
        </div>

        {error && <p className="modal__error">{error}</p>}

        <div className="modal__actions">
          <button className="modal__cancel" onClick={onClose}>Cancel</button>
          <button className="modal__submit" onClick={handleSubmit}>
            + Connect Device
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  totalBadge: {
    marginLeft:    "8px",
    fontSize:      "10px",
    padding:       "2px 8px",
    borderRadius:  "20px",
    background:    "var(--accent-dim)",
    color:         "var(--accent)",
    border:        "1px solid var(--accent-glow)",
    fontWeight:    600,
    textTransform: "none",
    letterSpacing: 0,
  },
  sensorList: {
    display:       "flex",
    flexDirection: "column",
    gap:           "6px",
  },
  sensorRow: {
    display:       "flex",
    alignItems:    "center",
    gap:           "10px",
    padding:       "10px 14px",
    borderRadius:  "8px",
    border:        "1px solid",
    transition:    "all 0.15s",
    userSelect:    "none",
  },
  sensorIcon: {
    fontSize:      "16px",
    flexShrink:    0,
    width:         "22px",
    textAlign:     "center",
  },
  sensorLabel: {
    flex:          1,
    fontSize:      "13px",
    fontWeight:    500,
    minWidth:      0,
  },
  sensorUnit: {
    fontSize:      "11px",
    color:         "var(--text-muted)",
    fontFamily:    "monospace",
    flexShrink:    0,
  },
  counter: {
    display:       "flex",
    alignItems:    "center",
    gap:           "6px",
    flexShrink:    0,
  },
  counterBtn: {
    width:         "26px",
    height:        "26px",
    borderRadius:  "6px",
    border:        "1px solid var(--border)",
    background:    "var(--bg-elevated)",
    color:         "var(--text-primary)",
    fontSize:      "16px",
    lineHeight:    1,
    cursor:        "pointer",
    display:       "flex",
    alignItems:    "center",
    justifyContent:"center",
    padding:       0,
    transition:    "all 0.15s",
  },
  counterNum: {
    fontSize:      "14px",
    fontWeight:    700,
    fontFamily:    "monospace",
    minWidth:      "20px",
    textAlign:     "center",
  },
  preview: {
    marginTop:     "10px",
    padding:       "10px 14px",
    background:    "var(--bg-elevated)",
    borderRadius:  "8px",
    border:        "1px solid var(--border)",
    fontSize:      "11px",
    lineHeight:    1.7,
  },
  previewLabel: {
    color:         "var(--text-muted)",
  },
  previewKeys: {
    color:         "var(--accent)",
    fontFamily:    "monospace",
    wordBreak:     "break-all",
  },
};

export default AddDeviceModal;