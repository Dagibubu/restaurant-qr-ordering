import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/*  ────────────────────────────────────────────
    Plays a short two-tone "ding" using Web Audio
──────────────────────────────────────────── */
function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.start(now);
    osc.stop(now + 0.4);
    osc.onended = () => ctx.close();
  } catch (e) {
    console.warn('Audio blocked:', e);
  }
}

/*  ────────────────────────────────────────────
    Notification permission helper
──────────────────────────────────────────── */
async function requestNotifyPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

function showNotification(order) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(`🔔 New order — Table ${order.table?.number}`, {
      body: order.items.map(i => `${i.quantity}× ${i.name}`).join(', '),
      icon: '/vite.svg',
      tag: order._id,
      requireInteraction: false,
    });
    setTimeout(() => n.close(), 8000);
    n.onclick = () => { window.focus(); n.close(); };
  } catch (e) {
    console.warn('Notification failed:', e);
  }
}

/*  ────────────────────────────────────────────
    Main hook
──────────────────────────────────────────── */
export function useOrderAlerts(onNewOrder) {
  const audioReady = useRef(false);

  useEffect(() => {
    // Ask permission once on mount
    requestNotifyPermission();

    // Unlock audio on first user gesture (browsers block autoplay)
    const unlock = () => {
      audioReady.current = true;
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);

    const socket = io('http://localhost:5000');

    socket.on('order:new', (order) => {
      playDing();
      showNotification(order);
      onNewOrder?.(order);
    });

    return () => {
      socket.disconnect();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [onNewOrder]);
}