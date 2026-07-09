import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 40, marginBottom: 24 }}>🎤🇩🇪🇳🇱🇬🇧🇵🇹🇫🇷🇸🇪</div>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
          Simulador de Entrevista
        </div>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, lineHeight: 1.1, color: '#a1a1aa' }}>
          para a Europa
        </div>
        <div style={{ display: 'flex', fontSize: 30, marginTop: 32, color: '#d4d4d8', maxWidth: 900 }}>
          Treine no estilo real de cada país, adaptado à sua profissão em TI. Revisão de currículo incluída.
        </div>
      </div>
    ),
    { ...size }
  )
}
