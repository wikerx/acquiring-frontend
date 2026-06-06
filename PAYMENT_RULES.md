# PAYMENT_RULES.md

# Payment Business Rules

## Overview

This platform is a global payment and acquiring platform.

Frontend implementations must follow these business rules.

Never invent payment statuses, settlement statuses, refund statuses, or risk statuses.

------

# Payment Status

Use only:

PENDING
PROCESSING
SUCCESS
FAILED
CANCELLED

Meaning:

PENDING = Waiting
PROCESSING = In Progress
SUCCESS = Completed
FAILED = Failed
CANCELLED = Cancelled

------

# Refund Status

Use only:

PENDING
PROCESSING
SUCCESS
FAILED

------

# Settlement Status

Use only:

PENDING
SETTLING
SETTLED
FAILED

------

# Reconciliation Status

Use only:

UNRECONCILED
RECONCILED
EXCEPTION

------

# Risk Status

Use only:

PASS
REVIEW
REJECT

------

# Merchant Status

Use only:

PENDING
ACTIVE
SUSPENDED
CLOSED

------

# Store Status

Use only:

PENDING
ACTIVE
REJECTED
CLOSED

------

# Currency Rules

Use ISO4217 Currency Codes.

Examples:

USD
EUR
GBP
HKD
SGD
JPY
AUD
CAD
CNY

Never create custom currency codes.

------

# Amount Rules

Display:

1,234.56 USD

or

USD 1,234.56

depending on project standards.

Do not display excessive decimal places.

------

# Date Format

Default:

YYYY-MM-DD HH:mm:ss

Example:

2026-06-06 18:30:25

------

# Card Data Masking

Card Number:

541749******1485

Email:

sc***@gmail.com

Phone:

138****8888

Never display:

CVV
PIN

------

# Payment Method Display

Supported examples:

Card
Apple Pay
Google Pay
FPS
CHAPS
SEPA
SWIFT

Never invent unsupported payment methods.

------

# Error Handling

Always display:

User-friendly message

Never expose:

- Stack Trace
- SQL Error
- Internal Exception
- Secret Configuration

------

# Security Rules

Never log:

- PAN
- CVV
- Token
- Secret Key
- JWT Secret

Always follow PCI-style masking practices.