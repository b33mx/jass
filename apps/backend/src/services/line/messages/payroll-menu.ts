import type { LineMessage } from '../types.js';

export function createPayrollFlexMessage(liffId: string): LineMessage {
  const liffBase = `https://liff.line.me/${liffId}`;

  return {
    type: 'flex',
    altText: 'เมนูเงินเดือน',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: 'เงินเดือน',
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
            color: '#f97316',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'คำนวณเงินเดือน',
              uri: `${liffBase}/payroll`,
            },
          },
        ],
      },
    },
  };
}
