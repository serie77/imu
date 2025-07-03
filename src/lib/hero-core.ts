import { Hero } from '@ulixee/hero-core';

class HeroCoreSingleton {
  private static instance: HeroCoreSingleton;
  private isStarted = false;
  private startPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): HeroCoreSingleton {
    if (!HeroCoreSingleton.instance) {
      HeroCoreSingleton.instance = new HeroCoreSingleton();
    }
    return HeroCoreSingleton.instance;
  }

  public async ensureStarted(): Promise<void> {
    if (this.isStarted) return;
    
    if (!this.startPromise) {
      this.startPromise = this.startCore();
    }
    
    return this.startPromise;
  }

  private async startCore(): Promise<void> {
    try {
      console.log('Starting Hero Core...');
      // Use the startWithoutSession option from the latest version
      await Hero.start({ startWithoutSession: true });
      this.isStarted = true;
      console.log('Hero Core started successfully');
    } catch (error) {
      console.error('Error starting Hero Core:', error);
      this.startPromise = null;
      throw error;
    }
  }
}

export const heroCore = HeroCoreSingleton.getInstance(); 