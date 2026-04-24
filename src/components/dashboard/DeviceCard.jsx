import { useState } from "react";
import { useBoxes }     from "../../hooks/useBoxes";
import { useToast }     from "../../context/ToastContext";
import useDeviceData    from "../../hooks/useDeviceData";
import SensorFactory    from "../sensors/SensorFactory";
import ThresholdModal   from "./ThresholdModal";
import SkeletonCard     from "./SkeletonCard";

const SIZES = [
  { key: "compact", label: "Compact", icon: "▪️" },
  { key: "normal",  label: "Normal",  icon: "▫️" },
  { key: "wide",    label: "Wide",    icon: "⬛" },
];

function DeviceCard({ device }) {
  const { removeBox, updateCardSize }                    = useBoxes();
  const { addToast }                                     = useToast();
  const { currentReadings, history, alerts, isLoading } = useDeviceData(device);
  const [menuOpen,      setMenuOpen]                    = useState(false);
  const [showThreshold, setShowThreshold]               = useState(false);
  const [showSizeMenu,  setShowSizeMenu]                = useState(false);
  const [defaultTab,    setDefaultTab]                  = useState("thresholds"); // ← NEW

  const hasAlert = Object.values(alerts).some((a) => a === true);
  const cardSize = device.cardSize || "normal";

  if (isLoading) return <SkeletonCard />;

  const handleDelete = () => {
    removeBox(device.id);
    addToast({ message: `🗑 ${device.name} removed`, type: "info" });
    setMenuOpen(false);
  };

  const handleSizeChange = (sizeKey) => {
    updateCardSize(device.id, sizeKey);
    addToast({ message: `↔️ ${device.name} → ${sizeKey}`, type: "success" });
    setShowSizeMenu(false);
    setMenuOpen(false);
  };

  return (
    <div className={`device-card device-card--${cardSize} ${hasAlert ? "device-card--alert" : ""}`}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="device-card__header">
        <span className={`status-dot ${device.status}`} />
        <h3 className="device-card__name">{device.name}</h3>
        {hasAlert && <span className="alert-badge">⚠️ Alert</span>}
        <span className="device-card__type">{device.deviceType}</span>
        <span className="device-card__connection">{device.connection}</span>

        {/* Three dot menu */}
        <div className="card-menu">
          <button
            className="card-menu__btn"
            onClick={() => { setMenuOpen((p) => !p); setShowSizeMenu(false); }}
          >
            ⋮
          </button>

          {menuOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
                onClick={() => { setMenuOpen(false); setShowSizeMenu(false); }}
              />
              <div className="card-menu__dropdown">

                {/* ── CHANGED: sets defaultTab before opening ── */}
                <div
                  className="card-menu__item"
                  onClick={() => { setDefaultTab("thresholds"); setShowThreshold(true); setMenuOpen(false); }}
                >
                  ⚙️ Set Thresholds
                </div>

                <div
                  className="card-menu__item"
                  onClick={() => { setDefaultTab("axes"); setShowThreshold(true); setMenuOpen(false); }}
                >
                  📊 Chart Axes
                </div>

                {/* Card size — expands inline */}
                <div
                  className="card-menu__item card-menu__item--has-sub"
                  onClick={() => setShowSizeMenu((p) => !p)}
                >
                  <span>↔️ Card Size</span>
                  <span style={{ marginLeft: "auto", fontSize: "10px", opacity: 0.5 }}>
                    {cardSize} {showSizeMenu ? "▲" : "▼"}
                  </span>
                </div>

                {showSizeMenu && (
                  <div className="card-menu__size-options">
                    {SIZES.map((s) => (
                      <div
                        key={s.key}
                        className={`card-menu__size-btn ${cardSize === s.key ? "card-menu__size-btn--active" : ""}`}
                        onClick={() => handleSizeChange(s.key)}
                      >
                        <span>{s.icon} {s.label}</span>
                        {cardSize === s.key && <span>✓</span>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="card-menu__divider" />

                <div
                  className="card-menu__item card-menu__item--danger"
                  onClick={handleDelete}
                >
                  🗑 Delete Device
                </div>

              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Sensor charts ─────────────────────────────────────────────────── */}
      <div className={`device-card__charts ${cardSize === "wide" ? "device-card__charts--wide" : ""}`}>
        {device.sensors.map((sensor) => (
          <SensorFactory
            key={sensor}
            sensorType={sensor}
            value={currentReadings[sensor]}
            history={history[sensor]}
            threshold={device.thresholds?.[sensor]}
            isAlert={alerts[sensor]}
            axisRange={device.axisRanges?.[sensor]}
            cardSize={cardSize}
          />
        ))}
      </div>

      {/* ── CHANGED: passes defaultTab to modal ── */}
      {showThreshold && (
        <ThresholdModal
          device={device}
          defaultTab={defaultTab}
          onClose={() => setShowThreshold(false)}
        />
      )}

    </div>
  );
}

export default DeviceCard;