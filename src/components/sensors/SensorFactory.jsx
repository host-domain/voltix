import { Component }              from "react";
import { getSensorConfig }         from "../../utils/sensorConfig";
import TemperatureChart            from "./TemperatureChart";
import HumidityChart               from "./HumidityChart";
import UVGauge                     from "./UVGauge";
import IRStatus                    from "./IRStatus";

class SensorErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("[SensorErrorBoundary]", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="sensor-error">
          <span className="sensor-error__icon">⚠️</span>
          <span className="sensor-error__text">Chart unavailable</span>
          <button className="sensor-error__retry"
            onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Chart picker ──────────────────────────────────────────────────────────────
// sensorType can be "temperature", "temperature_1", "temperature_3" etc.
// getSensorConfig handles stripping the suffix and updating the label.
function SensorChart({ sensorType, value, history, isAlert, axisRange, cardSize }) {

  const config = getSensorConfig(sensorType);
  if (!config) return null;

  switch (config.chartType) {
    case "line":
      // route humidity base type to HumidityChart, everything else to TemperatureChart
      if (sensorType.startsWith("humidity")) {
        return (
          <HumidityChart
            value={value}
            history={history}
            config={config}
            isAlert={isAlert}
            axisRange={axisRange}
          />
        );
      }
      return (
        <TemperatureChart
          value={value}
          history={history}
          config={config}
          isAlert={isAlert}
          axisRange={axisRange}
        />
      );

    case "gauge":
      return <UVGauge value={value} config={config} isAlert={isAlert} />;

    case "status":
      return <IRStatus value={value} config={config} />;

    case "progressbar":
      return (
        <div className={`progress-sensor ${isAlert ? "sensor--alert" : ""}`}>
          <div className="progress-sensor__header">
            <span>{config.icon} {config.label}</span>
            <span style={{ color: isAlert ? "#ff4757" : config.color }}>
              {value ?? "--"} {config.unit}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar__fill"
              style={{
                width:      `${Math.min((value / config.max) * 100, 100)}%`,
                background: isAlert ? "#ff4757" : config.color,
              }}
            />
          </div>
          {isAlert && <p className="alert-text">⚠️ Outside safe range</p>}
        </div>
      );

    default:
      return (
        <div className="sensor-unknown">
          <p>{config.icon} {config.label}: {value ?? "--"} {config.unit}</p>
        </div>
      );
  }
}

function SensorFactory(props) {
  return (
    <SensorErrorBoundary>
      <SensorChart {...props} />
    </SensorErrorBoundary>
  );
}

export default SensorFactory;