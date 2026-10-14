Dựa trên các câu trả lời của bạn, đây là kế hoạch xây dựng Tip Jar:

---

## Implementation Plan: USDC Tip Jar

### Summary
Ứng dụng tip đơn giản cho phép người dùng kết nối ví và gửi USDC tip đến một địa chỉ ví cố định. Giao diện tối giản với các nút tip và ô nhập số tiền tùy chỉnh.

### Architecture
- **Blockchain:** Arc Testnet — USDC là gas token, phí ổn định, finality nhanh
- **Contract:** Không cần smart contract — gửi USDC trực tiếp qua ERC-20 transfer
- **Frontend:** React + TypeScript + Tailwind CSS; wagmi cho onchain calls; ConnectKit cho wallet
- **Wallet:** ConnectKit (đã có sẵn trong scaffold)

### Files to Create/Modify

1. `src/components/TipJar.tsx` — Component chính: nút tip preset, ô nhập tùy chỉnh, nút Gửi
2. `src/components/TipSuccess.tsx` — Hiển thị thông báo thành công + link explorer sau khi gửi
3. `src/config.ts` — Thêm địa chỉ ví nhận (RECIPIENT_ADDRESS) và preset amounts
4. `src/App.tsx` — Render TipJar component, bỏ nội dung scaffold mặc định

### Build Sequence

1. Cập nhật `src/config.ts` — thêm `RECIPIENT_ADDRESS` (placeholder để bạn điền sau) và mảng preset `[0.01, 0.05, 0.10, 0.25]`
2. Viết `src/components/TipJar.tsx` — nút preset highlight khi chọn, ô nhập custom amount, nút Send với validation (kiểm tra ví đã kết nối, số tiền > 0, đúng chain Arc Testnet)
3. Viết `src/components/TipSuccess.tsx` — hiển thị số tiền đã gửi, tx hash, link tới Arc Testnet explorer
4. Cập nhật `src/App.tsx` — import và render `<TipJar />`

### Done When
- [ ] Kết nối ví MetaMask hoặc ví tương thích qua ConnectKit
- [ ] Chọn một trong các mức tip preset ($0.01 / $0.05 / $0.10 / $0.25) hoặc nhập số tùy chỉnh
- [ ] Nhấn Send → ký giao dịch → USDC được gửi đến địa chỉ nhận trên Arc Testnet
- [ ] Hiển thị thông báo thành công với link explorer
- [ ] Báo lỗi rõ ràng nếu sai chain hoặc số dư không đủ

---

## Ready to build?

Nhấn **Approve** để chuyển sang Build mode và bắt đầu xây dựng. Sau khi build xong, bạn vào `src/config.ts` để điền địa chỉ ví nhận của mình vào `RECIPIENT_ADDRESS`. Kế hoạch đã được lưu tại `arc-studio-plans/PLAN.md`. Nhấn **Approve** để bắt đầu build!
