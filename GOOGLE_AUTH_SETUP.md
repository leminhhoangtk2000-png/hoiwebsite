# Hướng dẫn Cấu hình Google Login cho Supabase

Để tính năng Google Login hoạt động, anh cần cấu hình Google Cloud Platform và Supabase theo các bước sau:

## Bước 1: Tạo Google Cloud Project
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo một Project mới (hoặc chọn project có sẵn).
3. Tìm kiếm **"OAuth consent screen"** và chọn nó.
    *   **User Type**: Chọn **External**.
    *   Điền thông tin App (App name, support email...).
    *   Nhấn **Save and Continue**.

## Bước 2: Tạo Credentials (Client ID & Secret)
1. Vào menu **Credentials** bên trái.
2. Nhấn **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. **Application type**: Chọn **Web application**.
4. **Name**: Web client 1 (hoặc tên tùy ý).
5. **Authorized redirect URIs**:
    *   Anh cần lấy URL này từ Supabase Dashboard:
        *   Vào Supabase Project > **Authentication** > **Providers** > **Google**.
        *   Copy dòng **Callback URL (for OAuth)**. Nó sẽ có dạng: `https://<project-id>.supabase.co/auth/v1/callback`.
        *   Dán URL đó vào mục này trên Google Console.
6. Nhấn **Create**.
7. Google sẽ hiển thị **Your Client ID** và **Your Client Secret**.

## Bước 3: Cập nhật Supabase Dashboard (Bước quan trọng nhất)
1. Quay lại Supabase Dashboard > **Authentication** > **Providers** > **Google**.
2. **Enable** Google provider.
3. Paste **Client ID** vào ô `Client ID`.
4. Paste **Client Secret** vào ô `Client Secret`.
5. Nhấn **Save**.

## Bước 4: Cập nhật file .env.local (Để lưu trữ)
Em đã thêm sẵn 2 dòng này vào file `.env.local` của anh. Anh có thể điền vào để lưu trữ (mặc dù Supabase Auth chủ yếu đọc từ Dashboard, nhưng việc lưu biến môi trường là thói quen tốt).

```env
GOOGLE_CLIENT_ID="<Paste Client ID của anh vào đây>"
GOOGLE_CLIENT_SECRET="<Paste Secret của anh vào đây>"
```

## Bước 5: Kiểm tra
Sau khi làm xong các bước trên, tính năng Login bằng Google trên website sẽ hoạt động.
