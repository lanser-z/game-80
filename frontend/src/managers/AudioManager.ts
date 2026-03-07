import Phaser from 'phaser';

/**
 * 音效管理器
 * 管理背景音乐和音效播放
 */
export class AudioManager {
  private scene: Phaser.Scene;
  private audioContext: AudioContext | null = null;
  private volume: number = 0.5;
  private muted: boolean = false;
  private isContextReady: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 初始化或恢复 AudioContext
   * 必须在用户交互后调用
   */
  private ensureAudioContext(): boolean {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API 不支持');
        return false;
      }
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isContextReady = this.audioContext.state === 'running';
    return this.isContextReady;
  }

  /**
   * 播放砸墙音效
   */
  playHitSound(): void {
    if (this.muted) return;
    if (!this.ensureAudioContext() || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 砸墙音效 - 短促的低音撞击声
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(this.volume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);

    // 添加一点噪音效果
    this.playNoise(0.05, 0.1, this.volume * 0.3);
  }

  /**
   * 播放倒塌音效
   */
  playCollapseSound(): void {
    if (this.muted) return;
    if (!this.ensureAudioContext() || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 多个连续的低沉声音模拟倒塌
    for (let i = 0; i < 8; i++) {
      const delay = i * 0.08;

      // 低频撞击
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80 + Math.random() * 40, now + delay);
      osc.frequency.exponentialRampToValueAtTime(40, now + delay + 0.2);

      gain.gain.setValueAtTime(this.volume * 0.4, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    }

    // 添加碎石噪音
    this.playNoise(0.3, 0.5, this.volume * 0.2);
  }

  /**
   * 播放 UI 音效
   */
  playUISound(): void {
    if (this.muted) return;
    if (!this.ensureAudioContext() || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 清脆的点击音
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * 播放噪音（用于撞击效果）
   */
  private playNoise(delay: number, duration: number, volume: number): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // 生成白噪音
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now + delay);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(now + delay);
  }

  /**
   * 播放背景音乐（占位，需要实际音频文件）
   */
  playBGM(): void {
    // 没有实际音频文件，静默处理
  }

  /**
   * 停止背景音乐
   */
  stopBGM(): void {
    // 没有实际音频文件，静默处理
  }

  /**
   * 设置音量
   */
  setVolume(value: number): void {
    this.volume = Phaser.Math.Clamp(value, 0, 1);
  }

  /**
   * 静音/取消静音
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /**
   * 获取是否静音
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * 获取当前音量
   */
  getVolume(): number {
    return this.volume;
  }
}