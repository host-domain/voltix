import ReactApexChart from "react-apexcharts";

function TemperatureChart({ value, history, config, isAlert, axisRange }) {
  const alertColor  = "#ff4757";
  const activeColor = isAlert ? alertColor : config.color;

  // ── Axis range handling ───────────────────────────────
  const yMin    = axisRange?.yMin    ?? config.min;
  const yMax    = axisRange?.yMax    ?? config.max;
  const xPoints = axisRange?.xPoints ?? 20;

  // ✅ FIX: Remove null/undefined values → prevents NaN errors
  const visibleHistory = (history || [])
    .filter(v => v !== null && v !== undefined)
    .slice(-xPoints);

  const options = {
    chart: {
      type: "area",
      animations: {
        enabled: true,
        easing: "smooth",
        dynamicAnimation: { speed: 600 },
      },
      toolbar: { show: false },
      background: "transparent",
    },

    dataLabels: {
      enabled: true,
      formatter: (val, opts) =>
        opts.dataPointIndex % 5 === 4 ? `${Math.round(val)}` : "",
      style: {
        fontSize: "10px",
        fontWeight: "600",
        colors: ["#000000"],
      },
      background: {
        enabled: true,
        padding: 3,
        borderRadius: 3,
        borderWidth: 0,
        opacity: 0.75,
        dropShadow: { enabled: false },
      },
      offsetY: -6,
    },

    stroke: { curve: "smooth", width: 2 },
    colors: [activeColor],

    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },

    // ✅ FIX: Better tick distribution
    yaxis: {
      min: yMin,
      max: yMax,
      tickAmount: 5, // ← was 2
      labels: {
        style: { colors: "#6b8299", fontSize: "10px" },
        formatter: (val) => `${Math.round(val)}${config.unit}`,
        offsetX: -4,
      },
    },

    grid: {
      borderColor: "#1f2d3a",
      strokeDashArray: 4,
      padding: { left: 0, right: 8, top: 8, bottom: 0 },
    },

    tooltip: {
      theme: "dark",
      x: { show: false },
      y: { formatter: (val) => `${val} ${config.unit}` },
    },

    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.25,
        opacityTo: 0,
        stops: [0, 100],
      },
    },

    markers: { size: 0 },
  };

  return (
    <div className={`sensor-chart ${isAlert ? "sensor--alert" : ""}`}>
      <div className="sensor-chart__header">
        <span className="sensor-chart__icon">{config.icon}</span>
        <span className="sensor-chart__label">{config.label}</span>

        <span className="sensor-chart__value" style={{ color: activeColor }}>
          {value ?? "--"} {config.unit}
        </span>

        {isAlert && <span className="alert-icon">⚠️</span>}
      </div>

      <ReactApexChart
        key={`${yMin}-${yMax}-${xPoints}`}
        options={options}
        series={[{ name: config.label, data: visibleHistory }]}
        type="area"
        height={110}
      />

      {isAlert && (
        <p className="alert-text">⚠️ Outside threshold range</p>
      )}
    </div>
  );
}

export default TemperatureChart;