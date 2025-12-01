// Type declarations for Google Maps JavaScript API
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            inputField: HTMLInputElement,
            options?: {
              types?: string[];
              componentRestrictions?: { country?: string | string[] };
              fields?: string[];
            }
          ) => {
            getPlace(): {
              formatted_address?: string;
              geometry?: {
                location?: {
                  lat(): number;
                  lng(): number;
                };
              };
              name?: string;
            };
            addListener(event: string, handler: () => void): { remove(): void };
          };
        };
        event: {
          removeListener(listener: { remove(): void }): void;
          clearInstanceListeners(instance: any): void;
        };
      };
    };
  }
}

export {};

