/**
 * Agent Scheduler Service
 * Handles time-based and tick-based agent execution
 */

import type { AgentSchedule, AgentTickConfig } from '../types/agent.types';
import { createLogger } from '../utils';

const logger = createLogger('Scheduler');

export class AgentScheduler {
  /**
   * Check if current time is within agent's schedule
   */
  isWithinSchedule(schedule: AgentSchedule): boolean {
    if (!schedule.startTime && !schedule.endTime && !schedule.daysOfWeek) {
      return true; // No restrictions
    }

    const now = new Date();
    const timezone = schedule.timezone || 'UTC';
    
    // Convert to specified timezone
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    
    // Check day of week
    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
      const dayOfWeek = localTime.getDay();
      if (!schedule.daysOfWeek.includes(dayOfWeek)) {
        logger.debug(`Not in allowed days. Current day: ${dayOfWeek}, Allowed: ${schedule.daysOfWeek}`);
        return false;
      }
    }
    
    // Check time range
    if (schedule.startTime || schedule.endTime) {
      const currentTime = this.getTimeString(localTime);
      
      if (schedule.startTime && currentTime < schedule.startTime) {
        logger.debug(`Before start time. Current: ${currentTime}, Start: ${schedule.startTime}`);
        return false;
      }
      
      if (schedule.endTime && currentTime > schedule.endTime) {
        logger.debug(`After end time. Current: ${currentTime}, End: ${schedule.endTime}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get time in HH:MM format
   */
  private getTimeString(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  /**
   * Calculate wait time until schedule becomes active
   */
  getWaitTimeMs(schedule: AgentSchedule): number {
    if (this.isWithinSchedule(schedule)) {
      return 0;
    }
    
    const now = new Date();
    const timezone = schedule.timezone || 'UTC';
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    
    // If we have a start time, calculate wait until then
    if (schedule.startTime) {
      const parts = schedule.startTime.split(':').map(Number);
      const hours = parts[0] ?? 0;
      const minutes = parts[1] ?? 0;
      const startDate = new Date(localTime);
      startDate.setHours(hours, minutes, 0, 0);
      
      // If start time is earlier today, it means we should wait until tomorrow
      if (startDate < localTime) {
        startDate.setDate(startDate.getDate() + 1);
      }
      
      return startDate.getTime() - now.getTime();
    }
    
    return 0;
  }
  
  /**
   * Validate schedule configuration
   */
  validateSchedule(schedule: AgentSchedule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate time format (HH:MM in 24-hour format)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (schedule.startTime && !timeRegex.test(schedule.startTime)) {
      errors.push(`Invalid startTime format: ${schedule.startTime}. Use HH:MM in 24-hour format (e.g., "09:00", "14:30")`);
    }
    
    if (schedule.endTime && !timeRegex.test(schedule.endTime)) {
      errors.push(`Invalid endTime format: ${schedule.endTime}. Use HH:MM in 24-hour format (e.g., "17:00", "23:30")`);
    }
    
    // Validate start is before end
    if (schedule.startTime && schedule.endTime && schedule.startTime >= schedule.endTime) {
      errors.push('startTime must be before endTime');
    }
    
    // Validate days of week
    if (schedule.daysOfWeek) {
      for (const day of schedule.daysOfWeek) {
        if (day < 0 || day > 6 || !Number.isInteger(day)) {
          errors.push(`Invalid day of week: ${day}. Must be 0-6 (Sunday-Saturday)`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Tick Manager for frequency-based execution
 */
export class TickManager {
  private tickCounts = new Map<string, number>();
  private lastTickTimes = new Map<string, number>();
  
  /**
   * Check if agent should execute based on tick configuration
   */
  shouldExecute(agentId: string, tickConfig: AgentTickConfig): boolean {
    if (!tickConfig.enabled) {
      return true; // No tick restrictions
    }
    
    const now = Date.now();
    const lastTick = this.lastTickTimes.get(agentId) || 0;
    const intervalMs = tickConfig.intervalMs || 1000;
    
    // Check if enough time has passed since last tick
    if (now - lastTick < intervalMs) {
      return false;
    }
    
    // Check if we've exceeded max ticks
    if (tickConfig.maxTicksPerRound) {
      const currentTicks = this.tickCounts.get(agentId) || 0;
      if (currentTicks >= tickConfig.maxTicksPerRound) {
        logger.debug(`Agent ${agentId} has reached max ticks: ${currentTicks}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Record a tick execution
   */
  recordTick(agentId: string): void {
    this.lastTickTimes.set(agentId, Date.now());
    const currentTicks = this.tickCounts.get(agentId) || 0;
    this.tickCounts.set(agentId, currentTicks + 1);
  }
  
  /**
   * Reset tick counts (e.g., at the start of a new round)
   */
  resetRound(agentId: string): void {
    this.tickCounts.set(agentId, 0);
  }
  
  /**
   * Get current tick count
   */
  getTickCount(agentId: string): number {
    return this.tickCounts.get(agentId) || 0;
  }
  
  /**
   * Get time until next tick
   */
  getTimeUntilNextTick(agentId: string, tickConfig: AgentTickConfig): number {
    if (!tickConfig.enabled || !tickConfig.intervalMs) {
      return 0;
    }
    
    const now = Date.now();
    const lastTick = this.lastTickTimes.get(agentId) || 0;
    const intervalMs = tickConfig.intervalMs;
    const timeSinceLastTick = now - lastTick;
    
    if (timeSinceLastTick >= intervalMs) {
      return 0;
    }
    
    return intervalMs - timeSinceLastTick;
  }
  
  /**
   * Validate tick configuration
   */
  validateTickConfig(tickConfig: AgentTickConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (tickConfig.enabled) {
      // Must have at least one interval specified
      if (!tickConfig.intervalMs && !tickConfig.intervalSeconds && !tickConfig.intervalMinutes) {
        errors.push('Tick config must specify at least one interval (intervalMs, intervalSeconds, or intervalMinutes)');
      }
      
      // Validate interval values are positive
      if (tickConfig.intervalMs !== undefined && tickConfig.intervalMs <= 0) {
        errors.push('intervalMs must be positive');
      }
      if (tickConfig.intervalSeconds !== undefined && tickConfig.intervalSeconds <= 0) {
        errors.push('intervalSeconds must be positive');
      }
      if (tickConfig.intervalMinutes !== undefined && tickConfig.intervalMinutes <= 0) {
        errors.push('intervalMinutes must be positive');
      }
      
      // Validate maxTicksPerRound
      if (tickConfig.maxTicksPerRound !== undefined && tickConfig.maxTicksPerRound <= 0) {
        errors.push('maxTicksPerRound must be positive');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
