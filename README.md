# DCServerForge

> Build complete Discord servers from natural language prompts.

DCServerForge is an open-source, AI-assisted tool that generates and builds Discord server structures from simple text descriptions.

Instead of manually creating categories, channels, roles, and permissions, describe your community in plain English, review the generated blueprint, and let DCServerForge build it for you.

---

## ✨ Features (MVP)

- Discord OAuth authentication
- Discord bot integration
- Natural language prompt input
- AI-generated server blueprint
- Blueprint validation
- Automatic creation of:
  - Categories
  - Text channels
  - Voice channels
  - Forum channels
  - Roles
  - Permission overwrites
- Build progress tracking

---

## 🏗 Architecture

```
Prompt
    │
    ▼
AI Provider
    │
    ▼
Blueprint JSON
    │
    ▼
Validator
    │
    ▼
Discord Builder
    │
    ▼
Discord API
```

The AI **never directly interacts with the Discord API**.

Its only responsibility is generating a structured blueprint.

---

## 🤖 AI Providers

DCServerForge is provider-agnostic.

Supported providers (current and planned):

- NVIDIA API
- Ollama
- OpenAI-compatible APIs
- Local models

---

## 🚀 Goals

- Open source from day one
- Modular architecture
- Self-hostable
- Provider independent
- Beginner-friendly codebase
- Production-ready foundation

---

## 🛣 Roadmap

- [ ] Project setup
- [ ] Discord OAuth
- [ ] Discord bot
- [ ] Blueprint schema
- [ ] Validator
- [ ] Discord builder
- [ ] AI integration
- [ ] Blueprint editor
- [ ] Templates

---

## 🤝 Contributing

Contributions, ideas, bug reports, and discussions are welcome.

Please open an issue before submitting large changes.

---

## 📄 License

This project will be released under the MIT License.

---

> Build once. Customize forever.
