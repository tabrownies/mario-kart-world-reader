"use client";

import React, { useState, useEffect, useCallback } from 'react';

// Enum matches Protobuf types
enum Confidence {
  UNKNOWN = 0,
  UNCERTAIN = 1,
  CERTAIN = 2,
}

enum Track {
  UNKNOWN = 0,
  RAINBOW_ROAD = 1,
}

// Map the oneof structure
interface TelemetryGuess {
  confidence: Confidence;
  value?: {
    case: 'placement' | 'lapCount' | 'coinCount' | 'item' | 'racePhase' | 'track';
    value: number; // For enums or int32, it will be parsed as number by proto JSON
  };
}

interface RaceMetadata {
  track: Track;
  totalLaps: number;
}

interface GetFrameClassificationResponse {
  frameId: string;
  imageUrl: string;
  metadata?: RaceMetadata;
  placement?: TelemetryGuess;
  lapCount?: TelemetryGuess;
  coinCount?: TelemetryGuess;
  primaryItem?: TelemetryGuess;
  secondaryItem?: TelemetryGuess;
  racePhase?: TelemetryGuess;
}

export default function LabelerPage() {
  const [runId, setRunId] = useState('mkw_royal_ruins_p2_standard_online_nochat_10_09_2026_06_22_34');
  const [data, setData] = useState<GetFrameClassificationResponse | null>(null);

  const [formState, setFormState] = useState({
    track: String(Track.UNKNOWN),
    placement: '',
    lapCount: '',
    coinCount: '',
    primaryItem: '',
    secondaryItem: '',
    racePhase: '',
  });

  const fetchNextFrame = useCallback(async () => {
    try {
      // Backend acts as picker, we just ask for next
      const res = await fetch(`http://localhost:4000/api/run/${runId}/next`);
      if (!res.ok) throw new Error('Frame not found');
      const json: GetFrameClassificationResponse = await res.json();
      setData(json);
      setFormState({
        track: json.metadata ? String(json.metadata.track) : String(Track.UNKNOWN),
        placement: json.placement?.value ? String(json.placement.value.value) : '',
        lapCount: json.lapCount?.value ? String(json.lapCount.value.value) : '',
        coinCount: json.coinCount?.value ? String(json.coinCount.value.value) : '',
        primaryItem: json.primaryItem?.value ? String(json.primaryItem.value.value) : '',
        secondaryItem: json.secondaryItem?.value ? String(json.secondaryItem.value.value) : '',
        racePhase: json.racePhase?.value ? String(json.racePhase.value.value) : '',
      });
    } catch (e) {
      console.error(e);
      setData(null);
    }
  }, [runId]);

  useEffect(() => {
    fetchNextFrame();
  }, [fetchNextFrame]);

  const handleSaveAndNext = async () => {
    if (!data?.frameId) return;
    try {
      const payload = {
        frameId: data.frameId,
        track: parseInt(formState.track),
        placement: formState.placement ? parseInt(formState.placement) : undefined,
        lapCount: formState.lapCount ? parseInt(formState.lapCount) : undefined,
        coinCount: formState.coinCount !== '' ? parseInt(formState.coinCount) : undefined,
        primaryItem: formState.primaryItem ? parseInt(formState.primaryItem) : undefined,
        secondaryItem: formState.secondaryItem ? parseInt(formState.secondaryItem) : undefined,
        racePhase: formState.racePhase ? parseInt(formState.racePhase) : undefined,
      };

      await fetch(`http://localhost:4000/api/run/${runId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Immediately fetch next one
      fetchNextFrame();
    } catch (e) {
      console.error('Error saving', e);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSaveAndNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const getBorderColor = (confidence?: Confidence) => {
    if (confidence === Confidence.CERTAIN) return '2px solid #4ade80'; // Green
    if (confidence === Confidence.UNCERTAIN) return '2px solid #facc15'; // Yellow
    return '2px solid #f87171'; // Red
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', backgroundColor: '#121212',
      color: '#ffffff', fontFamily: 'Inter, sans-serif'
    }}>
      {/* Left side: Image */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        {data?.imageUrl ? (
          <img 
            src={data.imageUrl} 
            alt="Frame" 
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} 
          />
        ) : (
          <div>No Image Loaded / Finished</div>
        )}
      </div>

      {/* Right side: Controls */}
      <div style={{ width: '400px', padding: '40px', backgroundColor: '#1e1e1e', borderLeft: '1px solid #333', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '20px', fontWeight: '600' }}>Classification</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>Track Name</label>
          <select 
            value={formState.track} 
            onChange={(e) => setFormState({...formState, track: e.target.value})}
            style={{ 
              width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#2a2a2a', color: 'white',
              border: '2px solid #4ade80', outline: 'none'
            }}
          >
            <option value={String(Track.UNKNOWN)}>Unknown</option>
            <option value={String(Track.RAINBOW_ROAD)}>Rainbow Road</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>Placement</label>
          <select 
            value={formState.placement} 
            onChange={(e) => setFormState({...formState, placement: e.target.value})}
            style={{ 
              width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#2a2a2a', color: 'white',
              border: getBorderColor(data?.placement?.confidence), outline: 'none'
            }}
          >
            <option value="">Unknown</option>
            {[...Array(24)].map((_, i) => <option key={i+1} value={String(i+1)}>{i+1}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>Lap Count</label>
          <select 
            value={formState.lapCount} 
            onChange={(e) => setFormState({...formState, lapCount: e.target.value})}
            style={{ 
              width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#2a2a2a', color: 'white',
              border: getBorderColor(data?.lapCount?.confidence), outline: 'none'
            }}
          >
            <option value="">Unknown</option>
            {[...Array(7)].map((_, i) => <option key={i+1} value={String(i+1)}>{i+1}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>Coin Count</label>
          <select 
            value={formState.coinCount} 
            onChange={(e) => setFormState({...formState, coinCount: e.target.value})}
            style={{ 
              width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#2a2a2a', color: 'white',
              border: getBorderColor(data?.coinCount?.confidence), outline: 'none'
            }}
          >
            <option value="">Unknown</option>
            {[...Array(21)].map((_, i) => <option key={i} value={String(i)}>{i}</option>)}
          </select>
        </div>

        <button 
          onClick={handleSaveAndNext}
          style={{
            marginTop: '20px', width: '100%', padding: '16px', borderRadius: '8px', 
            backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer'
          }}
        >
          Save & Next (Enter)
        </button>
      </div>
    </div>
  );
}
