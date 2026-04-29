import type { LineMessage } from '../types.js';

export function createAttendanceFlexMessage(liffId: string, apiBaseUrl: string): LineMessage {
  const liffBase = `https://liff.line.me/${liffId}`;

  return {
    type: 'flex',
    altText: 'เมนูลงเวลางาน',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: 'ลงเวลางาน',
            weight: 'bold',
            size: 'lg',
            color: '#7C2D12',
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'button',
            style: 'primary',
            color: '#fada3d',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'ลงเวลางาน',
              uri: `${liffBase}/attendance`,
            },
          },
          {
            type: 'button',
            style: 'primary',
            color: '#fada3d',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'รายงานการทำงานงวดปัจจุบัน',
              uri: `${apiBaseUrl}/api/reports/work/current`,
            },
          },
        ],
      },
    },
  };
}
