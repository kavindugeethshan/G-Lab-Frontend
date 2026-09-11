import React, { useState, useEffect, useRef } from 'react';

// Brand extraction helper for realistic badges
const getSlotBrand = (part) => {
  if (!part) return '';
  if (part.brand) return part.brand;
  const name = part.name || '';
  if (name.toLowerCase().includes('nzxt')) return 'NZXT';
  if (name.toLowerCase().includes('asus')) return 'ASUS';
  if (name.toLowerCase().includes('msi')) return 'MSI';
  if (name.toLowerCase().includes('amd')) return 'AMD';
  if (name.toLowerCase().includes('intel')) return 'Intel';
  if (name.toLowerCase().includes('kingston')) return 'Kingston';
  if (name.toLowerCase().includes('corsair')) return 'Corsair';
  if (name.toLowerCase().includes('nvidia') || name.toLowerCase().includes('geforce') || name.toLowerCase().includes('rtx')) return 'NVIDIA';
  if (name.toLowerCase().includes('radeon') || name.toLowerCase().includes('rx')) return 'AMD';
  if (name.toLowerCase().includes('samsung')) return 'Samsung';
  if (name.toLowerCase().includes('deepcool')) return 'DeepCool';
  if (name.toLowerCase().includes('crucial')) return 'Crucial';
  return name.split(' ')[0] || 'Installed';
};

// Slot category icon mapping for realistic telemetry and popover badges
const SLOT_ICONS = {
  pcCase: 'fa-solid fa-server',
  fans: 'fa-solid fa-wind',
  motherboard: 'fa-solid fa-microchip',
  cpu: 'fa-solid fa-brain',
  cooler: 'fa-solid fa-fan',
  ram: 'fa-solid fa-memory',
  storage: 'fa-solid fa-hard-drive',
  gpu: 'fa-solid fa-tv',
  psu: 'fa-solid fa-bolt',
};

// Key specs extraction helper for rich popover chips
const getSlotKeySpecs = (slotId, part) => {
  if (!part) return [];
  const specs = [];

  if (slotId === 'cpu') {
    if (part.socket) specs.push(part.socket);
    if (part.cores) specs.push(`${part.cores} Cores`);
    if (part.threads) specs.push(`${part.threads} Threads`);
    if (part.tdp) specs.push(`${part.tdp}W TDP`);
    if (part.clockSpeed) specs.push(part.clockSpeed);
  } else if (slotId === 'gpu') {
    if (part.vram) specs.push(part.vram);
    if (part.chipset) specs.push(part.chipset);
    if (part.tdp) specs.push(`${part.tdp}W TDP`);
    if (part.length) specs.push(`${part.length}mm`);
  } else if (slotId === 'motherboard') {
    if (part.socket) specs.push(part.socket);
    if (part.formFactor) specs.push(part.formFactor);
    if (part.chipset) specs.push(part.chipset);
    if (part.ramType) specs.push(part.ramType);
  } else if (slotId === 'ram') {
    if (part.capacity || part.ramCapacity) specs.push(part.capacity || part.ramCapacity);
    if (part.speed || part.ramSpeed) specs.push(part.speed || part.ramSpeed);
    if (part.type || part.ramType) specs.push(part.type || part.ramType);
  } else if (slotId === 'storage') {
    if (part.capacity || part.storageCapacity) specs.push(part.capacity || part.storageCapacity);
    if (part.storageType) specs.push(part.storageType);
    if (part.readSpeed) specs.push(`${part.readSpeed} MB/s`);
  } else if (slotId === 'psu') {
    if (part.wattage) specs.push(`${part.wattage}W`);
    if (part.efficiencyRating) specs.push(part.efficiencyRating);
    if (part.modularity) specs.push(part.modularity);
  } else if (slotId === 'cooler') {
    if (part.coolerType) specs.push(`${part.coolerType}`);
    if (part.maxTdpSupported) specs.push(`Up to ${part.maxTdpSupported}W TDP`);
  } else if (slotId === 'pcCase') {
    if (part.formFactor) specs.push(part.formFactor);
    if (part.gpuMaxLen) specs.push(`GPU: ${part.gpuMaxLen}mm`);
  } else if (slotId === 'fans') {
    if (part.fanCount) specs.push(`${part.fanCount} Fans`);
    if (part.fanSize) specs.push(part.fanSize);
  }

  if (specs.length === 0 && part.brand) {
    specs.push(part.brand);
  }
  return specs.slice(0, 3);
};

// Interactive Hotspot Pin for direct manual component assembly
function HotspotPin({ slotId, label, part, onClick, isHovered, onHover, onLeave, customClass = '' }) {
  const isInstalled = !!part;
  const brand = getSlotBrand(part);
  const specs = getSlotKeySpecs(slotId, part);
  const iconClass = SLOT_ICONS[slotId] || 'fa-solid fa-microchip';

  return (
    <div
      className={`rig-hotspot-pin ${customClass} ${isInstalled ? 'installed' : 'empty'} ${
        isHovered ? 'hovered' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(slotId);
      }}
      onMouseEnter={() => onHover && onHover(slotId)}
      onMouseLeave={() => onLeave && onLeave()}
      title={isInstalled ? `${label}: ${part.name} (Click to customize)` : `Mount ${label} (Click to install)`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(slotId);
        }
      }}
    >
      <div className="pin-beacon">
        <span className="beacon-ring"></span>
        <span className="beacon-dot">
          <i className={isInstalled ? 'fa-solid fa-check' : 'fa-regular fa-circle'}></i>
        </span>
      </div>
      <div className="pin-card">
        <span className="pin-title">{label}</span>
        <span className="pin-brand">{isInstalled ? brand : '+ Mount'}</span>
      </div>

      {/* Large readable popover on hover/focus so user can easily read details */}
      {isHovered && (
        <div
          className={`pin-large-popover popover-pos-${slotId} ${isInstalled ? 'installed' : 'empty'}`}
          onClick={(e) => {
            e.stopPropagation();
            onClick(slotId);
          }}
        >
          <div className="popover-header-row">
            <span className="popover-slot-badge">
              <i className={iconClass}></i>
              <span>{label}</span>
            </span>
            <span className={`popover-status-pill ${isInstalled ? 'mounted' : 'empty'}`}>
              <i className={isInstalled ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle-dot'}></i>
              <span>{isInstalled ? 'MOUNTED' : 'SLOT EMPTY'}</span>
            </span>
          </div>

          <div className="popover-title-row">
            <h4 className="popover-product-name">
              {isInstalled ? part.name : `Empty ${label} Bay`}
            </h4>
          </div>

          {isInstalled ? (
            <>
              <div className="popover-price-row">
                <span className="popover-price-label">Price:</span>
                <span className="popover-price-val">Rs. {Number(part.price || 0).toLocaleString()}</span>
              </div>

              {specs.length > 0 && (
                <div className="popover-specs-chips">
                  {specs.map((spec, idx) => (
                    <span key={idx} className="popover-spec-chip">
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              <div className="popover-cta-action">
                <i className="fa-solid fa-sliders"></i>
                <span>Click to change / customize</span>
              </div>
            </>
          ) : (
            <>
              <p className="popover-empty-desc">
                Select and mount compatible {label.toLowerCase()} hardware for this rig.
              </p>
              <div className="popover-cta-action install">
                <i className="fa-solid fa-plus"></i>
                <span>Click to select & install</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function BuildVisualizer({ selectedParts, onSlotClick, isPoweredOn, onTogglePower }) {
  const { pcCase, motherboard, cpu, cooler, ram, gpu, storage, psu, fans } = selectedParts;
  const [activeHoverSlot, setActiveHoverSlot] = useState(null);
  const [viewAngle, setViewAngle] = useState('front'); // 'isometric' | 'hero' | 'front'
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  const [isGlassOpen, setIsGlassOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const viewportRef = useRef(null);

  // Real boot sequence state
  const [debugLedCode, setDebugLedCode] = useState('--');
  const [isBootDone, setIsBootDone] = useState(false);
  const [isSpinningUp, setIsSpinningUp] = useState(false);
  const [bootStatusText, setBootStatusText] = useState('');

  // Core components required to POST (Power On Self Test)
  const isPostReady = !!(pcCase && motherboard && cpu && ram && storage && psu);

  // Synthesized Web Audio POST beep (No external audio file needed)
  const playBeep = (freq = 880, duration = 0.15) => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio suppressed or policy restricted
    }
  };

  // Real boot countdown sequence when system powers on
  useEffect(() => {
    if (isPoweredOn) {
      setIsSpinningUp(true);
      setIsBootDone(false);
      setBootStatusText('BOOTING…');
      playBeep(520, 0.08); // Initial click beep
      const debugCodes = ['B2', 'A0', '55', '24', '0d', '00'];
      const timers = [];

      debugCodes.forEach((code, i) => {
        timers.push(
          setTimeout(() => {
            setDebugLedCode(code);
          }, i * 160)
        );
      });

      timers.push(
        setTimeout(() => {
          setIsBootDone(true);
          setDebugLedCode('OK');
          playBeep(880, 0.18); // Motherboard POST single beep
        }, debugCodes.length * 160 + 80)
      );

      timers.push(
        setTimeout(() => {
          setIsSpinningUp(false);
          setBootStatusText('SYSTEM READY');
        }, debugCodes.length * 160 + 1400)
      );

      return () => {
        timers.forEach(clearTimeout);
      };
    } else {
      setDebugLedCode('--');
      setIsBootDone(false);
      setIsSpinningUp(false);
      setBootStatusText('');
    }
  }, [isPoweredOn, audioEnabled]);

  // Interactive 3D mouse parallax tracking
  const handleMouseMove = (e) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;

    if (viewAngle === 'isometric') {
      setMouseTilt({ x: x * 0.4, y: y * 0.4 });
    } else if (viewAngle === 'hero') {
      setMouseTilt({ x: x * 0.35, y: y * 0.35 });
    } else {
      setMouseTilt({ x: x * 0.3, y: y * 0.3 });
    }
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
    setActiveHoverSlot(null);
  };

  // Touch parallax support for mobile screens
  const handleTouchMove = (e) => {
    if (!viewportRef.current || !e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const rect = viewportRef.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((touch.clientY - rect.top) / rect.height - 0.5) * -8;
    setMouseTilt({ x: x * 0.35, y: y * 0.35 });
  };

  const handleTouchEnd = () => {
    setMouseTilt({ x: 0, y: 0 });
    setActiveHoverSlot(null);
  };

  // Dynamic 3D transform string
  const get3DTransform = () => {
    if (viewAngle === 'isometric') {
      const rotX = 9 + mouseTilt.y;
      const rotY = -16 + mouseTilt.x;
      return `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }
    if (viewAngle === 'hero') {
      const rotX = -5 + mouseTilt.y;
      const rotY = 14 + mouseTilt.x;
      return `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    }
    // Front View
    const rotX = 1 + mouseTilt.y;
    const rotY = mouseTilt.x;
    return `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  };

  const installedCount = Object.values(selectedParts).filter(Boolean).length;

  return (
    <div
      className={`pc-build-visualizer realistic-rig-mode ${isPoweredOn ? 'on' : ''} ${
        isSpinningUp ? 'spinning-up' : ''
      }`}
    >
      {/* RIG HEADER */}
      <div className="rig-header-realistic">
        <div className="rig-title-block">
          <h2>Live Assembly Rig</h2>
          <span className="rig-sub-caption">real materials · real boot sequence</span>
        </div>

        {/* CONTROLS (Angle Presets, Glass Panel, Audio & Power Switch) */}
        <div className="rig-controls-realistic">
          <div className="rig-angle-toggle">
            <button
              type="button"
              className={viewAngle === 'isometric' ? 'active' : ''}
              onClick={() => setViewAngle('isometric')}
              title="Isometric 3D Perspective"
            >
              ISO
            </button>
            <button
              type="button"
              className={viewAngle === 'hero' ? 'active' : ''}
              onClick={() => setViewAngle('hero')}
              title="Hero Angled View"
            >
              HERO
            </button>
            <button
              type="button"
              className={viewAngle === 'front' ? 'active' : ''}
              onClick={() => setViewAngle('front')}
              title="Direct Front Inspection"
            >
              FRONT
            </button>
          </div>

          <button
            type="button"
            className={`rig-glass-toggle-btn ${showHotspots ? 'active' : ''}`}
            onClick={() => setShowHotspots(!showHotspots)}
            title="Toggle Hardware Installation Points"
          >
            <i className="fa-solid fa-location-dot"></i>
            <span>POINTS</span>
          </button>

          <button
            type="button"
            className={`rig-glass-toggle-btn ${isGlassOpen ? 'active' : ''}`}
            onClick={() => setIsGlassOpen(!isGlassOpen)}
            title={isGlassOpen ? 'Close Tempered Glass Panel' : 'Swing Open Tempered Glass Panel'}
          >
            <i className={`fa-solid ${isGlassOpen ? 'fa-door-open' : 'fa-window-maximize'}`}></i>
            <span>{isGlassOpen ? 'OPEN' : 'GLASS'}</span>
          </button>

          <button
            type="button"
            className={`rig-glass-toggle-btn ${audioEnabled ? 'active' : ''}`}
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Mute Motherboard Audio' : 'Enable Motherboard POST Audio'}
          >
            <i className={`fa-solid ${audioEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
          </button>

          <button
            type="button"
            className={`pwr-realistic-btn ${isPoweredOn ? 'on' : ''} ${!isPostReady ? 'disabled' : ''}`}
            onClick={onTogglePower}
            disabled={!isPostReady}
            title={
              !isPostReady
                ? 'Install Case, Motherboard, CPU, RAM, Storage, and PSU to test Power On.'
                : 'Click to test real hardware boot sequence!'
            }
          >
            <span className="pwr-dot"></span>
            <span>{isPoweredOn ? 'RUNNING' : 'POWER'}</span>
          </button>
        </div>
      </div>

      {/* 3D CHASSIS VIEWPORT */}
      <div
        className={`rig-viewport-realistic ${viewAngle === 'front' ? 'front' : ''}`}
        ref={viewportRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 3D STAGE */}
        <div className="rig-stage-realistic" style={{ transform: get3DTransform() }}>
          {/* CASE SHELL: BRUSHED ALUMINUM */}
          <div
            className={`case-shell-realistic ${pcCase ? 'installed' : 'empty-case'} ${
              isGlassOpen ? 'glass-open' : ''
            }`}
            onClick={() => onSlotClick('pcCase')}
            onMouseEnter={() => setActiveHoverSlot('pcCase')}
            onMouseLeave={() => setActiveHoverSlot(null)}
          >
            {/* TEMPERED GLASS SIDE PANEL WITH LIGHT SWEEP REAL REFLECTION */}
            <div className="glass-panel-realistic"></div>

            {/* 1. CASE HOTSPOT PIN */}
            {showHotspots && (
              <HotspotPin
                slotId="pcCase"
                label="Case"
                part={pcCase}
                onClick={onSlotClick}
                customClass="pin-case"
                isHovered={activeHoverSlot === 'pcCase'}
                onHover={setActiveHoverSlot}
                onLeave={() => setActiveHoverSlot(null)}
              />
            )}

            {!pcCase ? (
              <div className="empty-rig-placeholder">
                <i className="fa-solid fa-server"></i>
                <strong>No Chassis Selected</strong>
                <span>Click here to select a Case</span>
              </div>
            ) : (
              <>
                {/* 2. TOP EXHAUST FANS (FANS SLOT) */}
                <div
                  className={`top-fans-array-realistic ${fans ? 'installed' : 'empty-fans'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSlotClick('fans');
                  }}
                  onMouseEnter={() => setActiveHoverSlot('fans')}
                  onMouseLeave={() => setActiveHoverSlot(null)}
                  title={fans ? `Fans: ${fans.name}` : 'Top Exhaust Fan Array (Click to Install)'}
                >
                  <div className="top-fan-unit"><div className="blades-realistic"></div></div>
                  <div className="top-fan-unit"><div className="blades-realistic"></div></div>
                  <div className="top-fan-unit"><div className="blades-realistic"></div></div>
                  {showHotspots && (
                    <HotspotPin
                      slotId="fans"
                      label="Fans"
                      part={fans}
                      onClick={onSlotClick}
                      customClass="pin-fans"
                      isHovered={activeHoverSlot === 'fans'}
                      onHover={setActiveHoverSlot}
                      onLeave={() => setActiveHoverSlot(null)}
                    />
                  )}
                </div>

                {/* 3. MOTHERBOARD: ETCHED PCB */}
                <div
                  className={`mobo-realistic ${motherboard ? 'installed' : 'empty-mobo'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSlotClick('motherboard');
                  }}
                  onMouseEnter={() => setActiveHoverSlot('motherboard')}
                  onMouseLeave={() => setActiveHoverSlot(null)}
                >
                  <span className="mobo-realistic-label">
                    {motherboard ? `${motherboard.name} • ${motherboard.socket || 'AM5'}` : 'ATX · AM5 · PCIe 5.0 (Click to Mount)'}
                  </span>

                  {/* MOTHERBOARD HOTSPOT PIN */}
                  {showHotspots && (
                    <HotspotPin
                      slotId="motherboard"
                      label="Motherboard"
                      part={motherboard}
                      onClick={onSlotClick}
                      customClass="pin-motherboard"
                      isHovered={activeHoverSlot === 'motherboard'}
                      onHover={setActiveHoverSlot}
                      onLeave={() => setActiveHoverSlot(null)}
                    />
                  )}

                  {/* VRM HEATSINKS - BRUSHED METAL FINS */}
                  <div className="vrm-realistic"></div>

                  {/* EZ-DEBUG STYLE LED READOUT - REAL BOOT BEHAVIOR */}
                  <div className={`debug-led-realistic ${isBootDone ? 'done' : ''}`} title="Motherboard POST Debug LED">
                    {debugLedCode}
                  </div>

                  {/* 4 & 5. CPU + COOLER FAN WITH MOTION BLUR */}
                  <div
                    className="cpu-block-realistic"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick(cooler ? 'cooler' : (cpu ? 'cooler' : 'cpu'));
                    }}
                    onMouseEnter={() => setActiveHoverSlot(cooler ? 'cooler' : (cpu ? 'cooler' : 'cpu'))}
                    onMouseLeave={() => setActiveHoverSlot(null)}
                    title={
                      cooler
                        ? `Cooler: ${cooler.name} on ${cpu?.name || 'CPU'}`
                        : cpu
                        ? `CPU: ${cpu.name} (Click to install Cooler)`
                        : 'CPU Socket Empty'
                    }
                  >
                    <div className="cpu-die-realistic">
                      {!cpu && <span className="cpu-empty-cue">+ CPU</span>}
                    </div>
                    {cooler && (
                      <div className="fan-realistic">
                        <div className="blades-realistic"></div>
                        <div className="hub-realistic"></div>
                      </div>
                    )}
                  </div>

                  {/* CPU HOTSPOT PIN */}
                  {showHotspots && (
                    <HotspotPin
                      slotId="cpu"
                      label="CPU"
                      part={cpu}
                      onClick={onSlotClick}
                      customClass="pin-cpu"
                      isHovered={activeHoverSlot === 'cpu'}
                      onHover={setActiveHoverSlot}
                      onLeave={() => setActiveHoverSlot(null)}
                    />
                  )}

                  {/* COOLER HOTSPOT PIN */}
                  {showHotspots && (
                    <HotspotPin
                      slotId="cooler"
                      label="Cooler"
                      part={cooler}
                      onClick={onSlotClick}
                      customClass="pin-cooler"
                      isHovered={activeHoverSlot === 'cooler'}
                      onHover={setActiveHoverSlot}
                      onLeave={() => setActiveHoverSlot(null)}
                    />
                  )}

                  {/* 6. RAM - RGB DIFFUSER WITH REAL GRADUAL LIGHT-UP */}
                  <div
                    className="ram-cluster-realistic"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick('ram');
                    }}
                    onMouseEnter={() => setActiveHoverSlot('ram')}
                    onMouseLeave={() => setActiveHoverSlot(null)}
                    title={ram ? `RAM: ${ram.name}` : 'DIMM Slots Empty'}
                  >
                    <div className={`stick-realistic ${ram ? 'installed' : ''}`}></div>
                    <div className={`stick-realistic ${ram ? 'installed' : ''}`}></div>
                    <div className={`stick-realistic ${ram ? 'installed' : ''}`}></div>
                    <div className={`stick-realistic ${ram ? 'installed' : ''}`}></div>
                  </div>

                  {/* RAM HOTSPOT PIN */}
                  {showHotspots && (
                    <HotspotPin
                      slotId="ram"
                      label="RAM"
                      part={ram}
                      onClick={onSlotClick}
                      customClass="pin-ram"
                      isHovered={activeHoverSlot === 'ram'}
                      onHover={setActiveHoverSlot}
                      onLeave={() => setActiveHoverSlot(null)}
                    />
                  )}

                  {/* 7. M.2 NVME STORAGE SLOT */}
                  <div
                    className={`m2-shield-realistic ${storage ? 'installed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick('storage');
                    }}
                    onMouseEnter={() => setActiveHoverSlot('storage')}
                    onMouseLeave={() => setActiveHoverSlot(null)}
                    title={storage ? `Storage: ${storage.name}` : 'M.2 NVMe Slot Empty'}
                  >
                    <span>{storage ? storage.name.substring(0, 14) : 'M.2 NVMe'}</span>
                  </div>

                  {/* STORAGE HOTSPOT PIN */}
                  {showHotspots && (
                    <HotspotPin
                      slotId="storage"
                      label="Storage"
                      part={storage}
                      onClick={onSlotClick}
                      customClass="pin-storage"
                      isHovered={activeHoverSlot === 'storage'}
                      onHover={setActiveHoverSlot}
                      onLeave={() => setActiveHoverSlot(null)}
                    />
                  )}

                  {/* 8. GPU - BRUSHED SHROUD, BACKPLATE, TRIPLE FAN, 12VHPWR GLOW */}
                  <div
                    className={`gpu-realistic ${gpu ? 'installed' : 'empty-gpu'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick('gpu');
                    }}
                    onMouseEnter={() => setActiveHoverSlot('gpu')}
                    onMouseLeave={() => setActiveHoverSlot(null)}
                    title={gpu ? `GPU: ${gpu.name}` : 'PCIe x16 Slot Empty'}
                  >
                    {gpu ? (
                      <>
                        <div className="gpu-fans-trio-realistic">
                          <div className="gfan-realistic"><div className="blades-realistic"></div></div>
                          <div className="gfan-realistic"><div className="blades-realistic"></div></div>
                          <div className="gfan-realistic"><div className="blades-realistic"></div></div>
                        </div>
                        <span className="gpu-name-realistic">
                          {gpu.name.length > 20 ? `${gpu.name.substring(0, 18)}...` : gpu.name}
                        </span>
                        <div className="power-conn-realistic" title="12VHPWR Power Connector"></div>
                      </>
                    ) : (
                      <span className="gpu-empty-cue">+ Mount Graphics Card (PCIe 5.0)</span>
                    )}
                  </div>

                  {/* GPU HOTSPOT PIN */}
                  {showHotspots && (
                    <HotspotPin
                      slotId="gpu"
                      label="GPU"
                      part={gpu}
                      onClick={onSlotClick}
                      customClass="pin-gpu"
                      isHovered={activeHoverSlot === 'gpu'}
                      onHover={setActiveHoverSlot}
                      onLeave={() => setActiveHoverSlot(null)}
                    />
                  )}
                </div>

                {/* 9. PSU + BRAIDED CABLES WITH BEZIER SAG */}
                <div
                  className={`psu-realistic ${psu ? 'installed' : 'empty-psu'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSlotClick('psu');
                  }}
                  onMouseEnter={() => setActiveHoverSlot('psu')}
                  onMouseLeave={() => setActiveHoverSlot(null)}
                  title={psu ? `PSU: ${psu.name} (${psu.wattage}W)` : 'PSU Basement Empty'}
                >
                  <div className="psu-fan-realistic"><div className="blades-realistic"></div></div>
                  <div className="psu-text-realistic">
                    <strong>{psu ? `${psu.wattage}W ${psu.efficiencyRating || 'GOLD'}` : '+ Power Supply'}</strong>
                    <span>{psu ? psu.name : 'ATX 3.0 · Full Modular'}</span>
                  </div>
                  {/* Real Braided Cable Sag with SVG Bezier Curves */}
                  <div className="cables-realistic">
                    <svg viewBox="0 0 60 22">
                      <path className="cable-core" d="M2,2 C 20,2 20,20 58,20"></path>
                      <path className="cable-braid" d="M2,2 C 20,2 20,20 58,20"></path>
                    </svg>
                  </div>
                </div>

                {/* PSU HOTSPOT PIN - DIRECT CHASSIS CHILD TO PREVENT CLIPPING / STACKING ISSUES */}
                {showHotspots && (
                  <HotspotPin
                    slotId="psu"
                    label="PSU"
                    part={psu}
                    onClick={onSlotClick}
                    customClass="pin-psu"
                    isHovered={activeHoverSlot === 'psu'}
                    onHover={setActiveHoverSlot}
                    onLeave={() => setActiveHoverSlot(null)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER: REAL TELEMETRY & BOOT STATUS */}
      <div className="rig-footer-realistic">
        <div className="rig-footer-left">
          {activeHoverSlot && selectedParts[activeHoverSlot] ? (
            <span className="telemetry-highlight">
              <strong>{activeHoverSlot.toUpperCase()}:</strong> {selectedParts[activeHoverSlot].name} (Rs. {selectedParts[activeHoverSlot].price?.toLocaleString()})
            </span>
          ) : (
            <span>installed: {installedCount}/9 components</span>
          )}
        </div>
        <div className="rig-footer-right">
          <span className={`status-realistic ${isPoweredOn ? 'active' : ''}`}>
            {bootStatusText || (isPoweredOn ? 'SYSTEM READY' : 'STANDBY')}
          </span>
        </div>
      </div>
    </div>
  );
}
