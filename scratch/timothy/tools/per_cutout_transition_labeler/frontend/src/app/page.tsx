"use client";

import { useEffect, useState, useRef } from "react";

// Lowercase string enum arrays matching Protobuf definitions
const ENUMS = {
  placement: ['place_unknown', ...Array.from({ length: 24 }, (_, i) => `place_${i + 1}`)],
  coin_count: ['coin_unknown', ...Array.from({ length: 21 }, (_, i) => `coin_${i}`)],
  primary_item: [
    'item_unknown', 'none', 'item_roulette', 'green_shell', 'red_shell', 'coin_shell', 'banana', 'mushroom', 'kamek', 'blooper', 'bobomb', 'boo', 'boomerang', 'bullet_bill', 'coin', 'feather', 'fire_flower', 'hammer', 'ice_flower', 'lightning', 'mega_mushroom', 'spiny_shell', 'super_horn', 'star', 'triple_bananas', 'triple_green_shells', 'triple_mushrooms', 'triple_red_shells', 'question_mark_box', 'dash_food_roulette', 'dash_food_hamburger', 'dash_food_donut', 'dash_food_spicy_curry', 'dash_food_barbecue', 'dash_food_wild_bone', 'dash_food_ice_cream', 'dash_food_magma_curry', 'dash_food_fruit_barrel', 'dash_food_moo_moo_milk', 'dash_food_pancake', 'dash_food_pan', 'dash_food_pizza', 'dash_food_fritter_and_potato', 'dash_food_takoyaki', 'dash_food_ringo_ame', 'dash_food_pukupuki_taiyaki', 'dash_food_sushi', 'dash_food_white_choco_snack', 'dash_food_ichigo_choco_snack', 'dash_food_black_choco_snack', 'dash_food_popcorn', 'dash_food_lunchbox'
  ],
  secondary_item: [
    'item_unknown', 'none', 'item_roulette', 'green_shell', 'red_shell', 'coin_shell', 'banana', 'mushroom', 'kamek', 'blooper', 'bobomb', 'boo', 'boomerang', 'bullet_bill', 'coin', 'feather', 'fire_flower', 'hammer', 'ice_flower', 'lightning', 'mega_mushroom', 'spiny_shell', 'super_horn', 'star', 'triple_bananas', 'triple_green_shells', 'triple_mushrooms', 'triple_red_shells', 'question_mark_box', 'dash_food_roulette', 'dash_food_hamburger', 'dash_food_donut', 'dash_food_spicy_curry', 'dash_food_barbecue', 'dash_food_wild_bone', 'dash_food_ice_cream', 'dash_food_magma_curry', 'dash_food_fruit_barrel', 'dash_food_moo_moo_milk', 'dash_food_pancake', 'dash_food_pan', 'dash_food_pizza', 'dash_food_fritter_and_potato', 'dash_food_takoyaki', 'dash_food_ringo_ame', 'dash_food_pukupuki_taiyaki', 'dash_food_sushi', 'dash_food_white_choco_snack', 'dash_food_ichigo_choco_snack', 'dash_food_black_choco_snack', 'dash_food_popcorn', 'dash_food_lunchbox'
  ]
};

// Bounding box HUD presets
const DEFAULT_CROPS = {
  placement: { top: 85, left: 85, scale: 400 },
  coin_count: { top: 85, left: 10, scale: 400 },
  primary_item: { top: 10, left: 15, scale: 350 },
  secondary_item: { top: 10, left: 25, scale: 350 }
};

// Numeric keypad rapid maps
const QUICK_HOTKEYS = {
  placement: [
    { key: '1', label: '1st', val: 'place_1' },
    { key: '2', label: '2nd', val: 'place_2' },
    { key: '3', label: '3rd', val: 'place_3' },
    { key: '4', label: '4th', val: 'place_4' },
    { key: '5', label: '5th', val: 'place_5' },
    { key: '6', label: '6th', val: 'place_6' },
    { key: '7', label: '7th', val: 'place_7' },
    { key: '8', label: '8th', val: 'place_8' },
    { key: '9', label: '9th', val: 'place_9' }
  ],
  coin_count: [
    { key: '0', label: '0 coins', val: 'coin_0' },
    { key: '1', label: '1 coin', val: 'coin_1' },
    { key: '2', label: '2 coins', val: 'coin_2' },
    { key: '3', label: '3 coins', val: 'coin_3' },
    { key: '4', label: '4 coins', val: 'coin_4' },
    { key: '5', label: '5 coins', val: 'coin_5' },
    { key: '6', label: '6 coins', val: 'coin_6' },
    { key: '7', label: '7 coins', val: 'coin_7' },
    { key: '8', label: '8 coins', val: 'coin_8' },
    { key: '9', label: '9 coins', val: 'coin_9' }
  ],
  primary_item: [
    { key: '0', label: 'None', val: 'none' },
    { key: '1', label: 'Roulette', val: 'item_roulette' },
    { key: '2', label: 'Green Shell', val: 'green_shell' },
    { key: '3', label: 'Red Shell', val: 'red_shell' },
    { key: '4', label: 'Banana', val: 'banana' },
    { key: '5', label: 'Mushroom', val: 'mushroom' },
    { key: '6', label: 'Star', val: 'star' },
    { key: '7', label: 'Spiny Shell', val: 'spiny_shell' },
    { key: '8', label: 'Bullet Bill', val: 'bullet_bill' },
    { key: '9', label: 'Coin', val: 'coin' }
  ],
  secondary_item: [
    { key: '0', label: 'None', val: 'none' },
    { key: '1', label: 'Roulette', val: 'item_roulette' },
    { key: '2', label: 'Green Shell', val: 'green_shell' },
    { key: '3', label: 'Red Shell', val: 'red_shell' },
    { key: '4', label: 'Banana', val: 'banana' },
    { key: '5', label: 'Mushroom', val: 'mushroom' },
    { key: '6', label: 'Star', val: 'star' },
    { key: '7', label: 'Spiny Shell', val: 'spiny_shell' },
    { key: '8', label: 'Bullet Bill', val: 'bullet_bill' },
    { key: '9', label: 'Coin', val: 'coin' }
  ]
};

interface LabelEvent {
  frameIdx: number;
  val: string;
}

const BACKEND_URL = 'http://localhost:3003';

export default function TimelineLabeler() {
  const [loading, setLoading] = useState(true);
  const [loaderMsg, setLoaderMsg] = useState("Connecting to backend...");
  const [csvFilename, setCsvFilename] = useState("");
  const [totalFrames, setTotalFrames] = useState(0);
  const [frameUrls, setFrameUrls] = useState<string[]>([]);
  const [frameIds, setFrameIds] = useState<string[]>([]);
  
  const [activePhase, setActivePhase] = useState<'placement' | 'coin_count' | 'primary_item' | 'secondary_item'>('placement');
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(60);
  const [saveStatus, setSaveStatus] = useState("Saved to CSV");
  const [saveColor, setSaveColor] = useState("#10b981");

  const [allTransitions, setAllTransitions] = useState<Record<string, LabelEvent[]>>({
    placement: [],
    coin_count: [],
    primary_item: [],
    secondary_item: []
  });

  const [activeCrop, setActiveCrop] = useState({ top: 50, left: 50, scale: 100 });
  const [flashBg, setFlashBg] = useState(false);

  const preloadedImages = useRef<Map<string, HTMLImageElement>>(new Map());
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial CSV data
  useEffect(() => {
    async function loadDataset() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/load`);
        const data = await res.json();

        if (data.success) {
          setCsvFilename(data.csvFilename);
          setTotalFrames(data.totalFrames);
          setFrameUrls(data.imageUrls);
          setFrameIds(data.frameIds);
          setAllTransitions(data.transitions);

          // Default resume phase and index
          const initialIndex = data.resumeFrameIndex.placement;
          setCurrentFrameIdx(initialIndex);
          setLoading(false);
        } else {
          setLoaderMsg(data.message || "Failed loading dataset. No unfinished CSV.");
        }
      } catch (err) {
        console.error(err);
        setLoaderMsg("Backend unavailable. Make sure Express server is running on port 3001.");
      }
    }
    loadDataset();
  }, []);

  // Sync phase crop coordinates from localStorage
  useEffect(() => {
    if (loading) return;
    const saved = localStorage.getItem(`mk_crop_${activePhase}`);
    if (saved) {
      setActiveCrop(JSON.parse(saved));
    } else {
      setActiveCrop({ ...DEFAULT_CROPS[activePhase] });
    }
  }, [activePhase, loading]);

  // Dynamically slide preload frame windows around the current index
  useEffect(() => {
    if (loading || frameUrls.length === 0) return;
    
    const windowBefore = 10;
    const windowAfter = 60;
    const start = Math.max(0, currentFrameIdx - windowBefore);
    const end = Math.min(totalFrames - 1, currentFrameIdx + windowAfter);

    for (let i = start; i <= end; i++) {
      const url = `${BACKEND_URL}${frameUrls[i]}`;
      if (!preloadedImages.current.has(url)) {
        const img = new Image();
        img.src = url;
        preloadedImages.current.set(url, img);
      }
    }
  }, [currentFrameIdx, loading, frameUrls, totalFrames]);

  // Handle auto playback loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 1000 / fps;
      playIntervalRef.current = setInterval(() => {
        setCurrentFrameIdx(prev => {
          if (prev < totalFrames - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, intervalMs);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, fps, totalFrames]);

  // Fetch active state value for the current frame index
  const getCurrentStateVal = () => {
    const transitions = allTransitions[activePhase];
    const exact = transitions.find(t => t.frameIdx === currentFrameIdx);
    if (exact) return exact.val;

    let interpolated = '';
    for (let i = 0; i < transitions.length; i++) {
      if (currentFrameIdx >= transitions[i].frameIdx) {
        interpolated = transitions[i].val;
      }
    }
    return (interpolated === 'unknown') ? '' : interpolated;
  };

  // Dispatch transition save details to Express server
  const saveTransitions = async (updatedTransitions: LabelEvent[]) => {
    setSaveStatus("Saving changes...");
    setSaveColor("#f59e0b");

    try {
      const res = await fetch(`${BACKEND_URL}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnName: activePhase,
          transitions: updatedTransitions
        })
      });

      if (res.ok) {
        setSaveStatus("Saved to CSV");
        setSaveColor("#10b981");
      } else {
        setSaveStatus("Saving failed!");
        setSaveColor("#ef4444");
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("Network error!");
      setSaveColor("#ef4444");
    }
  };

  const addTransition = (frameIdx: number, val: string) => {
    const currentList = [...allTransitions[activePhase]];
    const existing = currentList.findIndex(t => t.frameIdx === frameIdx);

    if (existing !== -1) {
      currentList[existing].val = val;
    } else {
      currentList.push({ frameIdx, val });
      currentList.sort((a, b) => a.frameIdx - b.frameIdx);
    }

    const updated = {
      ...allTransitions,
      [activePhase]: currentList
    };
    setAllTransitions(updated);
    saveTransitions(currentList);
  };

  const deleteTransition = (frameIdx: number) => {
    const filtered = allTransitions[activePhase].filter(t => t.frameIdx !== frameIdx);
    const updated = {
      ...allTransitions,
      [activePhase]: filtered
    };
    setAllTransitions(updated);
    saveTransitions(filtered);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    if (loading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing when editing input
      if (document.activeElement?.tagName === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        if (e.shiftKey) {
          setCurrentFrameIdx(prev => Math.min(totalFrames - 1, prev + 10));
        } else if (e.metaKey || e.ctrlKey) {
          setCurrentFrameIdx(prev => Math.min(totalFrames - 1, prev + 60));
        } else {
          setCurrentFrameIdx(prev => Math.min(totalFrames - 1, prev + 1));
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        if (e.shiftKey) {
          setCurrentFrameIdx(prev => Math.max(0, prev - 10));
        } else if (e.metaKey || e.ctrlKey) {
          setCurrentFrameIdx(prev => Math.max(0, prev - 60));
        } else {
          setCurrentFrameIdx(prev => Math.max(0, prev - 1));
        }
      } else if (e.code === 'KeyK') {
        e.preventDefault();
        const selector = document.getElementById('val-selector');
        if (selector) (selector as HTMLSelectElement).focus();
      } else if (e.code === 'Backspace' || e.code === 'Delete') {
        e.preventDefault();
        deleteTransition(currentFrameIdx);
      } else if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        const mapping = QUICK_HOTKEYS[activePhase].find(hk => hk.key === e.key);
        if (mapping) {
          addTransition(currentFrameIdx, mapping.val);
          setFlashBg(true);
          setTimeout(() => setFlashBg(false), 200);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, currentFrameIdx, activePhase, allTransitions, totalFrames]);

  // Adjust crop state variables
  const adjustCrop = (property: 'top' | 'left' | 'scale', value: number) => {
    const updated = {
      ...activeCrop,
      [property]: value
    };
    setActiveCrop(updated);
    localStorage.setItem(`mk_crop_${activePhase}`, JSON.stringify(updated));
  };

  const resetCrop = () => {
    const defaults = { ...DEFAULT_CROPS[activePhase] };
    setActiveCrop(defaults);
    localStorage.setItem(`mk_crop_${activePhase}`, JSON.stringify(defaults));
  };

  // Helper strings
  const formatName = (str: string) => {
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="spinner" style={{ borderTopColor: activePhase === 'placement' ? '#3b82f6' : activePhase === 'coin_count' ? '#10b981' : '#f59e0b' }}></div>
        <h2>Loading Cutout Annotations...</h2>
        <p>{loaderMsg}</p>
      </div>
    );
  }

  // Active theme color configurations
  const activeColor = {
    placement: '#3b82f6',
    coin_count: '#10b981',
    primary_item: '#f59e0b',
    secondary_item: '#ec4899'
  }[activePhase];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', '--active-accent': activeColor } as React.CSSProperties}>
      
      {/* Header Dashboard */}
      <header className="glass">
        <div className="logo-section">
          <h1>
            Per-Cutout Transition Labeler{" "}
            <span className="badge" style={{ backgroundColor: activeColor }}>
              {formatName(activePhase)}
            </span>
          </h1>
        </div>

        <div className="active-csv">
          <span>Active Run: </span>
          <strong>{csvFilename}</strong>
        </div>

        <div className="phase-selector">
          {(['placement', 'coin_count', 'primary_item', 'secondary_item'] as const).map(phase => (
            <button
              key={phase}
              className={`phase-btn ${activePhase === phase ? 'active' : ''}`}
              data-phase={phase}
              onClick={(e) => {
                setIsPlaying(false);
                setActivePhase(phase);
                e.currentTarget.blur();
              }}
            >
              {phase === 'coin_count' ? 'Coins' : phase === 'primary_item' ? 'Item 1' : phase === 'secondary_item' ? 'Item 2' : 'Placement'}
            </button>
          ))}
        </div>
      </header>

      {/* Grid Workspace */}
      <div className="workspace">

        {/* Viewport Frame Box Panel */}
        <div className="viewport-panel glass">
          <div
            className="crop-container"
            style={{ borderColor: activeColor }}
          >
            <img
              src={`${BACKEND_URL}${frameUrls[currentFrameIdx]}`}
              alt="Gameplay Crop cutout Viewport"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transformOrigin: `${activeCrop.left}% ${activeCrop.top}%`,
                transform: `scale(${activeCrop.scale / 100})`,
                transition: 'transform 0.1s ease-out'
              }}
            />
            <div className="crop-overlay"></div>
          </div>

          {/* Dynamic Tuning Slider Controls */}
          <div className="crop-adjuster glass">
            <div className="adjust-group">
              <label>Top Offset ({activeCrop.top}%)</label>
              <input
                type="range"
                className="adjust-slider"
                min="0"
                max="100"
                value={activeCrop.top}
                onChange={e => adjustCrop('top', parseInt(e.target.value))}
                style={{ accentColor: activeColor }}
              />
            </div>
            <div className="adjust-group">
              <label>Left Offset ({activeCrop.left}%)</label>
              <input
                type="range"
                className="adjust-slider"
                min="0"
                max="100"
                value={activeCrop.left}
                onChange={e => adjustCrop('left', parseInt(e.target.value))}
                style={{ accentColor: activeColor }}
              />
            </div>
            <div className="adjust-group">
              <label>Scale / Zoom ({activeCrop.scale}%)</label>
              <input
                type="range"
                className="adjust-slider"
                min="100"
                max="1000"
                value={activeCrop.scale}
                onChange={e => adjustCrop('scale', parseInt(e.target.value))}
                style={{ accentColor: activeColor }}
              />
            </div>
            <button className="control-btn" onClick={(e) => { resetCrop(); e.currentTarget.blur(); }}>Reset</button>
          </div>
        </div>

        {/* Right side annotation panel controls */}
        <div className="controls-panel glass">
          <div className="panel-header">
            <h2>Annotation Controls</h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: saveColor }}>
              {saveStatus}
            </span>
          </div>

          <div className="panel-body">
            
            {/* Value annotator selector */}
            <div className="classification-box">
              <label>Current Cutout Value</label>
              <select
                id="val-selector"
                className="custom-select"
                value={getCurrentStateVal()}
                onChange={e => {
                  addTransition(currentFrameIdx, e.target.value);
                  e.target.blur();
                }}
                style={{
                  borderColor: flashBg ? '#10b981' : '',
                  backgroundColor: flashBg ? 'rgba(16, 185, 129, 0.2)' : '',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <option value="" disabled>Select state option...</option>
                {ENUMS[activePhase].map(opt => (
                  <option key={opt} value={opt}>
                    {formatName(opt)}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick hotkeys list info */}
            <div className="cheatsheet">
              <h4>Quick Hotkeys ({formatName(activePhase)})</h4>
              {QUICK_HOTKEYS[activePhase].map(hk => (
                <div className="hotkey-row" key={hk.key}>
                  <span>{formatName(hk.label)}</span>
                  <kbd style={{ borderColor: activeColor }}>{hk.key}</kbd>
                </div>
              ))}
              <div className="hotkey-row" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                <span>Play / Pause</span>
                <kbd>Space</kbd>
              </div>
              <div className="hotkey-row">
                <span>Step Frame</span>
                <kbd>&larr;</kbd> / <kbd>&rarr;</kbd>
              </div>
              <div className="hotkey-row">
                <span>Skip 10 Frames</span>
                <kbd>Shift</kbd>+<kbd>&larr;/&rarr;</kbd>
              </div>
              <div className="hotkey-row">
                <span>Skip 60 Frames</span>
                <kbd>Ctrl/Cmd</kbd>+<kbd>&larr;/&rarr;</kbd>
              </div>
            </div>

            {/* Scrollable list of transition boundary marks */}
            <div className="transitions-section">
              <h3>Marked Keyframes</h3>
              <div className="transitions-list">
                {allTransitions[activePhase].length === 0 ? (
                  <div className="empty-state">
                    No transitions marked yet. Seek to a frame and tap a hotkey (0-9) to insert.
                  </div>
                ) : (
                  allTransitions[activePhase].map((t, idx) => {
                    const activeMatch = currentFrameIdx >= t.frameIdx && (idx === allTransitions[activePhase].length - 1 || currentFrameIdx < allTransitions[activePhase][idx + 1].frameIdx);
                    
                    return (
                      <div
                        key={t.frameIdx}
                        className={`transition-item ${activeMatch ? 'active' : ''}`}
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentFrameIdx(t.frameIdx);
                        }}
                        style={{ borderLeftColor: activeMatch ? activeColor : '' }}
                      >
                        <div>
                          <span className="frame" style={{ color: activeColor }}>
                            #{String(t.frameIdx).padStart(6, '0')}
                          </span>
                          <span className="val">&rarr; {formatName(t.val)}</span>
                        </div>
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTransition(t.frameIdx);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Timeline controls bar */}
      <div className="timeline-bar glass">
        <div className="timeline-row">
          
          <div className="play-controls">
            <button
              className="control-btn"
              onClick={(e) => {
                setIsPlaying(false);
                setCurrentFrameIdx(prev => Math.max(0, prev - 1));
                e.currentTarget.blur();
              }}
            >
              &larr;
            </button>
            <button
              className="control-btn accent"
              onClick={(e) => {
                setIsPlaying(prev => !prev);
                e.currentTarget.blur();
              }}
              style={{ backgroundColor: activeColor }}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              className="control-btn"
              onClick={(e) => {
                setIsPlaying(false);
                setCurrentFrameIdx(prev => Math.min(totalFrames - 1, prev + 1));
                e.currentTarget.blur();
              }}
            >
              &rarr;
            </button>
            
            <select
              className="control-btn"
              value={fps}
              onChange={e => {
                setFps(parseInt(e.target.value));
                e.target.blur();
              }}
              style={{ padding: '0.35rem 0.5rem' }}
            >
              <option value="15">15 fps</option>
              <option value="30">30 fps</option>
              <option value="60">60 fps</option>
            </select>
          </div>

          <div className="slider-container">
            {/* Draw tick marks */}
            <div className="timeline-ticks-layer">
              {allTransitions[activePhase].map(t => (
                <div
                  key={t.frameIdx}
                  className="tick-marker"
                  style={{
                    left: `${(t.frameIdx / (totalFrames - 1)) * 100}%`,
                    backgroundColor: activeColor,
                    boxShadow: `0 0 8px ${activeColor}`
                  }}
                />
              ))}
            </div>

            <input
              type="range"
              className="timeline-slider"
              min="0"
              max={totalFrames - 1}
              value={currentFrameIdx}
              onChange={e => {
                setIsPlaying(false);
                setCurrentFrameIdx(parseInt(e.target.value));
              }}
              style={{ accentColor: activeColor }}
            />
          </div>

          <div className="time-counter">
            Frame <span style={{ fontFamily: 'monospace' }}>{String(currentFrameIdx).padStart(6, '0')}</span> / {String(totalFrames - 1).padStart(6, '0')}
          </div>

        </div>
      </div>

    </div>
  );
}
