import { useState, useEffect, useContext } from "react";
import { ReadingsContext } from "../context/ReadingsContext";
import { SettingsContext } from "../context/SettingsContext";
import { SerialContext }   from "../context/SerialContext";

function useDeviceData(device) {
  const { addReadings }                = useContext(ReadingsContext);
  const { settings }                   = useContext(SettingsContext);
  const { latestData, connectionType } = useContext(SerialContext);
  const { historyPoints }              = settings;

  const [currentReadings, setCurrentReadings] = useState({});
  const [history, setHistory]                 = useState({});
  const [alerts, setAlerts]                   = useState({});
  const [isLoading, setIsLoading]             = useState(true);

  const checkAlerts = (readings, thresholds) => {
    if (!thresholds) return {};
    const newAlerts = {};

    device.sensors.forEach((sensor) => {
      const threshold = thresholds[sensor];
      const value     = readings[sensor];

      if (!threshold || value === undefined) return;

      newAlerts[sensor] =
        value < threshold.min || value > threshold.max;
    });

    return newAlerts;
  };

  // ── Initialize history ───────────────────────────────
  useEffect(() => {
    if (!device?.sensors) return;

    const initialHistory = {};
    device.sensors.forEach((s) => { initialHistory[s] = []; });

    setHistory(initialHistory);
    setIsLoading(false);
  }, [device.id]);

  // ── Update from serial data ──────────────────────────
  useEffect(() => {
    if (connectionType === "none" || !device?.sensors) return;
    if (Object.keys(latestData).length === 0) return;

    const newReading = {};

    device.sensors.forEach((sensor) => {
      if (latestData[sensor] !== undefined) {
        newReading[sensor] = latestData[sensor];
      }
    });

    if (Object.keys(newReading).length === 0) return;

    setCurrentReadings(newReading);
    setAlerts(checkAlerts(newReading, device.thresholds));
    addReadings(device, newReading);

    // ✅ FIX: Do NOT push null values into history
    setHistory((prev) => {
      const updated = {};

      device.sensors.forEach((sensor) => {
        const prevHistory = prev[sensor] || [];

        updated[sensor] =
          newReading[sensor] !== undefined
            ? [
                ...prevHistory.slice(-(historyPoints - 1)),
                newReading[sensor],
              ]
            : prevHistory;
      });

      return updated;
    });

  }, [latestData, connectionType]);

  // ── Re-check alerts ──────────────────────────────────
  useEffect(() => {
    if (!device?.thresholds || !currentReadings) return;
    setAlerts(checkAlerts(currentReadings, device.thresholds));
  }, [device.thresholds]);

  return { currentReadings, history, alerts, isLoading };
}

export default useDeviceData;