// Polyfills for Web Worker environment to support libraries that check for DOM APIs
if (typeof self !== 'undefined') {
  if (typeof self.window === 'undefined') {
    self.window = self;
  }
  if (typeof self.document === 'undefined') {
    self.document = {
      createElement: () => {
        return {
          getContext: () => {
            return {
              fillRect: () => {},
              clearRect: () => {},
              getImageData: () => ({ data: new Uint8ClampedArray(0) }),
              putImageData: () => {},
              createImageData: () => ({}),
              setTransform: () => {},
              drawImage: () => {},
              save: () => {},
              restore: () => {},
              beginPath: () => {},
              moveTo: () => {},
              lineTo: () => {},
              stroke: () => {},
              fill: () => {},
              rect: () => {},
              arc: () => {},
              closePath: () => {},
            };
          },
          style: {},
          width: 0,
          height: 0
        };
      },
      getElementsByTagName: () => [],
      querySelector: () => null,
      body: {
        appendChild: () => {},
        removeChild: () => {}
      },
      documentElement: {
        style: {}
      }
    };
  }
}
