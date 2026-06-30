# ADR-0003: Deploying with Render

## Status

Accepted

---

## Context

The project required an affordable cloud hosting platform capable of deploying a Node.js application with GitHub integration and minimal configuration.

---

## Options Considered

### Render

Pros

- Simple deployment
- GitHub integration
- Free tier
- Supports Node.js applications

Cons

- Cold starts on the free plan
- Limited compute resources

### Railway

Pros

- Easy deployment
- Good developer experience

Cons

- Smaller free tier

### DigitalOcean

Pros

- Greater flexibility
- Highly scalable

Cons

- More configuration
- Requires server management

---

## Decision

The team selected Render because it provides straightforward deployment with automatic GitHub integration while minimizing deployment overhead.

---

## Consequences

### Benefits

- Continuous deployment
- Easy maintenance
- Low operational overhead

### Trade-offs

- Cold starts on inactive services
- Limited resources on the free tier