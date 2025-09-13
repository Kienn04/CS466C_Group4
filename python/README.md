# Flask Two-Factor Authentication (2FA) App

Ứng dụng web Flask với xác thực 2 lớp sử dụng TOTP và Google Authenticator.

## Tính năng

- 🔐 Đăng ký/Đăng nhập an toàn với bcrypt
- 📱 Two-Factor Authentication (2FA) với Google Authenticator
- 📊 QR Code tự động sinh cho thiết lập 2FA
- 🛡️ Session management với Flask-Login
- 🎨 UI hiện đại với Bootstrap 5

## Cài đặt

1. **Cài đặt dependencies:**
```bash
pip install -r requirements.txt
```

2. **Chạy ứng dụng:**
```bash
python app.py
```

3. **Truy cập ứng dụng:**
Mở trình duyệt: http://localhost:5000

## 4. Luồng xử lý (Workflow)

### 4.1 Register:
- User gửi (username + password)
- Hệ thống Hash mật khẩu, sinh OTP_SECRET, lưu DB
- Trả về QR_CODE để User scan với Auth

### 4.2 Login:
- User nhập (username + password)
- Nếu sai --> báo lỗi
- Nếu đúng --> hệ thống tạo session tạm (pre_2fa_user)

### 4.3 Verify OTP:
- User nhập mã OTP từ Google Authenticator
- Nếu sai --> báo lỗi
- Nếu đúng --> đăng nhập thành công, chuyển Dashboard

## Sử dụng

### 1. Đăng ký tài khoản
- Click "Register" → Nhập username/password
- Scan QR code bằng Google Authenticator

### 2. Đăng nhập với 2FA
- Click "Login" → Nhập username/password
- Nhập mã 6 số từ Google Authenticator
- Đăng nhập thành công!

### 3. Dashboard
- Xem thông tin tài khoản
- Quản lý 2FA
- Đăng xuất

## Cấu trúc thư mục

```
python/
├── app.py                 # Ứng dụng Flask chính
├── requirements.txt       # Dependencies
└── templates/            # HTML templates
    ├── base.html         # Template cơ sở
    ├── index.html        # Trang chủ
    ├── register.html     # Đăng ký
    ├── login.html        # Đăng nhập
    ├── setup_2fa.html    # Thiết lập 2FA
    ├── verify_2fa.html   # Xác thực OTP
    └── dashboard.html    # Dashboard
```

## Dependencies

- Flask 2.3.3
- Flask-SQLAlchemy 3.0.5
- Flask-Login 0.6.3
- Werkzeug 2.3.7
- pyotp 2.9.0
- qrcode 7.4.2
- Pillow 10.0.1

## Bảo mật

- Mật khẩu hash với bcrypt
- TOTP theo chuẩn RFC 6238
- Session an toàn với Flask-Login
- CSRF protection
- OTP có thời hạn 30 giây

## Lưu ý

- Đây là ứng dụng demo, không dùng cho production
- Thay đổi SECRET_KEY trong app.py khi deploy
- Đồng hồ hệ thống phải chính xác để OTP hoạt động
