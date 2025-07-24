export const parseAlawPcmToAudioData = (data: ArrayBufferLike) => {
  const dataView = new DataView(data);
  const reader = createReader(dataView);
  const read = reader.pcm16;

  const length = data.byteLength / 2;

  const audioBuffer = new AudioBuffer({
    numberOfChannels: 1,
    length,
    sampleRate: 8000,
  });

  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    channelData[i] = read();
  }

  return audioBuffer;
};

export function createReader(dataView: DataView) {
  let pos = 0;

  return {
    remain() {
      return dataView.byteLength - pos;
    },
    skip(n: number) {
      pos += n;
    },
    uint8() {
      const data = dataView.getUint8(pos);

      pos += 1;

      return data;
    },
    int16() {
      const data = dataView.getInt16(pos, true);

      pos += 2;

      return data;
    },
    uint16() {
      const data = dataView.getUint16(pos, true);

      pos += 2;

      return data;
    },
    uint32() {
      const data = dataView.getUint32(pos, true);

      pos += 4;

      return data;
    },
    string(n: number) {
      let data = '';

      for (let i = 0; i < n; i += 1) {
        data += String.fromCharCode(this.uint8());
      }

      return data;
    },
    pcm8() {
      const data = dataView.getUint8(pos) - 128;

      pos += 1;

      return data < 0 ? data / 128 : data / 127;
    },
    pcm8s() {
      const data = dataView.getUint8(pos) - 127.5;

      pos += 1;

      return data / 127.5;
    },
    pcm16() {
      const data = dataView.getInt16(pos, true);

      pos += 2;

      return data < 0 ? data / 32768 : data / 32767;
    },
    pcm16s() {
      const data = dataView.getInt16(pos, true);

      pos += 2;

      return data / 32768;
    },
    pcm24() {
      const x0 = dataView.getUint8(pos + 0);
      const x1 = dataView.getUint8(pos + 1);
      const x2 = dataView.getUint8(pos + 2);
      const xx = (x0 + (x1 * 2 ** 8) + (x2 * 2 ** 16));
      const data = xx > 0x800000 ? xx - 0x1000000 : xx;

      pos += 3;

      return data < 0 ? data / 8388608 : data / 8388607;
    },
    pcm24s() {
      const x0 = dataView.getUint8(pos + 0);
      const x1 = dataView.getUint8(pos + 1);
      const x2 = dataView.getUint8(pos + 2);
      const xx = (x0 + (x1 * 2 ** 8) + (x2 * 2 ** 16));
      const data = xx > 0x800000 ? xx - 0x1000000 : xx;

      pos += 3;

      return data / 8388608;
    },
    pcm32() {
      const data = dataView.getInt32(pos, true);

      pos += 4;

      return data < 0 ? data / 2147483648 : data / 2147483647;
    },
    pcm32s() {
      const data = dataView.getInt32(pos, true);

      pos += 4;

      return data / 2147483648;
    },
    pcm32f() {
      const data = dataView.getFloat32(pos, true);

      pos += 4;

      return data;
    },
    pcm64f() {
      const data = dataView.getFloat64(pos, true);

      pos += 8;

      return data;
    }
  };
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i += 1) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function floatTo32BitPCM(output: DataView, _offset: number, _input: ArrayBuffer) {
  const input = new Int32Array(_input);
  let offset = _offset;
  for (let i = 0; i < input.length; i += 1, offset += 4) {
    output.setInt32(offset, input[i], true);
  }
}
function floatTo16BitPCM(output: DataView, _offset: number, _input: ArrayBuffer) {
  const input = new Int16Array(_input);
  let offset = _offset;
  for (let i = 0; i < input.length; i += 1, offset += 2) {
    output.setInt16(offset, input[i], true);
  }
}
function floatTo8BitPCM(output: DataView, _offset: number, _input: ArrayBuffer) {
  const input = new Int8Array(_input);
  let offset = _offset;
  for (let i = 0; i < input.length; i += 1, offset += 1) {
    output.setInt8(offset, input[i]);
  }
}

export const addWavHeader = (samples: ArrayBuffer, sampleRateTmp: number, sampleBits: number, channelCount: number) => {
  const dataLength = samples.byteLength;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  let offset = 0;
  /* Resource Interchange File Format */
  writeString(view, offset, 'RIFF'); offset += 4;
  /* datalength */
  view.setUint32(offset, /* 32 */ 36 + dataLength, true); offset += 4;
  /* file type */
  writeString(view, offset, 'WAVE'); offset += 4;
  /* waveform format */
  writeString(view, offset, 'fmt '); offset += 4;
  /* filter byte, 0x10 = 16 */
  view.setUint32(offset, 16, true); offset += 4;
  /* pcm byte */
  view.setUint16(offset, 1, true); offset += 2;
  /* channel count */
  view.setUint16(offset, channelCount, true); offset += 2;
  /* sampleRate */
  view.setUint32(offset, sampleRateTmp, true); offset += 4;
  /* bitrate */
  view.setUint32(offset, sampleRateTmp * channelCount * (sampleBits / 8), true); offset += 4;
  /* sample byte */
  view.setUint16(offset, channelCount * (sampleBits / 8), true); offset += 2;
  /* sample bits */
  view.setUint16(offset, sampleBits, true); offset += 2;

  writeString(view, offset, 'data'); offset += 4;
  /* sample datalength: datalength-44 */
  view.setUint32(offset, dataLength, true); offset += 4;

  if (sampleBits === 16) {
    floatTo16BitPCM(view, 44, samples);
  } else if (sampleBits === 8) {
    floatTo8BitPCM(view, 44, samples);
  } else {
    floatTo32BitPCM(view, 44, samples);
  }
  return view.buffer;
};

export const parsePcmToWav = async (fileBuffer: ArrayBuffer, sampleRateTmp: number, sampleBits: number, channelCount: number) => {
  try {
    const audioContext = new AudioContext({ sampleRate: sampleRateTmp });
    const arrayBuffer = addWavHeader(fileBuffer, sampleRateTmp, sampleBits, channelCount);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    console.log('load pcm failed: ', error);
    return null;
  }
};
