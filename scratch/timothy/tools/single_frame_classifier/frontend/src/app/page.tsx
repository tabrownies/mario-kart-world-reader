'use client';

import { useState, useEffect, FormEvent } from 'react';

const API_BASE = 'http://localhost:3001';

const ENUMS = {
  track: ['track_unknown', 'rainbow_road'],
  race_phase: ['phase_unknown', 'pre_countdown', 'countdown', 'racing', 'finished'],
  lap_count: ['lap_unknown', 'lap_1', 'lap_2', 'lap_3', 'lap_4', 'lap_5'],
  placement: ['place_unknown', ...Array.from({length: 24}, (_, i) => `place_${i+1}`)],
  coin_count: ['coin_unknown', ...Array.from({length: 21}, (_, i) => `coin_${i}`)],
  item: [
    'item_unknown', 'none', 'item_roulette', 'green_shell', 'red_shell', 'coin_shell', 'banana', 'mushroom', 'kamek', 'blooper', 'bobomb', 'boo', 'boomerang', 'bullet_bill', 'coin', 'feather', 'fire_flower', 'hammer', 'ice_flower', 'lightning', 'mega_mushroom', 'spiny_shell', 'super_horn', 'star', 'triple_bananas', 'triple_green_shells', 'triple_mushrooms', 'triple_red_shells', 'question_mark_box', 'dash_food_roulette', 'dash_food_hamburger', 'dash_food_donut', 'dash_food_spicy_curry', 'dash_food_barbecue', 'dash_food_wild_bone', 'dash_food_ice_cream', 'dash_food_magma_curry', 'dash_food_fruit_barrel', 'dash_food_moo_moo_milk', 'dash_food_pancake', 'dash_food_pan', 'dash_food_pizza', 'dash_food_fritter_and_potato', 'dash_food_takoyaki', 'dash_food_ringo_ame', 'dash_food_pukupuki_taiyaki', 'dash_food_sushi', 'dash_food_white_choco_snack', 'dash_food_ichigo_choco_snack', 'dash_food_black_choco_snack', 'dash_food_popcorn', 'dash_food_lunchbox'
  ]
};

const formatEnum = (str: string) => {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

type FrameData = {
  frame_id: string;
  track: string;
  placement: string;
  lap_count: string;
  coin_count: string;
  primary_item: string;
  secondary_item: string;
  race_phase: string;
};

type FrameItem = {
  frame_id: string;
  imageUrl: string;
  data: FrameData;
  isCompleted: boolean;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [jumpInput, setJumpInput] = useState<string>('0');

  useEffect(() => {
    setJumpInput(selectedIndex.toString());
  }, [selectedIndex]);

  // Form State
  const [formData, setFormData] = useState({
    track: '',
    placement: '',
    lap_count: '',
    coin_count: '',
    primary_item: '',
    secondary_item: '',
    race_phase: ''
  });

  const updateFormData = (data: FrameData) => {
    setFormData({
      track: data.track === 'unknown' ? '' : data.track,
      placement: data.placement === 'unknown' ? '' : data.placement,
      lap_count: data.lap_count === 'unknown' ? '' : data.lap_count,
      coin_count: data.coin_count === 'unknown' ? '' : data.coin_count,
      primary_item: data.primary_item === 'unknown' ? '' : data.primary_item,
      secondary_item: data.secondary_item === 'unknown' ? '' : data.secondary_item,
      race_phase: data.race_phase === 'unknown' ? '' : data.race_phase,
    });
  };

  const fetchFrames = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/frames`);
      const data = await res.json();
      
      if (data.done) {
        setDone(true);
        setMessage(data.message);
      } else {
        setDone(false);
        setFrames(data.frames);
        
        // Find first uncompleted frame or default to 0
        const firstUnfinished = data.frames.findIndex((f: FrameItem) => !f.isCompleted);
        const idxToSelect = firstUnfinished === -1 ? 0 : firstUnfinished;
        setSelectedIndex(idxToSelect);
        updateFormData(data.frames[idxToSelect].data);
      }
    } catch (err) {
      console.error(err);
      setMessage("Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrames();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (frames.length === 0) return;
    const currentFrame = frames[selectedIndex];

    // Replace empty strings back with 'unknown' just in case, though they should be filled
    const submitData = {
      track: formData.track || 'unknown',
      placement: formData.placement || 'unknown',
      lap_count: formData.lap_count || 'unknown',
      coin_count: formData.coin_count || 'unknown',
      primary_item: formData.primary_item || 'unknown',
      secondary_item: formData.secondary_item || 'unknown',
      race_phase: formData.race_phase || 'unknown',
    };

    try {
      setLoading(true);
      await fetch(`${API_BASE}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frame_id: currentFrame.frame_id,
          updatedData: submitData
        })
      });
      fetchFrames();
    } catch (err) {
      console.error(err);
      setMessage("Failed to save frame data.");
      setLoading(false);
    }
  };

  if (loading && frames.length === 0) {
    return <div className="container"><h2>Loading frames...</h2></div>;
  }

  if (done) {
    return (
      <div className="container">
        <h2>✅ Finished!</h2>
        <p>{message}</p>
        <button onClick={fetchFrames}>Check for another file</button>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>Mario Kart Single Frame Classifier</h1>
        <div style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', fontSize: '0.9rem' }}>
          <span>Frame</span>
          <input 
            type="number" 
            min="0" 
            max={frames.length - 1} 
            value={jumpInput} 
            onChange={(e) => setJumpInput(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const idx = parseInt(jumpInput);
                if (!isNaN(idx) && idx >= 0 && idx < frames.length) {
                  setSelectedIndex(idx);
                  updateFormData(frames[idx].data);
                } else {
                  // Reset input if invalid
                  setJumpInput(selectedIndex.toString());
                }
              }
            }}
            style={{ width: '80px', textAlign: 'center', padding: '0.5rem', borderRadius: '4px', background: 'var(--input-bg)', color: 'white', border: '1px solid var(--border)' }}
          />
          <span>of {frames.length - 1}</span>
          <span style={{ marginLeft: '1rem', fontWeight: 'bold', color: frames[selectedIndex]?.isCompleted ? '#4ade80' : '#f87171' }}>
            {frames[selectedIndex]?.isCompleted ? '✅ Finished' : '❌ Unfinished'}
          </span>
        </div>
        {message && <p className="error">{message}</p>}
      </header>
      
      <main className="layout">
        <div className="image-panel">
          {frames[selectedIndex]?.imageUrl && <img src={`${API_BASE}${frames[selectedIndex].imageUrl}`} alt="Frame to classify" />}
        </div>
        
        <div className="form-panel">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Track</label>
              <select name="track" value={formData.track} onChange={handleChange} required autoFocus>
                <option value="" disabled>Select track...</option>
                {ENUMS.track.map(val => <option key={val} value={val}>{formatEnum(val)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Race Phase</label>
              <select name="race_phase" value={formData.race_phase} onChange={handleChange} required>
                <option value="" disabled>Select phase...</option>
                {ENUMS.race_phase.map(val => <option key={val} value={val}>{formatEnum(val)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Lap Count</label>
              <select name="lap_count" value={formData.lap_count} onChange={handleChange} required>
                <option value="" disabled>Select lap...</option>
                {ENUMS.lap_count.map(val => <option key={val} value={val}>{formatEnum(val)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Placement</label>
              <select name="placement" value={formData.placement} onChange={handleChange} required>
                <option value="" disabled>Select placement...</option>
                {ENUMS.placement.map(val => <option key={val} value={val}>{formatEnum(val)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Coin Count</label>
              <select name="coin_count" value={formData.coin_count} onChange={handleChange} required>
                <option value="" disabled>Select coins...</option>
                {ENUMS.coin_count.map(val => <option key={val} value={val}>{formatEnum(val)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Primary Item</label>
              <select name="primary_item" value={formData.primary_item} onChange={handleChange} required>
                <option value="" disabled>Select item...</option>
                {ENUMS.item.map(val => <option key={val} value={val}>{formatEnum(val)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Secondary Item</label>
              <select name="secondary_item" value={formData.secondary_item} onChange={handleChange} required>
                <option value="" disabled>Select item...</option>
                {ENUMS.item.map(val => <option key={val} value={val}>{formatEnum(val)}</option>)}
              </select>
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save & Next"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
