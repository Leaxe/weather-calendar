declare module 'ical.js' {
  export function parse(input: string): unknown;

  export class Component {
    constructor(jCal: unknown);
    getAllSubcomponents(name: string): Component[];
    getFirstPropertyValue(name: string): unknown;
  }

  export class Event {
    constructor(component: Component);
    summary: string;
    uid: string;
    location: string;
    description: string;
    startDate: Time;
    endDate: Time;
    isRecurring(): boolean;
    iterator(startTime?: Time): RecurExpansion;
  }

  export class Time {
    constructor(data?: {
      year: number;
      month: number;
      day: number;
      hour?: number;
      minute?: number;
      second?: number;
      isDate?: boolean;
    });
    isDate: boolean;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    toJSDate(): Date;
    compare(other: Time): number;
    clone(): Time;
    static fromDateTimeString(str: string): Time;
    static fromJSDate(date: Date, useUTC?: boolean): Time;
  }

  export class RecurExpansion {
    next(): Time;
    complete: boolean;
  }
}
