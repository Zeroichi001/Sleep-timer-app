import React, { useState } from 'react';
import { BluetoothDevice } from '../types';
import {
  Bluetooth,
  BluetoothOff,
  Headphones,
  Speaker,
  Battery,
  BatteryCharging,
  Check,
  X,
  RefreshCw,
  Plus,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface BluetoothManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: BluetoothDevice[];
  onToggleConnect: (id: string) => void;
  onAddDevice: (device: BluetoothDevice) => void;
}

export const BluetoothManagerModal: React.FC<BluetoothManagerModalProps> = ({
  isOpen,
  onClose,
  devices,
  onToggleConnect,
  onAddDevice,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real Web Bluetooth scanning attempt
  const handleScanRealDevice = async () => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      if ('bluetooth' in navigator) {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service'],
        });

        if (device) {
          const newDev: BluetoothDevice = {
            id: `real-${device.id || Date.now()}`,
            name: device.name || 'Perangkat Bluetooth Eksternal',
            type: 'headphone',
            battery: 100,
            connected: true,
            isReal: true,
          };
          onAddDevice(newDev);
          soundEngine.playTick(1.2);
        }
      } else {
        // Fallback simulated scan: add a nearby device
        setTimeout(() => {
          const simulatedNames = ['Pixel Buds Pro 2', 'JBL Flip 6', 'Sennheiser Momentum 4'];
          const randomName = simulatedNames[Math.floor(Math.random() * simulatedNames.length)];
          const newDev: BluetoothDevice = {
            id: `sim-${Date.now()}`,
            name: randomName,
            type: randomName.includes('Flip') ? 'speaker' : 'earbuds',
            battery: 85,
            connected: true,
          };
          onAddDevice(newDev);
          setIsScanning(false);
          soundEngine.playTick(1.2);
        }, 1000);
        return;
      }
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        setErrorMessage(err.message || 'Gagal memindai perangkat');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const getDeviceIcon = (type: BluetoothDevice['type']) => {
    switch (type) {
      case 'speaker':
        return <Speaker className="w-5 h-5 text-indigo-400" />;
      case 'earbuds':
      case 'headphone':
      default:
        return <Headphones className="w-5 h-5 text-sky-400" />;
    }
  };

  const connectedCount = devices.filter((d) => d.connected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden p-5 text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Bluetooth className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Kelola Bluetooth</h3>
              <p className="text-[11px] text-slate-400">
                {connectedCount > 0 ? `${connectedCount} Terhubung (Auto-Disconnect saat tidur)` : 'Tidak ada perangkat terhubung'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="my-3 p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/40 flex items-start gap-2 text-xs text-sky-200">
          <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <span>
            Saat sleep timer habis, sambungan ke semua headset / speaker Bluetooth ini akan diputus otomatis agar audio berhenti dan baterai perangkat Anda hemat semalaman.
          </span>
        </div>

        {errorMessage && (
          <div className="mb-2 p-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Device List */}
        <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar py-1">
          {devices.map((dev) => (
            <div
              key={dev.id}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                dev.connected
                  ? 'bg-slate-800/80 border-sky-500/40'
                  : 'bg-slate-950/50 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/60">
                  {getDeviceIcon(dev.type)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>{dev.name}</span>
                    {dev.isReal && (
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded border border-emerald-800">
                        Real BT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Battery className="w-3 h-3 text-emerald-400" />
                      {dev.battery}%
                    </span>
                    <span>•</span>
                    <span className={dev.connected ? 'text-sky-300 font-medium' : 'text-slate-500'}>
                      {dev.connected ? 'Terhubung (Audio Aktif)' : 'Terputus'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connect / Disconnect button */}
              <button
                onClick={() => {
                  soundEngine.playTick();
                  onToggleConnect(dev.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1 ${
                  dev.connected
                    ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60'
                    : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                }`}
              >
                {dev.connected ? (
                  <>
                    <BluetoothOff className="w-3 h-3" />
                    <span>Putus</span>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-3 h-3" />
                    <span>Hubungkan</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Add / Scan Device Button */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleScanRealDevice}
            disabled={isScanning}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-sky-400' : ''}`} />
            <span>{isScanning ? 'Memindai Perangkat...' : 'Pindai Perangkat Baru'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
