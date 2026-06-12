# ISC

## Abstractions for inter server communication

#### General
General purpose api, can be used for building third-party apis or internal tool for ISC.

- ApiGateway
- HmacSignature

#### Http and Json specific
More narrowed usage, specifically for simple http communication primary using json.\
Generally hmac signature is simple, fast, stateless auth method.

- ISCGateway
- ISCSignature
