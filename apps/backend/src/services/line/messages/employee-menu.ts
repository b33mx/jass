import type { LineMessage } from '../types.ts';

export function createEmployeeFlexMessage(): LineMessage {
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
              text: 'รายชื่อ'
            }
          },
          {
            type: 'button',
            style: 'primary',
            color: '#fada3d',
            height: 'sm',
            action: {
              type: 'message',
              label: 'สร้าง',
              text: 'สร้าง'
            }
          },
          {
            type: 'button',
            style: 'primary',
            color: '#fada3d',
            height: 'sm',
            action: {
              type: 'message',
              label: 'แก้ไข',
              text: 'แก้ไข'
            }
          },
          {
            type: 'button',
            style: 'primary',
            color: '#db2121',
            height: 'sm',
            action: {
              type: 'message',
              label: 'ลบ',
              text: 'ลบ'
            }
          }
        ]
      }
    }
  };
}
