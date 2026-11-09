# -*- coding: utf-8 -*-
"""Optional local AMap geocoding check; credentials are never kept in source."""
import json
import os
from pathlib import Path

import requests
from dotenv import load_dotenv


def main():
    load_dotenv(Path(__file__).resolve().parent / '.env.local')
    api_key = os.environ.get('AMAP_WEB_SERVICE_KEY', '').strip()
    if not api_key:
        raise SystemExit('请先在根目录 .env.local 中设置 AMAP_WEB_SERVICE_KEY。')

    response = requests.get(
        'https://restapi.amap.com/v3/geocode/geo',
        params={
            'key': api_key,
            'address': '浙江省杭州市西湖区西湖风景区',
            'city': '杭州市',
        },
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()
    print('Status:', data.get('status'))
    print('Info:', data.get('info'))
    if data.get('geocodes'):
        print('Location:', data['geocodes'][0]['location'])
        print('\nAPI 测试成功！')
    else:
        print('Response:', json.dumps(data, ensure_ascii=False))


if __name__ == '__main__':
    main()
