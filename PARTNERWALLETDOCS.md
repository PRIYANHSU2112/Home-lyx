# Partner Wallet & Settlement System - Implementation Summary

## ✅ Implementation Complete

The Partner Wallet & Settlement System for eCommerce orders has been fully implemented and integrated into your system.

---

## 📦 What's Been Implemented

### 1. **Core Models Created**
- `src/models/partnerWallet.js` - Tracks partner earning, withdrawn, and balance
- `src/models/partnerTransaction.js` - Logs ALL partner wallet transactions
- `src/models/withdrawalRequest.js` - Manages withdrawal requests and approvals
- Updated `src/models/partnerProfileModel.js` - Added bank details for withdrawals

### 2. **Service Layer**
- `src/services/settlementService.js` - Core business logic for settlements
- `src/services/settlementCron.js` - Scheduled settlement job (runs daily at 2 AM UTC)

### 3. **Partner APIs** (Authenticated Partners)
Base URL: `/api/partner/wallet`

**Wallet Management:**
- `GET /my-wallet` - Get current wallet balance, earnings, withdrawn amounts
- `GET /stats` - Get wallet statistics including monthly earnings
- `GET /transactions` - Get transaction history (paginated, filterable by type/status)
- `GET /pending-commissions` - View commissions awaiting settlement

**Withdrawal:**
- `POST /request-withdrawal` - Request withdrawal (requires amount + bank details)
- `GET /withdrawal-requests` - View your withdrawal requests and their status

### 4. **Admin APIs** (Admin/Super Admin Only)
Base URL: `/api/admin/settlement`

**Partner Management:**
- `GET /partners` - List all partners with wallet summaries (searchable, filterable)
- `GET /partner/:partnerId/wallet` - Detailed wallet info + last 50 transactions

**Commission Management:**
- `GET /commissions` - View all commissions (filterable by partner, status, date)
- `POST /settle-batch` - Settle all pending commissions to settled status (daily via cron or manual)

**Withdrawal Management:**
- `GET /withdrawals` - List withdrawal requests (filterable, paginated)
- `POST /withdrawal/:withdrawalId/approve` - Approve withdrawal request
- `POST /withdrawal/:withdrawalId/reject` - Reject withdrawal (refunds amount)

**Reporting:**
- `GET /transactions` - All settlement transactions with filters
- `GET /dashboard-stats` - Overall settlement statistics

### 5. **Order Controller Integration**
- Updated `src/controllers/ecommerce/orderController.js` to auto-settle commissions when order reaches DELIVERED status
- Commissions are moved to "PENDING" status, waiting for scheduled settlement

---

## 🔄 Data Flow Diagram

```
1. ECOMMERCE ORDER CREATED
   ├─ Order has partnerId, adminCommission%, commissionAmount per product
   └─ Commission amounts calculated in billDetail middleware

2. ORDER STATUS: PENDING → ... → DELIVERED
   └─ When status changes to DELIVERED:
      ├─ For each product with partnerId:
      │  ├─ Create PartnerTransaction (COMMISSION_EARNED, PENDING)
      │  └─ Update PartnerWallet.pendingBalance
      └─ Generate invoice

3. DAILY SETTLEMENT (2 AM UTC via Cron Job)
   ├─ Find all PENDING COMMISSION_EARNED transactions
   ├─ For each partner:
   │  ├─ Sum all pending commissions
   │  ├─ Move to balance: wallet.balance += commission
   │  ├─ Move from pending: wallet.pendingBalance -= commission
   │  ├─ Update totalEarning: wallet.totalEarning += commission
   │  ├─ Set lastSettlementDate = now
   │  └─ Update transaction status to SETTLED
   └─ Cron logging shows results

4. PARTNER REQUESTS WITHDRAWAL
   ├─ Check available balance (balance - pending withdrawals)
   ├─ Create WithdrawalRequest (PENDING) with bank details
   ├─ Create PartnerTransaction (WITHDRAWAL_REQUESTED, PENDING)
   └─ Balance remains unchanged (reserved for withdrawal)

5. ADMIN APPROVES WITHDRAWAL
   ├─ Update WithdrawalRequest.status → APPROVED
   ├─ Reduce wallet.balance by withdrawal amount
   ├─ Increase wallet.totalWithdrawn by withdrawal amount
   ├─ Create PartnerTransaction (WITHDRAWAL_APPROVED, COMPLETED)
   └─ Admin can enter bank transfer reference for tracking

6. ADMIN REJECTS WITHDRAWAL
   ├─ Update WithdrawalRequest.status → REJECTED
   ├─ Refund amount back to wallet.balance
   ├─ Create PartnerTransaction (WITHDRAWAL_REJECTED, COMPLETED)
   └─ Provide rejection reason to partner
```

---

## 💰 Wallet Balances Explained

**Total Earning** = Sum of all commissions earned (SETTLED status)
- Never decreases even when withdrawal happens
- Historical record of all earnings

**Total Withdrawn** = Sum of all approved withdrawals
- Only increases when admin approves withdrawal
- Shows total amount paid out to partner

**Balance** = totalEarning - totalWithdrawn
- Available for withdrawal
- Decreases when withdrawal is approved

**Pending Balance** = Commissions from DELIVERED but not-yet-SETTLED orders
- Temporary holding amount
- Moves to balance after daily settlement
- Not available for withdrawal until settled

**Available for Withdrawal** = balance - pending_withdrawal_amounts
- True available amount accounting for pending withdrawal requests

---

## 🔐 Authentication & Permissions

**Partner Routes** (`/api/partner/wallet/*`)
- Requires JWT token with PARTNER userType
- Uses `partnerRoute` middleware
- Partners can only see their own data

**Admin Routes** (`/api/admin/settlement/*`)
- Requires JWT token with ADMIN/SUB_ADMIN/SUPER_ADMIN userType
- Uses `adminRoute` middleware
- Admins see all partners' data

---

## 📝 Transaction Types

1. **COMMISSION_EARNED** - Commission from delivered order (PENDING → SETTLED)
2. **WITHDRAWAL_REQUESTED** - Partner requests withdrawal (PENDING → COMPLETED/CANCELLED)
3. **WITHDRAWAL_APPROVED** - Admin approved withdrawal (COMPLETED)
4. **WITHDRAWAL_REJECTED** - Admin rejected withdrawal (COMPLETED)
5. **REFUND_CREDIT** - Commission reversed due to order refund (COMPLETED)

---

## ⚙️ Cron Job Configuration

**File:** `src/services/settlementCron.js`
**Schedule:** `0 2 * * *` (Daily at 2 AM UTC)
**Triggered in:** `index.js` after MongoDB connection

### Manual Settlement (if needed)
Admins can manually settle at any time using:
```
POST /api/admin/settlement/settle-batch
Body: { "partnerIds": [] } // empty = all partners
```

---

## 🧪 Testing the System End-to-End

### Prerequisites
1. Partner profile with verified documents (APPROVED status)
2. Partner assigned to products in ecommerce/ProductRoutes
3. eCommerce order created with products from that partner
4. Admin user for testing admin endpoints

### Test Scenario 1: Commission Settlement Flow
```
1. Create partner profile & verify documents
2. Create ecommerce product, assign to partner with adminCommission = 5%
3. Create order with that product (price = 1000)
   → Expected: commissionAmount = 50
4. Mark order status as DELIVERED
   → Check: PartnerTransaction created with COMMISSION_EARNED (PENDING)
   → Check: PartnerWallet.pendingBalance += 50
5. Wait for cron (or call settle-batch manually)
   → Check: Transaction status changed to SETTLED
   → Check: PartnerWallet.balance = 50, totalEarning = 50, pendingBalance = 0
6. View wallet as partner
   → GET /api/partner/wallet/my-wallet
   → Verify all balances correct
```

### Test Scenario 2: Withdrawal Flow
```
1. Partner requests withdrawal of 30 (available = 50)
   → POST /api/partner/wallet/request-withdrawal
   → Body: {
       "amount": 30,
       "bankDetails": {
         "accountHolderName": "John Doe",
         "accountNumber": "1234567890",
         "bankName": "HDFC Bank",
         "ifscCode": "HDFC0001234"
       }
     }
   → Response: WithdrawalRequest created (PENDING)
   → Check: PartnerTransaction created (WITHDRAWAL_REQUESTED, PENDING)

2. Admin approves withdrawal
   → POST /api/admin/settlement/withdrawal/:withdrawalId/approve
   → Body: { "transactionRef": "TRANSFER123" }
   → Check: WithdrawalRequest.status = APPROVED
   → Check: PartnerWallet.balance = 20 (50 - 30)
   → Check: PartnerWallet.totalWithdrawn = 30
   → Check: New PartnerTransaction created (WITHDRAWAL_APPROVED, COMPLETED)

3. Partner checks wallet
   → Balance = 20, totalEarning = 50, totalWithdrawn = 30
   → Withdrawal visible in transaction history with COMPLETED status
```

### Test Scenario 3: Withdrawal Rejection Flow
```
1. Partner requests withdrawal of 40
   → WithdrawalRequest created (PENDING)

2. Admin rejects withdrawal
   → POST /api/admin/settlement/withdrawal/:withdrawalId/reject
   → Body: { "rejectionReason": "Bank details invalid" }
   → Check: WithdrawalRequest.status = REJECTED
   → Check: PartnerWallet.balance still = 50 (amount refunded)
   → Check: New PartnerTransaction created (WITHDRAWAL_REJECTED, COMPLETED)

3. Partner can see rejection reason
   → GET /api/partner/wallet/withdrawal-requests
   → See rejection reason in response
```

### Test Scenario 4: Partial Refund Handling
```
1. Order delivered, commission settled (earned 50 from order)
2. Customer returns partial item (50% of order)
   → Call settlementService.handleOrderRefund(orderId, refundAmount=500, isFullRefund=false)
   → Expected: 50% of 50 = 25 reversed from partner wallet

3. Check wallet
   → Balance reduced by 25
   → New REFUND_CREDIT transaction in history
```

---

## 🗂️ File Structure

```
src/
├── models/
│   ├── partnerWallet.js (NEW)
│   ├── partnerTransaction.js (NEW)
│   ├── withdrawalRequest.js (NEW)
│   └── partnerProfileModel.js (UPDATED)
├── controllers/
│   ├── ecommerce/orderController.js (UPDATED)
│   ├── partnerWalletController.js (NEW)
│   └── adminSettlementController.js (NEW)
├── routes/
│   ├── partnerWalletRoute.js (NEW)
│   └── adminSettlementRoute.js (NEW)
├── services/
│   ├── settlementService.js (NEW)
│   └── settlementCron.js (NEW)
└── midellwares/auth.js (used partnerRoute, adminRoute)

index.js (UPDATED) - Added cron initialization & routes
```

---

## 🚀 API Request Examples

### Partner: Get Wallet Balance
```bash
GET /api/partner/wallet/my-wallet
Headers: Authorization: Bearer {partner_token}

Response:
{
  "success": true,
  "data": {
    "totalEarning": 150,
    "totalWithdrawn": 30,
    "balance": 120,
    "pendingBalance": 0,
    "lastSettlementDate": "2024-01-15T02:00:00Z",
    "availableForWithdrawal": 120
  },
  "pendingCommissions": {
    "count": 0,
    "total": 0
  }
}
```

### Partner: Request Withdrawal
```bash
POST /api/partner/wallet/request-withdrawal
Headers: Authorization: Bearer {partner_token}
Content-Type: application/json

Body:
{
  "amount": 100,
  "bankDetails": {
    "accountHolderName": "John Doe",
    "accountNumber": "1234567890123456",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0001234",
    "upiId": "johndoe@upi"
  }
}

Response:
{
  "success": true,
  "message": "Withdrawal request created for ₹100",
  "data": {
    "_id": "60d5ec49c1234...",
    "partnerId": "60d5ec49c1234...",
    "amount": 100,
    "status": "PENDING",
    "requestedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Admin: Approve Withdrawal
```bash
POST /api/admin/settlement/withdrawal/60d5ec49c1234.../approve
Headers: Authorization: Bearer {admin_token}
Content-Type: application/json

Body:
{
  "transactionRef": "TRANSFER_REF_12345"
}

Response:
{
  "success": true,
  "message": "Withdrawal of ₹100 approved",
  "data": {
    "_id": "60d5ec49c1234...",
    "status": "APPROVED",
    "transactionRef": "TRANSFER_REF_12345",
    "processedAt": "2024-01-15T10:45:00Z"
  }
}
```

### Admin: Get Commission Report
```bash
GET /api/admin/settlement/commissions?status=SETTLED&startDate=2024-01-01&endDate=2024-01-31&limit=50
Headers: Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec49c1234...",
      "partnerId": { "_id": "...", "name": "John's Services" },
      "orderId": { "_id": "...", "orderId": "ORD-123456" },
      "amount": 1000,
      "commissionPercentage": 5,
      "commissionAmount": 50,
      "status": "SETTLED",
      "createdAt": "2024-01-10T15:20:00Z"
    }
  ],
  "summary": {
    "SETTLED": { "total": 500, "count": 10 },
    "PENDING": { "total": 100, "count": 2 }
  }
}
```

---

## 📊 Database Indexes

All models have proper indexes for query performance:
- `partnerId` (unique for wallet)
- `createdAt` (for sorting/history)
- `status` (for filtering)
- `transactionType` (for transaction filtering)
- Composite indexes for common filter combinations

---

## 🔄 Integration Points

**Existing Systems:**
- Uses existing `partnerRoute` middleware for authentication
- Uses existing `adminRoute` middleware for authorization
- Leverages existing order status enum from `helper/status.js`
- Compatible with existing wallet model structure

**Order System Integration:**
- Automatically triggers on order DELIVERED status
- Reads commission data already calculated in products
- Maintains order invoice generation

---

## 📮 Next Phase: Service Orders (Phase 2)

When ready, the system can be extended to service orders (bookings) by:
1. Adding `partnerId`, `commissionPercentage`, `commissionAmount` to bookingModel
2. Adding settlement trigger in booking controller when status = COMPLETED
3. Setting commission percentage from category or partner config
4. Using same settlement, wallet, and withdrawal flows

---

## ✨ Key Features

✅ Automatic commission settlement on daily schedule
✅ Separate pending/settled balance tracking
✅ Full audit trail with transaction history
✅ Flexible withdrawal with bank details
✅ Admin approval workflow for payouts
✅ Refund handling with commission reversal
✅ Partner self-service wallet dashboard
✅ Admin reporting and analytics
✅ No minimum withdrawal amount
✅ Handles multi-product orders with different partners

---

## 🐛 Troubleshooting

**Cron job not running?**
- Check that `node-cron` is installed: `npm install node-cron`
- Verify settlement logs in console at 2 AM UTC
- Manually trigger: POST /api/admin/settlement/settle-batch

**Commissions not settling?**
- Verify order status is exactly "DELIVERED"
- Check that products in order have valid partnerId references
- Check PartnerTransaction records created with COMMISSION_EARNED

**Withdrawal failing?**
- Verify available balance is sufficient
- Ensure bank details are complete and valid
- Check partner is not disabled in system

---

## 📌 Important Notes

1. **Cron Schedule**: Configured for 2 AM UTC. Modify in `index.js` if different time needed.
2. **No Payment Integration**: Bank transfers are manual. Store transaction reference for your records.
3. **Commissions from Products**: Based on category adminCommission % at time of order.
4. **Ledger Safety**: All transactions are immutable records - essential for audits.
5. **Timezone**: All timestamps in UTC. Adjust display timezone in frontend as needed.

---

This implementation is production-ready and fully documented! 🚀
