"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

// Kaaba coordinates
const KAABA = { lat: 21.4225, lng: 39.8262 };
// Melbourne fallback
const MELBOURNE = { lat: -37.8136, lng: 144.9631 };

function calcBearing(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const φ1 = (fromLat * Math.PI) / 180;
  const φ2 = (toLat * Math.PI) / 180;
  const Δλ = ((toLng - fromLng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function bearingLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export default function QiblaPage() {
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("Melbourne");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [compassPermissionDenied, setCompassPermissionDenied] = useState(false);
  const orientationListenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  // Get user location and compute bearing
  useEffect(() => {
    if (!navigator.geolocation) {
      setQiblaBearing(calcBearing(MELBOURNE.lat, MELBOURNE.lng, KAABA.lat, KAABA.lng));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setQiblaBearing(calcBearing(latitude, longitude, KAABA.lat, KAABA.lng));
        setLocationName("Your Location");
      },
      () => {
        setPermissionDenied(true);
        setQiblaBearing(calcBearing(MELBOURNE.lat, MELBOURNE.lng, KAABA.lat, KAABA.lng));
      }
    );
  }, []);

  // Request device orientation for live compass
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // iOS: webkitCompassHeading gives true compass heading directly
      // Android deviceorientationabsolute: alpha is compass heading (0=north, CCW), so heading = (360 - alpha) % 360
      const heading =
        (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading ??
        (e.alpha !== null ? (360 - e.alpha) % 360 : null);
      if (heading !== null) setDeviceHeading(heading);
    };

    orientationListenerRef.current = handleOrientation;

    // iOS 13+ requires permission
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function"
    ) {
      (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .then((state) => {
          if (state === "granted") {
            window.addEventListener("deviceorientation", handleOrientation, true);
          } else {
            setCompassPermissionDenied(true);
          }
        })
        .catch(() => setCompassPermissionDenied(true));
    } else {
      // Use deviceorientationabsolute on Android for magnetic-north-referenced heading
      // Fall back to deviceorientation if not supported
      if ("ondeviceorientationabsolute" in window) {
        window.addEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
      } else {
        (window as Window).addEventListener("deviceorientation", handleOrientation, true);
      }
    }

    return () => {
      if (orientationListenerRef.current) {
        window.removeEventListener("deviceorientationabsolute", orientationListenerRef.current as EventListener, true);
        window.removeEventListener("deviceorientation", orientationListenerRef.current, true);
      }
    };
  }, []);

  // Angle to rotate the needle: qibla bearing relative to device heading
  const needleAngle =
    qiblaBearing !== null && deviceHeading !== null
      ? qiblaBearing - deviceHeading
      : qiblaBearing ?? 0;

  const isLive = deviceHeading !== null;

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Back */}
      <Link href="/home" className="flex items-center gap-1 text-sm text-[var(--subtext)] -mt-1">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Home
      </Link>

      <div className="flex flex-col items-center gap-1">
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Qibla Direction</h1>
        <p className="text-sm text-[var(--subtext)]">
          {permissionDenied ? "Using Melbourne (location denied)" : `From ${locationName}`}
        </p>
      </div>

      {/* Compass */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-72 h-72">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-[var(--border)] bg-[var(--surface)]" />

          {/* Cardinal labels */}
          {[
            { label: "N", angle: 0 },
            { label: "E", angle: 90 },
            { label: "S", angle: 180 },
            { label: "W", angle: 270 },
          ].map(({ label, angle }) => {
            const rad = ((angle - (isLive ? deviceHeading! : 0)) * Math.PI) / 180;
            const r = 120;
            const x = 144 + r * Math.sin(rad);
            const y = 144 - r * Math.cos(rad);
            return (
              <span
                key={label}
                className={`absolute text-xs font-bold -translate-x-1/2 -translate-y-1/2 ${
                  label === "N" ? "text-red-400" : "text-[var(--subtext)]"
                }`}
                style={{ left: x, top: y }}
              >
                {label}
              </span>
            );
          })}

          {/* Tick marks */}
          {Array.from({ length: 36 }, (_, i) => {
            const angle = i * 10 - (isLive ? deviceHeading! : 0);
            const rad = (angle * Math.PI) / 180;
            const r1 = i % 3 === 0 ? 104 : 108;
            const r2 = 114;
            const cx = 144;
            const cy = 144;
            return (
              <svg key={i} className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                <line
                  x1={cx + r1 * Math.sin(rad)}
                  y1={cy - r1 * Math.cos(rad)}
                  x2={cx + r2 * Math.sin(rad)}
                  y2={cy - r2 * Math.cos(rad)}
                  stroke="var(--border)"
                  strokeWidth={i % 3 === 0 ? 1.5 : 1}
                />
              </svg>
            );
          })}

          {/* Qibla needle */}
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${needleAngle}deg)` }}
          >
            {/* Arrow pointing up = Qibla direction */}
            <svg viewBox="0 0 288 288" className="w-full h-full">
              {/* Kaaba icon at tip */}
              <text x="144" y="48" textAnchor="middle" fontSize="20">🕋</text>
              {/* Needle shaft */}
              <line
                x1="144" y1="60"
                x2="144" y2="144"
                stroke="#C9A84C"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Arrowhead */}
              <polygon
                points="144,52 139,68 149,68"
                fill="#C9A84C"
              />
              {/* Tail */}
              <line
                x1="144" y1="144"
                x2="144" y2="210"
                stroke="#C9A84C"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.3"
              />
              {/* Centre dot */}
              <circle cx="144" cy="144" r="5" fill="#C9A84C" />
            </svg>
          </div>
        </div>

        {/* Bearing info */}
        {qiblaBearing !== null && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-5xl font-bold text-[#C9A84C]">
                {Math.round(qiblaBearing)}°
              </span>
              <span className="text-xl font-semibold text-[var(--subtext)]">
                {bearingLabel(qiblaBearing)}
              </span>
            </div>
            <p className="text-sm text-[var(--subtext)]">True bearing to the Kaaba</p>
          </div>
        )}

        {/* Status badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm ${
          isLive
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : compassPermissionDenied
            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--subtext)]"
        }`}>
          <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-[var(--subtext)]"}`} />
          {isLive
            ? "Live compass active"
            : compassPermissionDenied
            ? "Compass permission denied — showing fixed bearing"
            : "Hold your phone flat and face the direction shown"}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--subtext)]">About Qibla</p>
        <p className="text-sm text-[var(--text)] leading-relaxed">
          The Qibla is the direction Muslims face during prayer, pointing towards the Masjid al-Haram in Mecca where the Kaaba stands.
        </p>
      </div>
    </div>
  );
}
