import requests


def main() -> None:
    url = 'http://127.0.0.1:8000/api/auth/login/'
    payload = {"email": "admin@eshtarek.com", "password": "admin123"}
    r = requests.post(url, json=payload)
    print('status:', r.status_code)
    print('headers:', dict(r.headers))
    print('body_prefix:', r.text[:500])


if __name__ == '__main__':
    main()

