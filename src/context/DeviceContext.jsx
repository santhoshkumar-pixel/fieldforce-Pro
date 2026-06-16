import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

const DeviceContext = createContext(null);

export function DeviceProvider({ children }) {
 const [deviceList, setDeviceList] = useState([]);
 const [loading, setLoading] = useState(true);

 const fetchDevices = async () => {
 try {
 const data = await api.devices.getAll();
 const normalized = (data || []).map(d => ({
   ...d,
   type: d.type === "Fastscan" ? "FastScan" : d.type
 }));
 setDeviceList(normalized);
 } catch (err) {
 console.error("Failed to fetch devices:", err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchDevices();
 }, []);

 const addDevice = async (newDevice) => {
 try {
 const toCreate = {
   ...newDevice,
   type: newDevice.type === "Fastscan" ? "FastScan" : newDevice.type
 };
 const created = await api.devices.create(toCreate);
 const normalizedCreated = {
   ...created,
   type: created.type === "Fastscan" ? "FastScan" : created.type
 };
 setDeviceList((prev) => [normalizedCreated, ...prev]);
 } catch (err) {
 console.error("Failed to add device:", err);
 }
 };

  const updateDevice = async (id, updatedFields) => {
    try {
      const existing = deviceList.find(d => d.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updatedFields };
      const response = await api.devices.update(id, merged);
      setDeviceList((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...response } : d))
      );
    } catch (err) {
      console.error("Failed to update device:", err);
    }
  };

 const value = useMemo(
 () => ({
 devices: deviceList,
 loading,
 addDevice,
 updateDevice,
 refreshDevices: fetchDevices,
 setDevices: setDeviceList,
 }),
 [deviceList, loading]
 );

 return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
 const ctx = useContext(DeviceContext);
 if (!ctx) throw new Error("useDevice must be used within DeviceProvider");
 return ctx;
}
