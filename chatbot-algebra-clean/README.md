# 🤖 GarzaMath

<p align="center">
  <b>Asistente inteligente para el aprendizaje del álgebra</b><br/>
  <i>Chatbot educativo impulsado por IA local (Ollama)</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success" />
  <img src="https://img.shields.io/badge/AI-Ollama-blue" />
  <img src="https://img.shields.io/badge/framework-Next.js-black" />
  <img src="https://img.shields.io/badge/database-SQLite-lightgrey" />
  <img src="https://img.shields.io/badge/license-Educational-orange" />
</p>

---

## 📖 Overview

*GarzaMath* es una aplicación web que implementa un chatbot educativo especializado en álgebra, diseñado para proporcionar explicaciones claras, resolución paso a paso y acompañamiento académico en tiempo real.

El sistema destaca por ejecutar modelos de inteligencia artificial de manera *100% local*, eliminando la dependencia de APIs externas y garantizando privacidad, bajo costo y alta disponibilidad.

---

## 🎯 Problemática

Muchos estudiantes presentan dificultades en álgebra debido a:

- Falta de asesoría inmediata fuera del aula  
- Explicaciones poco personalizadas  
- Dependencia de recursos limitados o de pago  

GarzaMath aborda este problema ofreciendo un *tutor virtual accesible en todo momento*.

---

## 💡 Solución

GarzaMath proporciona:

- Explicaciones paso a paso  
- Respuestas en lenguaje natural  
- Interacción conversacional intuitiva  
- Persistencia de conversaciones  

Todo impulsado por un modelo de IA ejecutado localmente mediante *Ollama*.

---

## ✨ Features

- 🧠 Generación de respuestas con IA local  
- 💬 Interfaz tipo ChatGPT  
- ⚡ Baja latencia (sin llamadas externas)  
- 🔒 Privacidad total (sin envío de datos)  
- 💾 Historial de conversaciones persistente  
- 📚 Enfoque educativo en álgebra  

---

## 🏗️ Arquitectura del Sistema

El proyecto está basado en principios de *Clean Architecture*, separando claramente las capas:
---

## 🛠️ Tech Stack

| Capa            | Tecnología              |
|-----------------|------------------------|
| Frontend        | Next.js (App Router)   |
| Backend         | API Routes (Next.js)   |
| Base de datos   | Prisma + SQLite        |
| IA              | Ollama                 |
| Modelo          | Gemma (local)          |

---
## 🧱 Estructura del Proyecto

```bash
garzamath/
│
├── app/                         # App Router (Next.js)
│   │
│   ├── api/                     # Endpoints del backend
│   │   ├── chat/
│   │   │   └── route.ts         # Lógica principal del chatbot
│   │   │
│   │   └── conversations/
│   │       └── route.ts         # Manejo de historial
│   │
│   ├── components/              # Componentes reutilizables
│   │   ├── Chat.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── InputBox.tsx
│   │   └── Navbar.tsx
│   │
│   ├── hooks/                   # Custom hooks
│   │   └── useChat.ts
│   │
│   ├── styles/                  # Estilos (si no usas solo Tailwind)
│   │   └── globals.css
│   │
│   ├── layout.tsx               # Layout principal
│   └── page.tsx                 # Página principal
│
├── lib/                         # Lógica externa / utilidades
│   ├── ollama.ts                # Conexión con Ollama
│   ├── promptBuilder.ts         # Construcción de prompts
│   └── formatter.ts             # Limpieza de respuestas
│
├── services/                    # Lógica de negocio
│   ├── chatService.ts           # Flujo del chatbot
│   └── conversationService.ts   # Manejo de conversaciones
│
├── prisma/                      # Base de datos
│   ├── schema.prisma
│   └── migrations/
│
├── types/                       # Tipos TypeScript
│   ├── chat.ts
│   └── conversation.ts
│
├── utils/                       # Funciones auxiliares
│   ├── validators.ts
│   └── helpers.ts
│
├── public/                      # Archivos públicos (imágenes, icons)
│   └── logo.png
│
├── docs/                        # Documentación adicional
│   ├── architecture.md
│   └── api.md
│
├── .env                         # Variables de entorno
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
