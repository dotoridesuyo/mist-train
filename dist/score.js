/* 〈다음 역〉 S17: 네 기억에 따라 쌓이는 브라우저용 임시 음악.
 * Usage:
 *   const score = new window.S17Score(audioContext, existingVolumeMaster);
 *   score.setStage(uniqueCompletedMemories.length); // 0..4, 재감상은 호출해도 단계 불변
 *   score.tick(isMusicAllowed); // 화면 갱신마다 호출; menu/title 등에서는 false
 *   score.cue('fragment'|'fracture'|'unfinished'|'complete'|'finalPhrase'|'clap');
 *   score.pause(); score.resume(); score.reset(); score.close();
 * Existing volume master should remain connected to audioContext.destination.
 * All notes/noise are generated in this file; there are no recorded samples.
 */
(() => {
  'use strict';

  const LEAD = [220, 261.63, 329.63, 293.66, 261.63, 220, 196, 0,
    220, 261.63, 329.63, 392, 329.63, 293.66, 0, 0];
  const BEAT = .62;
  const LEVELS = [0, .085, .095, .105, .11];

  class S17Score {
    constructor(context, destination) {
      if (!context || !destination) throw new TypeError('S17Score requires an AudioContext and destination node');
      this.context = context;
      this.output = context.createGain();
      this.output.gain.value = 1;
      this.output.connect(destination);
      this.stage = 0;
      this.step = 0;
      this.next = context.currentTime + .05;
      this.paused = false;
      this.muteUntil = 0;
      this.closed = false;
      this.pluckCache = new Map();
    }

    setStage(count) {
      const n = Number.isFinite(Number(count)) ? Math.max(0, Math.min(4, Math.floor(Number(count)))) : 0;
      // Progress only rises in one run. A new run should construct a fresh score.
      this.stage = Math.max(this.stage, n);
      return this.stage;
    }

    reset() {
      this.stage = 0;
      this.step = 0;
      this.next = this.context.currentTime + .05;
      this.paused = false;
      this.muteUntil = 0;
      this.output.gain.cancelScheduledValues(this.context.currentTime);
      this.output.gain.setValueAtTime(1, this.context.currentTime);
    }

    pause() { this.paused = true; this.next = this.context.currentTime + .05; }
    resume() { this.paused = false; this.next = this.context.currentTime + .05; }
    close() {
      this.closed = true;
      this.output.gain.setTargetAtTime(0, this.context.currentTime, .03);
      // One-shot notes already scheduled will finish naturally before disconnect.
      setTimeout(() => { try { this.output.disconnect(); } catch {} }, 4000);
    }

    tick(playing = true) {
      if (this.closed) return;
      const now = this.context.currentTime;
      if (this.paused || !playing || now < this.muteUntil || !this.stage) {
        this.next = now + .06;
        return;
      }
      if (this.next < now - .2) this.next = now + .025;
      while (this.next < now + .13) {
        this.playStep(this.step % LEAD.length, this.next);
        this.next += BEAT;
        this.step++;
      }
    }

    playStep(i, at) {
      if (LEAD[i]) this.pluck(LEAD[i], at, .95, LEVELS[this.stage]);
      if (this.stage >= 2) {
        if (i % 4 === 0) this.pluck(i < 8 ? 110 : 130.81, at, 1.75, .055);
        if (i % 4 === 2) this.pluck(i < 8 ? 164.81 : 196, at, 1.05, .035);
      }
      if (this.stage >= 3 && i % 4 === 0) {
        this.hum(i < 8 ? 220 : 246.94, at + .08, 2, .011);
        this.hiss(at, .28, .003);
      }
      if (this.stage >= 4 && (i === 12 || i === 14)) this.unfinishedChord(at);
    }

    cue(name) {
      if (this.closed) return;
      const at = this.context.currentTime + .015;
      switch (name) {
        case 'fragment':
          [220, 261.63, 329.63, 293.66].forEach((f, i) => this.pluck(f, at + i * .43, .55, .11));
          break;
        case 'fracture':
          this.muteUntil = at + .35;
          this.output.gain.cancelScheduledValues(at);
          this.output.gain.setValueAtTime(this.output.gain.value, at);
          this.output.gain.linearRampToValueAtTime(.0001, at + .012);
          this.output.gain.setValueAtTime(.0001, at + .32);
          this.output.gain.linearRampToValueAtTime(1, at + .38);
          break;
        case 'unfinished':
          this.unfinishedChord(at);
          this.unfinishedChord(at + .64);
          break;
        case 'complete':
          [164.81, 196, 246.94, 329.63].forEach((f, i) => this.pluck(f, at + i * .12, 3.2, .075));
          this.hum(329.63, at + .35, 2.6, .018);
          break;
        case 'finalPhrase':
          [220, 261.63, 329.63, 392, 329.63, 293.66, 329.63].forEach((f, i) =>
            this.pluck(f, at + i * .44, i === 6 ? 2.5 : .86, .12));
          this.hum(220, at + .25, 1.75, .019);
          this.hum(329.63, at + 1.97, 2.1, .018);
          break;
        case 'clap':
          this.clap(at);
          break;
        default:
          throw new RangeError(`Unknown S17 music cue: ${name}`);
      }
    }

    // Damped string noise gives each pitched note a fast attack and a wooden decay.
    stringBuffer(freq, seconds) {
      const sr = this.context.sampleRate;
      const cacheKey = `${Math.round(freq)}:${seconds}`;
      if (this.pluckCache.has(cacheKey)) return this.pluckCache.get(cacheKey);
      const size = Math.max(2, Math.round(sr / freq));
      const buffer = this.context.createBuffer(1, Math.ceil(sr * seconds), sr);
      const data = buffer.getChannelData(0);
      const ring = new Float32Array(size);
      for (let i = 0; i < size; i++) ring[i] = (Math.random() * 2 - 1) * .55;
      let previous = 0;
      for (let i = 0; i < data.length; i++) {
        const p = i % size;
        const v = ring[p];
        data[i] = v * Math.exp(-i / (sr * seconds * .58));
        ring[p] = (v + previous) * .5 * .998;
        previous = v;
      }
      this.pluckCache.set(cacheKey, buffer);
      return buffer;
    }

    pluck(freq, at, duration, loudness) {
      if (!freq || this.closed) return;
      const ctx = this.context;
      const source = ctx.createBufferSource();
      source.buffer = this.stringBuffer(freq, Math.max(.42, Math.min(3.5, duration)));
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.exponentialRampToValueAtTime(loudness, at + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, at + Math.max(.4, duration));
      source.connect(gain).connect(this.output);
      source.start(at);
      source.stop(at + Math.max(.42, duration) + .01);
    }

    // A very soft wordless voice impression; no lyrics or real vocal sample.
    hum(freq, at, duration, loudness) {
      const ctx = this.context;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.linearRampToValueAtTime(loudness, at + .38);
      gain.gain.setValueAtTime(loudness, at + Math.max(.4, duration - .5));
      gain.gain.linearRampToValueAtTime(.0001, at + duration);
      for (const [ratio, weight] of [[1, 1], [2, .22], [3, .06]]) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * ratio, at);
        const level = ctx.createGain(); level.gain.value = weight;
        osc.connect(level).connect(gain);
        osc.start(at); osc.stop(at + duration + .02);
      }
      gain.connect(this.output);
    }

    hiss(at, duration, loudness) {
      const ctx = this.context, sr = ctx.sampleRate;
      const buffer = ctx.createBuffer(1, Math.ceil(sr * duration), sr);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * .2;
      const noise = ctx.createBufferSource(); noise.buffer = buffer;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1900;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(loudness, at);
      gain.gain.linearRampToValueAtTime(.0001, at + duration);
      noise.connect(filter).connect(gain).connect(this.output);
      noise.start(at); noise.stop(at + duration + .01);
    }

    unfinishedChord(at) {
      [123.47, 185, 246.94].forEach((f, i) => this.pluck(f, at + i * .045, 1.3, .052));
    }

    clap(at) {
      // One narrow transient with one tiny room reflection; never a crowd loop.
      this.hiss(at, .105, .15);
      this.hiss(at + .085, .055, .018);
    }
  }

  window.S17Score = S17Score;
})();
