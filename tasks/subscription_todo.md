# Subscription Management Implementation Plan

## Overview
Implement complete subscription management including plan upgrades, STO ID storage, and cancellation functionality.

## Required Supabase Schema Changes

### 1. Update `user_profiles` table
Add the following columns:
- `sto_id` (VARCHAR 255) - Stores Tranzila recurring payment ID
- `subscription_status` (VARCHAR 50) - 'active', 'inactive', 'cancelled'
- `subscription_start_date` (TIMESTAMP) - When subscription started
- `subscription_end_date` (TIMESTAMP) - When subscription ends/cancelled
- `last_payment_date` (TIMESTAMP) - Last successful payment
- `payment_method` (VARCHAR 50) - Payment method used

SQL Command:
```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS sto_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
```

## Implementation Tasks

### Backend Tasks

#### Task 1: Update Payment Success Flow
- [ ] After successful initial payment, update user's plan_type to 'pro' in Supabase
- [ ] Store the STO ID from recurring payment response in user_profiles
- [ ] Update subscription_status to 'active'
- [ ] Set subscription_start_date

**Files to modify:**
- `Backend/routes/payment_routes.py` - make_initial_payment function
- `Backend/services/payment_service.py` - create_recurring_payment function

#### Task 2: Update Cancel Payment Endpoint
- [ ] Fetch user's STO ID from Supabase
- [ ] Call Tranzila cancel API with the STO ID
- [ ] Update user's plan_type back to 'free'
- [ ] Update subscription_status to 'cancelled'
- [ ] Set subscription_end_date

**Files to modify:**
- `Backend/routes/payment_routes.py` - cancel_payment function

#### Task 3: Add Supabase Helper Functions
- [ ] Create function to update user subscription details
- [ ] Create function to fetch user's STO ID
- [ ] Create function to reset subscription on cancellation

**Files to modify:**
- `Backend/supabase_client.py` - Add new helper functions

### Frontend Tasks

#### Task 4: Add Cancel Subscription Button
- [ ] Show cancel button only for 'pro' users
- [ ] Add confirmation dialog before cancellation
- [ ] Call cancel API endpoint with user authentication

**Files to modify:**
- `Frontend/src/pages/Account.jsx` - Add cancel button in plan section

#### Task 5: Create Cancel Subscription API Service
- [ ] Create function to call backend cancel endpoint
- [ ] Handle success/error responses
- [ ] Update local user state after cancellation

**Files to modify:**
- `Frontend/src/services/payment.service.js` - Add cancelSubscription function

#### Task 6: Update Plan Display Logic
- [ ] Fetch and display subscription status
- [ ] Show subscription end date if cancelled
- [ ] Handle different subscription states (active, cancelled, expired)

**Files to modify:**
- `Frontend/src/pages/Account.jsx` - Update plan display logic
- `Frontend/src/hooks/useUserProfile.js` - Add subscription fields

## Simple Implementation Approach

Following CLAUDE.md guideline #6 (simplicity):
1. Each change will be minimal and focused
2. Use existing patterns in the codebase
3. Avoid complex state management
4. Reuse existing Supabase client functions where possible

## Testing Plan
1. Test payment flow updates plan to 'pro'
2. Test STO ID is saved correctly
3. Test cancellation updates plan to 'free'
4. Test UI shows correct subscription status
5. Test error handling for failed operations

## Review
(To be completed after implementation)