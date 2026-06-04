import type { LineMessage } from '../types.js';

export function createPeriodFlexMessage(liffId: string, activePeriodLabel?: string): LineMessage {
  const liffBase = `https://liff.line.me/${liffId}`;

  return {
    type: 'flex',
    altText: 'เมนูจัดการงวด',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#B91C1C',
        paddingAll: 'lg',
        contents: [
          {
            type: 'text',
            text: 'จัดการงวดเงินเดือน',
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF',
          },
          {
            type: 'text',
            text: activePeriodLabel ? `งวดปัจจุบัน: ${activePeriodLabel}` : 'ยังไม่มีงวดที่เปิดอยู่',
            size: 'xs',
            color: '#FECACA',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: 'lg',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#B91C1C',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'สร้าง / แก้ไข / ลบงวด',
              uri: `${liffBase}/periods`,
            },
          },
          {
            type: 'button',
            style: 'secondary',
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
