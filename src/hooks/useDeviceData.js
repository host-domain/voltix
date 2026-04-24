import { useState, useEffect, useContext } from "react";
import { ReadingsContext } from "../context/ReadingsContext";
import { SettingsContext } from "../context/SettingsContext";
import { SerialContext }   from "../context/SerialContext";

function useDeviceData(device) {
  const { addReadings }                        = useContext(ReadingsContext);
  const { settings }                           = useContext(SettingsContext);
  const { latestData, connectionType }         = useContext(SerialContext);
  const { historyPoints }                      = settings;

  const [currentReadings, setCurrentReadings]  = useState({});
  const [history, setHistory]                  = useState({});
  const [alerts, setAlerts]                    = useState({});
  const [isLoading, setIsLoading]              = useState(true);

  const checkAlerts = (readings, thresholds) => {
    if (!thresholds) return {};
    const newAlerts = {};
    device.sensors.forEach((sensor) => {
      const threshold = thresholds[sensor];
      const value     = readings[sensor];
      if (!threshold || value === undefined) return;
      newAlerts[sensor] = value < threshold.min || value > threshold.max;
    });
    return newAlerts;
  };

  // ── Initialize history structure on mount ─────────────────
  useEffect(() => {
    if (!device?.sensors) return;
    const initialHistory = {};
    device.sensors.forEach((s) => { initialHistory[s] = []; });
    setHistory(initialHistory);
    setIsLoading(false);
  }, [device.id]);

  // ── When new serial data arrives, update readings ─────────
  useEffect(() => {
    if (connectionType === "none" || !device?.sensors) return;
    if (Object.keys(latestData).length === 0) return;

  console.log("📡 latestData:", latestData);          // ← test purpose
  console.log("📦 device.sensors:", device.sensors);  // ← test purpose

    const newReading = {};
    device.sensors.forEach((sensor) => {
      if (latestData[sensor] !== undefined) {
        newReading[sensor] = latestData[sensor];
      }
    });

  console.log("✅ newReading:", newReading); // ← test purpose

    if (Object.keys(newReading).length === 0) return;

    setCurrentReadings(newReading);
    setAlerts(checkAlerts(newReading, device.thresholds));
    addReadings(device, newReading);

    setHistory((prev) => {
      const updated = {};
      device.sensors.forEach((sensor) => {
        const prevHistory = prev[sensor] || [];
        updated[sensor] = [
          ...prevHistory.slice(-(historyPoints - 1)),
          newReading[sensor] ?? null,
        ];
      });
      return updated;
    });
  }, [latestData, connectionType]); // ← fixed: was isConnected

  // ── Re-check alerts when thresholds change ────────────────
  useEffect(() => {
    if (!device?.thresholds || !currentReadings) return;
    setAlerts(checkAlerts(currentReadings, device.thresholds));
  }, [device.thresholds]);

  return { currentReadings, history, alerts, isLoading };
}

export default useDeviceData;