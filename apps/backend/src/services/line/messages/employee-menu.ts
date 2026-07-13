import type { LineMessage } from '../types.js';
import { appendQueryParam, joinUrlPath } from '../../../lib/url.js';

function appUrl(appBaseUrl: string, path: string, lineUserId?: string): string {
  return appendQueryParam(joinUrlPath(appBaseUrl, path), 'lineUserId', lineUserId);
}

export function createEmployeeFlexMessage(appBaseUrl: string, lineUserId?: string): LineMessage {
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
              uri: appUrl(appBaseUrl, '/employees/new', lineUserId)
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
              uri: appUrl(appBaseUrl, '/employees/edit', lineUserId)
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
