// Type declarations for Google Maps JavaScript API
declare namespace google {
  namespace maps {
    namespace places {
      class Autocomplete {
        constructor(inputField: HTMLInputElement, options?: AutocompleteOptions);
        getPlace(): PlaceResult;
        addListener(event: string, handler: () => void): MapsEventListener;
      }

      interface AutocompleteOptions {
        types?: string[];
        componentRestrictions?: { country?: string | string[] };
        fields?: string[];
      }

      interface PlaceResult {
        formatted_address?: string;
        geometry?: {
          location?: {
            lat(): number;
            lng(): number;
          };
        };
        name?: string;
      }
    }

    namespace event {
      function removeListener(listener: MapsEventListener): void;
      function clearInstanceListeners(instance: any): void;
    }

    interface MapsEventListener {
      remove(): void;
    }
  }
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

export {};

