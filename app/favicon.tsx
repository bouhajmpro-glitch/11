import { ImageResponse } from 'next/server';

export const runtime = 'edge';

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        🌤️
      </div>
    ),
    {
      width: 32,
      height: 32,
    }
  );
}
