import type { LineMessage } from '../types.ts';

export function createEmployeeFlexMessage(liffId: string): LineMessage {
  const liffBase = `https://liff.line.me/${liffId}`;

  return {
    type: 'flex',
    altText: 'เมนูจัดการพนักงาน',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: 'เมนูจัดการพนักงาน',
            weight: 'bold',
            size: 'lg'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'button',
            style: 'primary',
            color: '#fada3d',
            height: 'sm',
            action: {
              type: 'message',
              label: 'รายชื่อ',
              text: '>รายชื่อ'
            }
          },
          {
            type: 'button',
            style: 'primary',
            color: '#fada3d',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'สร้าง',
              uri: `${liffBase}/employees/new`
            }
          },
          {
            type: 'button',
            style: 'primary',
            color: '#fada3d',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'แก้ไข/ลบ',
              uri: `${liffBase}/employees/edit`
            }
          },
          // {
          //   type: 'button',
          //   style: 'primary',
          //   color: '#db2121',
          //   height: 'sm',
          //   action: {
          //     type: 'message',
          //     label: 'ลบ',
          //     text: 'ลบ'
          //   }
          // }
        ]
      }
    }
  };
}
